import expect from "expect";
import {createSqlInstance, validateResult} from "./utils";
import {graphql} from "graphql";
import {createSchema, connect} from "../index";
import Sequelize from "sequelize";

describe("mutations", () => {
  it("create", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);
    const mutation = `mutation {
      models {
        Task {
          create(input: {name: "item1"}) {
            id, 
            name
          }
        }
      }
    }`;
    const mutationResult = await graphql(schema, mutation);
    validateResult(mutationResult);
    const query = "query { models { Task { id, name } } }";
    const queryResult = await graphql(schema, query);
    validateResult(queryResult);
    return expect(queryResult.data.models.Task.length).toEqual(1);
  });
  it("create - override", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);
    const mutation = `mutation {
      models {
        Task {
          create(input: {name: "item1", options: {hidden: "nowhere"}}) {
            id, 
            name
            options {
              hidden
            }
          }
        }
      }
    }`;
    const mutationResult = await graphql(schema, mutation);
    validateResult(mutationResult);
    expect(mutationResult.data.models.Task.create.options.hidden).toEqual("nowhere");

    const queryResult = await graphql(schema, "query { models { Task { id, name, options {hidden} } } }");
    validateResult(queryResult);
    return expect(queryResult.data.models.Task[0].options.hidden).toEqual("nowhere");
  });
  it("update - override", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);
    const createMutation = `mutation {
      models {
        Task {
          create(input: {name: "item1", options: {hidden: "nowhere"}}) {
            id, 
            name
            options {
              hidden
            }
          }
        }
      }
    }`;
    const createMutationResult = await graphql(schema, createMutation);
    validateResult(createMutationResult);
    const id = createMutationResult.data.models.Task.create.id;

    const updateMutation = `mutation {
      models {
        Task {
          update(id: ${id}, input: {options: {hidden2: "nowhere2"}}) {
            id, 
            name
            options {
              hidden
              hidden2
            }
          }
        }
      }
    }`;
    const updateMutationResult = await graphql(schema, updateMutation);
    validateResult(updateMutationResult);

    const queryResult = await graphql(schema, "query { models { Task { id, name, options {hidden, hidden2} } } }");
    validateResult(queryResult);
    expect(queryResult.data.models.Task[0].options.hidden).toEqual("nowhere");
    return expect(queryResult.data.models.Task[0].options.hidden2).toEqual("nowhere2");
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
        Task {
          update(id: ${item.id}, input: {name: "UPDATED"}) {
            id, 
            name
          }
        }
      }
    }`;
    const result = await graphql(schema, mutation);
    validateResult(result);
    return expect(result.data.models.Task.update.name).toEqual("UPDATED");
  });
  it("delete", async() => {
    const instance = await createSqlInstance();
    const {Task} = instance.models;
    const item = await Task.create({
      name: "item2",
    });
    const schema = await createSchema(instance);

    const mutation = `mutation {
      models {
        Task {
          delete(id: ${item.id}) {
            id
          }
        }
      }
    }`;
    const result = await graphql(schema, mutation);
    validateResult(result);
    expect(result.data.models.Task.delete.id).toEqual(1);
    const query = `query { models { Task(where: {id: ${item.id}}) { id, name } } }`;
    const queryResult = await graphql(schema, query);
    validateResult(queryResult);
    return expect(queryResult.data.models.Task.length).toEqual(0);
  });
  it("updateAll", async() => {
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
        Task {
          updateAll(where: {name: {in: ["item2", "item3"]}}, input: {name: "UPDATED"}) {
            id, 
            name
          }
        }
      }
    }`;
    const mutationResult = await graphql(schema, mutation);
    validateResult(mutationResult);
    const item2Result = await graphql(schema, `query { models { Task(where: {id: ${items[1].id}}) { id, name } } }`);
    validateResult(item2Result);
    const item3Result = await graphql(schema, `query { models { Task(where: {id: ${items[2].id}}) { id, name } } }`);
    validateResult(item3Result);
    expect(item2Result.data.models.Task[0].name).toEqual("UPDATED");
    expect(item3Result.data.models.Task[0].name).toEqual("UPDATED");
  });
  it("deleteAll", async() => {
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
        Task {
          deleteAll(where: {name: {in: ["item2", "item3"]}}) {
            id
          }
        }
      }
    }`;
    const result = await graphql(schema, mutation);
    validateResult(result);
    // console.log("result", result.data);
    expect(result.data.models.Task.deleteAll.length).toEqual(2);
    const queryResults = await graphql(schema, "query { models { Task { id, name } } }");
    // console.log("queryResults", queryResults.data.models.Task);
    expect(queryResults.data.models.Task.length).toEqual(1);
  });
  it("classMethod", async() => {
    const instance = await createSqlInstance();
    const {Task} = instance.models;
    await Task.create({
      name: "item2",
    });
    const schema = await createSchema(instance);

    const mutation = `mutation {
      models {
        Task {
          reverseName(input: {amount: 2}) {
            name
          }
        }
      }
    }`;
    const result = await graphql(schema, mutation);
    validateResult(result);
    return expect(result.data.models.Task.reverseName.name).toEqual("reverseName2");
  });
  it("create - before hook", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);
    const mutation = `mutation {
      models {
        Task {
          create(input: {name: "item1"}) {
            id, 
            name,
            mutationCheck
          }
        }
      }
    }`;
    const mutationResult = await graphql(schema, mutation);
    validateResult(mutationResult);
    return expect(mutationResult.data.models.Task.create.mutationCheck).toEqual("create");
  });

  it("update - before hook", async() => {
    const instance = await createSqlInstance();
    const {Task} = instance.models;
    const item = await Task.create({
      name: "item2",
    });
    const schema = await createSchema(instance);

    const mutation = `mutation {
      models {
        Task {
          update(id: ${item.id}, input: {name: "UPDATED"}) {
            id, 
            name,
            mutationCheck
          }
        }
      }
    }`;
    const result = await graphql(schema, mutation);
    validateResult(result);
    return expect(result.data.models.Task.update.mutationCheck).toEqual("update");
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
        Task {
          create(input: {name: "CREATED"}) {
            id, 
            name
          }
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
    const updateMutation = `mutation {
      models {
        Task {
          update(id: ${item.id}, input: {name: "UPDATED"}) {
            id, 
            name
          }
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
    const schema = await createSchema(instance);
    const deleteMutation = `mutation {
      models {
        Task {
          delete(id: ${item.id}) {
            id
          }
        }
      }
    }`;
    const deleteResult = await graphql(schema, deleteMutation, {req: "exists"});
    validateResult(deleteResult);
  });
  // it("create", async() => {
  //   const instance = await createSqlInstance();
  //   // const {Task} = instance.models;
  //   // const item = await Task.create({
  //   //   name: "item2",
  //   // });
  //   const schema = await createSchema(instance);



  //   const mutation = `mutation {
  //     models {
  //       Task {
  //         create(input: {name: "CREATED"}) {
  //           id, 
  //           name
  //           relationships 

  //           items(type: "create", ) {
  //             create(input: {
  //               name: "ITEM1"
  //             }) {
  //               id,
  //               name
  //             }
  //           }
  //         }
  //       }
  //     }
  //   }`;
  //   const result = await graphql(schema, mutation);
  //   validateResult(result);
  //   return expect(result.data.models.Task.update.name).toEqual("UPDATED");
  // });
});
