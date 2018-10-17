"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createMutationFunctions;

var _graphql = require("graphql");

var _getModelDef = _interopRequireDefault(require("../utils/get-model-def"));

var _processFk = _interopRequireDefault(require("../utils/process-fk"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import { GraphQLList } from "graphql/type/definition";
// import { GraphQLNonNull } from "graphql/type/definition";

/**
 * @function createMutationFunctions
 * @param {Object} models
 * @param {string[]} keys
 * @param {Object} typeCollection
 * @param {Object} options
 * @returns {Object}
*/
async function createMutationFunctions(models, keys, typeCollection, options) {
  let mutationCollection = {};
  await Promise.all(keys.map(async modelName => {
    const {
      mutations
    } = ((0, _getModelDef.default)(models[modelName]).expose || {}).classMethods || {};
    let mutationFields = {};

    if (mutations) {
      await Promise.all(Object.keys(mutations).map(async methodName => {
        if (options.permission) {
          if (options.permission.mutationClassMethods) {
            const result = await options.permission.mutationClassMethods(modelName, methodName, options.permission.options);

            if (!result) {
              return;
            }
          }
        }

        const {
          type,
          args
        } = mutations[methodName];
        let outputType = type instanceof String || typeof type === "string" ? typeCollection[type] : type;

        if (!outputType) {
          return;
        }

        mutationFields[methodName] = {
          type: outputType,
          args,

          resolve(item, args, context, gql) {
            return (0, _processFk.default)(outputType, models[modelName][methodName], models[modelName], args, context, gql);
          }

        };
      }));

      if (Object.keys(mutationFields).length > 0) {
        mutationCollection[modelName] = {
          type: new _graphql.GraphQLObjectType({
            name: `${modelName}Mutation`,
            fields: mutationFields
          }),

          resolve() {
            return {}; // forces graphql to resolve the fields
          }

        };
      }
    }
  }));
  return mutationCollection;
}
//# sourceMappingURL=create-class-methods.js.map
