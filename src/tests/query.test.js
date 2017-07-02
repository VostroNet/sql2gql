import expect from "expect";
import {createSqlInstance} from "./utils";
import {graphql} from "graphql";

// import logger from "utils/logger";
// const log = logger("seeql::tests:query:");

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
    return expect(result.data.models.Task.length).toEqual(3);
  });
  it("classMethod", async() => {
    const instance = await createSqlInstance();
    // const {Task} = instance.models;
    // await Task.create({
    //   name: "item2",
    // });
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
    return expect(result.data.classMethods.Task.getHiddenData.hidden).toEqual("Hi");
  });
});
