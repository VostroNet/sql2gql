import {createSqlInstance} from "./utils";
import {createSchema, permissionHelper} from "../index";
import expect from "expect";

let instance;



describe("permission helper", () => {
  before(async() => {
    instance = await createSqlInstance();
  });
  it("basic test - no settings - defaults deny", async() => {
    const permission = permissionHelper("anything", {});
    const result = permission.model("anything");
    expect(result).toBeFalsy();
    let e;
    try {
      await createSchema(instance, {
        permission,
      });
      expect(true).toBeFalsy();
    } catch (err) {
      e = err;
    }
    expect(e).toBeDefined();

    // // console.log("schema");
    // const queryFields = schema.getQueryType().getFields().models.type.getFields();
    // return expect(queryFields.Task).not.toBeDefined();
  });
  it("basic test - field/model/query - defaults deny", async() => {
    const permission = permissionHelper("anyone", {
      "someone": "deny",
      "anyone": {
        "query": "allow",
        "model": {
          "Task": "allow",
        },
        "field": {
          "Task": {
            "name": "allow",
          },
        },
      },
    });

    expect(permission.query("Task")).toBeTruthy();
    expect(permission.query("TaskItem")).toBeTruthy();

    expect(permission.model("Task")).toBeTruthy();
    expect(permission.model("TaskItem")).toBeFalsy();

    expect(permission.field("Task", "name")).toBeTruthy();
    expect(permission.field("Task", "options")).toBeFalsy();
    // expect(permission.field("TaskItem", "name")).toBeFalsy();

    const schema = await createSchema(instance, {
      permission,
    });
    const queryFields = schema.getQueryType().getFields().models.type.getFields();
    expect(queryFields.Task).toBeDefined();
    // expect().toBeDefined();
    // console.log("queryFields.Task", schema.$sql2gql.types.Task.getFields());
    const fields = schema.$sql2gql.types.Task.getFields();
    expect(fields.name).toBeDefined();
    expect(fields.id).not.toBeDefined();
    expect(queryFields.TaskItem).not.toBeDefined();
  });
});
