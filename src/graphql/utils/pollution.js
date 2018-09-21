import { toGlobalId, fromGlobalId } from "graphql-relay/lib/node/node";
import {getForeignKeysForModel, getForeignKeyAssociation} from "./models";


export function createPollution(model, fk, targetName) {
  const val = model.get(fk);
  if (val) {
    const globalId = toGlobalId(targetName, model.get(fk));
    model.set(fk, globalId);
    if (!model.$polluted) {
      model.$polluted = {};
      model.$pollutedState = "global";
    }
    model.$polluted[fk] = targetName;
  }
  return model;
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
  } else {
    const foreignKeys = getForeignKeysForModel(model);
    foreignKeys.forEach((fk) => {
      const assoc = getForeignKeyAssociation(model, fk);
      const targetName = assoc.target.name;
      return createPollution(model, fk, targetName);
    });
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


export function convertInputForModelToKeys(input, targetModel) {
  const foreignKeys = getForeignKeysForModel(targetModel);
  if (foreignKeys.length > 0) {
    foreignKeys.forEach((fk) => {
      if (input[fk] && typeof input[fk] === "string") {
        input[fk] = fromGlobalId(input[fk]).id;
      }
    });
  }
  return input;
}
