import {
  GraphQLObjectType,
} from "graphql";
// import getModelDefinition from "../utils/get-model-def";
// import processFK from "../utils/process-fk";

/**
 * @function createQueryFunctions
 * @param {Object} models
 * @param {string[]} keys
 * @param {Object} typeCollection
 * @param {Object} options
 * @returns {Object}
*/

export default async function createQueryFunctions(models, keys, typeCollection, options) {
  let queryCollection = {};
  await Promise.all(keys.map(async(modelName) => {
    const {query} = ((getModelDefinition(models[modelName]).expose || {}).classMethods || {});
    let queryFields = {};
    if (query) {
      await Promise.all(Object.keys(query).map(async(methodName) => {
        if (options.permission) {
          if (options.permission.queryClassMethods) {
            const result = await options.permission.queryClassMethods(modelName, methodName, options.permission.options);
            if (!result) {
              return;
            }
          }
        }
        const {type, args} = query[methodName];
        let outputType = (type instanceof String || typeof type === "string") ? typeCollection[type] : type;
        if (!outputType) {
          return;
        }
        queryFields[methodName] = {
          type: outputType,
          args,
          async resolve(item, args, context, gql) {
            return processFK(outputType, models[modelName][methodName], models[modelName], args, context, gql);
          },
        };
      }));
      if (Object.keys(queryFields).length > 0) {
        queryCollection[modelName] = {
          type: new GraphQLObjectType({
            name: `${modelName}Query`,
            fields: queryFields,
          }),
          resolve() {
            return {}; // forces graphql to resolve the fields
          },
        };
      }
    }
  }));
  return queryCollection;
}
