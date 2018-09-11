"use strict";

var _expect = _interopRequireDefault(require("expect"));

var _graphql = require("graphql");

var _uuid = _interopRequireDefault(require("uuid"));

var _utils = require("./utils");

var _index = require("../index");

var _graphqlRelay = require("graphql-relay");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe("relay", () => {
  it("validate foreign key global id conversion - models", async () => {
    const instance = await (0, _utils.createSqlInstance)();
    const schema = await (0, _index.createSchema)(instance);
    const mutation = `mutation {
  models {
    Task(create: { name: "test", items: { create: { name: "testitem" } } }) {
      id
      items {
        edges {
          node {
            id
            taskId
          }
        }
      }
    }
  }
}`;
    const mutationResults = await (0, _graphql.graphql)(schema, mutation);
    (0, _utils.validateResult)(mutationResults);
    (0, _expect.default)(mutationResults.data.models.Task.length).toEqual(1);
    (0, _expect.default)(mutationResults.data.models.Task[0].items.edges.length).toEqual(1);
    const mutationTaskId = (0, _graphqlRelay.fromGlobalId)(mutationResults.data.models.Task[0].items.edges[0].node.taskId).id;
    (0, _expect.default)(mutationTaskId).toEqual("1");
    const query = `query {
  models {
    TaskItem {
      edges {
        node {
          id
          taskId
        }
      }
    }
  }
}`;
    const queryResults = await (0, _graphql.graphql)(schema, query);
    (0, _utils.validateResult)(queryResults);
    (0, _expect.default)(queryResults.data.models.TaskItem.edges.length).toEqual(1);
    const taskId = (0, _graphqlRelay.fromGlobalId)(queryResults.data.models.TaskItem.edges[0].node.taskId).id;
    (0, _expect.default)(taskId).toEqual("1");
  });
  it("validate foreign key global id conversion - query instanceMethod - single", async () => {
    const instance = await (0, _utils.createSqlInstance)();
    const schema = await (0, _index.createSchema)(instance);
    const mutation = `mutation {
  models {
    Task(create: { name: "test", items: { create: { name: "testitem" } } }) {
      id
      items {
        edges {
          node {
            id
            taskId
          }
        }
      }
    }
  }
}`;
    const mutationResults = await (0, _graphql.graphql)(schema, mutation);
    (0, _utils.validateResult)(mutationResults);
    (0, _expect.default)(mutationResults.data.models.Task.length).toEqual(1);
    (0, _expect.default)(mutationResults.data.models.Task[0].items.edges.length).toEqual(1);
    const mutationTaskId = (0, _graphqlRelay.fromGlobalId)(mutationResults.data.models.Task[0].items.edges[0].node.taskId).id;
    (0, _expect.default)(mutationTaskId).toEqual("1");
    const query = `query {
  models {
    TaskItem {
      edges {
        node {
          testInstanceMethodSingle {
            id,
            taskId
          }
        }
      }
    }
  }
}`;
    const queryResults = await (0, _graphql.graphql)(schema, query, undefined, {
      instance
    });
    (0, _utils.validateResult)(queryResults);
    const taskId = (0, _graphqlRelay.fromGlobalId)(queryResults.data.models.TaskItem.edges[0].node.testInstanceMethodSingle.taskId).id;
    (0, _expect.default)(taskId).toEqual("1");
  });
  it("validate foreign key global id conversion - query instanceMethod - array", async () => {
    const instance = await (0, _utils.createSqlInstance)();
    const schema = await (0, _index.createSchema)(instance);
    const mutation = `mutation {
  models {
    Task(create: { name: "test", items: [{ create: { name: "testitem" } }, {create: { name: "testitem2" } }] }) {
      id
      items {
        edges {
          node {
            id
            taskId
          }
        }
      }
    }
  }
}`;
    const mutationResults = await (0, _graphql.graphql)(schema, mutation);
    (0, _utils.validateResult)(mutationResults);
    (0, _expect.default)(mutationResults.data.models.Task.length).toEqual(1);
    (0, _expect.default)(mutationResults.data.models.Task[0].items.edges.length).toEqual(2);
    const mutationTaskId = (0, _graphqlRelay.fromGlobalId)(mutationResults.data.models.Task[0].items.edges[0].node.taskId).id;
    (0, _expect.default)(mutationTaskId).toEqual("1");
    const query = `query {
      models {
        TaskItem {
          edges {
            node {
              testInstanceMethodArray {
                id,
                taskId
              }
            }
          }
        }
      }
    }`;
    const queryResults = await (0, _graphql.graphql)(schema, query, undefined, {
      instance
    });
    (0, _utils.validateResult)(queryResults);
    (0, _expect.default)(queryResults.data.models.TaskItem.edges[0].node.testInstanceMethodArray.length).toEqual(2);
    const taskId = (0, _graphqlRelay.fromGlobalId)(queryResults.data.models.TaskItem.edges[0].node.testInstanceMethodArray[0].taskId).id;
    (0, _expect.default)(taskId).toEqual("1");
  });
  it("validate foreign key global id conversion - query classMethods - single", async () => {
    const instance = await (0, _utils.createSqlInstance)();
    const schema = await (0, _index.createSchema)(instance);
    const mutation = `mutation {
  models {
    Task(create: { name: "test", items: { create: { name: "testitem" } } }) {
      id
      items {
        edges {
          node {
            id
            taskId
          }
        }
      }
    }
  }
}`;
    const mutationResults = await (0, _graphql.graphql)(schema, mutation);
    (0, _utils.validateResult)(mutationResults);
    (0, _expect.default)(mutationResults.data.models.Task.length).toEqual(1);
    (0, _expect.default)(mutationResults.data.models.Task[0].items.edges.length).toEqual(1);
    const mutationTaskId = (0, _graphqlRelay.fromGlobalId)(mutationResults.data.models.Task[0].items.edges[0].node.taskId).id;
    (0, _expect.default)(mutationTaskId).toEqual("1");
    const query = `query {
  classMethods {
    TaskItem {
      getTaskItemsSingle {
        id
        taskId
      }
    }
  }
}`;
    const queryResults = await (0, _graphql.graphql)(schema, query, undefined, {
      instance
    });
    (0, _utils.validateResult)(queryResults);
    const taskId = (0, _graphqlRelay.fromGlobalId)(queryResults.data.classMethods.TaskItem.getTaskItemsSingle.taskId).id;
    (0, _expect.default)(taskId).toEqual("1");
  });
  it("validate foreign key global id conversion - mutation classMethods - single", async () => {
    const instance = await (0, _utils.createSqlInstance)();
    const schema = await (0, _index.createSchema)(instance);
    const mutation = `mutation {
  models {
    Task(create: { name: "test", items: { create: { name: "testitem" } } }) {
      id
      items {
        edges {
          node {
            id
            taskId
          }
        }
      }
    }
  }
}`;
    const mutationResults = await (0, _graphql.graphql)(schema, mutation);
    (0, _utils.validateResult)(mutationResults);
    (0, _expect.default)(mutationResults.data.models.Task.length).toEqual(1);
    (0, _expect.default)(mutationResults.data.models.Task[0].items.edges.length).toEqual(1);
    const mutationTaskId = (0, _graphqlRelay.fromGlobalId)(mutationResults.data.models.Task[0].items.edges[0].node.taskId).id;
    (0, _expect.default)(mutationTaskId).toEqual("1");
    const query = `mutation {
  classMethods {
    TaskItem {
      getTaskItemsSingle {
        id
        taskId
      }
    }
  }
}`;
    const queryResults = await (0, _graphql.graphql)(schema, query, undefined, {
      instance
    });
    (0, _utils.validateResult)(queryResults);
    const taskId = (0, _graphqlRelay.fromGlobalId)(queryResults.data.classMethods.TaskItem.getTaskItemsSingle.taskId).id;
    (0, _expect.default)(taskId).toEqual("1");
  });
  it("validate foreign key global id conversion - query classMethods - array", async () => {
    const instance = await (0, _utils.createSqlInstance)();
    const schema = await (0, _index.createSchema)(instance);
    const mutation = `mutation {
  models {
    Task(create: { name: "test", items: [{ create: { name: "testitem" } }, {create: { name: "testitem2" } }] }) {
      id
      items {
        edges {
          node {
            id
            taskId
          }
        }
      }
    }
  }
}`;
    const mutationResults = await (0, _graphql.graphql)(schema, mutation);
    (0, _utils.validateResult)(mutationResults);
    (0, _expect.default)(mutationResults.data.models.Task.length).toEqual(1);
    (0, _expect.default)(mutationResults.data.models.Task[0].items.edges.length).toEqual(2);
    const mutationTaskId = (0, _graphqlRelay.fromGlobalId)(mutationResults.data.models.Task[0].items.edges[0].node.taskId).id;
    (0, _expect.default)(mutationTaskId).toEqual("1");
    const query = `query {
  classMethods {
    TaskItem {
      getTaskItemsArray {
        id
        taskId
      }
    }
  }
}`;
    const queryResults = await (0, _graphql.graphql)(schema, query, undefined, {
      instance
    });
    (0, _utils.validateResult)(queryResults);
    (0, _expect.default)(queryResults.data.classMethods.TaskItem.getTaskItemsArray.length).toEqual(2);
    const taskId = (0, _graphqlRelay.fromGlobalId)(queryResults.data.classMethods.TaskItem.getTaskItemsArray[0].taskId).id;
    (0, _expect.default)(taskId).toEqual("1");
  });
  it("validate foreign key global id conversion - mutation classMethods - array", async () => {
    const instance = await (0, _utils.createSqlInstance)();
    const schema = await (0, _index.createSchema)(instance);
    const mutation = `mutation {
      models {
        Task(create: { name: "test", items: [{ create: { name: "testitem" } }, {create: { name: "testitem2" } }] }) {
          id
          items {
            edges {
              node {
                id
                taskId
              }
            }
          }
        }
      }
    }`;
    const mutationResults = await (0, _graphql.graphql)(schema, mutation);
    (0, _utils.validateResult)(mutationResults);
    (0, _expect.default)(mutationResults.data.models.Task.length).toEqual(1);
    (0, _expect.default)(mutationResults.data.models.Task[0].items.edges.length).toEqual(2);
    const mutationTaskId = (0, _graphqlRelay.fromGlobalId)(mutationResults.data.models.Task[0].items.edges[0].node.taskId).id;
    (0, _expect.default)(mutationTaskId).toEqual("1");
    const query = `mutation {
  classMethods {
    TaskItem {
      getTaskItemsArray {
        id
        taskId
      }
    }
  }
}`;
    const queryResults = await (0, _graphql.graphql)(schema, query, undefined, {
      instance
    });
    (0, _utils.validateResult)(queryResults);
    (0, _expect.default)(queryResults.data.classMethods.TaskItem.getTaskItemsArray.length).toEqual(2);
    const taskId = (0, _graphqlRelay.fromGlobalId)(queryResults.data.classMethods.TaskItem.getTaskItemsArray[0].taskId).id;
    (0, _expect.default)(taskId).toEqual("1");
  });
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
