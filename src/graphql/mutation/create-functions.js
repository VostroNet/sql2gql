import {
  GraphQLList,
  GraphQLInputObjectType,
  GraphQLNonNull,
} from "graphql";
import {
  resolver,
  defaultListArgs,
} from "graphql-sequelize";

import waterfall from "../utils/waterfall";

import createBeforeAfter from "../models/create-before-after";
import events from "../events";
import getModelDefinition from "../utils/get-model-def";
import {fromGlobalId, toGlobalId} from "graphql-relay/lib/node/node";
import { getForeignKeysForModel } from "../utils/models";

/**
 * @function createFunctions
 * @param {Object} models
 * @param {string[]} keys
 * @param {Object} typeCollection
 * @param {Object} mutationInputTypes
 * @param {Object} options
 * @returns {Object}
*/

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
    convertInputForModelToKeys(input, targetModel);

    let model = await targetModel.create(input, {context, rootValue: Object.assign({}, info.rootValue, {args}), transaction: (context || {}).transaction});
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
    try {
      let input = args.input;
      if (!input) {
        throw new Error("Unable to update field as no input was provided");
      }
      if (modelDefinition.override) {
        input = Object.keys(modelDefinition.override).reduce((data, fieldName) => {
          if (modelDefinition.override[fieldName].input) {
            const testField = modelDefinition.override[fieldName].input(data[fieldName], args, context, info, model);
            if (testField !== undefined) {
              data[fieldName] = testField;
            }
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
      convertInputForModelToKeys(input, targetModel);
      model = await model.update(input, {context, rootValue: Object.assign({}, info.rootValue, {args}), transaction: (context || {}).transaction});
      if (modelDefinition.after) {
        return modelDefinition.after({
          result: model, args, context, info,
          modelDefinition,
          type: events.MUTATION_UPDATE,
        });
      }
      return model;
    } catch(err) {
      console.log("err", err, err.stack);
    }
    return undefined;
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
      await waterfall(Object.keys(model.relationships), async(relName) => {
        if (input[relName]) {
          const relationship = model.relationships[relName];
          const assoc = model.associations[relName];
          const modelDefinition = getModelDefinition(models[relationship.source]);
          let createArgs, updateArgs, result, updateVars = {};

          switch (relationship.type) {
            case "belongsTo":
              await waterfall(Object.keys(input[relName]), async(command) => {
                switch (command) {
                  case "create":
                    createArgs = {
                      input: Object.assign({}, input[relName].create),
                    };
                    result = await modelDefinition.mutationFunctions.create(source, createArgs, context, info);
                    updateVars[assoc.foreignKey] = result[assoc.targetKey];
                    source = await source.update(updateVars, context);
                    await modelDefinition.events.after(result, createArgs, context, info);
                    break;
                  case "update":
                    throw new Error("belongsTo update - Needs to be implemented properly");
                }
              });
              break;
            case "hasOne":
              await waterfall(Object.keys(input[relName]), async(command) => {
                switch (command) {
                  case "create":
                    createArgs = {
                      input: Object.assign({}, input[relName].create),
                    };
                    createArgs.input[assoc.foreignKey] = toGlobalId(relationship.source, source[assoc.sourceKey]);
                    await modelDefinition.mutationFunctions.create(source, createArgs, context, info);
                    break;
                  case "update":
                    throw new Error("hasOne update - Needs to be implemented properly");
                }
              });
              break;
            case "belongsToMany": //eslint-disable-line
              await waterfall(input[relName], (commands) => {
                return waterfall(Object.keys(commands), (command) => {
                  switch (command) {
                    case "create":
                      return waterfall(commands.create, async(action) => {
                        const createArgs = {
                          input: Object.assign({}, action),
                        };
                        let models = await modelDefinition.mutationFunctions.create(source, createArgs, context, info);
                        return source[assoc.accessors.add].apply(source, [
                          models,
                          {context},
                        ]);

                      });
                    case "update":
                      return waterfall(commands.update, async(action) => {
                        const models = await source[assoc.accessors.get]({
                          where: action.where, context,
                        });
                        return waterfall(models, (model) => {
                          return modelDefinition.mutationFunctions.updateSingle(model, {
                            input: action.input,
                          }, context, info);
                        });
                      });
                  }
                  return undefined;
                });
              });
              break;
            case "hasMany":
              await waterfall(input[relName], (commands) => {
                return waterfall(Object.keys(commands), (command) => {
                  return waterfall(commands[command], async(action) => {
                    switch (command) {
                      case "create":
                        createArgs = {
                          input: Object.assign({}, action, {
                            [assoc.foreignKey]: toGlobalId(source.name, source.get(assoc.sourceKey)),
                          }),
                        };
                        await modelDefinition.mutationFunctions.create(source, createArgs, context, info);
                        break;
                      case "update":
                        updateArgs = {
                          where: {and: [{[assoc.foreignKey]: source.get(assoc.sourceKey)}, action.where]},
                          input: action.input,
                        };
                        await modelDefinition.mutationFunctions.update(source, updateArgs, context, info);
                        break;
                    }
                  });
                });
              });
              break;
          }
        }
      });
    }
    return source;
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
      if (source) {
        await processRelationships(source, args, context, info);
      }
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
      before(source, args, context, info) {
        return before(source, args, context, info);
      },
      after: afterUpdateList,
    });
    funcs.updateSingle = async(source, args, context, info) => {
      const arr = await before([source], args, context, info);
      return afterUpdateList(arr, args, context, info);
    };
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
      before(source, args, context, info) {
        return before(source, args, context, info);
      },
      after: afterDeleteList,
    });
  }
  if (createResult || updateResult || deleteResult) {
    modelDefinition.mutationFunctions = funcs;
    return {funcs, fields};
  }
  return undefined;
}


export function convertInputForModelToKeys(input, targetModel) {
  const foreignKeys = getForeignKeysForModel(targetModel);
  if (foreignKeys.length > 0) {
    foreignKeys.forEach((fk) => {
      if (input[fk] && typeof input[fk] === "string") {
        input[fk] = fromGlobalId(input[fk]).id;
      }
    });
  }
  return input;
}
