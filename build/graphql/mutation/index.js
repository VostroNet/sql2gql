"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createMutationV3;

var _graphql = require("graphql");

var _graphqlSequelize = require("graphql-sequelize");

var _createBeforeAfter = _interopRequireDefault(require("../models/create-before-after"));

var _waterfall = _interopRequireDefault(require("../../utils/waterfall"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @function createMutationV3
 * @param {Object} models
 * @param {string[]} keys
 * @param {Object} typeCollection
 * @param {function[]} mutationFunctions
 * @param {Object} options
 * @returns {Object}
*/
async function createMutationV3(models, keys, typeCollection, mutationFunctions, options) {
  let mutationCollection = {};
  await Promise.all(keys.map(async modelName => {
    if (!typeCollection[modelName] || !mutationFunctions[modelName]) {
      return;
    }

    const {
      fields,
      funcs
    } = mutationFunctions[modelName];

    if (Object.keys(fields).length > 0) {
      const {
        before,
        after
      } = (0, _createBeforeAfter.default)(models[modelName], options);
      mutationCollection[modelName] = {
        type: new _graphql.GraphQLList(typeCollection[modelName]),
        args: fields,

        async resolve(source, args, context, info) {
          let results = [];

          if (args.create) {
            results = await (0, _waterfall.default)(args.create, async (arg, arr) => {
              const result = await funcs.create(source, {
                input: arg
              }, context, info);
              return arr.concat(result);
            }, results);
          }

          if (args.update) {
            results = await (0, _waterfall.default)(args.update, async (arg, arr) => {
              const result = await funcs.update(source, arg, context, info);
              return arr.concat(result);
            }, results);
          }

          if (args.delete) {
            results = await (0, _waterfall.default)(args.delete, async (arg, arr) => {
              const result = await funcs.delete(source, arg, context, info);
              return arr.concat(result);
            }, results);
          }

          if (!(args.create || args.update || args.delete) || args.where) {
            return (0, _graphqlSequelize.resolver)(models[modelName], {
              before,
              after
            })(source, args, context, info);
          }

          return results;
        }

      };
    }
  }));
  return mutationCollection;
}
//# sourceMappingURL=index.js.map
