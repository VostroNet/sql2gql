import { toGlobalId, fromGlobalId } from "graphql-relay/lib/node/node";



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

export function createPollution(result, fk, targetName) {
  const val = result.get(fk);
  if (val) {
    const globalId = toGlobalId(targetName, result.get(fk));
    result.set(fk, globalId);
    if (!result.$polluted) {
      result.$polluted = {};
      result.$pollutedState = "global";
    }
    result.$polluted[fk] = targetName;
  }
  return result;
}

export function getPollutedVar(model, targetKey, value) {
  if (model.$polluted) {
    if (model.$polluted[targetKey]) {
      if (model.$pollutedState === "global") {
        return fromGlobalId(value).id;
      }
    }
  }
  return value;
}


export function toGlobalIds(model) {
  if (model.$polluted) {
    if (model.$pollutedState === "key") {
      Object.keys(model.$polluted).forEach((key) => {
        model.set(key, toGlobalId(model.$polluted[key], model.get(key)));
      });
    }
  }
}
export function toForeignKeys(model) {
  if (model.$polluted) {
    if (model.$pollutedState === "global") {
      Object.keys(model.$polluted).forEach((key) => {
        model.set(key, fromGlobalId(model.get(key)).id);
      });
      model.$pollutedState = "key";
    }
  }
}
