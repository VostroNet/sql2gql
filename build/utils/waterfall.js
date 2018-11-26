"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = waterfall;

function waterfall(arr = [], func, start) {
  return arr.reduce(function (promise, val) {
    return promise.then(function (prevVal) {
      return func(val, prevVal);
    });
  }, Promise.resolve(start));
}
//# sourceMappingURL=waterfall.js.map
