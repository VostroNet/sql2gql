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
});
