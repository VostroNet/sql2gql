"use strict";

var _utils = require("./utils");

var _index = require("../index");

var _expect = require("expect");

var _expect2 = _interopRequireDefault(_expect);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

let instance;

describe("permission helper", () => {
  before(_asyncToGenerator(function* () {
    instance = yield (0, _utils.createSqlInstance)();
  }));
  it("basic test - no settings - defaults deny", _asyncToGenerator(function* () {
    const permission = (0, _index.permissionHelper)("anything", {});
    const result = permission.model("anything");
    (0, _expect2.default)(result).toBeFalsy();
    let e;
    try {
      yield (0, _index.createSchema)(instance, {
        permission
      });
      (0, _expect2.default)(true).toBeFalsy();
    } catch (err) {
      e = err;
    }
    (0, _expect2.default)(e).toBeDefined();

    // // console.log("schema");
    // const queryFields = schema.getQueryType().getFields().models.type.getFields();
    // return expect(queryFields.Task).not.toBeDefined();
  }));
  it("basic test - field/model/query - defaults deny", _asyncToGenerator(function* () {
    const permission = (0, _index.permissionHelper)("anyone", {
      "someone": "deny",
      "anyone": {
        "query": "allow",
        "model": {
          "Task": "allow"
        },
        "field": {
          "Task": {
            "name": "allow"
          }
        }
      }
    });

    (0, _expect2.default)(permission.query("Task")).toBeTruthy();
    (0, _expect2.default)(permission.query("TaskItem")).toBeTruthy();

    (0, _expect2.default)(permission.model("Task")).toBeTruthy();
    (0, _expect2.default)(permission.model("TaskItem")).toBeFalsy();

    (0, _expect2.default)(permission.field("Task", "name")).toBeTruthy();
    (0, _expect2.default)(permission.field("Task", "options")).toBeFalsy();
    // expect(permission.field("TaskItem", "name")).toBeFalsy();

    const schema = yield (0, _index.createSchema)(instance, {
      permission
    });
    const queryFields = schema.getQueryType().getFields().models.type.getFields();
    (0, _expect2.default)(queryFields.Task).toBeDefined();
    // expect().toBeDefined();
    // console.log("queryFields.Task", schema.$sql2gql.types.Task.getFields());
    const fields = schema.$sql2gql.types.Task.getFields();
    (0, _expect2.default)(fields.name).toBeDefined();
    (0, _expect2.default)(fields.id).not.toBeDefined();
    (0, _expect2.default)(queryFields.TaskItem).not.toBeDefined();
  }));
});
//# sourceMappingURL=permission-helper.test.js.map
