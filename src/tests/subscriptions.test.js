import expect from "expect";
import {createSqlInstance, validateResult} from "./utils";
// import {graphql, execute, subscribe} from "graphql";
import {createSchema, connect} from "../index";

import Sequelize from "sequelize";

import {PubSub, SubscriptionManager} from "graphql-subscriptions";

import {graphql} from "graphql";

describe("subscriptions", () => {
  it("afterCreate", async() => {
    const pubsub = new PubSub();
    const instance = await createSqlInstance({subscriptions: {pubsub}});
    const schema = await createSchema(instance);
    const subManager = new SubscriptionManager({pubsub, schema});
    const query = "subscription X { afterCreateTask {id} }";
    await new Promise((resolve, reject) => {
      subManager.subscribe({
        query,
        operationName: "X",
        callback(args, result) {
          try {
            validateResult(result);
            const {data: {afterCreateTask}} = result;
            expect(afterCreateTask.id).toEqual(1);
            return resolve();
          } catch (err) {
            return reject(err);
          }
        },
      });
      const {Task} = instance.models;
      Task.create({
        name: "item1",
      });
    });
  });
  it("afterUpdate", async() => {
    const pubsub = new PubSub();
    const sqlInstance = await createSqlInstance({subscriptions: {pubsub}});
    const schema = await createSchema(sqlInstance);
    const subManager = new SubscriptionManager({pubsub, schema});
    const query = "subscription X { afterUpdateTask {id, name} }";
    const {Task} = sqlInstance.models;

    const task = await Task.create({
      name: "item1",
    });

    await new Promise((resolve, reject) => {
      subManager.subscribe({
        query,
        operationName: "X",
        callback(args, result) {
          try {
            validateResult(result);
            const {data: {afterUpdateTask}} = result;
            expect(afterUpdateTask.name).toEqual("UPDATED");
            return resolve();
          } catch (err) {
            return reject(err);
          }
        },
      });
      task.update({
        name: "UPDATED",
      });
    });
  });
  it("afterDestroy", async() => {
    const pubsub = new PubSub();
    const sqlInstance = await createSqlInstance({subscriptions: {pubsub}});
    const schema = await createSchema(sqlInstance);
    const subManager = new SubscriptionManager({pubsub, schema});
    const query = "subscription X { afterDestroyTask {id} }";
    const {Task} = sqlInstance.models;

    const task = await Task.create({
      name: "item1",
    });

    await new Promise((resolve, reject) => {
      subManager.subscribe({
        query,
        operationName: "X",
        callback(args, result) {
          try {
            validateResult(result);
            const {data: {afterDestroyTask}} = result;
            expect(afterDestroyTask.id).toEqual(1);
            return resolve();
          } catch (err) {
            return reject(err);
          }
        },
      });
      task.destroy();
    });
  });
  it("BUGFIX#12: create testing for recursive calls on after functions", async() => {
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
            console.log("errr", err);
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
    const subManager = new SubscriptionManager({pubsub, schema});
    const query = "subscription X { afterCreateTask {id} }";
    await new Promise(async(resolve, reject) => {
      subManager.subscribe({
        query,
        operationName: "X",
        callback(args, result) {
          try {
            validateResult(result);
            const {data: {afterCreateTask}} = result;
            expect(afterCreateTask.id).toEqual(1);
            // expect(subCount).toEqual(1);
            return resolve();
          } catch (err) {
            return reject(err);
          }
        },
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
      const mutationResult = await graphql(schema, mutation);
      validateResult(mutationResult);
    });
  });

});
