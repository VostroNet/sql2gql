// import getModelDefinition from "../utils/get-model-def";
import replaceIdDeep, { replaceDefWhereOperators } from "../utils/replace-id-deep";
import waterfall from "../utils/waterfall";
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

export default function createBeforeAfter(defName, definition, dbInstance, options, hooks = {}) {
  let targetBeforeFuncs = [], targetAfterFuncs = [];
  if (hooks.after) {
    targetAfterFuncs = targetAfterFuncs.concat(hooks.after);
  }
  // const defAdapter = dbInstance.getModelAdapter(defName);
  // const modelDefinition = getModelDefinition(model);
  const globalKeys = dbInstance.getGlobalKeys(defName);

  if (options.before) {
    targetBeforeFuncs.push(function(params, args, context, info) {
      return options.before({
        params, args, context, info,
        modelDefinition: definition,
        type: events.QUERY,
      });
    });
  }
  if (options.after) {
    targetAfterFuncs.push(function(result, args, context, info) {
      return options.after({
        result, args, context, info,
        modelDefinition: definition,
        type: events.QUERY,
      });
    });
  }
  if (definition.before) {
    targetBeforeFuncs.push(function(params, args, context, info) {
      return definition.before({
        params, args, context, info,
        modelDefinition: definition,
        type: events.QUERY,
      });
    });
  }
  if (definition.after) {
    targetAfterFuncs.push(function(result, args, context, info) {
      return definition.after({
        result, args, context, info,
        modelDefinition: definition,
        type: events.QUERY,
      });
    });
  }
  if (hooks.before) {
    //TODO: do we need to set this up as a proxy function like the others?
    targetBeforeFuncs = targetBeforeFuncs.concat(hooks.before);
  }
  const targetBefore = async(findOptions, args, context, info) => {
    findOptions.context = context;
    findOptions.rootValue = info.rootValue;
    if (findOptions.where) {
      findOptions.where = replaceIdDeep(findOptions.where, globalKeys, info.variableValues);
    }
    if (targetBeforeFuncs.length === 0) {
      return findOptions;
    }

    return waterfall(targetBeforeFuncs, async(curr, prev) => {
      return curr(prev, args, context, info);
    }, findOptions);
  };
  const targetAfter = (result, args, context, info) => {
    if (targetAfterFuncs.length === 0) {
      if (!result) {
        return undefined;
      }
      if (result.edges) {
        result.edges = result.edges.filter(x => !!x);
      }
      return result;
    }
    return waterfall(targetAfterFuncs, async(curr, prev) => {
      const data = await curr(prev, args, context, info);
      if (!data) {
        return undefined;
      }
      if (data.edges) {
        data.edges = data.edges.filter(x => !!x);
      }
      return data;
    }, result);
  };
  const targetAfterArray = (results, args, context, info) => {
    if (targetAfterFuncs.length === 0) {
      return results;
    }
    return waterfall(results, async(result, prev) => {
      return prev.concat(await targetAfter(result, args, context, info));
    }, []);
  };
  return {
    before: targetBefore,
    after: targetAfter,
    afterList: targetAfterArray,
  };
}


