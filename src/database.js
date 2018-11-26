import Sequelize from "sequelize";

// if (global.Promise) {
//   Sequelize.Promise = global.Promise;
// }

import logger from "./utils/logger";
import { replaceDefWhereOperators } from "./graphql/utils/replace-id-deep";
import waterfall from "./utils/waterfall";

const log = logger("sql2gql::database:");

/**
 * @function connect
 * @param {Object[]} schemas
 * @param {Object} sqlInstance
 * @param {Object} options
 * @return {Object}
*/

export function connect(schemas, sqlInstance, options) {
  loadSchemas(schemas, sqlInstance, options);
  return sqlInstance;
}

/**
 * @function createSubscriptionHook
 * @param {Object} schema
 * @param {string} hookName
 * @param {string} subscriptionName
 * @param {Object} pubsub
 * @param {Object} schemaOptions
 * @return {function}
*/
export function createSubscriptionHook(schema, hookName, subscriptionName, pubsub, schemaOptions = {}) {
  const {hooks} = schemaOptions;
  const schemaHook = hooks[hookName];
  if (schemaHook) {
    if (schemaHook.isSubHook) {
      log.error("returning existing hook", {schemaHookName: schemaHook.hookName, hookName});
      return schemaHook; //#12 return existing hook;
    }
  }
  const f = async function(instance, options) {
    let output = {};
    try {
      if (schemaHook) {
        try {
          if (!schemaHook.isSubHook) {
            await schemaHook.apply(instance, [instance, options]);
          } else {
            log.error("attempting to call itself. check for BUGFIX#12", {hookName});
          }
        } catch (err) {
          log.debug(`${hookName} threw error, will not fire subscription event`, {err});
          return undefined;
        }
      }
      output[subscriptionName] = {instance, options, hookName};
      return pubsub.publish(subscriptionName, output);
    } catch (err) {
      log.error("error attempting to pubsub", {err, subscriptionName, output});
    }
    return undefined;
  };
  f.isSubHook = true;// check for BUGFIX#12
  f.hookName = hookName;
  f.schemaName = schema.name;
  return f;
}


function createHookQueue(hookName, hooks, schemaName) {
  return function(init, options, error) {
    return hooks.reduce((promise, targetHooks) => {
      return promise.then(async(val) => {
        if (targetHooks[hookName]) {
          let result;
          if (Array.isArray(targetHooks[hookName])) {
            result = await waterfall(targetHooks[hookName], (hook, prevResult) => {
              return hook(prevResult, options, error, schemaName, hookName);
            }, val);
          } else {
            result = await targetHooks[hookName](val, options, error, schemaName, hookName);
          }
          if (result) {
            return result;
          }
        }
        return val;
      });
    }, Promise.resolve(init));
  };
}

function generateHooks(hooks = [], schemaName) {
  return hooks.reduce((o, h) => {
    Object.keys(h).forEach((hookName) => {
      if (!o[hookName]) {
        o[hookName] = createHookQueue(hookName, hooks, schemaName);
      }
    });
    return o;
  }, {});
}

