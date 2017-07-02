import expect from "expect";
import {createSqlInstance} from "./utils";
import {createSchema} from "../index";

let instance;

describe("permissions", () => {
  before(async() => {
    instance = await createSqlInstance();
  });
  it("model", async() => {
    const schema = await createSchema(instance, {
      permission: {
        model(modelName) {
          if (modelName === "Task") {
            return false;
          }
          return true;
        },
      },
    });
    const queryFields = schema.getQueryType().getFields().models.type.getFields();
    expect(queryFields.Task).toNotExist();
    return expect(queryFields.TaskItem).toExist();
  });
  it("query listing", async() => {
    const schema = await createSchema(instance, {
      permission: {
        query(modelName) {
          if (modelName === "Task") {
            return false;
          }
          return true;
        },
      },
    });
    const queryFields = schema.getQueryType().getFields().models.type.getFields();
    expect(queryFields.Task).toNotExist();
    return expect(queryFields.TaskItem).toExist();
  });
  it("query classMethods", async() => {
    const schema = await createSchema(instance, {
      permission: {
        queryClassMethods(modelName, methodName) {
          if (modelName === "Task" && methodName === "getHiddenData") {
            return false;
          }
          return true;
        },
      },
    });
    const queryFields = schema.getQueryType().getFields().classMethods.type.getFields().Task.type.getFields();
    expect(queryFields.getHiddenData).toNotExist();
    return expect(queryFields.getHiddenData2).toExist();
  });
  it("relationship", async() => {
    const schema = await createSchema(instance, {
      permission: {
        relationship(modelName, relationshipName, targetType) {
          if (modelName === "Task" && targetType === "TaskItem") {
            return false;
          }
          return true;
        },
      },
    });
    const taskFields = schema.getQueryType().getFields().models.type.getFields().Task.type.ofType.getFields();
    return expect(taskFields.items).toNotExist();
  });
  it("mutation model", async() => {
    const schema = await createSchema(instance, {
      permission: {
        mutation(modelName) {
          if (modelName === "Task") {
            return false;
          }
          return true;
        },
      },
    });
    const queryFields = schema.getQueryType().getFields().models.type.getFields();
    const mutationFields = schema.getMutationType().getFields().models.type.getFields();
    expect(queryFields.Task).toExist();
    return expect(mutationFields.Task).toNotExist();
  });
  it("mutation model - create", async() => {
    const schema = await createSchema(instance, {
      permission: {
        mutationCreate(modelName) {
          if (modelName === "Task") {
            return false;
          }
          return true;
        },
      },
    });
    const func = schema.getMutationType().getFields().models.type.getFields().Task.type.getFields();
    expect(func.delete).toExist();
    return expect(func.create).toNotExist();
  });
  it("mutation model - update", async() => {
    const schema = await createSchema(instance, {
      permission: {
        mutationUpdate(modelName) {
          if (modelName === "Task") {
            return false;
          }
          return true;
        },
      },
    });
    const func = schema.getMutationType().getFields().models.type.getFields().Task.type.getFields();
    expect(func.delete).toExist();
    return expect(func.update).toNotExist();
  });
  it("mutation model - delete", async() => {
    const schema = await createSchema(instance, {
      permission: {
        mutationDelete(modelName) {
          if (modelName === "Task") {
            return false;
          }
          return true;
        },
      },
    });
    const func = schema.getMutationType().getFields().models.type.getFields().Task.type.getFields();
    expect(func.update).toExist();
    return expect(func.delete).toNotExist();
  });
  it("mutation model - updateAll", async() => {
    const schema = await createSchema(instance, {
      permission: {
        mutationUpdateAll(modelName) {
          if (modelName === "Task") {
            return false;
          }
          return true;
        },
      },
    });
    const func = schema.getMutationType().getFields().models.type.getFields().Task.type.getFields();
    expect(func.delete).toExist();
    return expect(func.updateAll).toNotExist();
  });
  it("mutation model - deleteAll", async() => {
    const schema = await createSchema(instance, {
      permission: {
        mutationDeleteAll(modelName) {
          if (modelName === "Task") {
            return false;
          }
          return true;
        },
      },
    });
    const func = schema.getMutationType().getFields().models.type.getFields().Task.type.getFields();
    expect(func.delete).toExist();
    return expect(func.deleteAll).toNotExist();
  });
  it("mutation model - classMethods", async() => {
    const schema = await createSchema(instance, {
      permission: {
        mutationClassMethods(modelName, methodName) {
          if (modelName === "Task" && methodName === "reverseName") {
            return false;
          }
          return true;
        },
      },
    });
    const func = schema.getMutationType().getFields().models.type.getFields().Task.type.getFields();
    expect(func.delete).toExist();
    return expect(func.reverseName).toNotExist();
  });
});
