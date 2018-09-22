"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.onCreate = onCreate;
exports.onUpdate = onUpdate;
exports.onDelete = onDelete;
exports.default = createFunctions;
exports.convertInputForModelToKeys = convertInputForModelToKeys;

var _graphql = require("graphql");

var _graphqlSequelize = require("graphql-sequelize");

var _createBeforeAfter = _interopRequireDefault(require("../models/create-before-after"));

var _events = _interopRequireDefault(require("../events"));

var _getModelDef = _interopRequireDefault(require("../utils/get-model-def"));

var _node = require("graphql-relay/lib/node/node");

var _models = require("../utils/models");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @function createFunctions
 * @param {Object} models
 * @param {string[]} keys
 * @param {Object} typeCollection
 * @param {Object} mutationInputTypes
 * @param {Object} options
 * @returns {Object}
*/
function onCreate(targetModel) {
  const modelDefinition = (0, _getModelDef.default)(targetModel);
  return async (source, args, context, info) => {
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
        params: input,
        args,
        context,
        info,
        modelDefinition,
        type: _events.default.MUTATION_CREATE
      });
    }

    convertInputForModelToKeys(input, targetModel);
    let model = await targetModel.create(input, {
      context,
      rootValue: Object.assign({}, info.rootValue, {
        args
      }),
      transaction: (context || {}).transaction
    });

    if (modelDefinition.after) {
      return modelDefinition.after({
        result: model,
        args,
        context,
        info,
        modelDefinition,
        type: _events.default.MUTATION_CREATE
      });
    }

    return model;
  };
}

function onUpdate(targetModel) {
  const modelDefinition = (0, _getModelDef.default)(targetModel);
  return async (model, args, context, info) => {
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
        params: input,
        args,
        context,
        info,
        model,
        modelDefinition,
        type: _events.default.MUTATION_UPDATE
      });
    }

    convertInputForModelToKeys(input, targetModel);
    model = await model.update(input, {
      context,
      rootValue: Object.assign({}, info.rootValue, {
        args
      }),
      transaction: (context || {}).transaction
    });

    if (modelDefinition.after) {
      return modelDefinition.after({
        result: model,
        args,
        context,
        info,
        modelDefinition,
        type: _events.default.MUTATION_UPDATE
      });
    }

    return model;
  };
}

function onDelete(targetModel) {
  const modelDefinition = (0, _getModelDef.default)(targetModel);
  return async (model, args, context, info) => {
    if (modelDefinition.before) {
      model = await modelDefinition.before({
        params: model,
        args,
        context,
        info,
        model,
        modelDefinition,
        type: _events.default.MUTATION_DELETE
      });
    }

    await model.destroy({
      context,
      rootValue: Object.assign({}, info.rootValue, {
        args
      }),
      transaction: context.transaction
    });

    if (modelDefinition.after) {
      return modelDefinition.after({
        result: model,
        args,
        context,
        info,
        modelDefinition,
        type: _events.default.MUTATION_DELETE
      });
    }

    return model;
  };
}

