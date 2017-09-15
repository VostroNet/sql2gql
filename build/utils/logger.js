"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (prefix = "") {
  return {
    err: (0, _debug2.default)(`${prefix}err`),
    error: (0, _debug2.default)(`${prefix}error`),
    info: (0, _debug2.default)(`${prefix}info`),
    warn: (0, _debug2.default)(`${prefix}warn`),
    debug: (0, _debug2.default)(`${prefix}debug`)
  };
};

var _debug = require("debug");

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
//# sourceMappingURL=logger.js.map
