"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.onCreate = onCreate;
exports.onUpdate = onUpdate;
exports.onDelete = onDelete;

var _events = _interopRequireDefault(require("../events"));

var _getModelDef = _interopRequireDefault(require("../utils/get-model-def"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function onCreate(targetModel) {
  const modelDefinition = (0, _getModelDef.default)(targetModel);
  return async (source, args, context, info) => {
    let input = args.input;

    if (modelDefinition.override) {
      input = Object.keys(modelDefinition.override).reduce((data, fieldName) => {
        if (modelDefinition.override[fieldName].input) {
          data[fieldName] = modelDefinition.override[fieldName].input(data[fieldName], args, context, info);
        }

        return data;
      }, input);
    }

    if (modelDefinition.before) {
      input = await modelDefinition.before({
        params: input,
        args,
        context,
        info,
        modelDefinition,
        type: _events.default.MUTATION_CREATE
      });
    }

    let model = await targetModel.create(input, {
      context,
      rootValue: Object.assign({}, info.rootValue, {
        args
      })
    });

    if (modelDefinition.after) {
      return await modelDefinition.after({
        result: model,
        args,
        context,
        info,
        modelDefinition,
        type: _events.default.MUTATION_CREATE
      });
    }

    return model;
  };
}

function onUpdate(targetModel) {
  const modelDefinition = (0, _getModelDef.default)(targetModel);
  return async (model, args, context, info) => {
    // console.log("onUpdate - args", args, model);
    let input = args.input;

    if (!input) {
      throw new Error("Unable to update field as no input was provided");
    }

    if (modelDefinition.override) {
      input = Object.keys(modelDefinition.override).reduce((data, fieldName) => {
        if (modelDefinition.override[fieldName].input) {
          data[fieldName] = modelDefinition.override[fieldName].input(data[fieldName], args, context, info, model);
        }

        return data;
      }, input);
    }

    if (modelDefinition.before) {
      input = await modelDefinition.before({
        params: input,
        args,
        context,
        info,
        model,
        modelDefinition,
        type: _events.default.MUTATION_UPDATE
      });
    }

    model = await model.update(input, {
      context,
      rootValue: Object.assign({}, info.rootValue, {
        args
      })
    });

    if (modelDefinition.after) {
      return await modelDefinition.after({
        result: model,
        args,
        context,
        info,
        modelDefinition,
        type: _events.default.MUTATION_UPDATE
      });
    }

    return model;
  };
}

function onDelete(targetModel) {
  const modelDefinition = (0, _getModelDef.default)(targetModel);
  return async (model, args, context, info) => {
    if (modelDefinition.before) {
      model = await modelDefinition.before({
        params: model,
        args,
        context,
        info,
        model,
        modelDefinition,
        type: _events.default.MUTATION_DELETE
      });
    }

    await model.destroy({
      context,
      rootValue: Object.assign({}, info.rootValue, {
        args
      })
    });

    if (modelDefinition.after) {
      return await modelDefinition.after({
        result: model,
        args,
        context,
        info,
        modelDefinition,
        type: _events.default.MUTATION_DELETE
      });
    }

    return model;
  };
}
//# sourceMappingURL=mutation-functions.js.map
