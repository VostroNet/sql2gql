"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = waterfall;

function waterfall(arr = [], func) {
  return arr.reduce(function (promise, val) {
    return promise.then(function (prevVal) {
      return func(val, prevVal);
    });
  }, Promise.resolve());
}
//# sourceMappingURL=waterfall.js.map
