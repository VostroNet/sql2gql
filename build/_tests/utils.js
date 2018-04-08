"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createSqlInstance = createSqlInstance;
exports.validateResult = validateResult;

var _sequelize = _interopRequireDefault(require("sequelize"));

var _sourceMapSupport = _interopRequireDefault(require("source-map-support"));

var _expect = _interopRequireDefault(require("expect"));

var _index = require("../index");

var _task = _interopRequireDefault(require("./models/task"));

var _taskItem = _interopRequireDefault(require("./models/task-item"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_sourceMapSupport.default.install();

const schemas = [_task.default, _taskItem.default];

function createSqlInstance(options) {
  let instance = new _sequelize.default("database", "username", "password", {
    dialect: "sqlite",
    logging: false
  });
  (0, _index.connect)(schemas, instance, Object.assign({}, options));
  return instance.sync().then(() => instance);
}

function validateResult(result) {
  if ((result.errors || []).length > 0) {
    console.log("Graphql Error", result.errors); //eslint-disable-line
  }

  (0, _expect.default)((result.data.errors || []).length).toEqual(0);
}
//# sourceMappingURL=utils.js.map
