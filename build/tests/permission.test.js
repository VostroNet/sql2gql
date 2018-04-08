"use strict";

var _expect = _interopRequireDefault(require("expect"));

var _utils = require("./utils");

var _index = require("../index");

var _graphqlSubscriptions = require("graphql-subscriptions");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let instance;
describe("permissions", () => {
  before(async () => {
    instance = await (0, _utils.createSqlInstance)();
  });
  it("model", async () => {
    const schema = await (0, _index.createSchema)(instance, {
      permission: {
        model(modelName) {
          if (modelName === "Task") {
            return false;
          }

          return true;
        }

      }
    }); // debugger; //eslint-disable-line

    const queryFields = schema.getQueryType().getFields().models.type.getFields();
    (0, _expect.default)(queryFields.Task).not.toBeDefined();
    return (0, _expect.default)(queryFields.TaskItem).toBeDefined();
  });
  it("field", async () => {
    const schema = await (0, _index.createSchema)(instance, {
      permission: {
        field(modelName, fieldName) {
          if (modelName === "Task" && fieldName === "name") {
            return false;
          }

          return true;
        }

      }
    });
    const taskFields = schema.$sql2gql.types.Task.getFields();
    (0, _expect.default)(taskFields.mutationCheck).toBeDefined();
    return (0, _expect.default)(taskFields.name).not.toBeDefined();
  });
  it("query listing", async () => {
    const schema = await (0, _index.createSchema)(instance, {
      permission: {
        query(modelName) {
          if (modelName === "Task") {
            return false;
          }

          return true;
        }

      }
    });
    const queryFields = schema.getQueryType().getFields().models.type.getFields();
    (0, _expect.default)(queryFields.Task).not.toBeDefined();
    return (0, _expect.default)(queryFields.TaskItem).toBeDefined();
  });
  it("query classMethods only", async () => {
    const schema = await (0, _index.createSchema)(instance, {
      permission: {
        query(modelName) {
          return false;
        },

        queryClassMethods(modelName, methodName) {
          if (modelName === "Task" && methodName === "getHiddenData") {
            return false;
          }

          return true;
        }

      }
    });
    const queryFields = schema.getQueryType().getFields().classMethods.type.getFields().Task.type.getFields();
    (0, _expect.default)(queryFields.getHiddenData).not.toBeDefined();
    return (0, _expect.default)(queryFields.getHiddenData2).toBeDefined();
  });
  it("query classMethods", async () => {
    const schema = await (0, _index.createSchema)(instance, {
      permission: {
        queryClassMethods(modelName, methodName) {
          if (modelName === "Task" && methodName === "getHiddenData") {
            return false;
          }

          return true;
        }

      }
    });
    const queryFields = schema.getQueryType().getFields().classMethods.type.getFields().Task.type.getFields();
    (0, _expect.default)(queryFields.getHiddenData).not.toBeDefined();
    return (0, _expect.default)(queryFields.getHiddenData2).toBeDefined();
  });
  it("relationship", async () => {
    const schema = await (0, _index.createSchema)(instance, {
      permission: {
        relationship(modelName, relationshipName, targetModelName) {
          if (modelName === "Task" && targetModelName === "TaskItem") {
            return false;
          }

          return true;
        }

      }
    });
    const taskFields = schema.getQueryType().getFields().models.type.getFields().Task.type.ofType.getFields();
    return (0, _expect.default)(taskFields.items).not.toBeDefined();
  });
  it("mutation model", async () => {
    const schema = await (0, _index.createSchema)(instance, {
      permission: {
        mutation(modelName) {
          if (modelName === "Task") {
            return false;
          }

          return true;
        }

      }
    });
    const queryFields = schema.getQueryType().getFields().models.type.getFields();
    const mutationFields = schema.getMutationType().getFields().models.type.getFields();
    (0, _expect.default)(queryFields.Task).toBeDefined();
    return (0, _expect.default)(mutationFields.Task).not.toBeDefined();
  });
  it("mutation model - create", async () => {
    const schema = await (0, _index.createSchema)(instance, {
      permission: {
        mutationCreate(modelName) {
          if (modelName === "Task") {
            return false;
          }

          return true;
        }

      }
    });
    const {
      args
    } = schema.getMutationType().getFields().models.type.getFields().Task;
    (0, _expect.default)(args.filter(a => a.name === "delete").length).toEqual(1);
    (0, _expect.default)(args.filter(a => a.name === "update").length).toEqual(1);
    return (0, _expect.default)(args.filter(a => a.name === "create").length).toEqual(0);
  });
  it("mutation model - update", async () => {
    const schema = await (0, _index.createSchema)(instance, {
      permission: {
        mutationUpdate(modelName) {
          if (modelName === "Task") {
            return false;
          }

          return true;
        }

      }
    });
    const {
      args
    } = schema.getMutationType().getFields().models.type.getFields().Task;
    (0, _expect.default)(args.filter(a => a.name === "delete").length).toEqual(1);
    (0, _expect.default)(args.filter(a => a.name === "update").length).toEqual(0);
    return (0, _expect.default)(args.filter(a => a.name === "create").length).toEqual(1);
  });
  it("mutation model - delete", async () => {
    const schema = await (0, _index.createSchema)(instance, {
      permission: {
        mutationDelete(modelName) {
          if (modelName === "Task") {
            return false;
          }

          return true;
        }

      }
    });
    const {
      args
    } = schema.getMutationType().getFields().models.type.getFields().Task;
    (0, _expect.default)(args.filter(a => a.name === "delete").length).toEqual(0);
    (0, _expect.default)(args.filter(a => a.name === "update").length).toEqual(1);
    return (0, _expect.default)(args.filter(a => a.name === "create").length).toEqual(1);
  });
  it("mutation model - classMethods", async () => {
    return (0, _expect.default)(false).toEqual(true); // const schema = await createSchema(instance, {
    //   permission: {
    //     mutationClassMethods(modelName, methodName) {
    //       if (modelName === "Task" && methodName === "reverseName") {
    //         return false;
    //       }
    //       return true;
    //     },
    //   },
    // });
    // const func = schema.getMutationType().getFields().models.type.getFields().Task.type.getFields();
    // expect(func.delete).toBeDefined();
    // return expect(func.reverseName).not.toBeDefined();
  });
  it("subscription", async () => {
    const pubsub = new _graphqlSubscriptions.PubSub();
    const sqlInstance = await (0, _utils.createSqlInstance)({
      subscriptions: {
        pubsub
      }
    }); // const {Task} = sqlInstance.models;

    const schema = await (0, _index.createSchema)(sqlInstance, {
      permission: {
        subscription(modelName, hookName) {
          if (modelName === "Task" && hookName === "afterCreate") {
            return false;
          }

          return true;
        }

      }
    });
    (0, _expect.default)(schema.getSubscriptionType().getFields().afterCreateTask).not.toBeDefined();
    return (0, _expect.default)(schema.getSubscriptionType().getFields().afterUpdateTask).toBeDefined();
  });
});
//# sourceMappingURL=permission.test.js.map
