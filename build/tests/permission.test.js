"use strict";

var _expect = require("expect");

var _expect2 = _interopRequireDefault(_expect);

var _utils = require("./utils");

var _index = require("../index");

var _graphqlSubscriptions = require("graphql-subscriptions");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

let instance;

describe("permissions", () => {
  before(_asyncToGenerator(function* () {
    instance = yield (0, _utils.createSqlInstance)();
  }));
  it("model", _asyncToGenerator(function* () {
    const schema = yield (0, _index.createSchema)(instance, {
      permission: {
        model(modelName) {
          if (modelName === "Task") {
            return false;
          }
          return true;
        }
      }
    });
    const queryFields = schema.getQueryType().getFields().models.type.getFields();
    (0, _expect2.default)(queryFields.Task).not.toBeDefined();
    return (0, _expect2.default)(queryFields.TaskItem).toBeDefined();
  }));
  it("field", _asyncToGenerator(function* () {
    const schema = yield (0, _index.createSchema)(instance, {
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
    (0, _expect2.default)(taskFields.mutationCheck).toBeDefined();
    return (0, _expect2.default)(taskFields.name).not.toBeDefined();
  }));

  it("query listing", _asyncToGenerator(function* () {
    const schema = yield (0, _index.createSchema)(instance, {
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
    (0, _expect2.default)(queryFields.Task).not.toBeDefined();
    return (0, _expect2.default)(queryFields.TaskItem).toBeDefined();
  }));
  it("query classMethods", _asyncToGenerator(function* () {
    const schema = yield (0, _index.createSchema)(instance, {
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
    (0, _expect2.default)(queryFields.getHiddenData).not.toBeDefined();
    return (0, _expect2.default)(queryFields.getHiddenData2).toBeDefined();
  }));
  it("relationship", _asyncToGenerator(function* () {
    const schema = yield (0, _index.createSchema)(instance, {
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
    return (0, _expect2.default)(taskFields.items).not.toBeDefined();
  }));
  it("mutation model", _asyncToGenerator(function* () {
    const schema = yield (0, _index.createSchema)(instance, {
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
    (0, _expect2.default)(queryFields.Task).toBeDefined();
    return (0, _expect2.default)(mutationFields.Task).not.toBeDefined();
  }));
  it("mutation model - create", _asyncToGenerator(function* () {
    const schema = yield (0, _index.createSchema)(instance, {
      permission: {
        mutationCreate(modelName) {
          if (modelName === "Task") {
            return false;
          }
          return true;
        }
      }
    });
    const func = schema.getMutationType().getFields().models.type.getFields().Task.type.getFields();
    (0, _expect2.default)(func.delete).toBeDefined();
    return (0, _expect2.default)(func.create).not.toBeDefined();
  }));
  it("mutation model - update", _asyncToGenerator(function* () {
    const schema = yield (0, _index.createSchema)(instance, {
      permission: {
        mutationUpdate(modelName) {
          if (modelName === "Task") {
            return false;
          }
          return true;
        }
      }
    });
    const func = schema.getMutationType().getFields().models.type.getFields().Task.type.getFields();
    (0, _expect2.default)(func.delete).toBeDefined();
    return (0, _expect2.default)(func.update).not.toBeDefined();
  }));
  it("mutation model - delete", _asyncToGenerator(function* () {
    const schema = yield (0, _index.createSchema)(instance, {
      permission: {
        mutationDelete(modelName) {
          if (modelName === "Task") {
            return false;
          }
          return true;
        }
      }
    });
    const func = schema.getMutationType().getFields().models.type.getFields().Task.type.getFields();
    (0, _expect2.default)(func.update).toBeDefined();
    return (0, _expect2.default)(func.delete).not.toBeDefined();
  }));
  it("mutation model - updateAll", _asyncToGenerator(function* () {
    const schema = yield (0, _index.createSchema)(instance, {
      permission: {
        mutationUpdateAll(modelName) {
          if (modelName === "Task") {
            return false;
          }
          return true;
        }
      }
    });
    const func = schema.getMutationType().getFields().models.type.getFields().Task.type.getFields();
    (0, _expect2.default)(func.delete).toBeDefined();
    return (0, _expect2.default)(func.updateAll).not.toBeDefined();
  }));
  it("mutation model - deleteAll", _asyncToGenerator(function* () {
    const schema = yield (0, _index.createSchema)(instance, {
      permission: {
        mutationDeleteAll(modelName) {
          if (modelName === "Task") {
            return false;
          }
          return true;
        }
      }
    });
    const func = schema.getMutationType().getFields().models.type.getFields().Task.type.getFields();
    (0, _expect2.default)(func.delete).toBeDefined();
    return (0, _expect2.default)(func.deleteAll).not.toBeDefined();
  }));
  it("mutation model - classMethods", _asyncToGenerator(function* () {
    const schema = yield (0, _index.createSchema)(instance, {
      permission: {
        mutationClassMethods(modelName, methodName) {
          if (modelName === "Task" && methodName === "reverseName") {
            return false;
          }
          return true;
        }
      }
    });
    const func = schema.getMutationType().getFields().models.type.getFields().Task.type.getFields();
    (0, _expect2.default)(func.delete).toBeDefined();
    return (0, _expect2.default)(func.reverseName).not.toBeDefined();
  }));
  it("subscription", _asyncToGenerator(function* () {
    const pubsub = new _graphqlSubscriptions.PubSub();
    const sqlInstance = yield (0, _utils.createSqlInstance)({ subscriptions: { pubsub } });
    // const {Task} = sqlInstance.models;
    const schema = yield (0, _index.createSchema)(sqlInstance, {
      permission: {
        subscription(modelName, hookName) {
          if (modelName === "Task" && hookName === "afterCreate") {
            return false;
          }
          return true;
        }
      }
    });
    (0, _expect2.default)(schema.getSubscriptionType().getFields().afterCreateTask).not.toBeDefined();
    return (0, _expect2.default)(schema.getSubscriptionType().getFields().afterUpdateTask).toBeDefined();
  }));
});
//# sourceMappingURL=permission.test.js.map
