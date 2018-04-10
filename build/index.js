"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.permissionHelper = exports.events = exports.createSchema = exports.connect = void 0;

var database = _interopRequireWildcard(require("./database"));

var graphql = _interopRequireWildcard(require("./graphql"));

var _events = _interopRequireDefault(require("./graphql/events"));

var _permissionHelper = _interopRequireDefault(require("./permission-helper"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

// import "babel-polyfill";
const connect = database.connect;
exports.connect = connect;
const createSchema = graphql.createSchema; //TODO: better way to lay this out?

exports.createSchema = createSchema;
const events = _events.default;
exports.events = events;
const permissionHelper = _permissionHelper.default;
exports.permissionHelper = permissionHelper;
//# sourceMappingURL=index.js.map
