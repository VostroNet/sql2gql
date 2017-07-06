"use strict";

var _expect = require("expect");

var _expect2 = _interopRequireDefault(_expect);

var _utils = require("./utils");

var _index = require("../index");

var _graphqlSubscriptions = require("graphql-subscriptions");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }
// import {graphql, execute, subscribe} from "graphql";


describe("subscriptions", () => {
  it("afterCreate", _asyncToGenerator(function* () {
    const pubsub = new _graphqlSubscriptions.PubSub();
    const instance = yield (0, _utils.createSqlInstance)({ subscriptions: { pubsub } });
    const schema = yield (0, _index.createSchema)(instance);
    const subManager = new _graphqlSubscriptions.SubscriptionManager({ pubsub, schema });
    const query = "subscription X { afterCreateTask {id} }";
    yield new Promise(function (resolve, reject) {
      subManager.subscribe({
        query,
        operationName: "X",
        callback(args, result) {
          try {
            (0, _utils.validateResult)(result);
            const { data: { afterCreateTask } } = result;
            (0, _expect2.default)(afterCreateTask.id).toEqual(1);
            return resolve();
          } catch (err) {
            return reject(err);
          }
        }
      });
      const { Task } = instance.models;
      Task.create({
        name: "item1"
      });
    });
  }));
  it("afterUpdate", _asyncToGenerator(function* () {
    const pubsub = new _graphqlSubscriptions.PubSub();
    const sqlInstance = yield (0, _utils.createSqlInstance)({ subscriptions: { pubsub } });
    const schema = yield (0, _index.createSchema)(sqlInstance);
    const subManager = new _graphqlSubscriptions.SubscriptionManager({ pubsub, schema });
    const query = "subscription X { afterUpdateTask {id, name} }";
    const { Task } = sqlInstance.models;

    const task = yield Task.create({
      name: "item1"
    });

    yield new Promise(function (resolve, reject) {
      subManager.subscribe({
        query,
        operationName: "X",
        callback(args, result) {
          try {
            (0, _utils.validateResult)(result);
            const { data: { afterUpdateTask } } = result;
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
  }));
  it("afterDestroy", _asyncToGenerator(function* () {
    const pubsub = new _graphqlSubscriptions.PubSub();
    const sqlInstance = yield (0, _utils.createSqlInstance)({ subscriptions: { pubsub } });
    const schema = yield (0, _index.createSchema)(sqlInstance);
    const subManager = new _graphqlSubscriptions.SubscriptionManager({ pubsub, schema });
    const query = "subscription X { afterDestroyTask {id} }";
    const { Task } = sqlInstance.models;

    const task = yield Task.create({
      name: "item1"
    });

    yield new Promise(function (resolve, reject) {
      subManager.subscribe({
        query,
        operationName: "X",
        callback(args, result) {
          try {
            (0, _utils.validateResult)(result);
            const { data: { afterDestroyTask } } = result;
            (0, _expect2.default)(afterDestroyTask.id).toEqual(1);
            return resolve();
          } catch (err) {
            return reject(err);
          }
        }
      });
      task.destroy();
    });
  }));
});
//# sourceMappingURL=subscriptions.test.js.map
