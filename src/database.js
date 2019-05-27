import waterfall from "./utils/waterfall";
import Cache from "./utils/cache";
import pluralize from "pluralize";
import replaceIdDeep from "./utils/replace-id-deep";
import { capitalize } from "./utils/word";
import events from "./events";

export default class GQL {
  constructor() {
    this.defs = {};
    this.defsAdapters = {};
    this.adapters = {};
    this.models = {};
    this.relationships = {};
    this.globalKeys = {};
    // this.reference = {};
    this.cache = new Cache();
    this.defaultAdapter = undefined;
  }
  registerAdapter = (adapter, adapterName) => {
    this.adapters[adapterName || adapter.name] = adapter;
    if (!this.defaultAdapter) {
      this.defaultAdapter = adapterName || adapter.name;
    }
  }
  addDefinition = async(def, datasource) => {
    if (!datasource) {
      datasource = def.datasource || this.defaultAdapter;
    }
    if (this.defs[def.name]) {
      throw new Error(`Model with the name ${def.name} has already been added`);
    }
    this.defs[def.name] = def;
    this.defsAdapters[def.name] = datasource;
    const adapter = this.adapters[datasource];
    this.models[def.name] = await adapter.createModel(def);
  }
  getModel = (modelName) => {
    return this.getModelAdapter(modelName).getModel(modelName);
  }
  getDefinitions = () => {
    return this.defs;
  }
  getDefinition = (defName) => {
    return this.defs[defName];
  }
  getGlobalKeys = (defName) => {
    const fields = this.getFields(defName);
    return Object.keys(fields).filter((key) => {
      return fields[key].foreignKey || fields[key].primaryKey;
    });
  }
  getFields = (defName) => {
    const adapter = this.getModelAdapter(defName);
    //TODO: add cross adapter fields
    return adapter.getFields(defName);
  }
  getRelationships = (defName) => {
    const adapter = this.getModelAdapter(defName);
    //TODO: add cross adapter relationships
    return adapter.getRelationships(defName);
  }
  getGraphQLOutputType = (modelName, type) => {
    const adapter = this.getModelAdapter(modelName);
    const typeMapper = adapter.getTypeMapper();
    return typeMapper(type);
  }
  getGraphQLInputType = (modelName, type) => {
    const adapter = this.getModelAdapter(modelName);
    const typeMapper = adapter.getTypeMapper();
    return typeMapper(type);
  }
  getModelAdapter = (modelName) => {
    const adapterName = this.defsAdapters[modelName];
    return this.adapters[adapterName];
  }
  processRelationship = async(def, sourceAdapter, rel) => {
    const targetAdapter = this.getModelAdapter(rel.model);
    if (!this.relationships[def.name]) {
      this.relationships[def.name] = {};
    }
    this.relationships[def.name][rel.name] = {
      targetAdapter,
      sourceAdapter,
      type: rel.type,
      model: rel.model,
      name: rel.name,
      options: rel.options,
    };
    let {foreignKey} = rel.options;
    if (targetAdapter === sourceAdapter) {
      this.relationships[def.name][rel.name].internal = true;
      //TODO: populate foreignKey/sourceKeys if not provided
      await sourceAdapter.createRelationship(def.name, rel.model, rel.name, rel.type, rel.options);
      // if (!foreignKey) {
      //   throw new Error("TODO: Add foreignKey detection from adapter");
      // }
      return undefined;

    }
    this.relationships[def.name][rel.name].internal = false;
    const modelClass = sourceAdapter.getModel(def.name);
    const sourcePrimaryKeyName = sourceAdapter.getPrimaryKeyNameForModel(def.name);
    let funcName = `get${capitalize(rel.model)}`;
    switch (rel.type) {
      case "hasMany":
        funcName = pluralize.plural(funcName);
        break;
      case "belongsTo":
        funcName = pluralize.singular(funcName);
        break;
    }
    this.relationships[def.name][rel.name].funcName = funcName;
    // const {foreignKey} = rel.options;
    if (!foreignKey) {
      throw new Error(`For cross adapter relationships you must define a foreign key ${def.name} (${rel.type}) ${rel.model}: ${rel.name}`);
    }
    let sourceKey = (rel.options || {}).sourceKey || sourcePrimaryKeyName;
    const findFunc = await targetAdapter.createFunctionForFind(rel.model);
    switch (rel.type) {
      case "hasMany":
        modelClass.prototype[funcName] =
          this.createProxyFunction(targetAdapter, sourceKey, foreignKey, false, findFunc);
        return undefined;
      case "belongsTo":
        modelClass.prototype[funcName] =
          this.createProxyFunction(targetAdapter, foreignKey, sourceKey, true, findFunc);
        return undefined;
    }
    throw new Error(`Unknown relationship type ${rel.type}`);
  }
  createProxyFunction(adapter, sourceKey, filterKey, singular, findFunc) {
    return function() {
      const keyValue = adapter.getValueFromInstance(this, sourceKey);
      return findFunc(keyValue, filterKey, singular)
        .apply(undefined, Array.from(arguments));
    };
  }
  getValueFromInstance = (defName, data, keyName) => {
    const adapter = this.getModelAdapter(defName);
    return adapter.getValueFromInstance(data, keyName);
  }
  initialise = async(reset = false) => {
    await Promise.all(Object.keys(this.defs).map((defName) => {
      const def = this.defs[defName];
      const sourceAdapter = this.getModelAdapter(defName);
      return waterfall(def.relationships, async(rel) =>
        this.processRelationship(def, sourceAdapter, rel));
    }));
    await Promise.all(Object.keys(this.adapters).map((adapterName) => {
      const adapter = this.adapters[adapterName];
      if (reset) {
        return adapter.reset();
      }
      return adapter.initialise();
    }));
  }
  getDefaultListArgs = (defName) => {
    const adapter = this.getModelAdapter(defName);
    return adapter.getDefaultListArgs();
  }
  getFilterGraphQLType = (defName) => {
    const adapter = this.getModelAdapter(defName);
    return adapter.getFilterGraphQLType();
  }
  resolveManyRelationship = async(defName, relationship, source, args, context, info) => {
    const adapter = this.getModelAdapter(defName);
    //(instance, defName, args, info, defaultOptions = {})
    const argNames = adapter.getAllArgsToReplaceId();
    const globalKeys = this.getGlobalKeys(defName);
    const a = Object.keys(args).reduce((o, key) => {
      if (argNames.indexOf(key) > -1) {
        o[key] = replaceIdDeep(args[key], globalKeys, info.variableValues);
      } else {
        o[key] = args[key];
      }
      return o;
    }, {});
    const {getOptions, countOptions} = adapter.processListArgsToOptions(this, defName, a, info, {
      getGraphQLArgs() {
        return {
          context,
          info,
          source,
        };
      }
    }, true);
    const models = await source[relationship.accessors.get](getOptions);
    let total;
    if (adapter.hasInlineCountFeature()) {
      total = await adapter.getInlineCount(models);
    } else {
      total = await source[relationship.accessors.count](countOptions);
    }
    return {
      total, models,
    };
  }
  resolveSingleRelationship = async(defName, relationship, source, args, context, info) => {
    return source[relationship.accessors.get]({
      getGraphQLArgs() {
        return {
          context,
          info,
          source,
        };
      }
    });
  }
  resolveFindAll = async(defName, source, args, context, info) => {
    const definition = this.getDefinition(defName);
    const adapter = this.getModelAdapter(defName);
    //(instance, defName, args, info, defaultOptions = {})
    const argNames = adapter.getAllArgsToReplaceId();
    const globalKeys = this.getGlobalKeys(defName);
    const a = Object.keys(args).reduce((o, key) => {
      if (argNames.indexOf(key) > -1) {
        o[key] = replaceIdDeep(args[key], globalKeys, info.variableValues);
      } else {
        o[key] = args[key];
      }
      return o;
    }, {});
    const {getOptions, countOptions} = adapter.processListArgsToOptions(this, defName, a, info, createGetGraphQLArgsFunc(context, info, source), true);
    if (definition.before) {
      await definition.before({
        params: getOptions, args, context, info,
        modelDefinition: definition,
        type: events.QUERY,
      });
    }
    let models = await adapter.findAll(defName, getOptions);

    if (definition.after) {
      models = await Promise.all(models.map((m) => definition.after({
        result: m, args, context, info,
        modelDefinition: definition,
        type: events.QUERY,
      })).filter((m) => ( m !== undefined && m !== null )));
    }
    let total;
    if (adapter.hasInlineCountFeature()) {
      total = await adapter.getInlineCount(models);
    } else {
      total = await adapter.count(defName, countOptions);
    }
    return {
      total, models,
    };
  }
  resolveClassMethod = (defName, methodName, source, args, context, info) => {
    const Model = this.getModel(defName);
    //TODO: add before/after events?
    return Model[methodName](args, context);
  }

