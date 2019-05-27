
import createListObject from "./create-list-object";
import {GraphQLList} from "graphql";
import waterfall from "../utils/waterfall";

export default function createMutationModel(instance, defName, schemaCache, mutationObject, create, update, del) {

  const input = schemaCache.mutationInputs[defName];
  let inp = {};
  if (create) {
    inp.create = {
      type: input.create,
    };
  }
  if (update) {
    inp.update = {
      type: input.update,
    };
  }
  if (del) {
    inp.delete = {
      type: input.delete,
    };
  }
  return {
    type: new GraphQLList(schemaCache.types[defName]),
    args: inp,
    async resolve(source, args, context, info) {
      // console.log({source, args, context, info});
      let results = [];

      if (args.create) {
        results = await waterfall(args.create, async(arg, arr) => {
          const result = await instance.processCreate(defName, source, {input: arg}, context, info);
          return arr.concat(result);
        }, results);
      }
      if (args.update) {
        results = await waterfall(args.update, async(arg, arr) => {
          const result = await instance.processUpdate(defName, source, arg, context, info);
          return arr.concat(result);
        }, results);
      }
      if (args.delete) {
        results = await waterfall(args.delete, async(arg, arr) => {
          const result = await instance.processDelete(defName, source, arg, context, info);
          return arr.concat(result);
        }, results);
      }
      // if (!(args.create || args.update || args.delete) || args.where) {
      //   return resolver(models[modelName], {
      //     before,
      //     after,
      //   })(source, args, context, info);
      // }
      return results;
    }
  };
}
