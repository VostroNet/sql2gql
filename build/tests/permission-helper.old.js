"use strict";

var _utils = require("./utils");

var _index = require("../index");

var _expect = _interopRequireDefault(require("expect"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let instance;
describe("permission helper", () => {
  before(async () => {
    instance = await (0, _utils.createSqlInstance)();
  });
  it("basic test - no settings - defaults deny", async () => {
    const permission = (0, _index.permissionHelper)("anything", {});
    const result = permission.model("anything");
    (0, _expect.default)(result).toBeFalsy();
    let e;

    try {
      await (0, _index.createSchema)(instance, {
        permission
      });
      (0, _expect.default)(true).toBeFalsy();
    } catch (err) {
      e = err;
    }

    (0, _expect.default)(e).toBeDefined(); // // console.log("schema");
    // const queryFields = schema.getQueryType().getFields().models.type.getFields();
    // return expect(queryFields.Task).not.toBeDefined();
  });
  it("basic test - field/model/query - defaults deny", async () => {
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
    (0, _expect.default)(permission.query("Task")).toBeTruthy();
    (0, _expect.default)(permission.query("TaskItem")).toBeTruthy();
    (0, _expect.default)(permission.model("Task")).toBeTruthy();
    (0, _expect.default)(permission.model("TaskItem")).toBeFalsy();
    (0, _expect.default)(permission.field("Task", "name")).toBeTruthy();
    (0, _expect.default)(permission.field("Task", "options")).toBeFalsy(); // expect(permission.field("TaskItem", "name")).toBeFalsy();

    const schema = await (0, _index.createSchema)(instance, {
      permission
    });
    const queryFields = schema.getQueryType().getFields().models.type.getFields();
    (0, _expect.default)(queryFields.Task).toBeDefined(); // expect().toBeDefined();
    // console.log("queryFields.Task", schema.$sql2gql.types.Task.getFields());

    const fields = schema.$sql2gql.types.Task.getFields();
    (0, _expect.default)(fields.name).toBeDefined();
    (0, _expect.default)(fields.id).not.toBeDefined();
    (0, _expect.default)(queryFields.TaskItem).not.toBeDefined();
  });
  it("basic test - allow all on task - defaults deny", async () => {
    const permission = (0, _index.permissionHelper)("anyone", {
      "someone": "deny",
      "anyone": {
        "query": {
          "Task": "allow"
        },
        "model": {
          "Task": "allow"
        },
        "field": {
          "Task": "allow"
        }
      }
    });
    (0, _expect.default)(permission.query("Task")).toBeTruthy();
    (0, _expect.default)(permission.field("Task", "name")).toBeTruthy();
  });
});
//# sourceMappingURL=permission-helper.old.js.map
