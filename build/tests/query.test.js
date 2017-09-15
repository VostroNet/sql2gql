"use strict";

var _expect = require("expect");

var _expect2 = _interopRequireDefault(_expect);

var _utils = require("./utils");

var _graphql = require("graphql");

var _index = require("../index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

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
    (0, _utils.validateResult)(result);
    return (0, _expect2.default)(result.data.models.Task.length).toEqual(3);
  }));
  it("classMethod", _asyncToGenerator(function* () {
    const instance = yield (0, _utils.createSqlInstance)();
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
    (0, _utils.validateResult)(result);
    return (0, _expect2.default)(result.data.classMethods.Task.getHiddenData.hidden).toEqual("Hi");
  }));
  it("override", _asyncToGenerator(function* () {
    const instance = yield (0, _utils.createSqlInstance)();
    const schema = yield (0, _index.createSchema)(instance);
    const { Task } = instance.models;
    yield Task.create({
      name: "item1",
      options: JSON.stringify({ "hidden": "invisibot" })
    });
    const result = yield (0, _graphql.graphql)(schema, "query { models { Task { id, name, options {hidden} } } }");
    (0, _utils.validateResult)(result);
    // console.log("result", result.data.models.Task[0]);
    return (0, _expect2.default)(result.data.models.Task[0].options.hidden).toEqual("invisibot");
  }));

  it("filter hooks", _asyncToGenerator(function* () {
    const instance = yield (0, _utils.createSqlInstance)();
    const { Task, TaskItem } = instance.models;
    const model = yield Task.create({
      name: "item1"
    });
    yield TaskItem.create({
      name: "filterMe",
      taskId: model.get("id")
    });
    const schema = yield (0, _index.createSchema)(instance);
    const result = yield (0, _graphql.graphql)(schema, "query { models { Task { id, name, items {id} } } }", { filterName: "filterMe" });
    (0, _utils.validateResult)(result);
    return (0, _expect2.default)(result.data.models.Task[0].items.length).toEqual(0);
  }));
  it("instance method", _asyncToGenerator(function* () {
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
    const result = yield (0, _graphql.graphql)(schema, "query { models { Task { id, name, testInstanceMethod(input: {amount: 1}) { name } } } }");
    (0, _utils.validateResult)(result);
    (0, _expect2.default)(result.data.models.Task[0].testInstanceMethod.name).toEqual("item11");
    (0, _expect2.default)(result.data.models.Task[1].testInstanceMethod.name).toEqual("item21");
    (0, _expect2.default)(result.data.models.Task[2].testInstanceMethod.name).toEqual("item31");
    return (0, _expect2.default)(result.data.models.Task.length).toEqual(3);
  }));
});
//# sourceMappingURL=query.test.js.map