async function createFunctions(models, keys, typeCollection, mutationInputTypes, options) {
  const result = await keys.reduce((promise, modelName) => {
    return promise.then(async o => {
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
  return async (source, args, context, info) => {
    const {
      input
    } = args;

    if (model.relationships) {
      await Promise.all(Object.keys(model.relationships).map(async relName => {
        if (input[relName]) {
          const relationship = model.relationships[relName];
          const assoc = model.associations[relName];
          const modelDefinition = (0, _getModelDef.default)(models[relationship.source]);
          let createArgs,
              updateArgs,
              result,
              updateVars = {};

          switch (relationship.type) {
            case "belongsTo":
              await Promise.all(Object.keys(input[relName]).map(async command => {
                switch (command) {
                  case "create":
                    createArgs = {
                      input: Object.assign({}, input[relName].create)
                    };
                    result = await modelDefinition.mutationFunctions.create(source, createArgs, context, info);
                    updateVars[assoc.foreignKey] = result[assoc.targetKey];
                    source = await source.update(updateVars, context);
                    await modelDefinition.events.after(result, createArgs, context, info);
                    break;

                  case "update":
                    throw new Error("belongsTo update - Needs to be implemented properly");
                }
              }));
              break;

            case "hasOne":
              await Promise.all(Object.keys(input[relName]).map(async command => {
                switch (command) {
                  case "create":
                    createArgs = {
                      input: Object.assign({}, input[relName].create)
                    };
                    createArgs.input[assoc.foreignKey] = (0, _node.toGlobalId)(relationship.source, source[assoc.sourceKey]);
                    await modelDefinition.mutationFunctions.create(source, createArgs, context, info);
                    break;

                  case "update":
                    throw new Error("hasOne update - Needs to be implemented properly");
                }
              }));
              break;

            case "belongsToMany":
              //eslint-disable-line
              throw new Error("belongsToMany - Needs to be implemented properly");

            case "hasMany":
              await Promise.all(input[relName].map(async item => {
                await Promise.all(Object.keys(item).map(async command => {
                  switch (command) {
                    case "create":
                      createArgs = {
                        input: Object.assign({}, item.create, {
                          [assoc.foreignKey]: (0, _node.toGlobalId)(source.name, source.get(assoc.sourceKey))
                        })
                      };
                      await modelDefinition.mutationFunctions.create(source, createArgs, context, info);
                      break;

                    case "update":
                      updateArgs = {
                        where: {
                          and: [{
                            [assoc.foreignKey]: source.get(assoc.sourceKey)
                          }, item.update.where]
                        },
                        input: item.update.input
                      };
                      await modelDefinition.mutationFunctions.update(source, updateArgs, context, info);
                      break;
                  }
                }));
              }));
              break;
          }
        }
      }));
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
  const modelDefinition = (0, _getModelDef.default)(model);
  const {
    optional,
    required
  } = mutationInputTypes[modelName];
  let fields = {},
      funcs = {};
  const {
    before
  } = (0, _createBeforeAfter.default)(model, options, {});
  let updateResult = true,
      deleteResult = true,
      createResult = true;

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
    fields.create = {
      type: new _graphql.GraphQLList(required)
    };
    const createFunc = onCreate(models[modelName]);

    funcs.create = async (o, args, context, info) => {
      const source = await createFunc(model, args, context, info);

      if (source) {
        await processRelationships(source, args, context, info);
      }

      return source;
    };
  }

  if (updateResult) {
    const {
      afterList: afterUpdateList
    } = (0, _createBeforeAfter.default)(models[modelName], options, {
      after: [onUpdate(models[modelName]), processRelationships]
    });
    fields.update = {
      type: new _graphql.GraphQLList(new _graphql.GraphQLInputObjectType({
        name: `${modelName}CommandUpdateInput`,
        fields: Object.assign((0, _graphqlSequelize.defaultListArgs)(models[modelName]), {
          input: {
            type: new _graphql.GraphQLNonNull(optional)
          }
        })
      }))
    };
    funcs.update = (0, _graphqlSequelize.resolver)(models[modelName], {
      before(source, args, context, info) {
        return before(source, args, context, info);
      },

      after: afterUpdateList
    });
  }

  if (deleteResult) {
    const {
      afterList: afterDeleteList
    } = (0, _createBeforeAfter.default)(models[modelName], options, {
      after: [onDelete(models[modelName])]
    });
    fields.delete = {
      type: new _graphql.GraphQLList(new _graphql.GraphQLInputObjectType({
        name: `${modelName}CommandDeleteInput`,
        fields: (0, _graphqlSequelize.defaultListArgs)(models[modelName])
      }))
    };
    funcs.delete = (0, _graphqlSequelize.resolver)(models[modelName], {
      before(source, args, context, info) {
        return before(source, args, context, info);
      },

      after: afterDeleteList
    });
  }

  if (createResult || updateResult || deleteResult) {
    modelDefinition.mutationFunctions = funcs;
    return {
      funcs,
      fields
    };
  }

  return undefined;
}

function convertInputForModelToKeys(input, targetModel) {
  const foreignKeys = (0, _models.getForeignKeysForModel)(targetModel);

  if (foreignKeys.length > 0) {
    foreignKeys.forEach(fk => {
      if (input[fk] && typeof input[fk] === "string") {
        input[fk] = (0, _node.fromGlobalId)(input[fk]).id;
      }
    });
  }

  return input;
}
//# sourceMappingURL=create-functions.js.map
