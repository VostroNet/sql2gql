"use strict";

var _express = _interopRequireDefault(require("express"));

var _apolloServerExpress = require("apollo-server-express");

var _utils = require("./utils");

var _index = require("../index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const PORT = 3005;
const app = (0, _express.default)();
(async () => {
  const instance = await (0, _utils.createSqlInstance)();
  const schema = await (0, _index.createSchema)(instance);
  const server = new _apolloServerExpress.ApolloServer({
    schema,
    context: () => {
      return {
        instance
      };
    }
  });
  server.applyMiddleware({
    app
  });
  app.listen(PORT);
})().then(() => {
  console.log("success");
}, err => {
  console.log("ERR", err);
});
//# sourceMappingURL=express.js.map
