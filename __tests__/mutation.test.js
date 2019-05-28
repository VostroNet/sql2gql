import expect from "expect";
import {createInstance, validateResult} from "./helper";
import {graphql} from "graphql";
// import {createSchema} from "../src/graphql/index";
import Sequelize from "sequelize";
import {toGlobalId} from "graphql-relay";
import SequelizeAdapter from "../src/adapters/sequelize";
import Database from "../src/manager";
import {createSchema} from "../src/graphql/index";

Sequelize.Promise = global.Promise;

describe("mutations", () => {
  it("create", async() => {
    const instance = await createInstance();
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
    return expect(queryResult.data.models.Task.edges).toHaveLength(1);
  });
  it("create - override", async() => {
    const instance = await createInstance();
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
    const instance = await createInstance();
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
    const instance = await createInstance();
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
    const instance = await createInstance();
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
    return expect(queryResult.data.models.Task.edges).toHaveLength(0);
  });
  it("update - multiple", async() => {
    const instance = await createInstance();
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
    const instance = await createInstance();
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
    expect(result.data.models.Task).toHaveLength(2);
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
    expect(queryResults.data.models.Task.edges).toHaveLength(1);
  });
  it("classMethod", async() => {
    const instance = await createInstance();
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
    const instance = await createInstance();
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
    const instance = await createInstance();
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
            expect(options.getGraphQLArgs).toBeDefined();
            expect(options.getGraphQLArgs).toBeInstanceOf(Function);
            const args = options.getGraphQLArgs();
            expect(args.info).toBeDefined();
            expect(args.info.rootValue).toBeDefined();
            expect(args.info.rootValue.req).toEqual("exists", `beforeFind: rootValue: {req: 'exists'} does not match. ${JSON.stringify(args.info.rootValue)}`);
            return undefined;
          },
          beforeCreate(instance, options) {
            expect(options.getGraphQLArgs).toBeDefined();
            expect(options.getGraphQLArgs).toBeInstanceOf(Function);
            const args = options.getGraphQLArgs();
            expect(args.info.rootValue).toBeDefined();
            expect(args.info.rootValue.req).toEqual("exists", `beforeCreate: rootValue: {req: 'exists'} does not match. ${JSON.stringify(args.info.rootValue)}`);
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
    const db = new Database();
    db.registerAdapter(new SequelizeAdapter({}, {
      dialect: "sqlite",
    }), "sqlite");
    db.addDefinition(taskModel);
    await db.initialise({reset: true});
    const schema = await createSchema(db);

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
            expect(options.getGraphQLArgs).toBeDefined();
            expect(options.getGraphQLArgs).toBeInstanceOf(Function);
            const args = options.getGraphQLArgs();
            expect(args.info).toBeDefined();
            expect(args.info.rootValue).toBeDefined();
            expect(args.info.rootValue.req).toEqual("exists", `beforeFind: rootValue: {req: 'exists'} does not match. ${JSON.stringify(args.info.rootValue)}`);
            return undefined;
          },
          beforeUpdate(instance, options) {
            expect(options.getGraphQLArgs).toBeDefined();
            expect(options.getGraphQLArgs).toBeInstanceOf(Function);
            const args = options.getGraphQLArgs();
            expect(args.info).toBeDefined();
            expect(args.info.rootValue).toBeDefined();
            expect(args.info.rootValue.req).toEqual("exists", `beforeUpdate: rootValue: {req: 'exists'} does not match. ${JSON.stringify(args.info.rootValue)}`);
            return undefined;
          },
          beforeDestroy(instance, options) {
            expect(false).toEqual(true, "beforeDestroy");
          },
        },
      },
    };

    const db = new Database();
    db.registerAdapter(new SequelizeAdapter({}, {
      dialect: "sqlite",
    }), "sqlite");
    db.addDefinition(taskModel);
    await db.initialise({reset: true});
    const {Task} = db.models;
    const item = await Task.create({
      name: "item2",
    });
    const schema = await createSchema(db);

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
            expect(options.getGraphQLArgs).toBeDefined();
            expect(options.getGraphQLArgs).toBeInstanceOf(Function);
            const args = options.getGraphQLArgs();
            expect(args.info).toBeDefined();
            expect(args.info.rootValue).toBeDefined();
            expect(args.info.rootValue.req).toEqual("exists", `beforeFind: rootValue: {req: 'exists'} does not match. ${JSON.stringify(args.info.rootValue)}`);
            return undefined;
          },
          beforeUpdate(instance, options) {
            expect(false).toEqual(true, "beforeUpdate");
            // return instance;
          },
          beforeDestroy(instance, options) {
            expect(options.getGraphQLArgs).toBeDefined();
            expect(options.getGraphQLArgs).toBeInstanceOf(Function);
            const args = options.getGraphQLArgs();
            expect(args.info).toBeDefined();
            expect(args.info.rootValue).toBeDefined();
            expect(args.info.rootValue.req).toEqual("exists", `beforeDestroy: rootValue: {req: 'exists'} does not match. ${JSON.stringify(args.info.rootValue)}`);
            return instance;
          },
        },
      },
    };
    const db = new Database();
    db.registerAdapter(new SequelizeAdapter({}, {
      dialect: "sqlite",
    }), "sqlite");
    db.addDefinition(taskModel);
    await db.initialise({reset: true});
    const {Task} = db.models;
    const item = await Task.create({
      name: "item2",
    });
    const itemId = toGlobalId("Task", item.id);
    const schema = await createSchema(db);
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
    const instance = await createInstance();
    const {TaskItem} = instance.models;
    const fields = instance.getFields("Task"); //TaskItem.$sqlgql.define;
    const schema = await createSchema(instance);
    const {data: {__type: {inputFields}}} = await graphql(schema, "query {__type(name:\"TaskRequiredInput\") { inputFields {name} }}");
    const mutationInputFields = inputFields.map(x => x.name);

    Object.keys(fields).map((field) => {
      expect(mutationInputFields).toContain(field);
    });
  });
  it("create inputs - with PK defined", async() => {
    const instance = await createInstance();
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
    expect(Object.keys(inputFields).filter(x => x.name === "id")).toHaveLength(0);
  });
  it("create complex object", async() => {
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
          }
        }
      }
    }
  }
}`;
    const queryResults = await graphql(schema, mutation);
    validateResult(queryResults);
    expect(queryResults.data.models.Task).toHaveLength(1);
    expect(queryResults.data.models.Task[0].items.edges).toHaveLength(1);
  });
  it("create complex object - hasOne", async() => {
    const instance = await createInstance();
    const schema = await createSchema(instance);
    const mutation = `mutation {
      models {
        Item(create: {
          name: "test",
          hasOne: {
            create: { 
              name: "testitem"
            }
          }
        }) {
          id
          hasOne {
            id
            name
            hasOneId
          }
        }
      }
    }`;
    const queryResults = await graphql(schema, mutation);
    validateResult(queryResults);
    expect(queryResults.data.models.Item).toHaveLength(1);
    const item = queryResults.data.models.Item[0];
    const {hasOne} = item;
    expect(item.id).toEqual(hasOne.hasOneId);
  });
  it("create complex object - belongsTo", async() => {
    const instance = await createInstance();
    const schema = await createSchema(instance);
    const mutation = `mutation {
      models {
        Item(create: {
          name: "test",
          belongsTo: {
            create: { 
              name: "testitem2"
            }
          }
        }) {
          id
          belongsTo {
            id
            name
          }
          belongsToId
        }
      }
    }`;
    const queryResults = await graphql(schema, mutation);
    validateResult(queryResults);
    expect(queryResults.data.models.Item).toHaveLength(1);
    const item = queryResults.data.models.Item[0];
    const {belongsTo} = item;
    expect(item.belongsToId).toEqual(belongsTo.id);
  });
  it("add - multiple", async() => {
    const instance = await createInstance();
    const {Task, TaskItem} = instance.models;
    const startTask = await Task.create({
      name: "start",
    });
    const endTask = await Task.create({
      name: "end",
    });
    await TaskItem.create({
      name: "item000001",
      taskId: startTask.get("id"),
    });
    await TaskItem.create({
      name: "item000002",
      taskId: startTask.get("id"),
    });
    await TaskItem.create({
      name: "item000003",
      taskId: startTask.get("id"),
    });
    const schema = await createSchema(instance);
    const mutation = `mutation {
      models {
        Task(update: {
          where: {
            name: "end" 
          },
          input: {
            items: {
              add: {
                name: {
                  in: ["item000002", "item000003"]
                }
              }
            }
          }
        }) {
          id
          items {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      }
    }`;
    const result = await graphql(schema, mutation);
    validateResult(result);
    expect(result.data.models.Task).toHaveLength(1);
    const queryResults = await graphql(schema, `{
      models {
        Task(where: {name: "start"}) {
          edges {
            node {
              id
              name
              items {
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
    expect(queryResults.data.models.Task.edges).toHaveLength(1);
    expect(queryResults.data.models.Task.edges[0].node.items.edges).toHaveLength(1);
    const endQueryResults = await graphql(schema, `{
      models {
        Task(where: {name: "end"}) {
          edges {
            node {
              id
              name
              items {
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
    expect(endQueryResults.data.models.Task.edges).toHaveLength(1);
    expect(endQueryResults.data.models.Task.edges[0].node.items.edges).toHaveLength(2);
  });
  it("remove - multiple", async() => {
    const instance = await createInstance();
    const {Task, TaskItem} = instance.models;
    const startTask = await Task.create({
      name: "start",
    });
    await TaskItem.create({
      name: "item000001",
      taskId: startTask.get("id"),
    });
    await TaskItem.create({
      name: "item000002",
      taskId: startTask.get("id"),
    });
    await TaskItem.create({
      name: "item000003",
      taskId: startTask.get("id"),
    });
    const schema = await createSchema(instance);
    const mutation = `mutation {
      models {
        Task(update: {
          where: {
            name: "start" 
          },
          input: {
            items: {
              remove: {
                name: {
                  in: ["item000002", "item000003"]
                }
              }
            }
          }
        }) {
          id
          items {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      }
    }`;
    const result = await graphql(schema, mutation);
    validateResult(result);
    expect(result.data.models.Task).toHaveLength(1);
    const queryResults = await graphql(schema, `{
      models {
        Task(where: {name: "start"}) {
          edges {
            node {
              id
              name
              items {
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
    expect(queryResults.data.models.Task.edges).toHaveLength(1);
    expect(queryResults.data.models.Task.edges[0].node.items.edges).toHaveLength(1);
  });
});
