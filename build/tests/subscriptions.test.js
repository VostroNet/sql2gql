"use strict";

var _expect = _interopRequireDefault(require("expect"));

var _utils = require("./utils");

var _graphql = require("graphql");

var _index = require("../index");

var _sequelize = _interopRequireDefault(require("sequelize"));

var _graphqlSubscriptions = require("graphql-subscriptions");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe("subscriptions", () => {
  it("afterCreate", async () => {
    const pubsub = new _graphqlSubscriptions.PubSub();
    const sqlInstance = await (0, _utils.createSqlInstance)({
      subscriptions: {
        pubsub
      }
    });
    const {
      Task
    } = sqlInstance.models;
    const schema = await (0, _index.createSchema)(sqlInstance);
    const document = (0, _graphql.parse)("subscription X { afterCreateTask {id} }");
    const ai = await (0, _graphql.subscribe)({
      schema,
      document
    });
    const result = await Promise.all([ai.next(), Task.create({
      name: "item1"
    })]);
    const gqlResult = result[0].value.data;
    (0, _expect.default)(gqlResult.afterCreateTask.id).toEqual(1);
  });
  it("afterUpdate", async () => {
    const pubsub = new _graphqlSubscriptions.PubSub();
    const sqlInstance = await (0, _utils.createSqlInstance)({
      subscriptions: {
        pubsub
      }
    });
    const {
      Task
    } = sqlInstance.models;
    const task = await Task.create({
      name: "item1"
    });
    const schema = await (0, _index.createSchema)(sqlInstance);
    const document = (0, _graphql.parse)("subscription X { afterUpdateTask {id, name} }");
    const ai = await (0, _graphql.subscribe)({
      schema,
      document
    });
    const result = await Promise.all([ai.next(), task.update({
      name: "UPDATED"
    })]);
    const gqlResult = result[0].value.data;
    (0, _expect.default)(gqlResult.afterUpdateTask.name).toEqual("UPDATED");
  });
  it("afterDestroy", async () => {
    const pubsub = new _graphqlSubscriptions.PubSub();
    const sqlInstance = await (0, _utils.createSqlInstance)({
      subscriptions: {
        pubsub
      }
    });
    const {
      Task
    } = sqlInstance.models;
    const task = await Task.create({
      name: "item1"
    });
    const schema = await (0, _index.createSchema)(sqlInstance);
    const document = (0, _graphql.parse)("subscription X { afterDestroyTask {id} }");
    const ai = await (0, _graphql.subscribe)({
      schema,
      document
    });
    const result = await Promise.all([ai.next(), task.destroy()]);
    const gqlResult = result[0].value.data;
    (0, _expect.default)(gqlResult.afterDestroyTask.id).toEqual(1);
  });
  it("BUGFIX#12: testing for recursive calls on model events", async () => {
    let modelTimeout;
    let modelCount = 0;
    const taskModel = {
      name: "Task",
      define: {
        name: {
          type: _sequelize.default.STRING,
          allowNull: false
        }
      },

      before({
        params
      }) {
        // return params;
        return new Promise((resolve, reject) => {
          try {
            modelCount++;
            (0, _expect.default)(modelCount).toEqual(1);

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
    let instance = new _sequelize.default("database", "username", "password", {
      dialect: "sqlite",
      logging: false
    });
    const models = [taskModel];
    (0, _index.connect)(models, instance, {
      subscriptions: {
        pubsub
      }
    });
    await instance.sync();
    const schema = await (0, _index.createSchema)(instance);
    const document = (0, _graphql.parse)("subscription X { afterCreateTask {id} }");
    const ai = await (0, _graphql.subscribe)({
      schema,
      document
    });
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
    const result = await Promise.all([ai.next(), await (0, _graphql.graphql)(schema, mutation)]);
    const gqlResult = result[0].value.data;
    (0, _expect.default)(gqlResult.afterCreateTask.id).toEqual(1);
    const mutationResult = result[1];
    (0, _utils.validateResult)(mutationResult);
  });
});
//# sourceMappingURL=subscriptions.test.js.map
