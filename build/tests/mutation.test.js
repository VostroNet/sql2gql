"use strict";

var _expect = require("expect");

var _expect2 = _interopRequireDefault(_expect);

var _utils = require("./utils");

var _graphql = require("graphql");

var _index = require("../index");

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
});
//# sourceMappingURL=mutation.test.js.map
