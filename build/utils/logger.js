"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _debug = _interopRequireDefault(require("debug"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _default(prefix = "") {
  return {
    err: (0, _debug.default)(`${prefix}err`),
    error: (0, _debug.default)(`${prefix}error`),
    info: (0, _debug.default)(`${prefix}info`),
    warn: (0, _debug.default)(`${prefix}warn`),
    debug: (0, _debug.default)(`${prefix}debug`)
  };
}
//# sourceMappingURL=logger.js.map
