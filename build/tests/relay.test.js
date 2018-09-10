"use strict";

var _expect = _interopRequireDefault(require("expect"));

var _graphql = require("graphql");

var _uuid = _interopRequireDefault(require("uuid"));

var _utils = require("./utils");

var _index = require("../index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe("relay", () => {
  it("node id validation", async () => {
    const instance = await (0, _utils.createSqlInstance)();
    const schema = await (0, _index.createSchema)(instance);
    const mutationResult = await (0, _graphql.graphql)(schema, `mutation {
      models {
        Task(create: {
          name: "test"
        }) {
          id
        }
      }
    }`);
    (0, _utils.validateResult)(mutationResult);
    const modelId = mutationResult.data.models.Task[0].id;
    const queryResult = await (0, _graphql.graphql)(schema, `query testNode($id: ID!) {
      node(id:$id) {
        id, __typename
        ... on Task {
          name
        }
      }
    }`, {}, {}, {
      id: modelId
    });
    (0, _utils.validateResult)(queryResult);
    (0, _expect.default)(queryResult.data.node.id).toEqual(modelId);
    (0, _expect.default)(queryResult.data.node.name).toEqual("test");
    return (0, _expect.default)(queryResult.data.node.__typename).toEqual("Task"); //eslint-disable-line
  });
  it("node id - redundant convert to global id", async () => {
    const instance = await (0, _utils.createSqlInstance)();
    const schema = await (0, _index.createSchema)(instance);
    const mutation = `mutation {
      models {
        Item(create: {name: "item1", id: "${(0, _uuid.default)()}"}) {
          id, 
          name
        }
      }
    }`;
    const itemResult = await (0, _graphql.graphql)(schema, mutation);
    (0, _utils.validateResult)(itemResult);
    const {
      data: {
        models: {
          Item
        }
      }
    } = itemResult;
    const itemChildrenMutation = `mutation {
      models {
        Item(create: [
          {name: "item1.1", id: "${(0, _uuid.default)()}", parentId: "${Item[0].id}"},
          {name: "item1.2", id: "${(0, _uuid.default)()}", parentId: "${Item[0].id}"},
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
    const itemChildrenResult = await (0, _graphql.graphql)(schema, itemChildrenMutation);
    (0, _utils.validateResult)(itemChildrenResult);
    const queryResult = await (0, _graphql.graphql)(schema, `query {
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
    (0, _utils.validateResult)(queryResult);
    (0, _expect.default)(queryResult.data.models.Item.edges[0].node.children.edges.length).toBe(2);
  });
});
//# sourceMappingURL=relay.test.js.map
