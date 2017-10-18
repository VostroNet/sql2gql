
import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLInputObjectType,
} from "graphql";

import {
  resolver,
  defaultListArgs,
  defaultArgs,
} from "graphql-sequelize";

import createBeforeAfter from "../../models/create-before-after";
import getModelDefinition from "../../utils/get-model-def";
import events from "../../events";
import createMutationInputs from "../create-input";
import {onCreate, onUpdate, onDelete} from "../mutation-functions";



export default async function createMutationV3(models, keys, typeCollection, mutationCollection, mutationFunctions, options) {
  // const mutationInputTypes = await createMutationInputs(models, keys, typeCollection, options);

  await Promise.all(keys.map(async(modelName) => {
    if (!typeCollection[modelName]) {
      return;
    }
    const {fields, funcs} = mutationFunctions[modelName];
    // const {fields, funcs} = createFunctions(modelName, models, mutationInputTypes, options);
    if (Object.keys(fields).length > 0) {
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
              return arr.concat(await funcs.delete(source, {input: arg}, context, info));
            }, []));
          }
          return results; //TODO: add where query results here
        }
      };
    }
  }));
  return mutationCollection;
}
