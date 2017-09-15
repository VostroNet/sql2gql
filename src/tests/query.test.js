import expect from "expect";
import {createSqlInstance, validateResult} from "./utils";
import {graphql} from "graphql";
import {createSchema} from "../index";

describe("queries", () => {
  it("basic", async() => {
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
    const result = await graphql(schema, "query { models { Task { id, name } } }");
    validateResult(result);
    return expect(result.data.models.Task.length).toEqual(3);
  });
  it("classMethod", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);

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
    validateResult(result);
    return expect(result.data.classMethods.Task.getHiddenData.hidden).toEqual("Hi");
  });
  it("classMethod - list", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);

    const query = `query {
      classMethods {
        Task {
          reverseNameArray {
            name
          }
        }
      }
    }`;
    const result = await graphql(schema, query);
    validateResult(result);
    return expect(result.data.classMethods.Task.reverseNameArray[0].name).toEqual("reverseName4");
  });
  it("override", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);
    const {Task} = instance.models;
    await Task.create({
      name: "item1",
      options: JSON.stringify({"hidden": "invisibot"}),
    });
    const result = await graphql(schema, "query { models { Task { id, name, options {hidden} } } }");
    validateResult(result);
    // console.log("result", result.data.models.Task[0]);
    return expect(result.data.models.Task[0].options.hidden).toEqual("invisibot");
  });

  it("filter hooks", async() => {
    const instance = await createSqlInstance();
    const {Task, TaskItem} = instance.models;
    const model = await Task.create({
      name: "item1",
    });
    await TaskItem.create({
      name: "filterMe",
      taskId: model.get("id"),
    });
    const schema = await createSchema(instance);
    const result = await graphql(schema, "query { models { Task { id, name, items {id} } } }", {filterName: "filterMe"});
    validateResult(result);
    return expect(result.data.models.Task[0].items.length).toEqual(0);
  });
  it("instance method", async() => {
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
    const result = await graphql(schema, "query { models { Task { id, name, testInstanceMethod(input: {amount: 1}) { name } } } }");
    validateResult(result);
    expect(result.data.models.Task[0].testInstanceMethod.name).toEqual("item11");
    expect(result.data.models.Task[1].testInstanceMethod.name).toEqual("item21");
    expect(result.data.models.Task[2].testInstanceMethod.name).toEqual("item31");
    return expect(result.data.models.Task.length).toEqual(3);
  });
});
