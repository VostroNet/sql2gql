import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLScalarType,
  GraphQLEnumType,
  GraphQLList,
} from "graphql";

import {
  fromGlobalId,
  connectionFromArray,
  nodeDefinitions,
  connectionDefinitions,
  connectionArgs,
  globalIdField
} from "graphql-relay";


function globalIdBindValue(defName, key, instance) {
  return (i) => instance.getValueFromInstance(defName, i, key);
}

export default function createBasicFieldsFunc(defName, instance, definition, options) {
  return function basicFields() {
    let fields = instance.cache.get("basicFields", {})[defName];
    if (!fields) {
      const modelFields = instance.getFields(defName);
      let exclude = Object.keys(definition.override || {})
        .concat(definition.ignoreFields || []);
      if (options.permission) {
        if (options.permission.field) {
          exclude = exclude.concat(Object.keys(modelFields).filter((keyName) => !options.permission.field(defName, keyName)));
        }
      }
      const fieldKeys = Object.keys(modelFields)
        .filter((k) => exclude.indexOf(k) === -1);
      if (fieldKeys.length === 0) { // no need to continue
        return {};
      }
      fields = fieldKeys.reduce((f, key) => {
        const fieldDef = modelFields[key];
        if (fieldDef.primaryKey || fieldDef.foreignKey) {
          let globalKeyName;
          if (fieldDef.primaryKey) {
            globalKeyName = defName;
          } else {
            globalKeyName = fieldDef.foreignTarget;
          }
          f[key] = globalIdField(globalKeyName, globalIdBindValue(defName, key, instance));
        } else {
          const type = instance.getGraphQLOutputType(defName, fieldDef.type);
          f[key] = {
            type: fieldDef.allowNull ? type : new GraphQLNonNull(type),
            // description: fieldDef.description,
            resolve: fieldDef.resolve,
            args: fieldDef.args,
          };
        }
        return f;
      }, {});
      if (definition.override) {
        fields = Object.keys(definition.override).reduce((f, fieldName) => {
          if (options.permission) {
            if (options.permission.field) {
              if (!options.permission.field(defName, fieldName)) {
                return f;
              }
            }
          }
          const fieldDefinition = modelFields[fieldName]; // modelDefinition.define[fieldName];
          if (!fieldDefinition) {
            throw new Error(`Unable to find the field definition for ${defName}->${fieldName}. Please check your model definition for invalid configuration.`);
          }
          const overrideFieldDefinition = definition.override[fieldName];
          let type;
          if (!(overrideFieldDefinition.type instanceof GraphQLObjectType) &&
            !(overrideFieldDefinition.type instanceof GraphQLScalarType) &&
            !(overrideFieldDefinition.type instanceof GraphQLEnumType)) {
            type = new GraphQLObjectType(overrideFieldDefinition.type);
          } else {
            type = overrideFieldDefinition.type;
          }
          if (!fieldDefinition.allowNull) {
            type = new GraphQLNonNull(type);
          }
          f[fieldName] = {
            // description: overrideFieldDefinition.description || fieldDefinition.description,
            type,
            resolve: overrideFieldDefinition.output,
          };
          return f;
        }, fields);
      }
      instance.cache.merge("basicFields", {[defName]: fields});
    }
    return fields;
  };
}
