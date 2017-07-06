import expect from "expect";
import {createSqlInstance, validateResult} from "./utils";
import {graphql} from "graphql";
import {createSchema} from "../index";


describe("mutations", () => {
  it("create", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);
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
    const query = "query { models { Task { id, name } } }";
    const queryResult = await graphql(schema, query);
    validateResult(queryResult);
    return expect(queryResult.data.models.Task.length).toEqual(1);
  });
  it("create - override", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);
    const mutation = `mutation {
      models {
        Task {
          create(input: {name: "item1", options: {hidden: "nowhere"}}) {
            id, 
            name
            options {
              hidden
            }
          }
        }
      }
    }`;
    const mutationResult = await graphql(schema, mutation);
    validateResult(mutationResult);
    expect(mutationResult.data.models.Task.create.options.hidden).toEqual("nowhere");

    const queryResult = await graphql(schema, "query { models { Task { id, name, options {hidden} } } }");
    validateResult(queryResult);
    return expect(queryResult.data.models.Task[0].options.hidden).toEqual("nowhere");
  });

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
    validateResult(result);
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
          delete(id: ${item.id}) {
            id
          }
        }
      }
    }`;
    const result = await graphql(schema, mutation);
    validateResult(result);
    expect(result.data.models.Task.delete.id).toEqual(1);
    const query = `query { models { Task(where: {id: ${item.id}}) { id, name } } }`;
    const queryResult = await graphql(schema, query);
    validateResult(queryResult);
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
    const mutationResult = await graphql(schema, mutation);
    validateResult(mutationResult);
    const item2Result = await graphql(schema, `query { models { Task(where: {id: ${items[1].id}}) { id, name } } }`);
    validateResult(item2Result);
    const item3Result = await graphql(schema, `query { models { Task(where: {id: ${items[2].id}}) { id, name } } }`);
    validateResult(item3Result);
    expect(item2Result.data.models.Task[0].name).toEqual("UPDATED");
    expect(item3Result.data.models.Task[0].name).toEqual("UPDATED");
  });
  it("deleteAll", async() => {
    const instance = await createSqlInstance();
    const {Task} = instance.models;
    await Promise.all([
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
          deleteAll(where: {name: {in: ["item2", "item3"]}}) {
            id
          }
        }
      }
    }`;
    const result = await graphql(schema, mutation);
    validateResult(result);
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
    validateResult(result);
    return expect(result.data.models.Task.reverseName.name).toEqual("reverseName2");
  });
});
