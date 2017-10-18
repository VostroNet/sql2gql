"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _graphql = require("graphql");

var _graphqlSequelize = require("graphql-sequelize");

var _createBeforeAfter = require("../models/create-before-after");

var _createBeforeAfter2 = _interopRequireDefault(_createBeforeAfter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.default = (() => {
  var _ref = _asyncToGenerator(function* (models, modelNames, typeCollection, options, fields = {}) {
    yield Promise.all(modelNames.map((() => {
      var _ref2 = _asyncToGenerator(function* (modelName) {
        if (typeCollection[modelName]) {
          if (options.permission) {
            if (options.permission.query) {
              const result = yield options.permission.query(modelName, options.permission.options);
              if (!result) {
                return;
              }
            }
          }
          // let targetOpts = options[modelName];
          const { before, after } = (0, _createBeforeAfter2.default)(models[modelName], options);
          fields[modelName] = {
            type: new _graphql.GraphQLList(typeCollection[modelName]),
            args: (0, _graphqlSequelize.defaultListArgs)(),
            resolve: (0, _graphqlSequelize.resolver)(models[modelName], {
              before,
              after
            })
          };
        }
      });

      return function (_x5) {
        return _ref2.apply(this, arguments);
      };
    })()));
    return fields;
  });

  function createModelLists(_x, _x2, _x3, _x4) {
    return _ref.apply(this, arguments);
  }

  return createModelLists;
})();
//# sourceMappingURL=create-lists.js.map
