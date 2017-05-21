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
  it("basic query test", function () {
    return createSqlInstance().then(function (instance) {
      var Task = instance.models.Task;

      return Promise.all([Task.create({
        name: "item1"
      }), Task.create({
        name: "item2"
      }), Task.create({
        name: "item3"
      })]).then(function () {
        var schema = (0, _index.createSchema)(instance);
        return (0, _graphql.graphql)(schema, "query { models { Task { id, name } } }").then(function (result) {
          return (0, _expect2.default)(result.data.models.Task.length).toEqual(3);
        });
      });
    });
  });
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
