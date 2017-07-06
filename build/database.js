"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.connect = connect;
exports.createSubscriptionHook = createSubscriptionHook;
exports.loadSchemas = loadSchemas;

var _sequelize = require("sequelize");

var _sequelize2 = _interopRequireDefault(_sequelize);

var _logger = require("./utils/logger");

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const log = (0, _logger2.default)("sql2gql::database:");

function connect(schemas, sqlInstance, options) {
  loadSchemas(schemas, sqlInstance, options);
  return sqlInstance;
}

function createSubscriptionHook(schema, hookName, subscriptionName, pubsub, schemaOptions = {}) {
  const { hooks } = schemaOptions;
  const schemaHook = hooks[hookName];
  return (() => {
    var _ref = _asyncToGenerator(function* (instance, options) {
      if (schemaHook) {
        try {
          yield schemaHook.apply(instance, [instance, options]);
        } catch (err) {
          log.debug(`${hookName} threw error, will not fire subscription event`, { err });
          return undefined;
        }
      }
      return pubsub.publish(subscriptionName, { instance, options, hookName });
    });

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  })();
}

function loadSchemas(schemas, sqlInstance, options = {}) {
  sqlInstance.$sqlgql = {};
  const { defaultAttr, defaultModel } = options;
  let pubsub, subscriptionHooks;
  if (options.subscriptions) {
    if (!options.subscriptions.pubsub) {
      throw "PubSub is required for subscriptions to work - {options.subscriptions.pubsub} is undefined";
    }
    pubsub = options.subscriptions.pubsub;
    subscriptionHooks = options.subscriptions.hooks || ["afterCreate", "afterDestroy", "afterUpdate"];
    sqlInstance.$sqlgql = Object.assign(sqlInstance.$sqlgql, {
      subscriptions: {
        pubsub
      }
    });
  }

  schemas.forEach(schema => {
    let schemaOptions = Object.assign({}, defaultModel, schema.options);
    if (pubsub) {
      //TODO Restrict or Enable hooks per model
      schema.$subscriptions = subscriptionHooks.reduce((data, hookName) => {
        const subscriptionName = `${hookName}${schema.name}`;
        const hookFunc = createSubscriptionHook(schema, hookName, subscriptionName, pubsub, schemaOptions);
        data.names[hookName] = subscriptionName;
        data.hooks[hookName] = hookFunc;
        return data;
      }, {
        names: {},
        hooks: {}
      });
      schemaOptions = Object.assign(schemaOptions, {
        hooks: Object.assign(schemaOptions.hooks || {}, schema.$subscriptions.hooks)
      });
    }

    let { classMethods, instanceMethods } = schema;
    if (!/^4/.test(_sequelize2.default.version)) {
      // v3 compatibilty
      if (classMethods) {
        schema.options.classMethods = classMethods;
      }
      if (instanceMethods) {
        schema.options.instanceMethods = instanceMethods;
      }
    }
    sqlInstance.define(schema.name, Object.assign({}, defaultAttr, schema.define), schemaOptions);
    sqlInstance.models[schema.name].$sqlgql = schema;
    if (/^4/.test(_sequelize2.default.version)) {
      // v4 compatibilty
      if (schema.options) {
        if (schema.options.classMethods) {
          classMethods = schema.options.classMethods;
        }
        if (schema.options.instanceMethods) {
          instanceMethods = schema.options.instanceMethods;
        }
      }
      if (classMethods) {
        Object.keys(classMethods).forEach(classMethod => {
          sqlInstance.models[schema.name][classMethod] = classMethods[classMethod];
        });
      }
      if (instanceMethods) {
        Object.keys(instanceMethods).forEach(instanceMethod => {
          sqlInstance.models[schema.name].prototype[instanceMethod] = instanceMethods[instanceMethod];
        });
      }
    }
  });
  schemas.forEach(schema => {
    (schema.relationships || []).forEach(relationship => {
      createRelationship(sqlInstance, schema.name, relationship.model, relationship.name, relationship.type, Object.assign({ as: relationship.name }, relationship.options));
    });
  });
}

function createRelationship(sqlInstance, targetModel, sourceModel, name, type, options = {}) {
  let model = sqlInstance.models[targetModel];
  if (!model.relationships) {
    model.relationships = {};
  }
  try {
    model.relationships[name] = {
      type: type,
      source: sourceModel,
      target: targetModel,
      rel: model[type](sqlInstance.models[sourceModel], options)
    };
  } catch (err) {
    log.error("Error Mapping relationship", { model, sourceModel, name, type, options, err });
  }
  sqlInstance.models[targetModel] = model;
}
//# sourceMappingURL=database.js.map
