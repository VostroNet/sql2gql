"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.permissionHelper = exports.events = exports.createSchema = exports.connect = undefined;

require("core-js/modules/es7.object.values");

require("core-js/modules/es7.object.entries");

require("core-js/modules/es7.object.get-own-property-descriptors");

require("core-js/modules/es7.string.pad-start");

require("core-js/modules/es7.string.pad-end");

var _database = require("./database");

var database = _interopRequireWildcard(_database);

var _graphql = require("./graphql");

var graphql = _interopRequireWildcard(_graphql);

var _permissionHelper = require("./permission-helper");

var _permissionHelper2 = _interopRequireDefault(_permissionHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

const connect = exports.connect = database.connect;
const createSchema = exports.createSchema = graphql.createSchema; //TODO: better way to lay this out?
const events = exports.events = graphql.events;
const permissionHelper = exports.permissionHelper = _permissionHelper2.default;
//# sourceMappingURL=index.js.map
