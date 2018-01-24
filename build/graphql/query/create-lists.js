"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createModelLists;

var _graphql = require("graphql");

var _graphqlSequelize = require("graphql-sequelize");

var _createBeforeAfter = _interopRequireDefault(require("../models/create-before-after"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function createModelLists(models, modelNames, typeCollection, options, fields = {}) {
  await Promise.all(modelNames.map(async modelName => {
    if (typeCollection[modelName]) {
      if (options.permission) {
        if (options.permission.query) {
          const result = await options.permission.query(modelName, options.permission.options);

          if (!result) {
            return;
          }
        }
      } // let targetOpts = options[modelName];


      const {
        before,
        after
      } = (0, _createBeforeAfter.default)(models[modelName], options);
      fields[modelName] = {
        type: new _graphql.GraphQLList(typeCollection[modelName]),
        args: (0, _graphqlSequelize.defaultListArgs)(),
        resolve: (0, _graphqlSequelize.resolver)(models[modelName], {
          before,
          after
        })
      };
    }
  }));
  return fields;
}
//# sourceMappingURL=create-lists.js.map
