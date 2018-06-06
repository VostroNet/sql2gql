import getModelDefinition from "../utils/get-model-def";
import replaceIdDeep from "../utils/replace-id-deep";
import events from "../events";

/**
 * @typedef {Object} CreateBeforeAfterOutput
 * @property {function} before
 * @property {function} after
 * @property {function[]} afterList
*/

/**
 * @function createBeforeAfter
 * @param {Object} model
 * @param {Object} options
 * @param {Object} hooks
 * @returns {CreateBeforeAfterOutput}
*/

export default function createBeforeAfter(model, options, hooks = {}) {
  let targetBeforeFuncs = [], targetAfterFuncs = [];
  if (hooks.after) {
    targetAfterFuncs = targetAfterFuncs.concat(hooks.after);
  }
  const modelDefinition = getModelDefinition(model);
  const primaryKeys = Object.keys(model.fieldRawAttributesMap).filter((k) => {
    return model.fieldRawAttributesMap[k].primaryKey;
  });
  const foreignKeys = Object.keys(model.fieldRawAttributesMap).filter(k => {
    return !(!model.fieldRawAttributesMap[k].references);
  });
  // targetBeforeFuncs.push(function(params, args, context, info) {

  // });

  if (options.before) {
    targetBeforeFuncs.push(function(params, args, context, info) {
      return options.before({
        params, args, context, info,
        modelDefinition,
        type: events.QUERY,
      });
    });
  }
  if (options.after) {
    targetAfterFuncs.push(function(result, args, context, info) {
      return options.after({
        result, args, context, info,
        modelDefinition,
        type: events.QUERY,
      });
    });
  }
  if (modelDefinition.before) {
    targetBeforeFuncs.push(function(params, args, context, info) {
      return modelDefinition.before({
        params, args, context, info,
        modelDefinition,
        type: events.QUERY,
      });
    });
  }
  if (modelDefinition.after) {
    targetAfterFuncs.push(function(result, args, context, info) {
      return modelDefinition.after({
        result, args, context, info,
        modelDefinition: modelDefinition,
        type: events.QUERY,
      });
    });
  }
  if (hooks.before) {
    targetBeforeFuncs = targetBeforeFuncs.concat(hooks.before);
  }
  const targetBefore = (findOptions, args, context, info) => {
    findOptions.context = context;
    findOptions.rootValue = info.rootValue;
    if (findOptions.where) {
      findOptions.where = replaceIdDeep(findOptions.where, primaryKeys.concat(foreignKeys));
    }
    if (targetBeforeFuncs.length === 0) {
      return findOptions;
    }
    const results = targetBeforeFuncs.reduce((promise, curr) => {
      return promise.then((prev) => {
        return curr(prev, args, context, info);
      });
    }, Promise.resolve(findOptions));
    return results;
  };
  const targetAfter = (result, args, context, info) => {
    if (targetAfterFuncs.length === 0) {
      return result;
    }
    return targetAfterFuncs.reduce((promise, curr) => {
      return promise.then((prev) => {
        return curr(prev, args, context, info);
        // const data = curr(prev, args, context, info);
        // data.edges = data.edges.filter(x => !!x);
        // return data;
      });
    }, Promise.resolve(result));
  };
  const targetAfterArray = (results, args, context, info) => {
    if (targetAfterFuncs.length === 0) {
      return results;
    }
    return results.map((result) => {
      return targetAfter(result, args, context, info);
    });
  };


  return {
    before: targetBefore,
    after: targetAfter,
    afterList: targetAfterArray,
  };
}
