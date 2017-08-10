"use strict";

var _expect = require("expect");

var _expect2 = _interopRequireDefault(_expect);

var _utils = require("./utils");

var _graphql = require("graphql");

var _index = require("../index");

var _sequelize = require("sequelize");

var _sequelize2 = _interopRequireDefault(_sequelize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

describe("mutations", function () {
  it("create", _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
    var instance, schema, mutation, mutationResult, query, queryResult;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _utils.createSqlInstance)();

          case 2:
            instance = _context.sent;
            _context.next = 5;
            return (0, _index.createSchema)(instance);

          case 5:
            schema = _context.sent;
            mutation = `mutation {
      models {
        Task {
          create(input: {name: "item1"}) {
            id, 
            name
          }
        }
      }
    }`;
            _context.next = 9;
            return (0, _graphql.graphql)(schema, mutation);

          case 9:
            mutationResult = _context.sent;

            (0, _utils.validateResult)(mutationResult);
            query = "query { models { Task { id, name } } }";
            _context.next = 14;
            return (0, _graphql.graphql)(schema, query);

          case 14:
            queryResult = _context.sent;

            (0, _utils.validateResult)(queryResult);
            return _context.abrupt("return", (0, _expect2.default)(queryResult.data.models.Task.length).toEqual(1));

          case 17:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, undefined);
  })));
  it("create - override", _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
    var instance, schema, mutation, mutationResult, queryResult;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return (0, _utils.createSqlInstance)();

          case 2:
            instance = _context2.sent;
            _context2.next = 5;
            return (0, _index.createSchema)(instance);

          case 5:
            schema = _context2.sent;
            mutation = `mutation {
      models {
        Task {
          create(input: {name: "item1", options: {hidden: "nowhere"}}) {
            id, 
            name
            options {
              hidden
            }
          }
        }
      }
    }`;
            _context2.next = 9;
            return (0, _graphql.graphql)(schema, mutation);

          case 9:
            mutationResult = _context2.sent;

            (0, _utils.validateResult)(mutationResult);
            (0, _expect2.default)(mutationResult.data.models.Task.create.options.hidden).toEqual("nowhere");

            _context2.next = 14;
            return (0, _graphql.graphql)(schema, "query { models { Task { id, name, options {hidden} } } }");

          case 14:
            queryResult = _context2.sent;

            (0, _utils.validateResult)(queryResult);
            return _context2.abrupt("return", (0, _expect2.default)(queryResult.data.models.Task[0].options.hidden).toEqual("nowhere"));

          case 17:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  })));

  it("update", _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
    var instance, Task, item, schema, mutation, result;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return (0, _utils.createSqlInstance)();

          case 2:
            instance = _context3.sent;
            Task = instance.models.Task;
            _context3.next = 6;
            return Task.create({
              name: "item2"
            });

          case 6:
            item = _context3.sent;
            _context3.next = 9;
            return (0, _index.createSchema)(instance);

          case 9:
            schema = _context3.sent;
            mutation = `mutation {
      models {
        Task {
          update(id: ${item.id}, input: {name: "UPDATED"}) {
            id, 
            name
          }
        }
      }
    }`;
            _context3.next = 13;
            return (0, _graphql.graphql)(schema, mutation);

          case 13:
            result = _context3.sent;

            (0, _utils.validateResult)(result);
            return _context3.abrupt("return", (0, _expect2.default)(result.data.models.Task.update.name).toEqual("UPDATED"));

          case 16:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  })));
  it("delete", _asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
    var instance, Task, item, schema, mutation, result, query, queryResult;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return (0, _utils.createSqlInstance)();

          case 2:
            instance = _context4.sent;
            Task = instance.models.Task;
            _context4.next = 6;
            return Task.create({
              name: "item2"
            });

          case 6:
            item = _context4.sent;
            _context4.next = 9;
            return (0, _index.createSchema)(instance);

          case 9:
            schema = _context4.sent;
            mutation = `mutation {
      models {
        Task {
          delete(id: ${item.id}) {
            id
          }
        }
      }
    }`;
            _context4.next = 13;
            return (0, _graphql.graphql)(schema, mutation);

          case 13:
            result = _context4.sent;

            (0, _utils.validateResult)(result);
            (0, _expect2.default)(result.data.models.Task.delete.id).toEqual(1);
            query = `query { models { Task(where: {id: ${item.id}}) { id, name } } }`;
            _context4.next = 19;
            return (0, _graphql.graphql)(schema, query);

          case 19:
            queryResult = _context4.sent;

            (0, _utils.validateResult)(queryResult);
            return _context4.abrupt("return", (0, _expect2.default)(queryResult.data.models.Task.length).toEqual(0));

          case 22:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  })));
  it("updateAll", _asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
    var instance, Task, items, schema, mutation, mutationResult, item2Result, item3Result;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 2;
            return (0, _utils.createSqlInstance)();

          case 2:
            instance = _context5.sent;
            Task = instance.models.Task;
            _context5.next = 6;
            return Promise.all([Task.create({
              name: "item1"
            }), Task.create({
              name: "item2"
            }), Task.create({
              name: "item3"
            })]);

          case 6:
            items = _context5.sent;
            _context5.next = 9;
            return (0, _index.createSchema)(instance);

          case 9:
            schema = _context5.sent;
            mutation = `mutation {
      models {
        Task {
          updateAll(where: {name: {in: ["item2", "item3"]}}, input: {name: "UPDATED"}) {
            id, 
            name
          }
        }
      }
    }`;
            _context5.next = 13;
            return (0, _graphql.graphql)(schema, mutation);

          case 13:
            mutationResult = _context5.sent;

            (0, _utils.validateResult)(mutationResult);
            _context5.next = 17;
            return (0, _graphql.graphql)(schema, `query { models { Task(where: {id: ${items[1].id}}) { id, name } } }`);

          case 17:
            item2Result = _context5.sent;

            (0, _utils.validateResult)(item2Result);
            _context5.next = 21;
            return (0, _graphql.graphql)(schema, `query { models { Task(where: {id: ${items[2].id}}) { id, name } } }`);

          case 21:
            item3Result = _context5.sent;

            (0, _utils.validateResult)(item3Result);
            (0, _expect2.default)(item2Result.data.models.Task[0].name).toEqual("UPDATED");
            (0, _expect2.default)(item3Result.data.models.Task[0].name).toEqual("UPDATED");

          case 25:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, undefined);
  })));
  it("deleteAll", _asyncToGenerator(regeneratorRuntime.mark(function _callee6() {
    var instance, Task, schema, mutation, result, queryResults;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return (0, _utils.createSqlInstance)();

          case 2:
            instance = _context6.sent;
            Task = instance.models.Task;
            _context6.next = 6;
            return Promise.all([Task.create({
              name: "item1"
            }), Task.create({
              name: "item2"
            }), Task.create({
              name: "item3"
            })]);

          case 6:
            _context6.next = 8;
            return (0, _index.createSchema)(instance);

          case 8:
            schema = _context6.sent;
            mutation = `mutation {
      models {
        Task {
          deleteAll(where: {name: {in: ["item2", "item3"]}}) {
            id
          }
        }
      }
    }`;
            _context6.next = 12;
            return (0, _graphql.graphql)(schema, mutation);

          case 12:
            result = _context6.sent;

            (0, _utils.validateResult)(result);
            // console.log("result", result.data);
            (0, _expect2.default)(result.data.models.Task.deleteAll.length).toEqual(2);
            _context6.next = 17;
            return (0, _graphql.graphql)(schema, "query { models { Task { id, name } } }");

          case 17:
            queryResults = _context6.sent;

            // console.log("queryResults", queryResults.data.models.Task);
            (0, _expect2.default)(queryResults.data.models.Task.length).toEqual(1);

          case 19:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, undefined);
  })));
  it("classMethod", _asyncToGenerator(regeneratorRuntime.mark(function _callee7() {
    var instance, Task, schema, mutation, result;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.next = 2;
            return (0, _utils.createSqlInstance)();

          case 2:
            instance = _context7.sent;
            Task = instance.models.Task;
            _context7.next = 6;
            return Task.create({
              name: "item2"
            });

          case 6:
            _context7.next = 8;
            return (0, _index.createSchema)(instance);

          case 8:
            schema = _context7.sent;
            mutation = `mutation {
      models {
        Task {
          reverseName(input: {amount: 2}) {
            name
          }
        }
      }
    }`;
            _context7.next = 12;
            return (0, _graphql.graphql)(schema, mutation);

          case 12:
            result = _context7.sent;

            (0, _utils.validateResult)(result);
            return _context7.abrupt("return", (0, _expect2.default)(result.data.models.Task.reverseName.name).toEqual("reverseName2"));

          case 15:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7, undefined);
  })));
  it("create - before hook", _asyncToGenerator(regeneratorRuntime.mark(function _callee8() {
    var instance, schema, mutation, mutationResult;
    return regeneratorRuntime.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.next = 2;
            return (0, _utils.createSqlInstance)();

          case 2:
            instance = _context8.sent;
            _context8.next = 5;
            return (0, _index.createSchema)(instance);

          case 5:
            schema = _context8.sent;
            mutation = `mutation {
      models {
        Task {
          create(input: {name: "item1"}) {
            id, 
            name,
            mutationCheck
          }
        }
      }
    }`;
            _context8.next = 9;
            return (0, _graphql.graphql)(schema, mutation);

          case 9:
            mutationResult = _context8.sent;

            (0, _utils.validateResult)(mutationResult);
            return _context8.abrupt("return", (0, _expect2.default)(mutationResult.data.models.Task.create.mutationCheck).toEqual("create"));

          case 12:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8, undefined);
  })));

  it("update - before hook", _asyncToGenerator(regeneratorRuntime.mark(function _callee9() {
    var instance, Task, item, schema, mutation, result;
    return regeneratorRuntime.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.next = 2;
            return (0, _utils.createSqlInstance)();

          case 2:
            instance = _context9.sent;
            Task = instance.models.Task;
            _context9.next = 6;
            return Task.create({
              name: "item2"
            });

          case 6:
            item = _context9.sent;
            _context9.next = 9;
            return (0, _index.createSchema)(instance);

          case 9:
            schema = _context9.sent;
            mutation = `mutation {
      models {
        Task {
          update(id: ${item.id}, input: {name: "UPDATED"}) {
            id, 
            name,
            mutationCheck
          }
        }
      }
    }`;
            _context9.next = 13;
            return (0, _graphql.graphql)(schema, mutation);

          case 13:
            result = _context9.sent;

            (0, _utils.validateResult)(result);
            return _context9.abrupt("return", (0, _expect2.default)(result.data.models.Task.update.mutationCheck).toEqual("update"));

          case 16:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9, undefined);
  })));
  it("create - hook variables {rootValue}", _asyncToGenerator(regeneratorRuntime.mark(function _callee10() {
    var taskModel, instance, schema, createMutation, createResult;
    return regeneratorRuntime.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _context10.t0 = {
              name: {
                type: _sequelize2.default.STRING,
                allowNull: false
              }
            };
            _context10.t1 = {
              beforeFind(options) {
                (0, _expect2.default)(options.rootValue).toExist("rootValue is missing");
                (0, _expect2.default)(options.rootValue.req).toEqual("exists", `beforeFind: rootValue: {req: 'exists'} does not match. ${JSON.stringify(options.rootValue)}`);
                return undefined;
              },
              beforeCreate(instance, options) {
                (0, _expect2.default)(options.rootValue).toExist("rootValue is missing");
                (0, _expect2.default)(options.rootValue.req).toEqual("exists", `beforeCreate: rootValue: {req: 'exists'} does not match. ${JSON.stringify(options.rootValue)}`);
                return undefined;
              },
              beforeUpdate(instance, options) {
                (0, _expect2.default)(false).toEqual(true, "beforeUpdate");
              },
              beforeDestroy(instance, options) {
                (0, _expect2.default)(false).toEqual(true, "beforeDestroy");
              }
            };
            _context10.t2 = {
              tableName: "tasks",
              hooks: _context10.t1
            };
            taskModel = {
              name: "Task",
              define: _context10.t0,
              options: _context10.t2
            };
            instance = new _sequelize2.default("database", "username", "password", {
              dialect: "sqlite",
              logging: false
            });

            (0, _index.connect)([taskModel], instance, {});
            _context10.next = 8;
            return instance.sync();

          case 8:
            _context10.next = 10;
            return (0, _index.createSchema)(instance);

          case 10:
            schema = _context10.sent;
            createMutation = `mutation {
      models {
        Task {
          create(input: {name: "CREATED"}) {
            id, 
            name
          }
        }
      }
    }`;
            _context10.next = 14;
            return (0, _graphql.graphql)(schema, createMutation, { req: "exists" });

          case 14:
            createResult = _context10.sent;

            (0, _utils.validateResult)(createResult);

          case 16:
          case "end":
            return _context10.stop();
        }
      }
    }, _callee10, undefined);
  })));
  it("update - hook variables {rootValue}", _asyncToGenerator(regeneratorRuntime.mark(function _callee11() {
    var taskModel, instance, Task, item, schema, updateMutation, updateResult;
    return regeneratorRuntime.wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            _context11.t0 = {
              name: {
                type: _sequelize2.default.STRING,
                allowNull: false
              }
            };
            _context11.t1 = {
              beforeFind(options) {
                (0, _expect2.default)(options.rootValue).toExist("rootValue is missing");
                (0, _expect2.default)(options.rootValue.req).toEqual("exists", `beforeFind: rootValue: {req: 'exists'} does not match. ${JSON.stringify(options.rootValue)}`);
                return undefined;
              },
              beforeUpdate(instance, options) {
                (0, _expect2.default)(options.rootValue).toExist("rootValue is missing");
                (0, _expect2.default)(options.rootValue.req).toEqual("exists", `beforeUpdate: rootValue: {req: 'exists'} does not match. ${JSON.stringify(options.rootValue)}`);
                return undefined;
              },
              beforeDestroy(instance, options) {
                (0, _expect2.default)(false).toEqual(true, "beforeDestroy");
              }
            };
            _context11.t2 = {
              tableName: "tasks",
              hooks: _context11.t1
            };
            taskModel = {
              name: "Task",
              define: _context11.t0,
              options: _context11.t2
            };
            instance = new _sequelize2.default("database", "username", "password", {
              dialect: "sqlite",
              logging: false
            });

            (0, _index.connect)([taskModel], instance, {});
            _context11.next = 8;
            return instance.sync();

          case 8:
            Task = instance.models.Task;
            _context11.next = 11;
            return Task.create({
              name: "item2"
            });

          case 11:
            item = _context11.sent;
            _context11.next = 14;
            return (0, _index.createSchema)(instance);

          case 14:
            schema = _context11.sent;
            updateMutation = `mutation {
      models {
        Task {
          update(id: ${item.id}, input: {name: "UPDATED"}) {
            id, 
            name
          }
        }
      }
    }`;
            _context11.next = 18;
            return (0, _graphql.graphql)(schema, updateMutation, { req: "exists" });

          case 18:
            updateResult = _context11.sent;

            (0, _utils.validateResult)(updateResult);

          case 20:
          case "end":
            return _context11.stop();
        }
      }
    }, _callee11, undefined);
  })));
  it("delete - hook variables {rootValue, context}", _asyncToGenerator(regeneratorRuntime.mark(function _callee12() {
    var taskModel, instance, Task, item, schema, deleteMutation, deleteResult;
    return regeneratorRuntime.wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            _context12.t0 = {
              name: {
                type: _sequelize2.default.STRING,
                allowNull: false
              }
            };
            _context12.t1 = {
              beforeFind(options) {
                (0, _expect2.default)(options.rootValue).toExist("rootValue  is missing");
                (0, _expect2.default)(options.rootValue.req).toEqual("exists", `beforeFind: rootValue: {req: 'exists'} does not match. ${JSON.stringify(options.rootValue)}`);
                return undefined;
              },
              beforeUpdate(instance, options) {
                (0, _expect2.default)(false).toEqual(true, "beforeUpdate");
              },
              beforeDestroy(instance, options) {
                (0, _expect2.default)(options.rootValue).toExist();
                (0, _expect2.default)(options.rootValue.req).toEqual("exists", `beforeDestroy: rootValue: {req: 'exists'} does not match. ${JSON.stringify(options.rootValue)}`);
                return undefined;
              }
            };
            _context12.t2 = {
              tableName: "tasks",
              hooks: _context12.t1
            };
            taskModel = {
              name: "Task",
              define: _context12.t0,
              options: _context12.t2
            };
            instance = new _sequelize2.default("database", "username", "password", {
              dialect: "sqlite",
              logging: false
            });

            (0, _index.connect)([taskModel], instance, {});
            _context12.next = 8;
            return instance.sync();

          case 8:
            Task = instance.models.Task;
            _context12.next = 11;
            return Task.create({
              name: "item2"
            });

          case 11:
            item = _context12.sent;
            _context12.next = 14;
            return (0, _index.createSchema)(instance);

          case 14:
            schema = _context12.sent;
            deleteMutation = `mutation {
      models {
        Task {
          delete(id: ${item.id}) {
            id
          }
        }
      }
    }`;
            _context12.next = 18;
            return (0, _graphql.graphql)(schema, deleteMutation, { req: "exists" });

          case 18:
            deleteResult = _context12.sent;

            (0, _utils.validateResult)(deleteResult);

          case 20:
          case "end":
            return _context12.stop();
        }
      }
    }, _callee12, undefined);
  })));
});
//# sourceMappingURL=mutation.test.js.map
