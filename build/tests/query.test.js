"use strict";

var _expect = require("expect");

var _expect2 = _interopRequireDefault(_expect);

var _utils = require("./utils");

var _graphql = require("graphql");

var _index = require("../index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

describe("queries", function () {
  it("basic", _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
    var instance, Task, schema, result;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _utils.createSqlInstance)();

          case 2:
            instance = _context.sent;
            Task = instance.models.Task;
            _context.next = 6;
            return Promise.all([Task.create({
              name: "item1"
            }), Task.create({
              name: "item2"
            }), Task.create({
              name: "item3"
            })]);

          case 6:
            _context.next = 8;
            return (0, _index.createSchema)(instance);

          case 8:
            schema = _context.sent;
            _context.next = 11;
            return (0, _graphql.graphql)(schema, "query { models { Task { id, name } } }");

          case 11:
            result = _context.sent;

            (0, _utils.validateResult)(result);
            return _context.abrupt("return", (0, _expect2.default)(result.data.models.Task.length).toEqual(3));

          case 14:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, undefined);
  })));
  it("classMethod", _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
    var instance, schema, query, result;
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
            query = `query {
      classMethods {
        Task {
          getHiddenData {
            hidden
          }
        }
      }
    }`;
            _context2.next = 9;
            return (0, _graphql.graphql)(schema, query);

          case 9:
            result = _context2.sent;

            (0, _utils.validateResult)(result);
            return _context2.abrupt("return", (0, _expect2.default)(result.data.classMethods.Task.getHiddenData.hidden).toEqual("Hi"));

          case 12:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  })));
  it("override", _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
    var instance, schema, Task, result;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return (0, _utils.createSqlInstance)();

          case 2:
            instance = _context3.sent;
            _context3.next = 5;
            return (0, _index.createSchema)(instance);

          case 5:
            schema = _context3.sent;
            Task = instance.models.Task;
            _context3.next = 9;
            return Task.create({
              name: "item1",
              options: JSON.stringify({ "hidden": "invisibot" })
            });

          case 9:
            _context3.next = 11;
            return (0, _graphql.graphql)(schema, "query { models { Task { id, name, options {hidden} } } }");

          case 11:
            result = _context3.sent;

            (0, _utils.validateResult)(result);
            // console.log("result", result.data.models.Task[0]);
            return _context3.abrupt("return", (0, _expect2.default)(result.data.models.Task[0].options.hidden).toEqual("invisibot"));

          case 14:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  })));

  it("filter hooks", _asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
    var instance, _instance$models, Task, TaskItem, model, schema, result;

    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return (0, _utils.createSqlInstance)();

          case 2:
            instance = _context4.sent;
            _instance$models = instance.models, Task = _instance$models.Task, TaskItem = _instance$models.TaskItem;
            _context4.next = 6;
            return Task.create({
              name: "item1"
            });

          case 6:
            model = _context4.sent;
            _context4.next = 9;
            return TaskItem.create({
              name: "filterMe",
              taskId: model.get("id")
            });

          case 9:
            _context4.next = 11;
            return (0, _index.createSchema)(instance);

          case 11:
            schema = _context4.sent;
            _context4.next = 14;
            return (0, _graphql.graphql)(schema, "query { models { Task { id, name, items {id} } } }", { filterName: "filterMe" });

          case 14:
            result = _context4.sent;

            (0, _utils.validateResult)(result);
            return _context4.abrupt("return", (0, _expect2.default)(result.data.models.Task[0].items.length).toEqual(0));

          case 17:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  })));
});
//# sourceMappingURL=query.test.js.map
