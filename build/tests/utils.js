"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createSqlInstance = createSqlInstance;
exports.validateResult = validateResult;

var _sequelize = require("sequelize");

var _sequelize2 = _interopRequireDefault(_sequelize);

var _sourceMapSupport = require("source-map-support");

var _sourceMapSupport2 = _interopRequireDefault(_sourceMapSupport);

var _expect = require("expect");

var _expect2 = _interopRequireDefault(_expect);

var _index = require("../index");

var _task = require("./models/task");

var _task2 = _interopRequireDefault(_task);

var _taskItem = require("./models/task-item");

var _taskItem2 = _interopRequireDefault(_taskItem);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_sourceMapSupport2.default.install();


var schemas = [_task2.default, _taskItem2.default];
function createSqlInstance() {
  var instance = new _sequelize2.default("database", "username", "password", {
    dialect: "sqlite",
    logging: false
  });
  (0, _index.connect)(schemas, instance, {});
  return instance.sync().then(function () {
    return instance;
  });
}

function validateResult(result) {
  if ((result.errors || []).length > 0) {
    console.log("Graphql Error", result.errors);
  }
  (0, _expect2.default)((result.data.errors || []).length).toEqual(0);
}
//# sourceMappingURL=utils.js.map
