import expect from "expect";
import {createSqlInstance, validateResult} from "./utils";
import {graphql, subscribe, parse} from "graphql";
import {createSchema, connect} from "../index";
import Sequelize from "sequelize";
import {PubSub} from "graphql-subscriptions";
import {fromGlobalId} from "graphql-relay";

describe("subscriptions", () => {
  it("afterCreate", async() => {
    const pubsub = new PubSub();
    const sqlInstance = await createSqlInstance({subscriptions: {pubsub}});
    const {Task} = sqlInstance.models;
    const schema = await createSchema(sqlInstance);
    const document = parse("subscription X { afterCreateTask {id} }");
    const ai = await subscribe({schema, document});
    const result = await Promise.all([
      ai.next(),
      Task.create({
        name: "item1",
      }),
    ]);
    const gqlResult = result[0].value.data;
    expect(fromGlobalId(gqlResult.afterCreateTask.id).id).toEqual("1");

  });
  it("afterUpdate", async() => {
    const pubsub = new PubSub();
    const sqlInstance = await createSqlInstance({subscriptions: {pubsub}});
    const {Task} = sqlInstance.models;
    const task = await Task.create({
      name: "item1",
    });
    const schema = await createSchema(sqlInstance);
    const document = parse("subscription X { afterUpdateTask {id, name} }");
    const ai = await subscribe({schema, document});
    const result = await Promise.all([
      ai.next(),
      task.update({
        name: "UPDATED",
      }),
    ]);
    const gqlResult = result[0].value.data;
    expect(gqlResult.afterUpdateTask.name).toEqual("UPDATED");
  });
  it("afterDestroy", async() => {
    const pubsub = new PubSub();
    const sqlInstance = await createSqlInstance({subscriptions: {pubsub}});
    const {Task} = sqlInstance.models;
    const task = await Task.create({
      name: "item1",
    });

    const schema = await createSchema(sqlInstance);
    const document = parse("subscription X { afterDestroyTask {id} }");
    const ai = await subscribe({schema, document});
    const result = await Promise.all([
      ai.next(),
      task.destroy(),
    ]);
    const gqlResult = result[0].value.data;
    expect(fromGlobalId(gqlResult.afterDestroyTask.id).id).toEqual("1");
  });
  it("BUGFIX#12: testing for recursive calls on model events", async() => {
    try {
      let modelTimeout;
      let modelCount = 0;
      const taskModel = {
        name: "Task",
        define: {
          name: {
            type: Sequelize.STRING,
            allowNull: false,
          },
        },
        before({params}) {
          // return params;
          return new Promise((resolve, reject) => {
            try {
              modelCount++;
              expect(modelCount).toEqual(1);
              if (modelTimeout) {
                clearTimeout(modelTimeout);
              }
              modelTimeout = setTimeout(() => {
                return resolve(params);
              }, 100);
              return undefined;
            } catch (err) {
              console.log("BUGFIX#12 - err", err);//eslint-disable-line
              return reject(err);
            }
          });
        },
        options: {
          tableName: "tasks",
          hooks: {},
        },
      };

      const pubsub = new PubSub();
      let instance = new Sequelize("database", "username", "password", {
        dialect: "sqlite",
        logging: false,
      });
      const models = [taskModel];
      connect(models, instance, {subscriptions: {pubsub}});
      await instance.sync();
      const schema = await createSchema(instance);
      const document = parse("subscription X { afterCreateTask {id} }");
      const ai = await subscribe({schema, document});

      const mutation = `mutation {
        models {
          Task(create: {
            name: "test"
          }) {
            id
          }
        }
      }`;
      const mutationResult = await graphql(schema, mutation);
      validateResult(mutationResult);
      const result = await ai.next();
      const gqlResult = result.value.data;
      expect(fromGlobalId(gqlResult.afterCreateTask.id).id).toEqual("1");

    } catch (er) {
      console.log("BUGFIX#12 - err", er);
    }
  });
});
