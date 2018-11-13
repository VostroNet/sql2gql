import {
  GraphQLList,
} from "graphql";
import {
  resolver,
} from "graphql-sequelize";
import createBeforeAfter from "../models/create-before-after";
import waterfall from "../utils/waterfall";

/**
 * @function createMutationV3
 * @param {Object} models
 * @param {string[]} keys
 * @param {Object} typeCollection
 * @param {function[]} mutationFunctions
 * @param {Object} options
 * @returns {Object}
*/

export default async function createMutationV3(models, keys, typeCollection, mutationFunctions, options) {
  let mutationCollection = {};
  await Promise.all(keys.map(async(modelName) => {
    if (!typeCollection[modelName] || !mutationFunctions[modelName]) {
      return;
    }
    const {fields, funcs} = mutationFunctions[modelName];
    if (Object.keys(fields).length > 0) {
      const {before, after} = createBeforeAfter(models[modelName], options);
      mutationCollection[modelName] = {
        type: new GraphQLList(typeCollection[modelName]),
        args: fields,
        async resolve(source, args, context, info) {
          let results = [];

          if (args.create) {
            results = await waterfall(args.create, async(arg, arr) => {
              const result = await funcs.create(source, {input: arg}, context, info);
              return arr.concat(result);
            }, results);
          }
          if (args.update) {
            results = await waterfall(args.update, async(arg, arr) => {
              const result = await funcs.update(source, arg, context, info);
              return arr.concat(result);
            }, results);
          }
          if (args.delete) {
            results = await waterfall(args.delete, async(arg, arr) => {
              const result = await funcs.delete(source, arg, context, info);
              return arr.concat(result);
            }, results);
          }
          if (!(args.create || args.update || args.delete) || args.where) {
            return resolver(models[modelName], {
              before,
              after,
            })(source, args, context, info);
          }
          return results;
        },
      };
    }
  }));
  return mutationCollection;
}
