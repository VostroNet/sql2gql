"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createPollution = createPollution;
exports.getPollutedVar = getPollutedVar;
exports.toGlobalIds = toGlobalIds;
exports.toForeignKeys = toForeignKeys;
exports.convertInputForModelToKeys = convertInputForModelToKeys;

var _node = require("graphql-relay/lib/node/node");

var _models = require("./models");

function createPollution(model, fk, targetName) {
  const val = model.get(fk);

  if (val) {
    const globalId = (0, _node.toGlobalId)(targetName, model.get(fk));
    model.set(fk, globalId);

    if (!model.$polluted) {
      model.$polluted = {};
      model.$pollutedState = "global";
    }

    model.$polluted[fk] = targetName;
  }

  return model;
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
  } else {
    const foreignKeys = (0, _models.getForeignKeysForModel)(model);
    foreignKeys.forEach(fk => {
      const assoc = (0, _models.getForeignKeyAssociation)(model, fk);
      const targetName = assoc.target.name;
      return createPollution(model, fk, targetName);
    });
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

function convertInputForModelToKeys(input, targetModel) {
  const foreignKeys = (0, _models.getForeignKeysForModel)(targetModel);

  if (foreignKeys.length > 0) {
    foreignKeys.forEach(fk => {
      if (input[fk] && typeof input[fk] === "string") {
        input[fk] = (0, _node.fromGlobalId)(input[fk]).id;
      }
    });
  }

  return input;
}
//# sourceMappingURL=pollution.js.map
