"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createQueryFunctions;

var _graphql = require("graphql");

var _getModelDef = _interopRequireDefault(require("../utils/get-model-def"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

          resolve(item, args, context, gql) {
            return models[modelName][methodName].apply(models[modelName], [args, context]);
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
