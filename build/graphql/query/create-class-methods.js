"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _graphql = require("graphql");

var _getModelDef = require("../utils/get-model-def");

var _getModelDef2 = _interopRequireDefault(_getModelDef);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.default = (() => {
  var _ref = _asyncToGenerator(function* (models, keys, typeCollection, options) {
    let queryCollection = {};
    yield Promise.all(keys.map((() => {
      var _ref2 = _asyncToGenerator(function* (modelName) {
        if (!typeCollection[modelName]) {
          return;
        }
        let { fields } = typeCollection[modelName]._typeConfig; //eslint-disable-line
        const { query } = ((0, _getModelDef2.default)(models[modelName]).expose || {}).classMethods || {};
        let queryFields = {};
        if (query) {
          yield Promise.all(Object.keys(query).map((() => {
            var _ref3 = _asyncToGenerator(function* (methodName) {
              if (options.permission) {
                if (options.permission.queryClassMethods) {
                  const result = yield options.permission.queryClassMethods(modelName, methodName, options.permission.options);
                  if (!result) {
                    return;
                  }
                }
              }
              const { type, args } = query[methodName];
              let outputType = type instanceof String || typeof type === "string" ? typeCollection[type] : type;
              // console.log("OUTPUT TYPE", outputType);
              queryFields[methodName] = {
                type: outputType,
                args,
                resolve(item, args, context, gql) {
                  return models[modelName][methodName].apply(models[modelName], [args, context]);
                }
              };
              // console.log("test", queryFields[methodName]);
            });

            return function (_x6) {
              return _ref3.apply(this, arguments);
            };
          })()));
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
      });

      return function (_x5) {
        return _ref2.apply(this, arguments);
      };
    })()));
    return queryCollection;
  });

  function createQueryFunctions(_x, _x2, _x3, _x4) {
    return _ref.apply(this, arguments);
  }

  return createQueryFunctions;
})();
//# sourceMappingURL=create-class-methods.js.map
