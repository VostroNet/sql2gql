"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = replaceIdDeep;

var _graphqlRelay = require("graphql-relay");

function replaceIdDeep(obj, keyMap) {
  // return obj;
  return Object.keys(obj).reduce((m, key) => {
    if (keyMap.indexOf(key) > -1) {
      m[key] = (0, _graphqlRelay.fromGlobalId)(obj[key]).id;
    } else {
      if (Array.isArray(m[key])) {
        obj[key].forEach((val, idx) => {
          if (Object.prototype.toString.call(val) === "[object Object]") {
            m[key][idx] = replaceIdDeep(val, keyMap);
          }
        });
      } else if (Object.prototype.toString.call(obj[key]) === "[object Object]") {
        m[key] = replaceIdDeep(obj[key], keyMap);
      }
    }

    return m;
  }, {});
}
//# sourceMappingURL=replace-id-deep.js.map
