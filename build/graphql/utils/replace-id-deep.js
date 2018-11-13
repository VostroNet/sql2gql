"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = replaceIdDeep;

var _graphqlRelay = require("graphql-relay");

function getProperties(obj) {
  return [].concat(Object.keys(obj), Object.getOwnPropertySymbols(obj));
}

function checkObject(value, keyMap, variableValues, isTagged) {
  if (typeof value === "function") {
    const result = value(variableValues);
    return checkObject(result, keyMap, variableValues, isTagged);
  } else if (Array.isArray(value)) {
    return value.map(val => {
      return checkObject(val, keyMap, variableValues, isTagged);
    });
  } else if (Object.prototype.toString.call(value) === "[object Object]") {
    return replaceIdDeep(value, keyMap, variableValues, isTagged);
  } else if (isTagged) {
    try {
      return (0, _graphqlRelay.fromGlobalId)(value).id;
    } catch (_unused) {
      return value;
    }
  } else {
    return value;
  }
}

function replaceIdDeep(obj, keyMap, variableValues, isTagged = false) {
  return getProperties(obj).reduce((m, key) => {
    if (keyMap.indexOf(key) > -1 || isTagged) {
      m[key] = checkObject(obj[key], keyMap, variableValues, true);
    } else {
      m[key] = checkObject(obj[key], keyMap, variableValues, false);
    }

    return m;
  }, {});
}
//# sourceMappingURL=replace-id-deep.js.map
