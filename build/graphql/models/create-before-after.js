"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createBeforeAfter;

var _getModelDef = _interopRequireDefault(require("../utils/get-model-def"));

var _replaceIdDeep = _interopRequireDefault(require("../utils/replace-id-deep"));

var _events = _interopRequireDefault(require("../events"));

var _node = require("graphql-relay/lib/node/node");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
function createBeforeAfter(model, options, hooks = {}) {
  let targetBeforeFuncs = [],
      targetAfterFuncs = [];

  if (hooks.after) {
    targetAfterFuncs = targetAfterFuncs.concat(hooks.after);
  }

  const modelDefinition = (0, _getModelDef.default)(model);
  const primaryKeys = Object.keys(model.fieldRawAttributesMap).filter(k => {
    return model.fieldRawAttributesMap[k].primaryKey;
  });
  const foreignKeys = Object.keys(model.fieldRawAttributesMap).filter(k => {
    return !!model.fieldRawAttributesMap[k].references;
  }); // targetBeforeFuncs.push(function(params, args, context, info) {
  // });

  if (options.before) {
    targetBeforeFuncs.push(function (params, args, context, info) {
      return options.before({
        params,
        args,
        context,
        info,
        modelDefinition,
        type: events.QUERY
      });
    });
  }

  if (options.after) {
    targetAfterFuncs.push(function (result, args, context, info) {
      return options.after({
        result,
        args,
        context,
        info,
        modelDefinition,
        type: events.QUERY
      });
    });
  }

  if (modelDefinition.before) {
    targetBeforeFuncs.push(function (params, args, context, info) {
      return modelDefinition.before({
        params,
        args,
        context,
        info,
        modelDefinition,
        type: events.QUERY
      });
    });
  }

  if (modelDefinition.after) {
    targetAfterFuncs.push(function (result, args, context, info) {
      return modelDefinition.after({
        result,
        args,
        context,
        info,
        modelDefinition: modelDefinition,
        type: events.QUERY
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
      findOptions.where = (0, _replaceIdDeep.default)(findOptions.where, primaryKeys.concat(foreignKeys));
    }

    if (targetBeforeFuncs.length === 0) {
      return findOptions;
    }

    const results = targetBeforeFuncs.reduce((promise, curr) => {
      return promise.then(prev => {
        return curr(prev, args, context, info);
      });
    }, Promise.resolve(findOptions));
    return results;
  };

  const targetAfter = (result, args, context, info) => {
    // console.log("after", {result, args, context, info});
    if (foreignKeys && result) {
      foreignKeys.forEach(fk => {
        const assoc = Object.keys(model.associations).filter(assocName => {
          return model.associations[assocName].foreignKey === fk;
        })[0];
        const targetName = model.associations[assoc].target.name;

        if (result.edges) {
          result.edges.forEach(e => {
            createPollution(e.node, fk, targetName);
          });
        } else {
          createPollution(result, fk, targetName);
        }
      });
    }

    if (targetAfterFuncs.length === 0) {
      return result;
    }

    return targetAfterFuncs.reduce((promise, curr) => {
      return promise.then(prev => {
        return Promise.resolve(curr(prev, args, context, info)).then(data => {
          if (!data) {
            return undefined;
          }

          if (data.edges) {
            data.edges = data.edges.filter(x => !!x);
          }

          return data;
        });
      });
    }, Promise.resolve(result));
  };

  const targetAfterArray = (results, args, context, info) => {
    if (targetAfterFuncs.length === 0) {
      return results;
    }

    return results.map(result => {
      return targetAfter(result, args, context, info);
    });
  };

  const events = {
    before: targetBefore,
    after: targetAfter,
    afterList: targetAfterArray
  };
  modelDefinition.events = events;
  return events;
}

function createPollution(result, fk, targetName) {
  const val = result.get(fk);

  if (val) {
    const globalId = (0, _node.toGlobalId)(targetName, result.get(fk));
    result.set(fk, globalId);

    if (!result.$polluted) {
      result.$polluted = [];
    }

    result.$polluted[fk] = targetName;
  }

  return result;
}
//# sourceMappingURL=create-before-after.js.map
