"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _graphql = require("graphql");

var _graphqlSequelize = require("graphql-sequelize");

var _createBeforeAfter = require("../models/create-before-after");

var _createBeforeAfter2 = _interopRequireDefault(_createBeforeAfter);

var _getModelDef = require("../utils/get-model-def");

var _getModelDef2 = _interopRequireDefault(_getModelDef);

var _events = require("../events");

var _events2 = _interopRequireDefault(_events);

var _createInput = require("./create-input");

var _createInput2 = _interopRequireDefault(_createInput);

var _mutationFunctions = require("./mutation-functions");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.default = (() => {
  var _ref = _asyncToGenerator(function* (models, keys, typeCollection, mutationCollection, options) {
    const mutationInputTypes = yield (0, _createInput2.default)(models, keys, typeCollection, options);
    yield Promise.all(keys.map((() => {
      var _ref2 = _asyncToGenerator(function* (modelName) {
        if (!typeCollection[modelName]) {
          return;
        }
        if (options.permission) {
          if (options.permission.mutation) {
            const result = yield options.permission.mutation(modelName, options.permission.options);
            if (!result) {
              return;
            }
          }
        }
        let { fields } = typeCollection[modelName]._typeConfig; //eslint-disable-line

        const requiredInput = mutationInputTypes[modelName].required;
        const optionalInput = mutationInputTypes[modelName].optional;
        let mutationFields = {};

        // const modelDefinition = getModelDefinition(models[modelName]);
        const createFunc = (0, _mutationFunctions.onCreate)(models[modelName]);
        const updateFunc = (0, _mutationFunctions.onUpdate)(models[modelName]);
        const deleteFunc = (0, _mutationFunctions.onDelete)(models[modelName]);
        let create = {
          type: typeCollection[modelName],
          args: {
            input: {
              type: requiredInput
            }
          },
          resolve: createFunc
        };
        // const {before, after, afterList} = createBeforeAfter(models[modelName], options, {after: [updateFunc]});
        const { before, after: afterUpdate, afterList: afterUpdateList } = (0, _createBeforeAfter2.default)(models[modelName], options, { after: [updateFunc] });
        const { after: afterDelete, afterList: afterDeleteList } = (0, _createBeforeAfter2.default)(models[modelName], options, { after: [deleteFunc] });
        let update = {
          type: typeCollection[modelName],
          args: Object.assign((0, _graphqlSequelize.defaultArgs)(models[modelName]), { input: { type: optionalInput } }),
          resolve: (0, _graphqlSequelize.resolver)(models[modelName], {
            before: before,
            after: afterUpdate
          })
        };
        let del = {
          type: typeCollection[modelName],
          args: (0, _graphqlSequelize.defaultArgs)(models[modelName]),
          resolve: (0, _graphqlSequelize.resolver)(models[modelName], {
            before: before,
            after: afterDelete
          })
        };
        let updateAll = {
          type: new _graphql.GraphQLList(typeCollection[modelName]),
          args: Object.assign((0, _graphqlSequelize.defaultListArgs)(models[modelName]), { input: { type: optionalInput } }),
          resolve: (0, _graphqlSequelize.resolver)(models[modelName], {
            before: before,
            after: afterUpdateList
          })
        };
        let deleteAll = {
          type: new _graphql.GraphQLList(typeCollection[modelName]),
          args: (0, _graphqlSequelize.defaultListArgs)(models[modelName]),
          resolve: (0, _graphqlSequelize.resolver)(models[modelName], {
            before: before,
            after: afterDeleteList
          })
        };

        if (options.permission) {
          if (options.permission.mutationCreate) {
            const result = yield options.permission.mutationCreate(modelName, options.permission.options);
            if (result) {
              mutationFields.create = create;
            }
          } else {
            mutationFields.create = create;
          }

          if (options.permission.mutationUpdate) {
            const result = yield options.permission.mutationUpdate(modelName, options.permission.options);
            if (result) {
              mutationFields.update = update;
            }
          } else {
            mutationFields.update = update;
          }

          if (options.permission.mutationDelete) {
            const result = yield options.permission.mutationDelete(modelName, options.permission.options);
            if (result) {
              mutationFields.delete = del;
            }
          } else {
            mutationFields.delete = del;
          }
          if (options.permission.mutationUpdateAll) {
            const result = yield options.permission.mutationUpdateAll(modelName, options.permission.options);
            if (result) {
              mutationFields.updateAll = updateAll;
            }
          } else {
            mutationFields.updateAll = updateAll;
          }
          if (options.permission.mutationDeleteAll) {
            const result = yield options.permission.mutationDeleteAll(modelName, options.permission.options);
            if (result) {
              mutationFields.deleteAll = deleteAll;
            }
          } else {
            mutationFields.deleteAll = deleteAll;
          }
        } else {
          mutationFields.create = create;
          mutationFields.update = update;
          mutationFields.delete = del;
          mutationFields.updateAll = updateAll;
          mutationFields.deleteAll = deleteAll;
        }

        const { mutations } = ((0, _getModelDef2.default)(models[modelName]).expose || {}).classMethods || {};
        if (mutations) {
          yield Promise.all(Object.keys(mutations).map((() => {
            var _ref3 = _asyncToGenerator(function* (methodName) {
              const { type, args } = mutations[methodName];
              if (options.permission) {
                if (options.permission.mutationClassMethods) {
                  const result = yield options.permission.mutationClassMethods(modelName, methodName, options.permission.options);
                  if (!result) {
                    return;
                  }
                }
              }
              let outputType = type instanceof String || typeof type === "string" ? typeCollection[type] : type;
              mutationFields[methodName] = {
                type: outputType,
                args,
                resolve(item, args, context, gql) {
                  return models[modelName][methodName].apply(models[modelName], [args, context]);
                }
              };
              // }
            });

            return function (_x7) {
              return _ref3.apply(this, arguments);
            };
          })()));
        }
        if (Object.keys(mutationFields).length > 0) {
          mutationCollection[modelName] = {
            type: new _graphql.GraphQLObjectType({
              name: `${modelName}Mutator`,
              fields: mutationFields
            }),
            resolve() {
              return {}; // forces graphql to resolve the fields
            }
          };
        }
      });

      return function (_x6) {
        return _ref2.apply(this, arguments);
      };
    })()));
    return mutationCollection;
  });

  function createMutationFunctions(_x, _x2, _x3, _x4, _x5) {
    return _ref.apply(this, arguments);
  }

  return createMutationFunctions;
})();
//# sourceMappingURL=index.js.map
