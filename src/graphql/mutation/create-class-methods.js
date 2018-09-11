import {
  GraphQLObjectType,
} from "graphql";
import getModelDefinition from "../utils/get-model-def";
import { GraphQLList } from "graphql/type/definition";
import { GraphQLNonNull } from "graphql/type/definition";
import processFK from "../utils/process-fk";

/**
 * @function createMutationFunctions
 * @param {Object} models
 * @param {string[]} keys
 * @param {Object} typeCollection
 * @param {Object} options
 * @returns {Object}
*/

export default async function createMutationFunctions(models, keys, typeCollection, options) {
  let mutationCollection = {};
  await Promise.all(keys.map(async(modelName) => {
    const {mutations} = ((getModelDefinition(models[modelName]).expose || {}).classMethods || {});
    let mutationFields = {};
    if (mutations) {
      await Promise.all(Object.keys(mutations).map(async(methodName) => {
        if (options.permission) {
          if (options.permission.mutationClassMethods) {
            const result = await options.permission.mutationClassMethods(modelName, methodName, options.permission.options);
            if (!result) {
              return;
            }
          }
        }
        const {type, args} = mutations[methodName];
        let outputType = (type instanceof String || typeof type === "string") ? typeCollection[type] : type;
        if (!outputType) {
          return;
        }
        mutationFields[methodName] = {
          type: outputType,
          args,
          resolve(item, args, context, gql) {
            return processFK(outputType, models[modelName][methodName], models[modelName], args, context, gql);
          },
        };
      }));
      if (Object.keys(mutationFields).length > 0) {
        mutationCollection[modelName] = {
          type: new GraphQLObjectType({
            name: `${modelName}Mutation`,
            fields: mutationFields,
          }),
          resolve() {
            return {}; // forces graphql to resolve the fields
          },
        };
      }
    }
  }));
  return mutationCollection;
}
