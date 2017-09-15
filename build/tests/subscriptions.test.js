"use strict";

var _expect = require("expect");

var _expect2 = _interopRequireDefault(_expect);

var _utils = require("./utils");

var _graphql = require("graphql");

var _index = require("../index");

var _sequelize = require("sequelize");

var _sequelize2 = _interopRequireDefault(_sequelize);

var _graphqlSubscriptions = require("graphql-subscriptions");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

describe("subscriptions", () => {
  it("afterCreate", _asyncToGenerator(function* () {
    const pubsub = new _graphqlSubscriptions.PubSub();
    const sqlInstance = yield (0, _utils.createSqlInstance)({ subscriptions: { pubsub } });
    const { Task } = sqlInstance.models;
    const schema = yield (0, _index.createSchema)(sqlInstance);
    const document = (0, _graphql.parse)("subscription X { afterCreateTask {id} }");
    const ai = yield (0, _graphql.subscribe)({ schema, document });
    const result = yield Promise.all([ai.next(), Task.create({
      name: "item1"
    })]);
    const gqlResult = result[0].value.data;
    (0, _expect2.default)(gqlResult.afterCreateTask.id).toEqual(1);
  }));
  it("afterUpdate", _asyncToGenerator(function* () {
    const pubsub = new _graphqlSubscriptions.PubSub();
    const sqlInstance = yield (0, _utils.createSqlInstance)({ subscriptions: { pubsub } });
    const { Task } = sqlInstance.models;
    const task = yield Task.create({
      name: "item1"
    });
    const schema = yield (0, _index.createSchema)(sqlInstance);
    const document = (0, _graphql.parse)("subscription X { afterUpdateTask {id, name} }");
    const ai = yield (0, _graphql.subscribe)({ schema, document });
    const result = yield Promise.all([ai.next(), task.update({
      name: "UPDATED"
    })]);
    const gqlResult = result[0].value.data;
    (0, _expect2.default)(gqlResult.afterUpdateTask.name).toEqual("UPDATED");
  }));
  it("afterDestroy", _asyncToGenerator(function* () {
    const pubsub = new _graphqlSubscriptions.PubSub();
    const sqlInstance = yield (0, _utils.createSqlInstance)({ subscriptions: { pubsub } });
    const { Task } = sqlInstance.models;
    const task = yield Task.create({
      name: "item1"
    });

    const schema = yield (0, _index.createSchema)(sqlInstance);
    const document = (0, _graphql.parse)("subscription X { afterDestroyTask {id} }");
    const ai = yield (0, _graphql.subscribe)({ schema, document });
    const result = yield Promise.all([ai.next(), task.destroy()]);
    const gqlResult = result[0].value.data;
    (0, _expect2.default)(gqlResult.afterDestroyTask.id).toEqual(1);
  }));
  it("BUGFIX#12: testing for recursive calls on model events", _asyncToGenerator(function* () {
    let modelTimeout;
    let modelCount = 0;
    const taskModel = {
      name: "Task",
      define: {
        name: {
          type: _sequelize2.default.STRING,
          allowNull: false
        }
      },
      before({ params }) {
        // return params;
        return new Promise((resolve, reject) => {
          try {
            modelCount++;
            (0, _expect2.default)(modelCount).toEqual(1);
            if (modelTimeout) {
              clearTimeout(modelTimeout);
            }
            modelTimeout = setTimeout(() => {
              return resolve(params);
            }, 100);
            return undefined;
          } catch (err) {
            console.log("BUGFIX#12 - err", err); //eslint-disable-line
            return reject(err);
          }
        });
      },
      options: {
        tableName: "tasks",
        hooks: {}
      }
    };
    const pubsub = new _graphqlSubscriptions.PubSub();
    let instance = new _sequelize2.default("database", "username", "password", {
      dialect: "sqlite",
      logging: false
    });
    const models = [taskModel];
    (0, _index.connect)(models, instance, { subscriptions: { pubsub } });
    yield instance.sync();
    const schema = yield (0, _index.createSchema)(instance);
    const document = (0, _graphql.parse)("subscription X { afterCreateTask {id} }");
    const ai = yield (0, _graphql.subscribe)({ schema, document });

    const mutation = `mutation {
      models {
        Task {
          create(input: {name: "item1"}) {
            id, 
            name
          }
        }
      }
    }`;

    const result = yield Promise.all([ai.next(), yield (0, _graphql.graphql)(schema, mutation)]);
    const gqlResult = result[0].value.data;
    (0, _expect2.default)(gqlResult.afterCreateTask.id).toEqual(1);
    const mutationResult = result[1];
    (0, _utils.validateResult)(mutationResult);
  }));
});
//# sourceMappingURL=subscriptions.test.js.map
