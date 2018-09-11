"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createQueryFunctions;

var _graphql = require("graphql");

var _getModelDef = _interopRequireDefault(require("../utils/get-model-def"));

var _processFk = _interopRequireDefault(require("../utils/process-fk"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @function createQueryFunctions
 * @param {Object} models
 * @param {string[]} keys
 * @param {Object} typeCollection
 * @param {Object} options
 * @returns {Object}
*/
async function createQueryFunctions(models, keys, typeCollection, options) {
  let queryCollection = {};
  await Promise.all(keys.map(async modelName => {
    const {
      query
    } = ((0, _getModelDef.default)(models[modelName]).expose || {}).classMethods || {};
    let queryFields = {};

    if (query) {
      await Promise.all(Object.keys(query).map(async methodName => {
        if (options.permission) {
          if (options.permission.queryClassMethods) {
            const result = await options.permission.queryClassMethods(modelName, methodName, options.permission.options);

            if (!result) {
              return;
            }
          }
        }

        const {
          type,
          args
        } = query[methodName];
        let outputType = type instanceof String || typeof type === "string" ? typeCollection[type] : type;

        if (!outputType) {
          return;
        }

        queryFields[methodName] = {
          type: outputType,
          args,

          async resolve(item, args, context, gql) {
            return (0, _processFk.default)(outputType, models[modelName][methodName], models[modelName], args, context, gql);
          }

        };
      }));

      if (Object.keys(queryFields).length > 0) {
        queryCollection[modelName] = {
          type: new _graphql.GraphQLObjectType({
            name: `${modelName}Query`,
            fields: queryFields
          }),

          resolve() {
            return {}; // forces graphql to resolve the fields
          }

        };
      }
    }
  }));
  return queryCollection;
}
//# sourceMappingURL=create-class-methods.js.map
