"use strict";

var _expect = require("expect");

var _expect2 = _interopRequireDefault(_expect);

var _utils = require("./utils");

var _graphql = require("graphql");

var _index = require("../index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

// import logger from "utils/logger";
// const log = logger("seeql::tests:query:");

describe("queries", () => {
  it("basic", _asyncToGenerator(function* () {
    const instance = yield (0, _utils.createSqlInstance)();
    const { Task } = instance.models;
    yield Promise.all([Task.create({
      name: "item1"
    }), Task.create({
      name: "item2"
    }), Task.create({
      name: "item3"
    })]);
    const schema = yield (0, _index.createSchema)(instance);
    const result = yield (0, _graphql.graphql)(schema, "query { models { Task { id, name } } }");
    return (0, _expect2.default)(result.data.models.Task.length).toEqual(3);
  }));
  it("classMethod", _asyncToGenerator(function* () {
    const instance = yield (0, _utils.createSqlInstance)();
    // const {Task} = instance.models;
    // await Task.create({
    //   name: "item2",
    // });
    const schema = yield (0, _index.createSchema)(instance);

    const query = `query {
      classMethods {
        Task {
          getHiddenData {
            hidden
          }
        }
      }
    }`;
    const result = yield (0, _graphql.graphql)(schema, query);
    return (0, _expect2.default)(result.data.classMethods.Task.getHiddenData.hidden).toEqual("Hi");
  }));
});
//# sourceMappingURL=query.test.js.map
