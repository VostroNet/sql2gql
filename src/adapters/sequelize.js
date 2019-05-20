import Sequelize, {Op} from "sequelize";
import waterfall from "../utils/waterfall";
import logger from "../utils/logger";
const log = logger("sql2gql::database:");


export default class SequelizeAdapter {
  static name = "sequelize";
  constructor(adapterOptions = {}, ...config) {
    //allows the adaptor to have the same config options as sequelize
    this.sequelize = new (Function.prototype.bind.apply(Sequelize, [undefined].concat(config))); //eslint-disable-line
    this.options = adapterOptions;
  }
  initialise = async() => {
    return this.sequelize.sync();
  }
  reset = async() => {
    return this.sequelize.sync({force: true});
  }
  getORM = () => {
    return this.sequelize;
  }
  createModel = async(def) => {
    const {defaultAttr, defaultModel} = this.options;
    const newDef = Object.assign({}, def, {
      options: Object.assign({}, def.options, {
        hooks: Object.assign({}, (def.options || {}).hooks),
      }),
    });
    let schemaOptions = Object.assign({}, defaultModel, def.options);
    const hooks = [this.options.hooks || {}, schemaOptions.hooks || {}];
    schemaOptions = Object.assign(schemaOptions, {
      hooks: generateHooks(hooks, def.name),
    });
    this.sequelize.define(newDef.name, Object.assign({}, defaultAttr, newDef.define), schemaOptions);

    let {classMethods, instanceMethods} = newDef;
    if (newDef.options) {
      if (newDef.options.classMethods) {
        classMethods = newDef.options.classMethods;
      }
      if (newDef.options.instanceMethods) {
        instanceMethods = newDef.options.instanceMethods;
      }
    }
    if (classMethods) {
      Object.keys(classMethods).forEach((classMethod) => {
        this.sequelize.models[newDef.name][classMethod] = classMethods[classMethod];
      });
    }
    if (instanceMethods) {
      Object.keys(instanceMethods).forEach((instanceMethod) => {
        this.sequelize.models[newDef.name].prototype[instanceMethod] = instanceMethods[instanceMethod];
      });
    }
    return this.sequelize.models[newDef.name];
  }
  createRelationship = (targetModel, sourceModel, name, type, options = {}) => {
    let model = this.sequelize.models[targetModel];
    if (!model.relationships) {
      model.relationships = {};
    }
    try {
      if (options.through) {
        if (options.through.model) {
          options.through.model = this.sequelize.models[options.through.model];
        }
      }
      model.relationships[name] = {
        type: type,
        source: sourceModel,
        target: targetModel,
        rel: model[type](this.sequelize.models[sourceModel], options),
      };
    } catch (err) {
      log.error("Error Mapping relationship", {model, sourceModel, name, type, options, err});
    }
    this.sequelize.models[targetModel] = model;
  }
  addInstanceFunction = (modelName, funcName, func) => {
    this.sequelize.models[modelName].prototype[funcName] = func;
  }

  addStaticFunction = (modelName, funcName, func) => {
    this.sequelize.models[modelName][funcName] = func;
  }
  getModel = (modelName) => {
    return this.sequelize.models[modelName];
  }
  getModels = () => {
    return this.sequelize.models;
  }
  createFunctionForFind = (modelName) => {
    const model = this.sequelize.models[modelName];
    return function(value, filterKey, singular) {
      return (options = {}) => {
        const opts = Object.assign({}, options, {
          where: mergeFilterStatement(filterKey, value, true, options.where),
        });
        if (!singular) {
          return model.findAll(opts);
        }
        return model.findOne(opts);
      };
    };
  }
  getPrimaryKeyNameForModel = (modelName) => {
    return this.sequelize.models[modelName].primaryKeyAttribute;
  }
  getValueFromInstance(data, keyName) {
    return data.get(keyName);
  }
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



export function mergeFilterStatement(fieldName, value, match = true, originalWhere) {
  let targetOp = Op.eq;
  if (Array.isArray(value)) {
    targetOp = (match) ? Op.in : Op.notIn;
  } else {
    targetOp = (match) ? Op.eq : Op.ne;
  }
  const filter = {
    [fieldName]: {
      [targetOp]: value,
    },
  };
  if (originalWhere) {
    return {
      [Op.and]: [originalWhere, filter],
    };
  }
  return filter;
}
