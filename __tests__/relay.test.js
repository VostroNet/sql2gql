import {graphql} from "graphql";
import uuid from "uuid";
import {createInstance, validateResult} from "./helper";
import {createSchema} from "../src/graphql/index";
import {fromGlobalId} from "graphql-relay";

describe("relay", () => {
  it("validate foreign key global id conversion - models", async() => {
    const instance = await createInstance();
    const schema = await createSchema(instance);
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
    const mutationResults = await graphql(schema, mutation);
    validateResult(mutationResults);
    expect(mutationResults.data.models.Task).toHaveLength(1);
    expect(mutationResults.data.models.Task[0].items.edges).toHaveLength(1);
    const mutationTaskId = fromGlobalId(mutationResults.data.models.Task[0].items.edges[0].node.taskId).id;
    expect(mutationTaskId).toEqual("1");
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
    const queryResults = await graphql(schema, query);
    validateResult(queryResults);
    expect(queryResults.data.models.TaskItem.edges).toHaveLength(1);
    const taskId = fromGlobalId(queryResults.data.models.TaskItem.edges[0].node.taskId).id;
    expect(taskId).toEqual("1");
  });
  it("validate foreign key global id conversion - query instanceMethod - single", async() => {
    const instance = await createInstance();
    const schema = await createSchema(instance);
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
    const mutationResults = await graphql(schema, mutation);
    validateResult(mutationResults);
    expect(mutationResults.data.models.Task).toHaveLength(1);
    expect(mutationResults.data.models.Task[0].items.edges).toHaveLength(1);
    const mutationTaskId = fromGlobalId(mutationResults.data.models.Task[0].items.edges[0].node.taskId).id;
    expect(mutationTaskId).toEqual("1");
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
    const queryResults = await graphql(schema, query, undefined, {instance});
    validateResult(queryResults);
    const taskId = fromGlobalId(queryResults.data.models.TaskItem.edges[0].node.testInstanceMethodSingle.taskId).id;
    expect(taskId).toEqual("1");
  });
  it("validate foreign key global id conversion - query instanceMethod - array", async() => {
    const instance = await createInstance();
    const schema = await createSchema(instance);
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
    const mutationResults = await graphql(schema, mutation);
    validateResult(mutationResults);
    expect(mutationResults.data.models.Task).toHaveLength(1);
    expect(mutationResults.data.models.Task[0].items.edges).toHaveLength(2);
    const mutationTaskId = fromGlobalId(mutationResults.data.models.Task[0].items.edges[0].node.taskId).id;
    expect(mutationTaskId).toEqual("1");
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
    const queryResults = await graphql(schema, query, undefined, {instance});
    validateResult(queryResults);
    expect(queryResults.data.models.TaskItem.edges[0].node.testInstanceMethodArray).toHaveLength(2);
    const taskId = fromGlobalId(queryResults.data.models.TaskItem.edges[0].node.testInstanceMethodArray[0].taskId).id;
    expect(taskId).toEqual("1");
  });
  it("validate foreign key global id conversion - query classMethods - single", async() => {
    const instance = await createInstance();
    const schema = await createSchema(instance);
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
    const mutationResults = await graphql(schema, mutation);
    validateResult(mutationResults);
    expect(mutationResults.data.models.Task).toHaveLength(1);
    expect(mutationResults.data.models.Task[0].items.edges).toHaveLength(1);
    const mutationTaskId = fromGlobalId(mutationResults.data.models.Task[0].items.edges[0].node.taskId).id;
    expect(mutationTaskId).toEqual("1");
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
    const queryResults = await graphql(schema, query, undefined, {instance});
    validateResult(queryResults);
    const taskId = fromGlobalId(queryResults.data.classMethods.TaskItem.getTaskItemsSingle.taskId).id;
    expect(taskId).toEqual("1");
  });
  it("validate foreign key global id conversion - mutation classMethods - single", async() => {
    const instance = await createInstance();
    const schema = await createSchema(instance);
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
    const mutationResults = await graphql(schema, mutation);
    validateResult(mutationResults);
    expect(mutationResults.data.models.Task).toHaveLength(1);
    expect(mutationResults.data.models.Task[0].items.edges).toHaveLength(1);
    const mutationTaskId = fromGlobalId(mutationResults.data.models.Task[0].items.edges[0].node.taskId).id;
    expect(mutationTaskId).toEqual("1");
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
    const queryResults = await graphql(schema, query, undefined, {instance});
    validateResult(queryResults);
    const taskId = fromGlobalId(queryResults.data.classMethods.TaskItem.getTaskItemsSingle.taskId).id;
    expect(taskId).toEqual("1");
  });
  it("validate foreign key global id conversion - query classMethods - array", async() => {
    const instance = await createInstance();
    const schema = await createSchema(instance);
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
    const mutationResults = await graphql(schema, mutation);
    validateResult(mutationResults);
    expect(mutationResults.data.models.Task).toHaveLength(1);
    expect(mutationResults.data.models.Task[0].items.edges).toHaveLength(2);
    const mutationTaskId = fromGlobalId(mutationResults.data.models.Task[0].items.edges[0].node.taskId).id;
    expect(mutationTaskId).toEqual("1");
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
    const queryResults = await graphql(schema, query, undefined, {instance});
    validateResult(queryResults);
    expect(queryResults.data.classMethods.TaskItem.getTaskItemsArray).toHaveLength(2);
    const taskId = fromGlobalId(queryResults.data.classMethods.TaskItem.getTaskItemsArray[0].taskId).id;
    expect(taskId).toEqual("1");
  });
  it("validate foreign key global id conversion - mutation classMethods - array", async() => {
    const instance = await createInstance();
    const schema = await createSchema(instance);
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
    const mutationResults = await graphql(schema, mutation);
    validateResult(mutationResults);
    expect(mutationResults.data.models.Task).toHaveLength(1);
    expect(mutationResults.data.models.Task[0].items.edges).toHaveLength(2);
    const mutationTaskId = fromGlobalId(mutationResults.data.models.Task[0].items.edges[0].node.taskId).id;
    expect(mutationTaskId).toEqual("1");
    const query = `mutation {
  classMethods {
    TaskItem {
      getTaskItemsArray {
        id
        taskId
        task {
          id
        }
      }
    }
  }
}`;
    const queryResults = await graphql(schema, query, undefined, {instance});
    validateResult(queryResults);
    expect(queryResults.data.classMethods.TaskItem.getTaskItemsArray).toHaveLength(2);
    const taskId = fromGlobalId(queryResults.data.classMethods.TaskItem.getTaskItemsArray[0].taskId).id;
    expect(taskId).toEqual("1");
  });
  it("node id validation", async() => {
    const instance = await createInstance();
    const schema = await createSchema(instance);
    const mutationResult = await graphql(schema, `mutation {
      models {
        Task(create: {
          name: "test"
        }) {
          id
        }
      }
    }`);
    validateResult(mutationResult);
    const modelId = mutationResult.data.models.Task[0].id;
    const queryResult = await graphql(schema, `query testNode($id: ID!) {
      node(id:$id) {
        id, __typename
        ... on Task {
          name
        }
      }
    }`, {}, {}, {
      id: modelId,
    });
    validateResult(queryResult);
    expect(queryResult.data.node.id).toEqual(modelId);
    expect(queryResult.data.node.name).toEqual("test");
    return expect(queryResult.data.node.__typename).toEqual("Task"); //eslint-disable-line
  });
  it("node id - redundant convert to global id", async() => {
    const instance = await createInstance();
    const schema = await createSchema(instance);
    const mutation = `mutation {
      models {
        Item(create: {name: "item1", id: "${uuid()}"}) {
          id, 
          name
        }
      }
    }`;
    const itemResult = await graphql(schema, mutation);
    validateResult(itemResult);
    const {data: {models: {Item}}} = itemResult;
    const itemChildrenMutation = `mutation {
      models {
        Item(create: [
          {name: "item1.1", id: "${uuid()}", parentId: "${Item[0].id}"},
          {name: "item1.2", id: "${uuid()}", parentId: "${Item[0].id}"},
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
    const itemChildrenResult = await graphql(schema, itemChildrenMutation);
    validateResult(itemChildrenResult);

    const queryResult = await graphql(schema, `query {
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
    validateResult(queryResult);
    expect(queryResult.data.models.Item.edges[0].node.children.edges).toHaveLength(2);
  });
});
