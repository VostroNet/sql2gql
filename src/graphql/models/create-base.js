
import {
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLEnumType,
  GraphQLNonNull,
} from "graphql";
import {
  globalIdField,
} from "graphql-relay";

import {
  resolver,
  attributeFields,
} from "graphql-sequelize";

import getModelDefinition from "../utils/get-model-def";
import createBeforeAfter from "./create-before-after";

// import {relay} from "graphql-sequelize";
// const {sequelizeConnection} = relay;

export default async function createModelTypes(models, keys, prefix = "", options, nodeInterface) {
  const result = await keys.reduce((promise, modelName) => {
    return promise.then(async(o) => {
      o[modelName] = await createModelType(modelName, models, prefix, options, nodeInterface);
      return o;
    });
  }, Promise.resolve({}));
  return result;
}

async function createModelType(modelName, models, prefix = "", options = {}, nodeInterface) {
  if (options.permission) {
    if (options.permission.model) {
      const result = await options.permission.model(modelName);
      if (!result) {
        // console.log("exluding", modelName);
        return undefined;
      }
    }
  }
  const model = models[modelName];
  const modelDefinition = getModelDefinition(model);
  let exclude = Object.keys(modelDefinition.override || {})
    .concat(modelDefinition.ignoreFields || []);
  if (options.permission) {
    if (options.permission.field) {
      exclude = exclude.concat(Object.keys(model.rawAttributes).filter((keyName) => !options.permission.field(modelName, keyName)));
    }
  }

  let fields = attributeFields(model, {
    exclude,
    globalId: true,
  });
  if (modelDefinition.override) {
    Object.keys(modelDefinition.override).forEach((fieldName) => {
      if (options.permission) {
        if (options.permission.field) {
          if (!options.permission.field(modelName, fieldName)) {
            return;
          }
        }
      }
      const fieldDefinition = modelDefinition.define[fieldName];
      const overrideFieldDefinition = modelDefinition.override[fieldName];
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
      fields[fieldName] = {
        type,
        resolve: overrideFieldDefinition.output,
      };
    });
  }
  let resolve;
  if (modelDefinition.resolver) {
    resolve = modelDefinition.resolver;
  } else {
    const {before, after} = createBeforeAfter(model, options);
    resolve = resolver(model, {before, after});
  }
  return new GraphQLObjectType({
    name: `${prefix}${modelName}`,
    description: "",
    fields,
    resolve: resolve,
    interfaces: [nodeInterface],
  });
}
