

import {
  GraphQLList,
  GraphQLInputObjectType,
  GraphQLNonNull,
} from "graphql";

import {
  resolver,
  defaultListArgs,
} from "graphql-sequelize";


import createBeforeAfter from "../models/create-before-after";
import events from "../events";
import getModelDefinition from "../utils/get-model-def";

export function onCreate(targetModel) {
  const modelDefinition = getModelDefinition(targetModel);
  return async(source, args, context, info) => {
    let input = args.input;
    if (modelDefinition.override) {
      input = Object.keys(modelDefinition.override).reduce((data, fieldName) => {
        if (modelDefinition.override[fieldName].input) {
          data[fieldName] = modelDefinition.override[fieldName].input(data[fieldName], args, context, info);
        }
        return data;
      }, input);
    }
    if (modelDefinition.before) {
      input = await modelDefinition.before({
        params: input, args, context, info,
        modelDefinition,
        type: events.MUTATION_CREATE,
      });
    }
    let model = await targetModel.create(input, {context, rootValue: Object.assign({}, info.rootValue, {args}), transaction: context.transaction});
    if (modelDefinition.after) {
      return modelDefinition.after({
        result: model, args, context, info,
        modelDefinition,
        type: events.MUTATION_CREATE,
      });
    }
    return model;
  };
}

export function onUpdate(targetModel) {

  const modelDefinition = getModelDefinition(targetModel);
  return async(model, args, context, info) => {
    // console.log("onUpdate - args", args, model);
    let input = args.input;
    if (!input) {
      throw new Error("Unable to update field as no input was provided");
    }
    if (modelDefinition.override) {
      input = Object.keys(modelDefinition.override).reduce((data, fieldName) => {
        if (modelDefinition.override[fieldName].input) {
          data[fieldName] = modelDefinition.override[fieldName].input(data[fieldName], args, context, info, model);
        }
        return data;
      }, input);
    }
    if (modelDefinition.before) {
      input = await modelDefinition.before({
        params: input, args, context, info,
        model, modelDefinition,
        type: events.MUTATION_UPDATE,
      });
    }
    model = await model.update(input, {context, rootValue: Object.assign({}, info.rootValue, {args}), transaction: context.transaction});
    if (modelDefinition.after) {
      return modelDefinition.after({
        result: model, args, context, info,
        modelDefinition,
        type: events.MUTATION_UPDATE,
      });
    }
    return model;
  };
}
export function onDelete(targetModel) {
  const modelDefinition = getModelDefinition(targetModel);
  return async(model, args, context, info) => {
    if (modelDefinition.before) {
      model = await modelDefinition.before({
        params: model, args, context, info,
        model, modelDefinition,
        type: events.MUTATION_DELETE,
      });
    }
    await model.destroy({context, rootValue: Object.assign({}, info.rootValue, {args}), transaction: context.transaction});
    if (modelDefinition.after) {
      return modelDefinition.after({
        result: model, args, context, info,
        modelDefinition,
        type: events.MUTATION_DELETE,
      });
    }
    return model;
  };
}




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

async function createProcessRelationships(model, models) {
  return async(source, args, context, info) => {
    const {input} = args;
    if (model.relationships) {
      await Promise.all(Object.keys(model.relationships).map(async(relName) => {
        if (input[relName]) {
          const output = [];
          const relationship = model.relationships[relName];
          const assoc = model.associations[relName];
          const {mutationFunctions} = getModelDefinition(models[relationship.source]);
          switch (relationship.type) {
            case "belongsToMany": //eslint-disable-line
            case "hasMany":
              await Promise.all(input[relName].map(async(item) => {
                await Promise.all(Object.keys(item).map(async(command) => {
                  switch (command) {
                    case "create":
                      const createArgs = {input: Object.assign({}, item.create, {[assoc.foreignKey]: source.get(assoc.sourceKey)})};

                      output.push((await mutationFunctions.create(source, createArgs, context, info)));
                      break;
                    case "update":
                      const updateArgs = {
                        where: {and: [{[assoc.foreignKey]: source.get(assoc.sourceKey)}, item.update.where]},
                        input: item.update.input,
                      };
                      output.push((await mutationFunctions.update(source, updateArgs, context, info)));
                      break;
                  }
                }));
              }));
              break;
          }
        }
      }));
    }
  };
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
  const model = models[modelName];
  const modelDefinition = getModelDefinition(model);
  const {optional, required} = mutationInputTypes[modelName];
  let fields = {}, funcs = {};
  const {before} = createBeforeAfter(model, options, {});

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
  const processRelationships = await createProcessRelationships(models[modelName], models);
  if (createResult) {
    fields.create = {type: new GraphQLList(required)};
    const createFunc = onCreate(models[modelName]);
    funcs.create = async(o, args, context, info) => {
      const source = await createFunc(model, args, context, info);
      await processRelationships(source, args, context, info);

      return source;
    };
  }
  if (updateResult) {
    const {afterList: afterUpdateList} = createBeforeAfter(models[modelName], options, {
      after: [
        onUpdate(models[modelName]),
        processRelationships,
      ]});
    fields.update = {
      type: new GraphQLList(new GraphQLInputObjectType({
        name: `${modelName}CommandUpdateInput`,
        fields: Object.assign(defaultListArgs(models[modelName]), {input: {type: new GraphQLNonNull(optional)}}),
      })),
    };
    funcs.update = resolver(models[modelName], {
      before,
      after: afterUpdateList,
    });
  }

  if (deleteResult) {
    const {afterList: afterDeleteList} = createBeforeAfter(models[modelName], options, {after: [onDelete(models[modelName])]});
    fields.delete = {
      type: new GraphQLList(new GraphQLInputObjectType({
        name: `${modelName}CommandDeleteInput`,
        fields: defaultListArgs(models[modelName]),
      })),
    };
    funcs.delete = resolver(models[modelName], {
      before,
      after: afterDeleteList,
    });
  }
  if (createResult || updateResult || deleteResult) {
    modelDefinition.mutationFunctions = funcs;
    return {funcs, fields};
  }
  return undefined;
}
