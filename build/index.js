"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createSchema = exports.connect = undefined;

require("babel-polyfill");

var _database = require("./database");

var _database2 = _interopRequireDefault(_database);

var _graphql = require("./graphql");

var _graphql2 = _interopRequireDefault(_graphql);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var connect = exports.connect = _database2.default;
var createSchema = exports.createSchema = _graphql2.default; //TODO: better way to lay this out?
//# sourceMappingURL=index.js.map
