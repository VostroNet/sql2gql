"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createModelLists;

var _graphqlSequelize = require("graphql-sequelize");

var _getModelDef = _interopRequireDefault(require("../utils/get-model-def"));

var _createBeforeAfter = _interopRequireDefault(require("../models/create-before-after"));

var _graphql = require("graphql");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * @function createModelLists
 * @param {Object} models
 * @param {string[]} modelNames
 * @param {Object} typeCollection
 * @param {Object} options
 * @param {Object} fields
 * @returns {Object}
*/
const {
  sequelizeConnection
} = _graphqlSequelize.relay;

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
      }

      const {
        before,
        after
      } = (0, _createBeforeAfter.default)(models[modelName], options);
      const def = (0, _getModelDef.default)(models[modelName]);
      const c = sequelizeConnection({
        name: `${modelName}`,
        nodeType: typeCollection[modelName],
        target: models[modelName],
        orderBy: def.orderBy,
        edgeFields: def.edgeFields,
        connectionFields: Object.assign({}, {
          total: {
            type: _graphql.GraphQLInt,

            resolve({
              source
            }) {
              if (source) {
                return (source.edges || []).length;
              }

              return 0;
            }

          }
        }, def.connectionFields),
        where: (key, value, currentWhere) => {
          // for custom args other than connectionArgs return a sequelize where parameter
          if (key === "where") {
            return value;
          }

          return {
            [key]: value
          };
        },
        before,
        after
      });
      fields[modelName] = {
        type: c.connectionType,
        args: _objectSpread({}, c.connectionArgs, {
          where: {
            type: _graphqlSequelize.JSONType.default
          }
        }),

        async resolve(source, args, context, info) {
          return c.resolve(source, args, context, info);
        }

      };
    }
  }));
  return fields;
}
//# sourceMappingURL=create-lists.js.map
