import expect from "expect";
import {createSqlInstance} from "./utils";
import {createSchema} from "../index";
import {PubSub} from "graphql-subscriptions";

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
    // debugger; //eslint-disable-line
    const queryFields = schema.getQueryType().getFields().models.type.getFields();
    expect(queryFields.Task).not.toBeDefined();
    return expect(queryFields.TaskItem).toBeDefined();
  });
  it("field", async() => {
    const schema = await createSchema(instance, {
      permission: {
        field(modelName, fieldName) {
          if (modelName === "Task" && fieldName === "name") {
            return false;
          }
          return true;
        },
      },
    });
    const taskFields = schema.$sql2gql.types.Task.getFields();
    expect(taskFields.mutationCheck).toBeDefined();
    return expect(taskFields.name).not.toBeDefined();
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
    expect(queryFields.Task).not.toBeDefined();
    return expect(queryFields.TaskItem).toBeDefined();
  });
  it("query classMethods only", async() => {
    const schema = await createSchema(instance, {
      permission: {
        query(modelName) {
          return false;
        },
        queryClassMethods(modelName, methodName) {
          if (modelName === "Task" && methodName === "getHiddenData") {
            return false;
          }
          return true;
        },
      },
    });
    const queryFields = schema.getQueryType().getFields().classMethods.type.getFields().Task.type.getFields();
    expect(queryFields.getHiddenData).not.toBeDefined();
    return expect(queryFields.getHiddenData2).toBeDefined();
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
    expect(queryFields.getHiddenData).not.toBeDefined();
    return expect(queryFields.getHiddenData2).toBeDefined();
  });
  it("relationship", async() => {
    const schema = await createSchema(instance, {
      permission: {
        relationship(modelName, relationshipName, targetModelName) {
          if (modelName === "Task" && targetModelName === "TaskItem") {
            return false;
          }
          return true;
        },
      },
    });
    const taskFields = schema.getQueryType().getFields().models.type.getFields().Task.type.getFields().edges.type.ofType.getFields().node.type.getFields();
    return expect(taskFields.items).not.toBeDefined();
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
    expect(queryFields.Task).toBeDefined();
    return expect(mutationFields.Task).not.toBeDefined();
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
    const {args} = schema.getMutationType().getFields().models.type.getFields().Task;
    expect(args.filter((a) => a.name === "delete").length).toEqual(1);
    expect(args.filter((a) => a.name === "update").length).toEqual(1);
    return expect(args.filter((a) => a.name === "create").length).toEqual(0);
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
    const {args} = schema.getMutationType().getFields().models.type.getFields().Task;
    expect(args.filter((a) => a.name === "delete").length).toEqual(1);
    expect(args.filter((a) => a.name === "update").length).toEqual(0);
    return expect(args.filter((a) => a.name === "create").length).toEqual(1);
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
    const {args} = schema.getMutationType().getFields().models.type.getFields().Task;
    expect(args.filter((a) => a.name === "delete").length).toEqual(0);
    expect(args.filter((a) => a.name === "update").length).toEqual(1);
    return expect(args.filter((a) => a.name === "create").length).toEqual(1);
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
    const func = schema.getMutationType().getFields().classMethods.type.getFields().Task.type.getFields();
    expect(func.reverseName2).toBeDefined();
    return expect(func.reverseName).not.toBeDefined();
  });
  it("subscription", async() => {
    const pubsub = new PubSub();
    const sqlInstance = await createSqlInstance({subscriptions: {pubsub}});
    // const {Task} = sqlInstance.models;
    const schema = await createSchema(sqlInstance, {
      permission: {
        subscription(modelName, hookName) {
          if (modelName === "Task" && hookName === "afterCreate") {
            return false;
          }
          return true;
        },
      },
    });
    expect(schema.getSubscriptionType().getFields().afterCreateTask).not.toBeDefined();
    return expect(schema.getSubscriptionType().getFields().afterUpdateTask).toBeDefined();
  });
});
