"use strict";

var _expect = _interopRequireDefault(require("expect"));

var _utils = require("./utils");

var _graphql = require("graphql");

var _index = require("../index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe("queries", () => {
  it("basic", async () => {
    const instance = await (0, _utils.createSqlInstance)();
    const {
      Task
    } = instance.models;
    await Promise.all([Task.create({
      name: "item1"
    }), Task.create({
      name: "item2"
    }), Task.create({
      name: "item3"
    })]);
    const schema = await (0, _index.createSchema)(instance);
    const result = await (0, _graphql.graphql)(schema, "query { models { Task { edges { node { id, name } } } } }");
    (0, _utils.validateResult)(result);
    return (0, _expect.default)(result.data.models.Task.edges.length).toEqual(3);
  });
  it("classMethod", async () => {
    const instance = await (0, _utils.createSqlInstance)();
    const schema = await (0, _index.createSchema)(instance);
    const query = `query {
      classMethods {
        Task {
          getHiddenData {
            hidden
          }
        }
      }
    }`;
    const result = await (0, _graphql.graphql)(schema, query);
    (0, _utils.validateResult)(result);
    return (0, _expect.default)(result.data.classMethods.Task.getHiddenData.hidden).toEqual("Hi");
  });
  it("classMethod - list", async () => {
    const instance = await (0, _utils.createSqlInstance)();
    const schema = await (0, _index.createSchema)(instance);
    const query = `query {
      classMethods {
        Task {
          reverseNameArray {
            name
          }
        }
      }
    }`;
    const result = await (0, _graphql.graphql)(schema, query);
    (0, _utils.validateResult)(result);
    return (0, _expect.default)(result.data.classMethods.Task.reverseNameArray[0].name).toEqual("reverseName4");
  });
  it("override", async () => {
    const instance = await (0, _utils.createSqlInstance)();
    const schema = await (0, _index.createSchema)(instance);
    const {
      Task
    } = instance.models;
    await Task.create({
      name: "item1",
      options: JSON.stringify({
        "hidden": "invisibot"
      })
    });
    const result = await (0, _graphql.graphql)(schema, "query { models { Task { edges { node { id, name, options {hidden} } } } } }");
    (0, _utils.validateResult)(result); // console.log("result", result.data.models.Task[0]);

    return (0, _expect.default)(result.data.models.Task.edges[0].node.options.hidden).toEqual("invisibot");
  });
  it("filter hooks", async () => {
    const instance = await (0, _utils.createSqlInstance)();
    const {
      Task,
      TaskItem
    } = instance.models;
    const model = await Task.create({
      name: "item1"
    });
    await TaskItem.create({
      name: "filterMe",
      taskId: model.get("id")
    });
    const schema = await (0, _index.createSchema)(instance);
    const result = await (0, _graphql.graphql)(schema, `query {
      models { 
        Task { 
          edges { 
            node { 
              id, 
              name, 
              items { 
                edges { 
                  node { 
                    id 
                  } 
                } 
              } 
            } 
          } 
        } 
      }
    }`, {
      filterName: "filterMe"
    });
    (0, _utils.validateResult)(result);
    return (0, _expect.default)(result.data.models.Task.edges[0].node.items.edges.length).toEqual(0);
  });
  it("instance method", async () => {
    const instance = await (0, _utils.createSqlInstance)();
    const {
      Task
    } = instance.models;
    await Promise.all([Task.create({
      name: "item1"
    }), Task.create({
      name: "item2"
    }), Task.create({
      name: "item3"
    })]);
    const schema = await (0, _index.createSchema)(instance);
    const result = await (0, _graphql.graphql)(schema, `{
      models {
        Task {
          edges {
            node {
              id
              name
              testInstanceMethod(input: {amount: 1}) {
                name
              }
            }
          }
        }
      }
    }
    `);
    (0, _utils.validateResult)(result);
    (0, _expect.default)(result.data.models.Task.edges[0].node.testInstanceMethod[0].name).toEqual("item11");
    (0, _expect.default)(result.data.models.Task.edges[1].node.testInstanceMethod[0].name).toEqual("item21");
    (0, _expect.default)(result.data.models.Task.edges[2].node.testInstanceMethod[0].name).toEqual("item31");
    return (0, _expect.default)(result.data.models.Task.edges.length).toEqual(3);
  });
  it("orderBy asc", async () => {
    const instance = await (0, _utils.createSqlInstance)();
    const {
      Task,
      TaskItem
    } = instance.models;
    const model = await Task.create({
      name: "task1"
    });
    await Promise.all([TaskItem.create({
      name: "taskitem1",
      taskId: model.get("id")
    }), TaskItem.create({
      name: "taskitem2",
      taskId: model.get("id")
    }), TaskItem.create({
      name: "taskitem3",
      taskId: model.get("id")
    })]);
    const schema = await (0, _index.createSchema)(instance);
    const result = await (0, _graphql.graphql)(schema, "query { models { Task { edges { node { id, name, items(orderBy: idAsc) {edges {node{id, name}}} } } } } }");
    (0, _utils.validateResult)(result);
    (0, _expect.default)(result.data.models.Task.edges[0].node.name).toEqual("task1");
    (0, _expect.default)(result.data.models.Task.edges[0].node.items.edges.length).toEqual(3);
    return (0, _expect.default)(result.data.models.Task.edges[0].node.items.edges[0].node.name).toEqual("taskitem1");
  });
  it("orderBy desc", async () => {
    const instance = await (0, _utils.createSqlInstance)();
    const {
      Task,
      TaskItem
    } = instance.models;
    const model = await Task.create({
      name: "task1"
    });
    await Promise.all([TaskItem.create({
      name: "taskitem1",
      taskId: model.get("id")
    }), TaskItem.create({
      name: "taskitem2",
      taskId: model.get("id")
    }), TaskItem.create({
      name: "taskitem3",
      taskId: model.get("id")
    })]);
    const schema = await (0, _index.createSchema)(instance);
    const result = await (0, _graphql.graphql)(schema, "query { models { Task { edges { node { id, name, items(orderBy: idDesc) {edges {node{id, name}}} } } } } }");
    (0, _utils.validateResult)(result);
    (0, _expect.default)(result.data.models.Task.edges[0].node.name).toEqual("task1");
    (0, _expect.default)(result.data.models.Task.edges[0].node.items.edges.length).toEqual(3);
    return (0, _expect.default)(result.data.models.Task.edges[0].node.items.edges[0].node.name).toEqual("taskitem3");
  });
});
//# sourceMappingURL=query.test.js.map
