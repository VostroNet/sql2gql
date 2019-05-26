
import createListObject from "./create-list-object";

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
  return createListObject(instance, schemaCache, defName, schemaCache.types[defName], (source, args, context, info) => {
    return source;
    // return instance.resolveFindAll(defName, source, args, context, info);
  }, "", "Mutation", inp);
}
