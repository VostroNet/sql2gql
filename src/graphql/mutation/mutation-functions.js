
import events from "../events";
import getModelDefinition from "../utils/get-model-def";

export function onCreate(targetModel) {
  const modelDefinition = getModelDefinition(targetModel);
  return async(source, args, context, info) => {
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
        params: input, args, context, info,
        modelDefinition,
        type: events.MUTATION_CREATE,
      });
    }
    let model = await targetModel.create(input, {context, rootValue: Object.assign({}, info.rootValue, {args})});
    if (modelDefinition.after) {
      return await modelDefinition.after({
        result: model, args, context, info,
        modelDefinition,
        type: events.MUTATION_CREATE,
      });
    }
    return model;
  };
}

export function onUpdate(targetModel) {

  const modelDefinition = getModelDefinition(targetModel);
  return async(model, args, context, info) => {
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
        params: input, args, context, info,
        model, modelDefinition,
        type: events.MUTATION_UPDATE,
      });
    }
    model = await model.update(input, {context, rootValue: Object.assign({}, info.rootValue, {args})});
    if (modelDefinition.after) {
      return await modelDefinition.after({
        result: model, args, context, info,
        modelDefinition,
        type: events.MUTATION_UPDATE,
      });
    }
    return model;
  };
}
export function onDelete(targetModel) {
  const modelDefinition = getModelDefinition(targetModel);
  return async(model, args, context, info) => {
    if (modelDefinition.before) {
      model = await modelDefinition.before({
        params: model, args, context, info,
        model, modelDefinition,
        type: events.MUTATION_DELETE,
      });
    }
    await model.destroy({context, rootValue: Object.assign({}, info.rootValue, {args})});
    if (modelDefinition.after) {
      return await modelDefinition.after({
        result: model, args, context, info,
        modelDefinition,
        type: events.MUTATION_DELETE,
      });
    }
    return model;
  };
}
