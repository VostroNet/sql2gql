"use strict";

var _expect = _interopRequireDefault(require("expect"));

var _utils = require("./utils");

var _graphql = require("graphql");

var _index = require("../index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe("schema", () => {
  it("type output", async () => {
    const instance = await (0, _utils.createSqlInstance)();
    const schema = await (0, _index.createSchema)(instance);
    (0, _expect.default)(schema.$sql2gql).toBeDefined();
    (0, _expect.default)(schema.$sql2gql.types).toBeDefined();
    (0, _expect.default)(schema.$sql2gql.types.Task).toBeDefined();
    return (0, _expect.default)(schema.$sql2gql.types.Task instanceof _graphql.GraphQLObjectType).toBeTruthy();
  });
});
//# sourceMappingURL=schema.test.js.map
