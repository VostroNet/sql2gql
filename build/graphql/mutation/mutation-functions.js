"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.onCreate = onCreate;
exports.onUpdate = onUpdate;
exports.onDelete = onDelete;

var _events = require("../events");

var _events2 = _interopRequireDefault(_events);

var _getModelDef = require("../utils/get-model-def");

var _getModelDef2 = _interopRequireDefault(_getModelDef);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function onCreate(targetModel) {
  const modelDefinition = (0, _getModelDef2.default)(targetModel);
  return (() => {
    var _ref = _asyncToGenerator(function* (source, args, context, info) {
      let input = args.input;
      if (modelDefinition.override) {
        input = Object.keys(modelDefinition.override).reduce(function (data, fieldName) {
          if (modelDefinition.override[fieldName].input) {
            data[fieldName] = modelDefinition.override[fieldName].input(data[fieldName], args, context, info);
          }
          return data;
        }, input);
      }
      if (modelDefinition.before) {
        input = yield modelDefinition.before({
          params: input, args, context, info,
          modelDefinition,
          type: _events2.default.MUTATION_CREATE
        });
      }
      let model = yield targetModel.create(input, { context, rootValue: Object.assign({}, info.rootValue, { args }) });
      if (modelDefinition.after) {
        return yield modelDefinition.after({
          result: model, args, context, info,
          modelDefinition,
          type: _events2.default.MUTATION_CREATE
        });
      }
      return model;
    });

    return function (_x, _x2, _x3, _x4) {
      return _ref.apply(this, arguments);
    };
  })();
}

function onUpdate(targetModel) {

  const modelDefinition = (0, _getModelDef2.default)(targetModel);
  return (() => {
    var _ref2 = _asyncToGenerator(function* (model, args, context, info) {
      console.log("onUpdate - args", args, model);
      let input = args.input;
      if (modelDefinition.override) {
        input = Object.keys(modelDefinition.override).reduce(function (data, fieldName) {
          if (modelDefinition.override[fieldName].input) {
            data[fieldName] = modelDefinition.override[fieldName].input(data[fieldName], args, context, info, model);
          }
          return data;
        }, input);
      }
      if (modelDefinition.before) {
        input = yield modelDefinition.before({
          params: input, args, context, info,
          model, modelDefinition,
          type: _events2.default.MUTATION_UPDATE
        });
      }
      model = yield model.update(input, { context, rootValue: Object.assign({}, info.rootValue, { args }) });
      if (modelDefinition.after) {
        return yield modelDefinition.after({
          result: model, args, context, info,
          modelDefinition,
          type: _events2.default.MUTATION_UPDATE
        });
      }
      return model;
    });

    return function (_x5, _x6, _x7, _x8) {
      return _ref2.apply(this, arguments);
    };
  })();
}
function onDelete(targetModel) {
  const modelDefinition = (0, _getModelDef2.default)(targetModel);
  return (() => {
    var _ref3 = _asyncToGenerator(function* (model, args, context, info) {
      if (modelDefinition.before) {
        model = yield modelDefinition.before({
          params: model, args, context, info,
          model, modelDefinition,
          type: _events2.default.MUTATION_DELETE
        });
      }
      yield model.destroy({ context, rootValue: Object.assign({}, info.rootValue, { args }) });
      if (modelDefinition.after) {
        return yield modelDefinition.after({
          result: model, args, context, info,
          modelDefinition,
          type: _events2.default.MUTATION_DELETE
        });
      }
      return model;
    });

    return function (_x9, _x10, _x11, _x12) {
      return _ref3.apply(this, arguments);
    };
  })();
}
//# sourceMappingURL=mutation-functions.js.map
