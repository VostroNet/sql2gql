import {
  GraphQLObjectType,
} from "graphql";

import getModelDefinition from "../utils/get-model-def";


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
          resolve(item, args, context, gql) {
            return models[modelName][methodName].apply(models[modelName], [args, context]);
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
