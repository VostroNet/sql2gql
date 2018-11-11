"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = replaceIdDeep;

var _graphqlRelay = require("graphql-relay");

function getProperties(obj) {
  return [].concat(Object.keys(obj), Object.getOwnPropertySymbols(obj));
}

function replaceIdDeep(obj, keyMap, variableValues) {
  return getProperties(obj).reduce((m, key) => {
    if (keyMap.indexOf(key) > -1) {
      if (typeof obj[key] === "function") {
        m[key] = (0, _graphqlRelay.fromGlobalId)(obj[key](variableValues)).id;
      } else {
        try {
          m[key] = (0, _graphqlRelay.fromGlobalId)(obj[key]).id;
        } catch (e) {
          m[key] = obj[key]; //is not a global id
        }
      }
    } else {
      if (Array.isArray(obj[key])) {
        m[key] = obj[key].map(val => {
          if (Object.prototype.toString.call(val) === "[object Object]") {
            return replaceIdDeep(val, keyMap, variableValues);
          }

          return val;
        });
      } else if (Object.prototype.toString.call(obj[key]) === "[object Object]") {
        m[key] = replaceIdDeep(obj[key], keyMap, variableValues);
      } else {
        m[key] = obj[key];
      }
    }

    return m;
  }, {});
}
//# sourceMappingURL=replace-id-deep.js.map
