import expect from "expect";
import {graphql} from "graphql";
import uuid from "uuid";
import {createSqlInstance, validateResult} from "./utils";
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
  it("node id - redundant convert to global id", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);
    const mutation = `mutation {
      models {
        Item(create: {name: "item1", id: "${uuid()}"}) {
          id, 
          name
        }
      }
    }`;
    const itemResult = await graphql(schema, mutation);
    validateResult(itemResult);
    const {data: {models: {Item}}} = itemResult;
    const itemChildrenMutation = `mutation {
      models {
        Item(create: [
          {name: "item1.1", id: "${uuid()}", parentId: "${Item[0].id}"},
          {name: "item1.2", id: "${uuid()}", parentId: "${Item[0].id}"},
        ]) {
          id
          name
          parent {
            id
            name
          }
        }
      }
    }`;
    const itemChildrenResult = await graphql(schema, itemChildrenMutation);
    validateResult(itemChildrenResult);

    const queryResult = await graphql(schema, `query {
      models {
        Item(where:{name:"item1"}) {
          edges {
            node {
              id
              name
              parent {
                id
                name
              }
              children {
                edges {
                  node {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    }`);
    validateResult(queryResult);
    expect(queryResult.data.models.Item.edges[0].node.children.edges.length).toBe(2);
  });
});
