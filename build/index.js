"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createSchema = exports.connect = undefined;

require("core-js/modules/es7.string.pad-start");

require("core-js/modules/es7.string.pad-end");

var _database = require("./database");

var database = _interopRequireWildcard(_database);

var _graphql = require("./graphql");

var graphql = _interopRequireWildcard(_graphql);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

const connect = exports.connect = database.connect;
const createSchema = exports.createSchema = graphql.createSchema; //TODO: better way to lay this out?
//# sourceMappingURL=index.js.map
