import expect from "expect";
import {createSqlInstance, validateResult} from "./utils";
import {graphql} from "graphql";
import {createSchema} from "../index";

describe("relay", () => {
  it("node id validation", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);
    const mutationResult = await graphql(schema, `mutation {
      models {
        Task(create: {
          name: "test"
        }) {
          id
        }
      }
    }`);
    validateResult(mutationResult);
    const modelId = mutationResult.data.models.Task[0].id;
    const queryResult = await graphql(schema, `query testNode($id: ID!) {
      node(id:$id) {
        id, __typename
        ... on Task {
          name
        }
      }
    }`, {}, {}, {
      id: modelId,
    });
    validateResult(queryResult);
    expect(queryResult.data.node.id).toEqual(modelId);
    expect(queryResult.data.node.name).toEqual("test");
    return expect(queryResult.data.node.__typename).toEqual("Task"); //eslint-disable-line
  });
});