/**
 * @function loadSchemas
 * @param {Object[]} schemas
 * @param {Object} sqlInstance
 * @param {Object} options
*/
export function loadSchemas(schemas, sqlInstance, options = {}) {
  sqlInstance.$sqlgql = {};
  const {defaultAttr, defaultModel} = options;
  let pubsub, subscriptionHooks;
  if (options.subscriptions) {
    if (!options.subscriptions.pubsub) {
      throw "PubSub is required for subscriptions to work - {options.subscriptions.pubsub} is undefined";
    }
    pubsub = options.subscriptions.pubsub;
    subscriptionHooks = options.subscriptions.hooks || ["afterCreate", "afterDestroy", "afterUpdate"];
    sqlInstance.$sqlgql = Object.assign(sqlInstance.$sqlgql, {
      subscriptions: {
        pubsub,
      },
      // node: sequelizeNodeInterface(sqlInstance),
    });
  }


  const sc = schemas.map((s) => {
    //BUGFIX #12 - clone schema and hooks as we like to polute the object
    const schema = Object.assign({}, s, {
      options: Object.assign({}, s.options, {
        hooks: Object.assign({}, (s.options || {}).hooks),
      }),
    });
    let schemaOptions = Object.assign({}, defaultModel, schema.options);
    const hooks = [options.hooks || {}, schemaOptions.hooks || {}];
    if (pubsub) { //TODO Restrict or Enable hooks per model
      schema.$subscriptions = subscriptionHooks.reduce((data, hookName) => {
        const subscriptionName = `${hookName}${schema.name}`;
        const hookFunc = createSubscriptionHook(schema, hookName, subscriptionName, pubsub, schemaOptions);
        data.names[hookName] = subscriptionName;
        data.hooks[hookName] = hookFunc;
        return data;
      }, {
        names: {},
        hooks: {},
      });
      hooks.push(schema.$subscriptions.hooks);
    }
    hooks.push({
      async beforeFind(findOptions) {
        if (schema.whereOperators && findOptions.where) {
          findOptions.where = await replaceDefWhereOperators(findOptions.where, schema.whereOperators, findOptions);
        }
        return findOptions;
      },
      async beforeCount(findOptions) {
        if (schema.whereOperators && findOptions.where) {
          findOptions.where = await replaceDefWhereOperators(findOptions.where, schema.whereOperators, findOptions);
        }
        return findOptions;
      }
    });
    schemaOptions = Object.assign(schemaOptions, {
      hooks: generateHooks(hooks, schema.name),
    });

    let {classMethods, instanceMethods} = schema;
    if (!(/^4/.test(Sequelize.version))) { // v3 compatibilty
      if (classMethods) {
        schema.options.classMethods = classMethods;
      }
      if (instanceMethods) {
        schema.options.instanceMethods = instanceMethods;
      }
    }
    sqlInstance.define(schema.name, Object.assign({}, defaultAttr, schema.define), schemaOptions);
    sqlInstance.models[schema.name].$sqlgql = schema;
    sqlInstance.models[schema.name].prototype.getOriginalModel = createBind(sqlInstance.models, schema.name);
    if (/^4/.test(Sequelize.version)) {// v4 compatibilty
      if (schema.options) {
        if (schema.options.classMethods) {
          classMethods = schema.options.classMethods;
        }
        if (schema.options.instanceMethods) {
          instanceMethods = schema.options.instanceMethods;
        }
      }
      if (classMethods) {
        Object.keys(classMethods).forEach((classMethod) => {
          sqlInstance.models[schema.name][classMethod] = classMethods[classMethod];
        });
      }
      if (instanceMethods) {
        Object.keys(instanceMethods).forEach((instanceMethod) => {
          sqlInstance.models[schema.name].prototype[instanceMethod] = instanceMethods[instanceMethod];
        });
      }
    }
    return schema;
  });
  sc.forEach((schema) => {
    (schema.relationships || []).forEach((relationship) => {
      createRelationship(sqlInstance, schema.name, relationship.model, relationship.name, relationship.type, Object.assign({
        as: relationship.name,
      }, relationship.options));
    });
  });
}

function createRelationship(sqlInstance, targetModel, sourceModel, name, type, options = {}) {
  let model = sqlInstance.models[targetModel];
  if (!model.relationships) {
    model.relationships = {};
  }
  try {
    if (options.through) {
      if (options.through.model) {
        options.through.model = sqlInstance.models[options.through.model];
      }
    }
    model.relationships[name] = {
      type: type,
      source: sourceModel,
      target: targetModel,
      rel: model[type](sqlInstance.models[sourceModel], options),
    };
  } catch (err) {
    log.error("Error Mapping relationship", {model, sourceModel, name, type, options, err});
  }
  sqlInstance.models[targetModel] = model;
}

function createBind(o, k) {
  return () => (o[k]);
}
