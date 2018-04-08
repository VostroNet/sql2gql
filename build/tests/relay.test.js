"use strict";

var _expect = _interopRequireDefault(require("expect"));

var _utils = require("./utils");

var _graphql = require("graphql");

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
});
//# sourceMappingURL=relay.test.js.map
