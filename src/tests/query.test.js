import expect from "expect";
import {graphql} from "graphql";
import {createSqlInstance, validateResult} from "./utils";
import {createSchema} from "../index";

describe("queries", () => {
  it("basic", async() => {
    const instance = await createSqlInstance();
    const {Task} = instance.models;
    await Promise.all([
      Task.create({
        name: "item1",
      }),
      Task.create({
        name: "item2",
      }),
      Task.create({
        name: "item3",
      }),
    ]);
    const schema = await createSchema(instance);
    const result = await graphql(schema, "query { models { Task { edges { node { id, name } } } } }");
    validateResult(result);
    return expect(result.data.models.Task.edges.length).toEqual(3);
  });
  it("classMethod", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);

    const query = `query {
      classMethods {
        Task {
          getHiddenData {
            hidden
          }
        }
      }
    }`;
    const result = await graphql(schema, query);
    validateResult(result);
    return expect(result.data.classMethods.Task.getHiddenData.hidden).toEqual("Hi");
  });
  it("classMethod - list", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);

    const query = `query {
      classMethods {
        Task {
          reverseNameArray {
            name
          }
        }
      }
    }`;
    const result = await graphql(schema, query);
    validateResult(result);
    return expect(result.data.classMethods.Task.reverseNameArray[0].name).toEqual("reverseName4");
  });
  it("override", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);
    const {Task} = instance.models;
    await Task.create({
      name: "item1",
      options: JSON.stringify({"hidden": "invisibot"}),
    });
    const result = await graphql(schema, "query { models { Task { edges { node { id, name, options {hidden} } } } } }");
    validateResult(result);
    // console.log("result", result.data.models.Task[0]);
    return expect(result.data.models.Task.edges[0].node.options.hidden).toEqual("invisibot");
  });
  it("filter hooks", async() => {
    const instance = await createSqlInstance();
    const {Task, TaskItem} = instance.models;
    const model = await Task.create({
      name: "item1",
    });
    await TaskItem.create({
      name: "filterMe",
      taskId: model.get("id"),
    });
    const schema = await createSchema(instance);
    const result = await graphql(schema, `query {
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
    }`, {filterName: "filterMe"});

    validateResult(result);
    return expect(result.data.models.Task.edges[0].node.items.edges.length).toEqual(0);
  });
  it("instance method", async() => {
    const instance = await createSqlInstance();
    const {Task} = instance.models;
    await Promise.all([
      Task.create({
        name: "item1",
      }),
      Task.create({
        name: "item2",
      }),
      Task.create({
        name: "item3",
      }),
    ]);
    const schema = await createSchema(instance);
    const result = await graphql(schema, `{
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
    validateResult(result);
    expect(result.data.models.Task.edges[0].node.testInstanceMethod[0].name).toEqual("item11");
    expect(result.data.models.Task.edges[1].node.testInstanceMethod[0].name).toEqual("item21");
    expect(result.data.models.Task.edges[2].node.testInstanceMethod[0].name).toEqual("item31");
    return expect(result.data.models.Task.edges.length).toEqual(3);
  });
  it("orderBy asc", async() => {
    const instance = await createSqlInstance();
    const {Task, TaskItem} = instance.models;
    const model = await Task.create({
      name: "task1",
    });
    await Promise.all([
      TaskItem.create({
        name: "taskitem1",
        taskId: model.get("id"),
      }),
      TaskItem.create({
        name: "taskitem2",
        taskId: model.get("id"),
      }),
      TaskItem.create({
        name: "taskitem3",
        taskId: model.get("id"),
      }),
    ]);
    const schema = await createSchema(instance);
    const result = await graphql(schema, "query { models { Task { edges { node { id, name, items(orderBy: idAsc) {edges {node{id, name}}} } } } } }");
    validateResult(result);
    expect(result.data.models.Task.edges[0].node.name).toEqual("task1");
    expect(result.data.models.Task.edges[0].node.items.edges.length).toEqual(3);
    return expect(result.data.models.Task.edges[0].node.items.edges[0].node.name).toEqual("taskitem1");
  });
  it("orderBy desc", async() => {
    const instance = await createSqlInstance();
    const {Task, TaskItem} = instance.models;
    const model = await Task.create({
      name: "task1",
    });
    await Promise.all([
      TaskItem.create({
        name: "taskitem1",
        taskId: model.get("id"),
      }),
      TaskItem.create({
        name: "taskitem2",
        taskId: model.get("id"),
      }),
      TaskItem.create({
        name: "taskitem3",
        taskId: model.get("id"),
      }),
    ]);
    const schema = await createSchema(instance);
    const result = await graphql(schema, "query { models { Task { edges { node { id, name, items(orderBy: idDesc) {edges {node{id, name}}} } } } } }");
    validateResult(result);
    expect(result.data.models.Task.edges[0].node.name).toEqual("task1");
    expect(result.data.models.Task.edges[0].node.items.edges.length).toEqual(3);
    return expect(result.data.models.Task.edges[0].node.items.edges[0].node.name).toEqual("taskitem3");
  });
  it("orderBy values", async() => {
    const instance = await createSqlInstance();
    const {TaskItem} = instance.models;
    const fields = TaskItem.$sqlgql.define;
    const schema = await createSchema(instance);
    const result = await graphql(schema, "query {__type(name:\"TaskitemsOrderBy\") { enumValues {name} }}");
    const enumValues = result.data.__type.enumValues.map(x => x.name);// eslint-disable-line

    Object.keys(fields).map((field) => {
      expect(enumValues).toContain(`${field}Asc`);
      expect(enumValues).toContain(`${field}Desc`);
    });
    expect(enumValues).toContain("createdAtAsc");
    expect(enumValues).toContain("createdAtDesc");
    expect(enumValues).toContain("updatedAtAsc");
    expect(enumValues).toContain("updatedAtDesc");
    expect(enumValues).toContain("idAsc");
    return expect(enumValues).toContain("idDesc");
  });
  it("filter non-null", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);
    const mutation = `mutation {
      models {
        Item(create: [
          {name: "item"},
          {name: "item-null"}
        ]) {
          id,
          name
        }
      }
    }`;
    const itemResult = await graphql(schema, mutation);
    validateResult(itemResult);

    const queryResult = await graphql(schema, `query {
      models {
        Item {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    }`);
    validateResult(queryResult);
    expect(queryResult.data.models.Item.edges.length).toBe(1);
  });
  it("test relationships - hasMany", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);
    const mutation = `mutation {
      models {
        Item(create: {
          name: "item",
          children: [{
            create: {
              name: "item1"
              children: [{create: {name: "item2"}}]
            }
          }]
        }) {
          id,
          name
        }
      }
    }`;
    const itemResult = await graphql(schema, mutation);
    validateResult(itemResult);

    const queryResult = await graphql(schema, `query {
      models {
        Item(where: {
          name: "item1"
        }) {
          edges {
            node {
              id
              name
              parentId
              children {
                edges {
                  node {
                    id
                    name
                  }
                }
              }
              parent {
                id
                name
              }
            }
          }
        }
      }
    }`);
    validateResult(queryResult);
    expect(queryResult.data.models.Item.edges.length).toBe(1);
    expect(queryResult.data.models.Item.edges[0].node.parent).not.toBeNull();
    expect(queryResult.data.models.Item.edges[0].node.children.edges.length).toBe(1);
  });
  it("test relationships - belongsTo", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);
    const mutation = `mutation {
      models {
        Item(create: {
          name: "item",
          parent: {
            create: {
              name: "item1"
            }
          }
        }) {
          id,
          name
        }
      }
    }`;
    const itemResult = await graphql(schema, mutation);
    validateResult(itemResult);

    const queryResult = await graphql(schema, `query {
      models {
        Item(where: {
          name: "item"
        }) {
          edges {
            node {
              id
              name
              parentId
              children {
                edges {
                  node {
                    id
                    name
                  }
                }
              }
              parent {
                id
                name
              }
            }
          }
        }
      }
    }`);
    validateResult(queryResult);
    expect(queryResult.data.models.Item.edges.length).toBe(1);
    expect(queryResult.data.models.Item.edges[0].node.parent).not.toBeNull();

  });
});
