

import {
  GraphQLList,
  GraphQLInputObjectType,
} from "graphql";

import {
  resolver,
  defaultListArgs,
} from "graphql-sequelize";

import createBeforeAfter from "../../models/create-before-after";
import {onCreate, onUpdate, onDelete} from "../mutation-functions";

export default async function createFunctions(models, keys, typeCollection, mutationInputTypes, options) {
  const result = await keys.reduce((promise, modelName) => {
    return promise.then(async(o) => {
      if (!typeCollection[modelName]) {
        return o;
      }
      o[modelName] = await createFunctionForModel(modelName, models, mutationInputTypes, options);
      return o;
    });
  }, Promise.resolve({}));
  return result;
}

async function createFunctionForModel(modelName, models, mutationInputTypes, options) {
  if (options.permission) {
    if (options.permission.mutation) {
      const result = await options.permission.mutation(modelName, options.permission.options);
      if (!result) {
        return undefined;
      }
    }
  }
  const {optional, required} = mutationInputTypes[modelName];
  let fields = {}, funcs = {};
  const updateFunc = onUpdate(models[modelName]);
  const deleteFunc = onDelete(models[modelName]);


  const {before} = createBeforeAfter(models[modelName], options, {});

  let updateResult = true, deleteResult = true, createResult = true;
  if (options.permission) {
    if (options.permission.mutationUpdate) {
      updateResult = await options.permission.mutationUpdate(modelName, options.permission.options);
    }
    if (options.permission.mutationDelete) {
      deleteResult = await options.permission.mutationDelete(modelName, options.permission.options);
    }
    if (options.permission.mutationCreate) {
      createResult = await options.permission.mutationCreate(modelName, options.permission.options);
    }
  }

  if (createResult) {
    fields.create = {type: new GraphQLList(required)};
    funcs.create = onCreate(models[modelName]);
  }
  if (updateResult) {
    const {afterList: afterUpdateList} = createBeforeAfter(models[modelName], options, {after: [updateFunc]});
    fields.update = {
      type: new GraphQLList(new GraphQLInputObjectType({
        name: `${modelName}CommandUpdateInput`,
        fields: Object.assign(defaultListArgs(models[modelName]), {input: {type: optional}}),
      })),
    };
    funcs.update = resolver(models[modelName], {
      before: before,
      after: afterUpdateList,
    });
  }

  if (deleteResult) {
    const {afterList: afterDeleteList} = createBeforeAfter(models[modelName], options, {after: [deleteFunc]});
    fields.delete = {
      type: new GraphQLList(new GraphQLInputObjectType({
        name: `${modelName}CommandDeleteInput`,
        fields: defaultListArgs(models[modelName]),
      })),
    };
    funcs.delete = resolver(models[modelName], {
      before: before,
      after: afterDeleteList,
    });
  }
  if (createResult || updateResult || deleteResult) {
    return {funcs, fields};
  }
  return undefined;
}
