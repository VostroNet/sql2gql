import waterfall from "./utils/waterfall";
import Cache from "./utils/cache";
import pluralize from "pluralize";
import replaceIdDeep from "./utils/replace-id-deep";
import { capitalize } from "./utils/word";

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
      if (!foreignKey) {
        throw new Error("TODO: Add foreignKey detection from adapter");
      }
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
    const models = await adapter.findAll(defName, getOptions);
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

}
