"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

let createFunctionForModel = (() => {
  var _ref3 = _asyncToGenerator(function* (modelName, models, mutationInputTypes, options) {
    if (options.permission) {
      if (options.permission.mutation) {
        const result = yield options.permission.mutation(modelName, options.permission.options);
        if (!result) {
          return undefined;
        }
      }
    }
    const { optional, required } = mutationInputTypes[modelName];
    let fields = {},
        funcs = {};
    const updateFunc = (0, _mutationFunctions.onUpdate)(models[modelName]);
    const deleteFunc = (0, _mutationFunctions.onDelete)(models[modelName]);

    const { before } = (0, _createBeforeAfter2.default)(models[modelName], options, {});

    let updateResult = true,
        deleteResult = true,
        createResult = true;
    if (options.permission) {
      if (options.permission.mutationUpdate) {
        updateResult = yield options.permission.mutationUpdate(modelName, options.permission.options);
      }
      if (options.permission.mutationDelete) {
        deleteResult = yield options.permission.mutationDelete(modelName, options.permission.options);
      }
      if (options.permission.mutationCreate) {
        createResult = yield options.permission.mutationCreate(modelName, options.permission.options);
      }
    }

    if (createResult) {
      fields.create = { type: new _graphql.GraphQLList(required) };
      funcs.create = (0, _mutationFunctions.onCreate)(models[modelName]);
    }
    if (updateResult) {
      const { afterList: afterUpdateList } = (0, _createBeforeAfter2.default)(models[modelName], options, { after: [updateFunc] });
      fields.update = {
        type: new _graphql.GraphQLList(new _graphql.GraphQLInputObjectType({
          name: `${modelName}CommandUpdateInput`,
          fields: Object.assign((0, _graphqlSequelize.defaultListArgs)(models[modelName]), { input: { type: optional } })
        }))
      };
      funcs.update = (0, _graphqlSequelize.resolver)(models[modelName], {
        before: before,
        after: afterUpdateList
      });
    }

    if (deleteResult) {
      const { afterList: afterDeleteList } = (0, _createBeforeAfter2.default)(models[modelName], options, { after: [deleteFunc] });
      fields.delete = {
        type: new _graphql.GraphQLList(new _graphql.GraphQLInputObjectType({
          name: `${modelName}CommandDeleteInput`,
          fields: (0, _graphqlSequelize.defaultListArgs)(models[modelName])
        }))
      };
      funcs.delete = (0, _graphqlSequelize.resolver)(models[modelName], {
        before: before,
        after: afterDeleteList
      });
    }
    if (createResult || updateResult || deleteResult) {
      return { funcs, fields };
    }
    return undefined;
  });

  return function createFunctionForModel(_x7, _x8, _x9, _x10) {
    return _ref3.apply(this, arguments);
  };
})();

var _graphql = require("graphql");

var _graphqlSequelize = require("graphql-sequelize");

var _createBeforeAfter = require("../../models/create-before-after");

var _createBeforeAfter2 = _interopRequireDefault(_createBeforeAfter);

var _mutationFunctions = require("../mutation-functions");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.default = (() => {
  var _ref = _asyncToGenerator(function* (models, keys, typeCollection, mutationInputTypes, options) {
    const result = yield keys.reduce(function (promise, modelName) {
      return promise.then((() => {
        var _ref2 = _asyncToGenerator(function* (o) {
          if (!typeCollection[modelName]) {
            return o;
          }
          o[modelName] = yield createFunctionForModel(modelName, models, mutationInputTypes, options);
          return o;
        });

        return function (_x6) {
          return _ref2.apply(this, arguments);
        };
      })());
    }, Promise.resolve({}));
    return result;
  });

  function createFunctions(_x, _x2, _x3, _x4, _x5) {
    return _ref.apply(this, arguments);
  }

  return createFunctions;
})();
//# sourceMappingURL=create-functions.js.map
