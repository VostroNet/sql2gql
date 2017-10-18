"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _graphql = require("graphql");

var _graphqlSequelize = require("graphql-sequelize");

var _createBeforeAfter = require("../../models/create-before-after");

var _createBeforeAfter2 = _interopRequireDefault(_createBeforeAfter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.default = (() => {
  var _ref = _asyncToGenerator(function* (models, keys, typeCollection, mutationFunctions, options) {
    let mutationCollection = {};
    yield Promise.all(keys.map((() => {
      var _ref2 = _asyncToGenerator(function* (modelName) {
        if (!typeCollection[modelName]) {
          return;
        }
        const { fields, funcs } = mutationFunctions[modelName];
        if (Object.keys(fields).length > 0) {
          const { before, after } = (0, _createBeforeAfter2.default)(models[modelName], options);
          mutationCollection[modelName] = {
            type: new _graphql.GraphQLList(typeCollection[modelName]),
            args: Object.assign(fields, (0, _graphqlSequelize.defaultListArgs)()),
            resolve(source, args, context, info) {
              return _asyncToGenerator(function* () {
                let results = [];
                if (args.create) {
                  results = results.concat((yield Promise.all(args.create.map((() => {
                    var _ref3 = _asyncToGenerator(function* (arg) {
                      return funcs.create(source, { input: arg }, context, info);
                    });

                    return function (_x7) {
                      return _ref3.apply(this, arguments);
                    };
                  })()))));
                }
                if (args.update) {
                  results = results.concat((yield args.update.reduce((() => {
                    var _ref4 = _asyncToGenerator(function* (arr, arg) {
                      return arr.concat((yield funcs.update(source, arg, context, info)));
                    });

                    return function (_x8, _x9) {
                      return _ref4.apply(this, arguments);
                    };
                  })(), [])));
                }
                if (args.delete) {
                  results = results.concat((yield args.delete.reduce((() => {
                    var _ref5 = _asyncToGenerator(function* (arr, arg) {
                      return arr.concat((yield funcs.delete(source, { input: arg }, context, info)));
                    });

                    return function (_x10, _x11) {
                      return _ref5.apply(this, arguments);
                    };
                  })(), [])));
                }
                if (!(args.create || args.update || args.delete) || args.where) {
                  return (0, _graphqlSequelize.resolver)(models[modelName], {
                    before,
                    after
                  })(source, args, context, info);
                }
                return results; //TODO: add where query results here
              })();
            }
          };
        }
      });

      return function (_x6) {
        return _ref2.apply(this, arguments);
      };
    })()));
    return mutationCollection;
  });

  function createMutationV3(_x, _x2, _x3, _x4, _x5) {
    return _ref.apply(this, arguments);
  }

  return createMutationV3;
})();
//# sourceMappingURL=index.js.map
