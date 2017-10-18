"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

let createModelType = (() => {
  var _ref3 = _asyncToGenerator(function* (modelName, models, prefix = "", options = {}) {
    if (options.permission) {
      if (options.permission.model) {
        const result = yield options.permission.model(modelName);
        if (!result) {
          console.log("exluding", modelName);
          return undefined;
        }
      }
    }
    const model = models[modelName];
    const modelDefinition = (0, _getModelDef2.default)(model);
    let exclude = Object.keys(modelDefinition.override || {}).concat(modelDefinition.ignoreFields || []);
    if (options.permission) {
      if (options.permission.field) {
        exclude = exclude.concat(Object.keys(model.rawAttributes).filter(function (keyName) {
          return !options.permission.field(modelName, keyName);
        }));
      }
    }

    let fields = (0, _graphqlSequelize.attributeFields)(model, {
      exclude
    });
    if (modelDefinition.override) {
      Object.keys(modelDefinition.override).forEach(function (fieldName) {
        if (options.permission) {
          if (options.permission.field) {
            if (!options.permission.field(modelName, fieldName)) {
              return;
            }
          }
        }
        const fieldDefinition = modelDefinition.define[fieldName];
        const overrideFieldDefinition = modelDefinition.override[fieldName];
        let type;
        if (!(overrideFieldDefinition.type instanceof _graphql.GraphQLObjectType) && !(overrideFieldDefinition.type instanceof _graphql.GraphQLScalarType) && !(overrideFieldDefinition.type instanceof _graphql.GraphQLEnumType)) {
          type = new _graphql.GraphQLObjectType(overrideFieldDefinition.type);
        } else {
          type = overrideFieldDefinition.type;
        }
        if (!fieldDefinition.allowNull) {
          type = new _graphql.GraphQLNonNull(type);
        }
        fields[fieldName] = {
          type,
          resolve: overrideFieldDefinition.output
        };
      });
    }
    let resolve;
    if (modelDefinition.resolver) {
      resolve = modelDefinition.resolver;
    } else {
      const { before, after } = (0, _createBeforeAfter2.default)(model, options);
      resolve = (0, _graphqlSequelize.resolver)(model, { before, after });
    }
    return new _graphql.GraphQLObjectType({
      name: `${prefix}${modelName}`,
      description: "",
      fields: fields,
      resolve: resolve
    });
  });

  return function createModelType(_x4, _x5) {
    return _ref3.apply(this, arguments);
  };
})();

var _graphql = require("graphql");

var _graphqlSequelize = require("graphql-sequelize");

var _getModelDef = require("../utils/get-model-def");

var _getModelDef2 = _interopRequireDefault(_getModelDef);

var _createBeforeAfter = require("./create-before-after");

var _createBeforeAfter2 = _interopRequireDefault(_createBeforeAfter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.default = (() => {
  var _ref = _asyncToGenerator(function* (models, keys, prefix = "", options) {
    const result = yield keys.reduce(function (promise, modelName) {
      return promise.then((() => {
        var _ref2 = _asyncToGenerator(function* (o) {
          o[modelName] = yield createModelType(modelName, models, prefix, options);
          return o;
        });

        return function (_x3) {
          return _ref2.apply(this, arguments);
        };
      })());
    }, Promise.resolve({}));
    return result;
  });

  function createModelTypes(_x, _x2) {
    return _ref.apply(this, arguments);
  }

  return createModelTypes;
})();
//# sourceMappingURL=create-base.js.map
