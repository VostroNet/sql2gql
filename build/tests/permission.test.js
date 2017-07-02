"use strict";

var _expect = require("expect");

var _expect2 = _interopRequireDefault(_expect);

var _utils = require("./utils");

var _index = require("../index");

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
    (0, _expect2.default)(queryFields.Task).toNotExist();
    return (0, _expect2.default)(queryFields.TaskItem).toExist();
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
    (0, _expect2.default)(queryFields.Task).toNotExist();
    return (0, _expect2.default)(queryFields.TaskItem).toExist();
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
    (0, _expect2.default)(queryFields.getHiddenData).toNotExist();
    return (0, _expect2.default)(queryFields.getHiddenData2).toExist();
  }));
  it("relationship", _asyncToGenerator(function* () {
    const schema = yield (0, _index.createSchema)(instance, {
      permission: {
        relationship(modelName, relationshipName, targetType) {
          if (modelName === "Task" && targetType === "TaskItem") {
            return false;
          }
          return true;
        }
      }
    });
    const taskFields = schema.getQueryType().getFields().models.type.getFields().Task.type.ofType.getFields();
    return (0, _expect2.default)(taskFields.items).toNotExist();
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
    (0, _expect2.default)(queryFields.Task).toExist();
    return (0, _expect2.default)(mutationFields.Task).toNotExist();
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
    (0, _expect2.default)(func.delete).toExist();
    return (0, _expect2.default)(func.create).toNotExist();
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
    (0, _expect2.default)(func.delete).toExist();
    return (0, _expect2.default)(func.update).toNotExist();
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
    (0, _expect2.default)(func.update).toExist();
    return (0, _expect2.default)(func.delete).toNotExist();
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
    (0, _expect2.default)(func.delete).toExist();
    return (0, _expect2.default)(func.updateAll).toNotExist();
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
    (0, _expect2.default)(func.delete).toExist();
    return (0, _expect2.default)(func.deleteAll).toNotExist();
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
    (0, _expect2.default)(func.delete).toExist();
    return (0, _expect2.default)(func.reverseName).toNotExist();
  }));
});
//# sourceMappingURL=permission.test.js.map
