import expect from "expect";
// import deepFreeze from "deep-freeze";
import Sequelize from "sequelize";
import sourceMapSupport from "source-map-support";
sourceMapSupport.install();

import {graphql} from "graphql";

import logger from "utils/logger";
const log = logger("seeql::tests:index:");

import {connect, createSchema} from "../index";
import TaskModel from "./models/task";
import TaskItemModel from "./models/task-item";

const schemas = [TaskModel, TaskItemModel];

function createSqlInstance() {
  let instance = new Sequelize("database", "username", "password", {
    dialect: "sqlite",
  });
  connect(schemas, instance, {});
  return instance.sync().then(() => instance);
}


describe("index test", () => {
  it("basic query test", async() => {
    const instance = await createSqlInstance();
    const {Task} = instance.models;
    const items = await Promise.all([
      Task.create({
        name: "item1",
      }),
      Task.create({
        name: "item2",
      }),
      Task.create({
        name: "item3",
      }),
    ]);
    const schema = createSchema(instance);
    const result = await graphql(schema, "query { models { Task { id, name } } }");
    return expect(result.data.models.Task.length).toEqual(3);
  });
  it("basic update test", async() => {
    const instance = await createSqlInstance();
    const {Task} = instance.models;
    const item = await Task.create({
      name: "item2",
    });
    const schema = createSchema(instance);

    const mutation = `mutation {
      Task {
        update(id: ${item.id}, input: {name: "UPDATED"}) {
          id, 
          name
        }
      }
    }`;
    const result = await graphql(schema, mutation);
    return expect(result.data.Task.update.name).toEqual("UPDATED");
  });
  it("basic delete test", async() => {
    const instance = await createSqlInstance();
    const {Task} = instance.models;
    const item = await Task.create({
      name: "item2",
    });
    const schema = createSchema(instance);

    const mutation = `mutation {
      Task {
        delete(id: ${item.id})
      }
    }`;
    const result = await graphql(schema, mutation);
    expect(result.data.Task.delete).toEqual(true);
    // console.log("delete result", result);
    const query = `query { models { Task(where: {id: ${item.id}}) { id, name } } }`;
    const queryResult = await graphql(schema, query);
    // console.log("query result", queryResult);
    return expect(queryResult.data.models.Task.length).toEqual(0);
  });
  it("basic update all test", async() => {
    const instance = await createSqlInstance();
    const {Task} = instance.models;
    const items = await Promise.all([
      Task.create({
        name: "item1",
      }),
      Task.create({
        name: "item2",
      }),
      Task.create({
        name: "item3",
      }),
    ]);
    const schema = createSchema(instance);
    const mutation = `mutation {
      Task {
        updateAll(where: {name: {in: ["item2", "item3"]}}, input: {name: "UPDATED"}) {
          id, 
          name
        }
      }
    }`;
    const result = await graphql(schema, mutation);
    const item2Result = await graphql(schema, `query { models { Task(where: {id: ${items[1].id}}) { id, name } } }`);
    const item3Result = await graphql(schema, `query { models { Task(where: {id: ${items[2].id}}) { id, name } } }`);
    expect(item2Result.data.models.Task[0].name).toEqual("UPDATED");
    expect(item2Result.data.models.Task[0].name).toEqual("UPDATED");
  });
  it("basic delete all test", async() => {
    const instance = await createSqlInstance();
    const {Task} = instance.models;
    const items = await Promise.all([
      Task.create({
        name: "item1",
      }),
      Task.create({
        name: "item2",
      }),
      Task.create({
        name: "item3",
      }),
    ]);
    const schema = createSchema(instance);
    const mutation = `mutation {
      Task {
        deleteAll(where: {name: {in: ["item2", "item3"]}})
      }
    }`;
    const result = await graphql(schema, mutation);
    // console.log("result", result.data);
    expect(result.data.Task.deleteAll.length).toEqual(2);
    const queryResults = await graphql(schema, "query { models { Task { id, name } } }");
    // console.log("queryResults", queryResults.data.models.Task);
    expect(queryResults.data.models.Task.length).toEqual(1);
  });
  it("basic classMethod test", async() => {
    const instance = await createSqlInstance();
    const {Task} = instance.models;
    const item = await Task.create({
      name: "item2",
    });
    const schema = createSchema(instance);

    const query = `query {
      classMethods {
        Task {
          getHiddenData {
            hidden
          }
        }
      }
    }`;
    const result = await graphql(schema, query);
    return expect(result.data.classMethods.Task.getHiddenData.hidden).toEqual("Hi");
  });
  it("mutation classMethod test", async() => {
    const instance = await createSqlInstance();
    const {Task} = instance.models;
    const item = await Task.create({
      name: "item2",
    });
    const schema = createSchema(instance);

    const mutation = `mutation {
      Task {
        reverseName(input: {amount: 2}) {
          name
        }
      }
    }`;
    const result = await graphql(schema, mutation);
    console.log("result", result);
    return expect(result.data.Task.reverseName.name).toEqual("reverseName2");
  });
});