  processInputs = async(defName, input, source, args, context, info, model) => {
    const definition = this.getDefinition(defName);
    let i = Object.keys(this.getFields(defName)).reduce((o, key) => {
      if (input[key]) {
        o[key] = input[key];
      }
      return o;
    }, {});

    if (definition.override) {
      i = await waterfall(Object.keys(definition.override), async(key, o) => {
        if (definition.override[key].input) {
          const val = await definition.override[key].input(o[key], args, context, info, model);
          if (val !== undefined) {
            o[key] = val;
          }
        }
        return o;
      }, i);
    }
    return i;
  }
  processRelationshipMutation = async(defName, source, input, context, info) => {
    const relationships = this.getRelationships(defName);
    const defaultOptions = createGetGraphQLArgsFunc(context, info, source);
    await waterfall(Object.keys(relationships), async(key, o) => {
      const relationship = relationships[key];
      const targetName = relationship.target;
      const targetAdapter = this.getModelAdapter(targetName);
      const targetGlobalKeys = this.getGlobalKeys(targetName);
      const targetDef = this.getDefinition(targetName);
      if (input[key]) {
        const args = input[key];
        if (args.create) {
          await waterfall(args.create, async(arg) => {
            const [result] = await this.processCreate(targetName, source, {input: arg}, context, info);
            // const targetAdapter = this.getModelAdapter(targetName);
            // const k = this.getValueFromInstance(targetName, result, targetAdapter.getPrimaryKeyNameForModel(targetName));
            switch (relationship.associationType) {
              case "hasMany":
              case "belongsToMany":
                await source[relationship.accessors.add](result, defaultOptions);
                break;
              default:
                await source[relationship.accessors.set](result, defaultOptions);
                break;
            }

            // await this.processRelationshipMutation(targetDef, result, input, context, info);
          });
        }
        if (args.update) {
          await waterfall(args.update, async(arg) => {
            const {where, input} = arg;
            // const [result] = await this.processUpdate(targetName, source, {input: arg}, context, info);
            const targets = await source[relationship.accessors.get](Object.assign({
              where: targetAdapter.processFilterArgument(replaceIdDeep(where, targetGlobalKeys, info.variableValues)),
            }, defaultOptions));
            let i = await this.processInputs(targetName, input, source, args, context, info);
            if (targetDef.before) {
              i = await targetDef.before({
                params: input, args, context, info,
                modelDefinition: targetDef,
                type: events.MUTATION_UPDATE,
              });
            }
            await Promise.all(targets.map(async(model) => {
              const m = await targetAdapter.update(model, i, defaultOptions);
              if (targetDef.after) {
                m = await targetDef.after({
                  result: m, args, context, info,
                  modelDefinition: targetDef,
                  type: events.MUTATION_UPDATE,
                });
              }
              await this.processRelationshipMutation(targetDef, m, input, context, info);
              return m;
            }));
          });
        }
        if (args.delete) {
          await waterfall(args.delete, async(arg) => {
            const where = arg;
            // const [result] = await this.processUpdate(targetName, source, {input: arg}, context, info);
            const targets = await source[relationship.accessors.get](Object.assign({
              where: targetAdapter.processFilterArgument(replaceIdDeep(where, targetGlobalKeys, info.variableValues)),
            }, defaultOptions));
            let i = await this.processInputs(targetName, input, source, args, context, info);
            await Promise.all(targets.map(async(model) => {
              await this.processRelationshipMutation(targetDef, model, input, context, info);
              if (targetDef.before) {
                await targetDef.before({
                  params: model, args, context, info,
                  model, modelDefinition: targetDef,
                  type: events.MUTATION_DELETE,
                });
              }
              await targetAdapter.destroy(model, defaultOptions);
              if (targetDef.after) {
                await targetDef.after({
                  result: model, args, context, info,
                  modelDefinition: targetDef,
                  type: events.MUTATION_DELETE,
                });
              }
              return model;
            }));
          });
        }
      }
    });
    return source;
  }
  processCreate = async(defName, source, args, context, info) => {
    const adapter = this.getModelAdapter(defName);
    const definition = this.getDefinition(defName);
    const processCreate = adapter.getCreateFunction(defName);
    const globalKeys = this.getGlobalKeys(defName);
    let input = replaceIdDeep(args.input, globalKeys, info.variableValues);
    if (definition.before) {
      input = await definition.before({
        params: input, args, context, info,
        modelDefinition: definition,
        type: events.MUTATION_CREATE,
      });
    }
    let i = await this.processInputs(defName, input, source, args, context, info);
    let result;
    if (Object.keys(i).length > 0) {
      result = await processCreate(i, createGetGraphQLArgsFunc(context, info, source));
      if (definition.after) {
        result = definition.after({
          result, args, context, info,
          modelDefinition: definition,
          type: events.MUTATION_CREATE,
        });
      }

      if (result !== undefined && result !== null) {
        result = await this.processRelationshipMutation(defName, result, input, context, info);
        return [result];
      }

    }
    return [];
  }

