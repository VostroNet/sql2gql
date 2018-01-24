"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createMutationV3;

var _graphql = require("graphql");

var _graphqlSequelize = require("graphql-sequelize");

var _createBeforeAfter = _interopRequireDefault(require("../../models/create-before-after"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
        args: Object.assign(fields, (0, _graphqlSequelize.defaultListArgs)()),

        async resolve(source, args, context, info) {
          let results = [];

          if (args.create) {
            results = results.concat((await Promise.all(args.create.map(async arg => {
              return funcs.create(source, {
                input: arg
              }, context, info);
            }))));
          }

          if (args.update) {
            results = results.concat((await args.update.reduce(async (arr, arg) => {
              return arr.concat((await funcs.update(source, arg, context, info)));
            }, [])));
          }

          if (args.delete) {
            results = results.concat((await args.delete.reduce(async (arr, arg) => {
              return arr.concat((await funcs.delete(source, {
                input: arg
              }, context, info)));
            }, [])));
          }

          if (!(args.create || args.update || args.delete) || args.where) {
            return (0, _graphqlSequelize.resolver)(models[modelName], {
              before,
              after
            })(source, args, context, info);
          }

          return results; //TODO: add where query results here
        }

      };
    }
  }));
  return mutationCollection;
}
//# sourceMappingURL=index.js.map
