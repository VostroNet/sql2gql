"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createPollution = createPollution;
exports.getPollutedVar = getPollutedVar;
exports.toGlobalIds = toGlobalIds;
exports.toForeignKeys = toForeignKeys;

var _node = require("graphql-relay/lib/node/node");

// export function switchState(model) {
//   if (model.$polluted) {
//     if (model.$polluted.state === "global") {
//       Object.keys(model.$polluted).forEach((key) => {
//         model.set(key, fromGlobalId(model.get(key)).id);
//       });
//       model.$polluted.state = "key";
//     } else {
//       Object.keys(model.$polluted).forEach((key) => {
//         model.set(key, toGlobalId(model.$polluted[key], model.get(key)));
//       });
//       model.$polluted.state = "key";
//     }
//   }
// }
function createPollution(result, fk, targetName) {
  const val = result.get(fk);

  if (val) {
    const globalId = (0, _node.toGlobalId)(targetName, result.get(fk));
    result.set(fk, globalId);

    if (!result.$polluted) {
      result.$polluted = {};
      result.$pollutedState = "global";
    }

    result.$polluted[fk] = targetName;
  }

  return result;
}

function getPollutedVar(model, targetKey, value) {
  if (model.$polluted) {
    if (model.$polluted[targetKey]) {
      if (model.$pollutedState === "global") {
        return (0, _node.fromGlobalId)(value).id;
      }
    }
  }

  return value;
}

function toGlobalIds(model) {
  if (model.$polluted) {
    if (model.$pollutedState === "key") {
      Object.keys(model.$polluted).forEach(key => {
        model.set(key, (0, _node.toGlobalId)(model.$polluted[key], model.get(key)));
      });
    }
  }
}

function toForeignKeys(model) {
  if (model.$polluted) {
    if (model.$pollutedState === "global") {
      Object.keys(model.$polluted).forEach(key => {
        model.set(key, (0, _node.fromGlobalId)(model.get(key)).id);
      });
      model.$pollutedState = "key";
    }
  }
}
//# sourceMappingURL=pollution.js.map
