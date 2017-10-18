"use strict";

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require("body-parser");

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _apolloServerExpress = require("apollo-server-express");

var _utils = require("./utils");

var _index = require("../index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const PORT = 3000;
const app = (0, _express2.default)();
_asyncToGenerator(function* () {
  const instance = yield (0, _utils.createSqlInstance)();
  const schema = yield (0, _index.createSchema)(instance, { version: 3 });
  app.use("/graphql", _bodyParser2.default.json(), (0, _apolloServerExpress.graphqlExpress)({ schema: schema }));
  app.get("/graphiql", (0, _apolloServerExpress.graphiqlExpress)({ endpointURL: "/graphql" }));
  app.listen(PORT);
})().then(() => {
  console.log("success");
}, err => {
  console.log("ERR", err);
});
//# sourceMappingURL=express.js.map
