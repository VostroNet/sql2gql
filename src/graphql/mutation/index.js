
import {
  GraphQLList,
} from "graphql";

import {
  resolver,
  defaultListArgs,
  // defaultArgs,
} from "graphql-sequelize";

import createBeforeAfter from "../models/create-before-after";

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
            results = results.concat(await Promise.all(args.create.map(async(arg) => {
              return funcs.create(source, {input: arg}, context, info);
            })));
          }
          if (args.update) {
            results = results.concat(await args.update.reduce(async(arr, arg) => {
              return arr.concat(await funcs.update(source, arg, context, info));
            }, []));
          }
          if (args.delete) {
            results = results.concat(await args.delete.reduce(async(arr, arg) => {
              return arr.concat(await funcs.delete(source, arg, context, info));
            }, []));
          }
          if (!(args.create || args.update || args.delete) || args.where) {
            return resolver(models[modelName], {
              before,
              after,
            })(source, args, context, info);
          }
          return results; //TODO: add where query results here
        },
      };
    }
  }));
  return mutationCollection;
}
