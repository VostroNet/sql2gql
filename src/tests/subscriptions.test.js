import expect from "expect";
import {createSqlInstance, validateResult} from "./utils";
// import {graphql, execute, subscribe} from "graphql";
import {createSchema} from "../index";

import {PubSub, SubscriptionManager} from "graphql-subscriptions";


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
});
