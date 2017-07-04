"use strict";

var _expect = require("expect");

var _expect2 = _interopRequireDefault(_expect);

var _utils = require("./utils");

var _index = require("../index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var instance = void 0;

describe("permissions", function () {
  before(_asyncToGenerator(regeneratorRuntime.mark(function _callee() {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _utils.createSqlInstance)();

          case 2:
            instance = _context.sent;

          case 3:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, undefined);
  })));
  it("model", _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
    var schema, queryFields;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.t0 = _index.createSchema;
            _context2.t1 = instance;
            _context2.t2 = {
              model(modelName) {
                if (modelName === "Task") {
                  return false;
                }
                return true;
              }
            };
            _context2.t3 = {
              permission: _context2.t2
            };
            _context2.next = 6;
            return (0, _context2.t0)(_context2.t1, _context2.t3);

          case 6:
            schema = _context2.sent;
            queryFields = schema.getQueryType().getFields().models.type.getFields();

            (0, _expect2.default)(queryFields.Task).toNotExist();
            return _context2.abrupt("return", (0, _expect2.default)(queryFields.TaskItem).toExist());

          case 10:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  })));
  it("query listing", _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
    var schema, queryFields;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.t0 = _index.createSchema;
            _context3.t1 = instance;
            _context3.t2 = {
              query(modelName) {
                if (modelName === "Task") {
                  return false;
                }
                return true;
              }
            };
            _context3.t3 = {
              permission: _context3.t2
            };
            _context3.next = 6;
            return (0, _context3.t0)(_context3.t1, _context3.t3);

          case 6:
            schema = _context3.sent;
            queryFields = schema.getQueryType().getFields().models.type.getFields();

            (0, _expect2.default)(queryFields.Task).toNotExist();
            return _context3.abrupt("return", (0, _expect2.default)(queryFields.TaskItem).toExist());

          case 10:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  })));
  it("query classMethods", _asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
    var schema, queryFields;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.t0 = _index.createSchema;
            _context4.t1 = instance;
            _context4.t2 = {
              queryClassMethods(modelName, methodName) {
                if (modelName === "Task" && methodName === "getHiddenData") {
                  return false;
                }
                return true;
              }
            };
            _context4.t3 = {
              permission: _context4.t2
            };
            _context4.next = 6;
            return (0, _context4.t0)(_context4.t1, _context4.t3);

          case 6:
            schema = _context4.sent;
            queryFields = schema.getQueryType().getFields().classMethods.type.getFields().Task.type.getFields();

            (0, _expect2.default)(queryFields.getHiddenData).toNotExist();
            return _context4.abrupt("return", (0, _expect2.default)(queryFields.getHiddenData2).toExist());

          case 10:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  })));
  it("relationship", _asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
    var schema, taskFields;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.t0 = _index.createSchema;
            _context5.t1 = instance;
            _context5.t2 = {
              relationship(modelName, relationshipName, targetModelName) {
                if (modelName === "Task" && targetModelName === "TaskItem") {
                  return false;
                }
                return true;
              }
            };
            _context5.t3 = {
              permission: _context5.t2
            };
            _context5.next = 6;
            return (0, _context5.t0)(_context5.t1, _context5.t3);

          case 6:
            schema = _context5.sent;
            taskFields = schema.getQueryType().getFields().models.type.getFields().Task.type.ofType.getFields();
            return _context5.abrupt("return", (0, _expect2.default)(taskFields.items).toNotExist());

          case 9:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, undefined);
  })));
  it("mutation model", _asyncToGenerator(regeneratorRuntime.mark(function _callee6() {
    var schema, queryFields, mutationFields;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.t0 = _index.createSchema;
            _context6.t1 = instance;
            _context6.t2 = {
              mutation(modelName) {
                if (modelName === "Task") {
                  return false;
                }
                return true;
              }
            };
            _context6.t3 = {
              permission: _context6.t2
            };
            _context6.next = 6;
            return (0, _context6.t0)(_context6.t1, _context6.t3);

          case 6:
            schema = _context6.sent;
            queryFields = schema.getQueryType().getFields().models.type.getFields();
            mutationFields = schema.getMutationType().getFields().models.type.getFields();

            (0, _expect2.default)(queryFields.Task).toExist();
            return _context6.abrupt("return", (0, _expect2.default)(mutationFields.Task).toNotExist());

          case 11:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, undefined);
  })));
  it("mutation model - create", _asyncToGenerator(regeneratorRuntime.mark(function _callee7() {
    var schema, func;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.t0 = _index.createSchema;
            _context7.t1 = instance;
            _context7.t2 = {
              mutationCreate(modelName) {
                if (modelName === "Task") {
                  return false;
                }
                return true;
              }
            };
            _context7.t3 = {
              permission: _context7.t2
            };
            _context7.next = 6;
            return (0, _context7.t0)(_context7.t1, _context7.t3);

          case 6:
            schema = _context7.sent;
            func = schema.getMutationType().getFields().models.type.getFields().Task.type.getFields();

            (0, _expect2.default)(func.delete).toExist();
            return _context7.abrupt("return", (0, _expect2.default)(func.create).toNotExist());

          case 10:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7, undefined);
  })));
  it("mutation model - update", _asyncToGenerator(regeneratorRuntime.mark(function _callee8() {
    var schema, func;
    return regeneratorRuntime.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.t0 = _index.createSchema;
            _context8.t1 = instance;
            _context8.t2 = {
              mutationUpdate(modelName) {
                if (modelName === "Task") {
                  return false;
                }
                return true;
              }
            };
            _context8.t3 = {
              permission: _context8.t2
            };
            _context8.next = 6;
            return (0, _context8.t0)(_context8.t1, _context8.t3);

          case 6:
            schema = _context8.sent;
            func = schema.getMutationType().getFields().models.type.getFields().Task.type.getFields();

            (0, _expect2.default)(func.delete).toExist();
            return _context8.abrupt("return", (0, _expect2.default)(func.update).toNotExist());

          case 10:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8, undefined);
  })));
  it("mutation model - delete", _asyncToGenerator(regeneratorRuntime.mark(function _callee9() {
    var schema, func;
    return regeneratorRuntime.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.t0 = _index.createSchema;
            _context9.t1 = instance;
            _context9.t2 = {
              mutationDelete(modelName) {
                if (modelName === "Task") {
                  return false;
                }
                return true;
              }
            };
            _context9.t3 = {
              permission: _context9.t2
            };
            _context9.next = 6;
            return (0, _context9.t0)(_context9.t1, _context9.t3);

          case 6:
            schema = _context9.sent;
            func = schema.getMutationType().getFields().models.type.getFields().Task.type.getFields();

            (0, _expect2.default)(func.update).toExist();
            return _context9.abrupt("return", (0, _expect2.default)(func.delete).toNotExist());

          case 10:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9, undefined);
  })));
  it("mutation model - updateAll", _asyncToGenerator(regeneratorRuntime.mark(function _callee10() {
    var schema, func;
    return regeneratorRuntime.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _context10.t0 = _index.createSchema;
            _context10.t1 = instance;
            _context10.t2 = {
              mutationUpdateAll(modelName) {
                if (modelName === "Task") {
                  return false;
                }
                return true;
              }
            };
            _context10.t3 = {
              permission: _context10.t2
            };
            _context10.next = 6;
            return (0, _context10.t0)(_context10.t1, _context10.t3);

          case 6:
            schema = _context10.sent;
            func = schema.getMutationType().getFields().models.type.getFields().Task.type.getFields();

            (0, _expect2.default)(func.delete).toExist();
            return _context10.abrupt("return", (0, _expect2.default)(func.updateAll).toNotExist());

          case 10:
          case "end":
            return _context10.stop();
        }
      }
    }, _callee10, undefined);
  })));
  it("mutation model - deleteAll", _asyncToGenerator(regeneratorRuntime.mark(function _callee11() {
    var schema, func;
    return regeneratorRuntime.wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            _context11.t0 = _index.createSchema;
            _context11.t1 = instance;
            _context11.t2 = {
              mutationDeleteAll(modelName) {
                if (modelName === "Task") {
                  return false;
                }
                return true;
              }
            };
            _context11.t3 = {
              permission: _context11.t2
            };
            _context11.next = 6;
            return (0, _context11.t0)(_context11.t1, _context11.t3);

          case 6:
            schema = _context11.sent;
            func = schema.getMutationType().getFields().models.type.getFields().Task.type.getFields();

            (0, _expect2.default)(func.delete).toExist();
            return _context11.abrupt("return", (0, _expect2.default)(func.deleteAll).toNotExist());

          case 10:
          case "end":
            return _context11.stop();
        }
      }
    }, _callee11, undefined);
  })));
  it("mutation model - classMethods", _asyncToGenerator(regeneratorRuntime.mark(function _callee12() {
    var schema, func;
    return regeneratorRuntime.wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            _context12.t0 = _index.createSchema;
            _context12.t1 = instance;
            _context12.t2 = {
              mutationClassMethods(modelName, methodName) {
                if (modelName === "Task" && methodName === "reverseName") {
                  return false;
                }
                return true;
              }
            };
            _context12.t3 = {
              permission: _context12.t2
            };
            _context12.next = 6;
            return (0, _context12.t0)(_context12.t1, _context12.t3);

          case 6:
            schema = _context12.sent;
            func = schema.getMutationType().getFields().models.type.getFields().Task.type.getFields();

            (0, _expect2.default)(func.delete).toExist();
            return _context12.abrupt("return", (0, _expect2.default)(func.reverseName).toNotExist());

          case 10:
          case "end":
            return _context12.stop();
        }
      }
    }, _callee12, undefined);
  })));
});
//# sourceMappingURL=permission.test.js.map