  processUpdate = async(defName, source, args, context, info) => {
    const definition = this.getDefinition(defName);
    const adapter = this.getModelAdapter(defName);
    const processUpdate = adapter.getUpdateFunction(defName);
    const globalKeys = this.getGlobalKeys(defName);
    let input = replaceIdDeep(args.input, globalKeys, info.variableValues);
    const where = replaceIdDeep(args.where, globalKeys, info.variableValues);
    if (definition.before) {
      input = await definition.before({
        params: input, args, context, info,
        modelDefinition: definition,
        type: events.MUTATION_UPDATE,
      });
    }
    const results = await processUpdate(where, (model) => {
      return this.processInputs(defName, input, source, args, context, info, model);
    }, createGetGraphQLArgsFunc(context, info, source));

    if (definition.after) {
      return Promise.all(results.map((r) => definition.after({
        result: r, args, context, info,
        modelDefinition: definition,
        type: events.MUTATION_UPDATE,
      })));
    }
    return results;
  }
  processDelete = async(defName, source, args, context, info) => {
    const definition = this.getDefinition(defName);
    const adapter = this.getModelAdapter(defName);
    const processDelete = adapter.getDeleteFunction(defName);
    const globalKeys = this.getGlobalKeys(defName);
    const where = replaceIdDeep(args.where, globalKeys, info.variableValues);
    const before = (model) => {
      if (!definition.before) {
        return model;
      }
      return definition.before({
        params: model, args, context, info,
        model, modelDefinition: definition,
        type: events.MUTATION_DELETE,
      });
    };
    const after = (model) => {
      if (!definition.after) {
        return model;
      }
      return definition.after({
        result: model, args, context, info,
        modelDefinition: definition,
        type: events.MUTATION_DELETE,
      });
    };
    return processDelete(where, createGetGraphQLArgsFunc(context, info, source), before, after);
  }
}


function createGetGraphQLArgsFunc(context, info, source, options = {}) {
  return Object.assign({
    getGraphQLArgs() {
      return {
        context,
        info,
        source,
      };
    }
  }, options);
}
