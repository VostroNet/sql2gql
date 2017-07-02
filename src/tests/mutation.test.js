import expect from "expect";
import {createSqlInstance} from "./utils";
import {graphql} from "graphql";

// import logger from "utils/logger";
// const log = logger("seeql::tests:query:");

import {createSchema} from "../index";


describe("mutations", () => {
  it("update", async() => {
    const instance = await createSqlInstance();
    const {Task} = instance.models;
    const item = await Task.create({
      name: "item2",
    });
    const schema = await createSchema(instance);

    const mutation = `mutation {
      models {
        Task {
          update(id: ${item.id}, input: {name: "UPDATED"}) {
            id, 
            name
          }
        }
      }
    }`;
    const result = await graphql(schema, mutation);
    return expect(result.data.models.Task.update.name).toEqual("UPDATED");
  });
  it("delete", async() => {
    const instance = await createSqlInstance();
    const {Task} = instance.models;
    const item = await Task.create({
      name: "item2",
    });
    const schema = await createSchema(instance);

    const mutation = `mutation {
      models {
        Task {
          delete(id: ${item.id})
        }
      }
    }`;
    const result = await graphql(schema, mutation);
    expect(result.data.models.Task.delete).toEqual(true);
    // console.log("delete result", result);
    const query = `query { models { Task(where: {id: ${item.id}}) { id, name } } }`;
    const queryResult = await graphql(schema, query);
    // console.log("query result", queryResult);
    return expect(queryResult.data.models.Task.length).toEqual(0);
  });
  it("updateAll", async() => {
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
    const schema = await createSchema(instance);
    const mutation = `mutation {
      models {
        Task {
          updateAll(where: {name: {in: ["item2", "item3"]}}, input: {name: "UPDATED"}) {
            id, 
            name
          }
        }
      }
    }`;
    await graphql(schema, mutation);
    const item2Result = await graphql(schema, `query { models { Task(where: {id: ${items[1].id}}) { id, name } } }`);
    await graphql(schema, `query { models { Task(where: {id: ${items[2].id}}) { id, name } } }`);
    expect(item2Result.data.models.Task[0].name).toEqual("UPDATED");
    expect(item2Result.data.models.Task[0].name).toEqual("UPDATED");
  });
  it("deleteAll", async() => {
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
    const schema = await createSchema(instance);
    const mutation = `mutation {
      models {
        Task {
          deleteAll(where: {name: {in: ["item2", "item3"]}})
        }
      }
    }`;
    const result = await graphql(schema, mutation);
    // console.log("result", result.data);
    expect(result.data.models.Task.deleteAll.length).toEqual(2);
    const queryResults = await graphql(schema, "query { models { Task { id, name } } }");
    // console.log("queryResults", queryResults.data.models.Task);
    expect(queryResults.data.models.Task.length).toEqual(1);
  });
  it("classMethod", async() => {
    const instance = await createSqlInstance();
    const {Task} = instance.models;
    await Task.create({
      name: "item2",
    });
    const schema = await createSchema(instance);

    const mutation = `mutation {
      models {
        Task {
          reverseName(input: {amount: 2}) {
            name
          }
        }
      }
    }`;
    const result = await graphql(schema, mutation);
    return expect(result.data.models.Task.reverseName.name).toEqual("reverseName2");
  });
});
