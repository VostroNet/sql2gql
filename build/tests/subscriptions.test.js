"use strict";

var _expect = require("expect");

var _expect2 = _interopRequireDefault(_expect);

var _utils = require("./utils");

var _index = require("../index");

var _graphqlSubscriptions = require("graphql-subscriptions");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }
// import {graphql, execute, subscribe} from "graphql";


describe("subscriptions", function () {
  it("afterCreate", _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
    var pubsub, instance, schema, subManager, query;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            pubsub = new _graphqlSubscriptions.PubSub();
            _context.next = 3;
            return (0, _utils.createSqlInstance)({ subscriptions: { pubsub } });

          case 3:
            instance = _context.sent;
            _context.next = 6;
            return (0, _index.createSchema)(instance);

          case 6:
            schema = _context.sent;
            subManager = new _graphqlSubscriptions.SubscriptionManager({ pubsub, schema });
            query = "subscription X { afterCreateTask {id} }";
            _context.next = 11;
            return new Promise(function (resolve, reject) {
              subManager.subscribe({
                query,
                operationName: "X",
                callback(args, result) {
                  try {
                    (0, _utils.validateResult)(result);
                    var afterCreateTask = result.data.afterCreateTask;

                    (0, _expect2.default)(afterCreateTask.id).toEqual(1);
                    return resolve();
                  } catch (err) {
                    return reject(err);
                  }
                }
              });
              var Task = instance.models.Task;

              Task.create({
                name: "item1"
              });
            });

          case 11:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, undefined);
  })));
  it("afterUpdate", _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
    var pubsub, sqlInstance, schema, subManager, query, Task, task;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            pubsub = new _graphqlSubscriptions.PubSub();
            _context2.next = 3;
            return (0, _utils.createSqlInstance)({ subscriptions: { pubsub } });

          case 3:
            sqlInstance = _context2.sent;
            _context2.next = 6;
            return (0, _index.createSchema)(sqlInstance);

          case 6:
            schema = _context2.sent;
            subManager = new _graphqlSubscriptions.SubscriptionManager({ pubsub, schema });
            query = "subscription X { afterUpdateTask {id, name} }";
            Task = sqlInstance.models.Task;
            _context2.next = 12;
            return Task.create({
              name: "item1"
            });

          case 12:
            task = _context2.sent;
            _context2.next = 15;
            return new Promise(function (resolve, reject) {
              subManager.subscribe({
                query,
                operationName: "X",
                callback(args, result) {
                  try {
                    (0, _utils.validateResult)(result);
                    var afterUpdateTask = result.data.afterUpdateTask;

                    (0, _expect2.default)(afterUpdateTask.name).toEqual("UPDATED");
                    return resolve();
                  } catch (err) {
                    return reject(err);
                  }
                }
              });
              task.update({
                name: "UPDATED"
              });
            });

          case 15:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  })));
  it("afterDestroy", _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
    var pubsub, sqlInstance, schema, subManager, query, Task, task;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            pubsub = new _graphqlSubscriptions.PubSub();
            _context3.next = 3;
            return (0, _utils.createSqlInstance)({ subscriptions: { pubsub } });

          case 3:
            sqlInstance = _context3.sent;
            _context3.next = 6;
            return (0, _index.createSchema)(sqlInstance);

          case 6:
            schema = _context3.sent;
            subManager = new _graphqlSubscriptions.SubscriptionManager({ pubsub, schema });
            query = "subscription X { afterDestroyTask {id} }";
            Task = sqlInstance.models.Task;
            _context3.next = 12;
            return Task.create({
              name: "item1"
            });

          case 12:
            task = _context3.sent;
            _context3.next = 15;
            return new Promise(function (resolve, reject) {
              subManager.subscribe({
                query,
                operationName: "X",
                callback(args, result) {
                  try {
                    (0, _utils.validateResult)(result);
                    var afterDestroyTask = result.data.afterDestroyTask;

                    (0, _expect2.default)(afterDestroyTask.id).toEqual(1);
                    return resolve();
                  } catch (err) {
                    return reject(err);
                  }
                }
              });
              task.destroy();
            });

          case 15:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  })));
});
//# sourceMappingURL=subscriptions.test.js.map
