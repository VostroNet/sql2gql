"use strict";

var _express = _interopRequireDefault(require("express"));

var _bodyParser = _interopRequireDefault(require("body-parser"));

var _apolloServerExpress = require("apollo-server-express");

var _utils = require("./utils");

var _index = require("../index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const PORT = 3000;
const app = (0, _express.default)();
(async () => {
  const instance = await (0, _utils.createSqlInstance)();
  const schema = await (0, _index.createSchema)(instance, {
    version: 3,
    compat: 2
  });
  app.use("/graphql", _bodyParser.default.json(), (0, _apolloServerExpress.graphqlExpress)({
    schema: schema
  }));
  app.get("/graphiql", (0, _apolloServerExpress.graphiqlExpress)({
    endpointURL: "/graphql"
  }));
  app.listen(PORT);
})().then(() => {
  console.log("success");
}, err => {
  console.log("ERR", err);
});
//# sourceMappingURL=express.js.map
