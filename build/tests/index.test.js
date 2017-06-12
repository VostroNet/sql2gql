"use strict";

var _expect = require("expect");

var _expect2 = _interopRequireDefault(_expect);

var _sequelize = require("sequelize");

var _sequelize2 = _interopRequireDefault(_sequelize);

var _sourceMapSupport = require("source-map-support");

var _sourceMapSupport2 = _interopRequireDefault(_sourceMapSupport);

var _graphql = require("graphql");

var _logger = require("../utils/logger");

var _logger2 = _interopRequireDefault(_logger);

var _index = require("../index");

var _task = require("./models/task");

var _task2 = _interopRequireDefault(_task);

var _taskItem = require("./models/task-item");

var _taskItem2 = _interopRequireDefault(_taskItem);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }
// import deepFreeze from "deep-freeze";


_sourceMapSupport2.default.install();

var log = (0, _logger2.default)("seeql::tests:index:");

var schemas = [_task2.default, _taskItem2.default];

function createSqlInstance() {
  var instance = new _sequelize2.default("database", "username", "password", {
    dialect: "sqlite"
  });
  (0, _index.connect)(schemas, instance, {});
  return instance.sync().then(function () {
    return instance;
  });
}

describe("index test", function () {
  it("basic query test", _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
    var instance, Task, items, schema, result;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return createSqlInstance();

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
            items = _context.sent;
            schema = (0, _index.createSchema)(instance);
            _context.next = 10;
            return (0, _graphql.graphql)(schema, "query { models { Task { id, name } } }");

          case 10:
            result = _context.sent;
            return _context.abrupt("return", (0, _expect2.default)(result.data.models.Task.length).toEqual(3));

          case 12:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, undefined);
  })));
  it("basic update test", _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
    var instance, Task, item, schema, mutation, result;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return createSqlInstance();

          case 2:
            instance = _context2.sent;
            Task = instance.models.Task;
            _context2.next = 6;
            return Task.create({
              name: "item2"
            });

          case 6:
            item = _context2.sent;
            schema = (0, _index.createSchema)(instance);
            mutation = "mutation {\n      Task {\n        update(id: " + item.id + ", input: {name: \"UPDATED\"}) {\n          id, \n          name\n        }\n      }\n    }";
            _context2.next = 11;
            return (0, _graphql.graphql)(schema, mutation);

          case 11:
            result = _context2.sent;
            return _context2.abrupt("return", (0, _expect2.default)(result.data.Task.update.name).toEqual("UPDATED"));

          case 13:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  })));
  it("basic delete test", _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
    var instance, Task, item, schema, mutation, result, query, queryResult;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return createSqlInstance();

          case 2:
            instance = _context3.sent;
            Task = instance.models.Task;
            _context3.next = 6;
            return Task.create({
              name: "item2"
            });

          case 6:
            item = _context3.sent;
            schema = (0, _index.createSchema)(instance);
            mutation = "mutation {\n      Task {\n        delete(id: " + item.id + ")\n      }\n    }";
            _context3.next = 11;
            return (0, _graphql.graphql)(schema, mutation);

          case 11:
            result = _context3.sent;

            (0, _expect2.default)(result.data.Task.delete).toEqual(true);
            // console.log("delete result", result);
            query = "query { models { Task(where: {id: " + item.id + "}) { id, name } } }";
            _context3.next = 16;
            return (0, _graphql.graphql)(schema, query);

          case 16:
            queryResult = _context3.sent;
            return _context3.abrupt("return", (0, _expect2.default)(queryResult.data.models.Task.length).toEqual(0));

          case 18:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  })));
  it("basic update all test", _asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
    var instance, Task, items, schema, mutation, result, item2Result, item3Result;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return createSqlInstance();

          case 2:
            instance = _context4.sent;
            Task = instance.models.Task;
            _context4.next = 6;
            return Promise.all([Task.create({
              name: "item1"
            }), Task.create({
              name: "item2"
            }), Task.create({
              name: "item3"
            })]);

          case 6:
            items = _context4.sent;
            schema = (0, _index.createSchema)(instance);
            mutation = "mutation {\n      Task {\n        updateAll(where: {name: {in: [\"item2\", \"item3\"]}}, input: {name: \"UPDATED\"}) {\n          id, \n          name\n        }\n      }\n    }";
            _context4.next = 11;
            return (0, _graphql.graphql)(schema, mutation);

          case 11:
            result = _context4.sent;
            _context4.next = 14;
            return (0, _graphql.graphql)(schema, "query { models { Task(where: {id: " + items[1].id + "}) { id, name } } }");

          case 14:
            item2Result = _context4.sent;
            _context4.next = 17;
            return (0, _graphql.graphql)(schema, "query { models { Task(where: {id: " + items[2].id + "}) { id, name } } }");

          case 17:
            item3Result = _context4.sent;

            (0, _expect2.default)(item2Result.data.models.Task[0].name).toEqual("UPDATED");
            (0, _expect2.default)(item2Result.data.models.Task[0].name).toEqual("UPDATED");

          case 20:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  })));
  it("basic delete all test", _asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
    var instance, Task, items, schema, mutation, result, queryResults;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 2;
            return createSqlInstance();

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
            schema = (0, _index.createSchema)(instance);
            mutation = "mutation {\n      Task {\n        deleteAll(where: {name: {in: [\"item2\", \"item3\"]}})\n      }\n    }";
            _context5.next = 11;
            return (0, _graphql.graphql)(schema, mutation);

          case 11:
            result = _context5.sent;

            // console.log("result", result.data);
            (0, _expect2.default)(result.data.Task.deleteAll.length).toEqual(2);
            _context5.next = 15;
            return (0, _graphql.graphql)(schema, "query { models { Task { id, name } } }");

          case 15:
            queryResults = _context5.sent;

            // console.log("queryResults", queryResults.data.models.Task);
            (0, _expect2.default)(queryResults.data.models.Task.length).toEqual(1);

          case 17:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, undefined);
  })));
  // it("basic delete test", async () => {
  //   const instance = await createSqlInstance();
  //   const {Task} = instance.models;
  //   const item = await Task.create({
  //     name: "item2",
  //   });
  //   const schema = createSchema(instance);

  //   const mutation = `mutation {
  //     Task {
  //       delete(id: ${item.id})
  //     }
  //   }`
  //   const result = await graphql(schema, mutation);
  //   expect(result.data.Task.delete).toEqual(true);
  //   // console.log("delete result", result);
  //   const query = `query { models { Task(where: {id: ${item.id}}) { id, name } } }`;
  //   const queryResult = await graphql(schema, query);
  //   // console.log("query result", queryResult);
  //   return expect(queryResult.data.models.Task.length).toEqual(0);
  // });
});

// function createInstance() {
//   const {host, username, password, database, debug, dialect, pool, sync} = config.database;
//   const db = new Sequelize(database, username, password, {
//     host: host,
//     dialect: dialect,
//     logging: (args) => {
//       if (debug) {
//         log.info(args);
//       }
//     },
//     pool: Object.assign({}, pool, {
//       max: 20,
//       min: 0,
//       idle: 10000,
//     }),
//     paranoid: true,
//     timestamps: true,
//   });
//   let models = loadSchemas(db);
//   db.models = models;
//   return db.sync(sync);
// }


// let instance;
// export function getDatabase() {
//   if (instance) {
//     return Promise.resolve(instance);
//   }
//   return createInstance().then((db) => {
//     instance = db;
//     return instance;
//   });
// }
//# sourceMappingURL=index.test.js.map
