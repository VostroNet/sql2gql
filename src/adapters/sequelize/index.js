import Sequelize, {Op} from "sequelize";
import waterfall from "../../utils/waterfall";
import logger from "../../utils/logger";
import { async } from "rsvp";
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
  addModel = async(m) => {
    const {defaultAttr, defaultModel} = this.options;
    const model = Object.assign({}, m, {
      options: Object.assign({}, m.options, {
        hooks: Object.assign({}, (m.options || {}).hooks),
      }),
    });
    let schemaOptions = Object.assign({}, defaultModel, model.options);
    const hooks = [this.options.hooks || {}, schemaOptions.hooks || {}];
    schemaOptions = Object.assign(schemaOptions, {
      hooks: generateHooks(hooks, model.name),
    });
    this.sequelize.define(model.name, Object.assign({}, defaultAttr, model.define), schemaOptions);

    let {classMethods, instanceMethods} = model;
    if (model.options) {
      if (model.options.classMethods) {
        classMethods = model.options.classMethods;
      }
      if (model.options.instanceMethods) {
        instanceMethods = model.options.instanceMethods;
      }
    }
    if (classMethods) {
      Object.keys(classMethods).forEach((classMethod) => {
        this.sequelize.models[model.name][classMethod] = classMethods[classMethod];
      });
    }
    if (instanceMethods) {
      Object.keys(instanceMethods).forEach((instanceMethod) => {
        this.sequelize.models[model.name].prototype[instanceMethod] = instanceMethods[instanceMethod];
      });
    }
  }
  addRelationship = (targetModel, sourceModel, name, type, options = {}) => {
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
  createFunctionForFind = async(modelName, mappingType) => {
    const model = this.sequelize.models[modelName];
    switch (mappingType) {
      case "hasMany":
        return async function(sourceKey) {
          return async(options = {}) => {
            let opts = {};
            if (options.where) {
              if (options.where[model.primaryKeyAttribute]) {
                opts.where = {
                  [Op.and]: [options.where, {[model.primaryKeyAttribute]: sourceKey}]
                };
              }
            }
            if (!opts.where) {
              opts.where = {[model.primaryKeyAttribute]: sourceKey};
            }
            return model.findAll(Object.assign({}, options, opts));
          };
        };
    }
    throw new Error(`Unknown mapping type ${mappingType}`);
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
