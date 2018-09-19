import expect from "expect";
import {createSqlInstance, validateResult} from "./utils";
import {graphql} from "graphql";
import {createSchema, connect} from "../index";
import Sequelize from "sequelize";
import {toGlobalId} from "graphql-relay";

Sequelize.Promise = global.Promise;

describe("mutations", () => {
  it("create", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);
    const mutation = `mutation {
      models {
        Task(create: {name: "item1"}) {
          id, 
          name
        }
      }
    }`;
    const mutationResult = await graphql(schema, mutation);
    validateResult(mutationResult);
    const query = "query { models { Task { edges { node { id, name } } } } }";
    const queryResult = await graphql(schema, query);
    validateResult(queryResult);
    return expect(queryResult.data.models.Task.edges.length).toEqual(1);
  });
  it("create - override", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);
    const mutation = `mutation {
      models {
        Task(create: {name: "item1", options: {hidden: "nowhere"}}) {
          id, 
          name
          options {
            hidden
          }
        }
      }
    }`;
    const mutationResult = await graphql(schema, mutation);
    validateResult(mutationResult);
    expect(mutationResult.data.models.Task[0].options.hidden).toEqual("nowhere");

    const queryResult = await graphql(schema, "query { models { Task { edges { node { id, name, options {hidden} } } } } }");
    validateResult(queryResult);
    return expect(queryResult.data.models.Task.edges[0].node.options.hidden).toEqual("nowhere");
  });
  it("update - override", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);
    const createMutation = `mutation {
      models {
        Task(create: {name: "item1", options: {hidden: "nowhere"}}) {
          id, 
          name
          options {
            hidden
          }
        }
      }
    }`;
    const createMutationResult = await graphql(schema, createMutation);
    validateResult(createMutationResult);
    const id = createMutationResult.data.models.Task[0].id;

    const updateMutation = `mutation {
      models {
        Task(update: {where: {id: "${id}"}, input: {options: {hidden2: "nowhere2"}}}) {
          id, 
          name
          options {
            hidden
            hidden2
          }
        }
      }
    }`;
    const updateMutationResult = await graphql(schema, updateMutation);
    validateResult(updateMutationResult);

    const queryResult = await graphql(schema, "query { models { Task { edges { node { id, name, options {hidden, hidden2} } } } } }");
    validateResult(queryResult);
    expect(queryResult.data.models.Task.edges[0].node.options.hidden).toEqual("nowhere");
    return expect(queryResult.data.models.Task.edges[0].node.options.hidden2).toEqual("nowhere2");
  });
  it("update", async() => {
    const instance = await createSqlInstance();
    const {Task} = instance.models;
    const item = await Task.create({
      name: "item2",
    });
    const schema = await createSchema(instance);
    const mutation = `mutation {
      models {
        Task(update: {where: {id: "${toGlobalId("Task", item.id)}"}, input: {name: "UPDATED"}}) {
          id, 
          name
        }
      }
    }`;
    const result = await graphql(schema, mutation);
    validateResult(result);
    expect(result.data.models.Task[0].id).toEqual(toGlobalId("Task", item.id));
    expect(result.data.models.Task[0].name).toEqual("UPDATED");
  });
  it("delete", async() => {
    const instance = await createSqlInstance();
    const {Task} = instance.models;
    const item = await Task.create({
      name: "item2",
    });
    const schema = await createSchema(instance);
    const itemId = toGlobalId("Task", item.id);
    const mutation = `mutation {
      models {
        Task(delete: {where: {id: "${itemId}"}}) {
          id
        }
      }
    }`;
    const result = await graphql(schema, mutation);
    validateResult(result);
    expect(result.data.models.Task[0].id).toEqual(itemId);
    const query = `query {
      models {
        Task(where: {id: "${itemId}"}) {
          edges {
            node {
              id,
              name
            }
          }
        }
      }
    }`;
    const queryResult = await graphql(schema, query);
    validateResult(queryResult);
    return expect(queryResult.data.models.Task.edges.length).toEqual(0);
  });
  it("update - multiple", async() => {
    const instance = await createSqlInstance();
    const {Task} = instance.models;
    const items = await Promise.all([
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
    const mutation = `mutation {
      models {
        Task(update: {
          where: {
            name: {in: ["item2", "item3"]}
          },
          input: {name: "UPDATED"}
        }) {
          id, 
          name
        }
      }
    }`;
    const item2Id = toGlobalId("Task", items[1].id);
    const item3Id = toGlobalId("Task", items[2].id);
    const mutationResult = await graphql(schema, mutation);
    validateResult(mutationResult);
    const item2Result = await graphql(schema, `{
      models {
        Task(where: {id: "${item2Id}"}) {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    }`);
    validateResult(item2Result);
    const item3Result = await graphql(schema, `{
      models {
        Task(where: {id: "${item3Id}"}) {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    }
    `);
    validateResult(item3Result);
    expect(item2Result.data.models.Task.edges[0].node.name).toEqual("UPDATED");
    expect(item3Result.data.models.Task.edges[0].node.name).toEqual("UPDATED");
  });
  it("delete - multiple", async() => {
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
    const mutation = `mutation {
      models {
        Task(delete: {
          where: {
            name: {in: ["item2", "item3"]}
          }
        }) {
          id
        }
      }
    }`;
    const result = await graphql(schema, mutation);
    validateResult(result);
    expect(result.data.models.Task.length).toEqual(2);
    const queryResults = await graphql(schema, `{
      models {
        Task {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    }`);
    // console.log("queryResults", queryResults.data.models.Task);
    expect(queryResults.data.models.Task.edges.length).toEqual(1);
  });
  it("classMethod", async() => {
    // return expect(false).toEqual(true);
    const instance = await createSqlInstance();
    const {Task} = instance.models;
    await Task.create({
      name: "item2",
    });
    const schema = await createSchema(instance);

    const mutation = `mutation {
      classMethods {
        Task {
          reverseName(input: {amount: 2}) {
            name
          }
        }
      }
    }`;
    const result = await graphql(schema, mutation);
    validateResult(result);
    return expect(result.data.classMethods.Task.reverseName.name).toEqual("reverseName2");
  });
  it("create - before hook", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);
    const mutation = `mutation {
      models {
        Task(create: {name: "item1"}) {
          id, 
          name,
          mutationCheck
        }
      }
    }`;
    const mutationResult = await graphql(schema, mutation);
    validateResult(mutationResult);
    return expect(mutationResult.data.models.Task[0].mutationCheck).toEqual("create");
  });
  it("update - before hook", async() => {
    const instance = await createSqlInstance();
    const {Task} = instance.models;
    const item = await Task.create({
      name: "item2",
    });
    const schema = await createSchema(instance);
    const itemId = toGlobalId("Task", item.id);
    const mutation = `mutation {
      models {
        Task(update: {where: {id: "${itemId}"}, input: {name: "UPDATED"}}) {
          id, 
          name,
          mutationCheck
        }
      }
    }`;
    const result = await graphql(schema, mutation);
    validateResult(result);
    return expect(result.data.models.Task[0].mutationCheck).toEqual("update");
  });
  it("create - hook variables {rootValue}", async() => {
    const taskModel = {
      name: "Task",
      define: {
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
      },
      options: {
        tableName: "tasks",
        hooks: {
          beforeFind(options) {
            expect(options.rootValue).toBeDefined();
            expect(options.rootValue.req).toEqual("exists", `beforeFind: rootValue: {req: 'exists'} does not match. ${JSON.stringify(options.rootValue)}`);
            return undefined;
          },
          beforeCreate(instance, options) {
            expect(options.rootValue).toBeDefined();
            expect(options.rootValue.req).toEqual("exists", `beforeCreate: rootValue: {req: 'exists'} does not match. ${JSON.stringify(options.rootValue)}`);
            return undefined;
          },
          beforeUpdate(instance, options) {
            expect(false).toEqual(true, "beforeUpdate");
          },
          beforeDestroy(instance, options) {
            expect(false).toEqual(true, "beforeDestroy");
          },
        },
      },
    };

    let instance = new Sequelize("database", "username", "password", {
      dialect: "sqlite",
      logging: false,
    });
    connect([taskModel], instance, {});
    await instance.sync();
    const schema = await createSchema(instance);

    const createMutation = `mutation {
      models {
        Task(create:{name: "CREATED"}) {
          id, 
          name
        }
      }
    }`;
    const createResult = await graphql(schema, createMutation, {req: "exists"});
    validateResult(createResult);
  });
  it("update - hook variables {rootValue}", async() => {
    const taskModel = {
      name: "Task",
      define: {
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
      },
      options: {
        tableName: "tasks",
        hooks: {
          beforeFind(options) {
            expect(options.rootValue).toBeDefined();
            expect(options.rootValue.req).toEqual("exists", `beforeFind: rootValue: {req: 'exists'} does not match. ${JSON.stringify(options.rootValue)}`);
            return undefined;
          },
          beforeUpdate(instance, options) {
            expect(options.rootValue).toBeDefined();
            expect(options.rootValue.req).toEqual("exists", `beforeUpdate: rootValue: {req: 'exists'} does not match. ${JSON.stringify(options.rootValue)}`);
            return undefined;
          },
          beforeDestroy(instance, options) {
            expect(false).toEqual(true, "beforeDestroy");
          },
        },
      },
    };

    let instance = new Sequelize("database", "username", "password", {
      dialect: "sqlite",
      logging: false,
    });
    connect([taskModel], instance, {});
    await instance.sync();
    const {Task} = instance.models;
    const item = await Task.create({
      name: "item2",
    });
    const schema = await createSchema(instance);
    const itemId = toGlobalId("Task", item.id);
    const updateMutation = `mutation {
      models {
        Task(update: {where: {id: "${itemId}"}, input: {name: "UPDATED"}}) {
            id, 
            name
          }
        }
      }`;
    const updateResult = await graphql(schema, updateMutation, {req: "exists"});
    validateResult(updateResult);
  });
  it("delete - hook variables {rootValue, context}", async() => {
    const taskModel = {
      name: "Task",
      define: {
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
      },
      options: {
        tableName: "tasks",
        hooks: {
          beforeFind(options) {
            expect(options.rootValue).toBeDefined();
            expect(options.rootValue.req).toEqual("exists", `beforeFind: rootValue: {req: 'exists'} does not match. ${JSON.stringify(options.rootValue)}`);
            return undefined;
          },
          beforeUpdate(instance, options) {
            expect(false).toEqual(true, "beforeUpdate");
          },
          beforeDestroy(instance, options) {
            expect(options.rootValue).toBeDefined();
            expect(options.rootValue.req).toEqual("exists", `beforeDestroy: rootValue: {req: 'exists'} does not match. ${JSON.stringify(options.rootValue)}`);
            return undefined;
          },
        },
      },
    };

    let instance = new Sequelize("database", "username", "password", {
      dialect: "sqlite",
      logging: false,
    });
    connect([taskModel], instance, {});
    await instance.sync();
    const {Task} = instance.models;
    const item = await Task.create({
      name: "item2",
    });
    const itemId = toGlobalId("Task", item.id);
    const schema = await createSchema(instance);
    const deleteMutation = `mutation {
      models {
        Task(delete: {where: {id: "${itemId}"}}) {
          id
        }
      }
    }`;
    const deleteResult = await graphql(schema, deleteMutation, {req: "exists"});
    validateResult(deleteResult);
  });
  it("create inputs - with no PK defined", async() => {
    const instance = await createSqlInstance();
    const {TaskItem} = instance.models;
    const fields = TaskItem.$sqlgql.define;
    const schema = await createSchema(instance);
    const {data: {__type: {inputFields}}} = await graphql(schema, "query {__type(name:\"TaskRequiredInput\") { inputFields {name} }}");
    const mutationInputFields = inputFields.map(x => x.name);

    Object.keys(fields).map((field) => {
      expect(mutationInputFields).toContain(field);
    });
  });
  it("create inputs - with PK defined", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);
    const mutation = `mutation {
      models {
        Item(create: {name: "item1"}) {
          id, 
          name
        }
      }
    }`;
    const itemResult = await graphql(schema, mutation);
    validateResult(itemResult);
    const {data: {__type: {inputFields}}} = await graphql(schema, "query {__type(name:\"ItemRequiredInput\") { inputFields {name} }}");
    expect(Object.keys(inputFields).filter(x => x.name === "id").length).toBe(0);
  });
  it("create complex object", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);
    const mutation = `mutation {
  models {
    Task(create: { name: "test", items: { create: { name: "testitem" } } }) {
      id
      items {
        edges {
          node {
            id
          }
        }
      }
    }
  }
}`;
    const queryResults = await graphql(schema, mutation);
    validateResult(queryResults);
    expect(queryResults.data.models.Task.length).toEqual(1);
    expect(queryResults.data.models.Task[0].items.edges.length).toEqual(1);
  });
  it("create complex object - hasOne", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);
    const mutation = `mutation {
  models {
    Task(create: {
      name: "test",
      item: { 
        create: { 
          name: "testitem"
        }
      }
    }) {
      id
      item {
        name
      }
      items {
        edges {
          node {
            id
          }
        }
      }
    }
  }
}`;
    const queryResults = await graphql(schema, mutation);
    validateResult(queryResults);
    expect(queryResults.data.models.Task.length).toEqual(1);
    expect(queryResults.data.models.Task[0].item.name).toBeDefined();
  });

});
