"use strict";

var _expect = require("expect");

var _expect2 = _interopRequireDefault(_expect);

var _utils = require("./utils");

var _graphql = require("graphql");

var _index = require("../index");

var _sequelize = require("sequelize");

var _sequelize2 = _interopRequireDefault(_sequelize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

describe("mutations", () => {
  it("create", _asyncToGenerator(function* () {
    const instance = yield (0, _utils.createSqlInstance)();
    const schema = yield (0, _index.createSchema)(instance);
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
    const mutationResult = yield (0, _graphql.graphql)(schema, mutation);
    (0, _utils.validateResult)(mutationResult);
    const query = "query { models { Task { id, name } } }";
    const queryResult = yield (0, _graphql.graphql)(schema, query);
    (0, _utils.validateResult)(queryResult);
    return (0, _expect2.default)(queryResult.data.models.Task.length).toEqual(1);
  }));
  it("create - override", _asyncToGenerator(function* () {
    const instance = yield (0, _utils.createSqlInstance)();
    const schema = yield (0, _index.createSchema)(instance);
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
    const mutationResult = yield (0, _graphql.graphql)(schema, mutation);
    (0, _utils.validateResult)(mutationResult);
    (0, _expect2.default)(mutationResult.data.models.Task.create.options.hidden).toEqual("nowhere");

    const queryResult = yield (0, _graphql.graphql)(schema, "query { models { Task { id, name, options {hidden} } } }");
    (0, _utils.validateResult)(queryResult);
    return (0, _expect2.default)(queryResult.data.models.Task[0].options.hidden).toEqual("nowhere");
  }));
  it("update - override", _asyncToGenerator(function* () {
    const instance = yield (0, _utils.createSqlInstance)();
    const schema = yield (0, _index.createSchema)(instance);
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
    const createMutationResult = yield (0, _graphql.graphql)(schema, createMutation);
    (0, _utils.validateResult)(createMutationResult);
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
    const updateMutationResult = yield (0, _graphql.graphql)(schema, updateMutation);
    (0, _utils.validateResult)(updateMutationResult);

    const queryResult = yield (0, _graphql.graphql)(schema, "query { models { Task { id, name, options {hidden, hidden2} } } }");
    (0, _utils.validateResult)(queryResult);
    (0, _expect2.default)(queryResult.data.models.Task[0].options.hidden).toEqual("nowhere");
    return (0, _expect2.default)(queryResult.data.models.Task[0].options.hidden2).toEqual("nowhere2");
  }));
  it("update", _asyncToGenerator(function* () {
    const instance = yield (0, _utils.createSqlInstance)();
    const { Task } = instance.models;
    const item = yield Task.create({
      name: "item2"
    });
    const schema = yield (0, _index.createSchema)(instance);

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
    const result = yield (0, _graphql.graphql)(schema, mutation);
    (0, _utils.validateResult)(result);
    return (0, _expect2.default)(result.data.models.Task.update.name).toEqual("UPDATED");
  }));
  it("delete", _asyncToGenerator(function* () {
    const instance = yield (0, _utils.createSqlInstance)();
    const { Task } = instance.models;
    const item = yield Task.create({
      name: "item2"
    });
    const schema = yield (0, _index.createSchema)(instance);

    const mutation = `mutation {
      models {
        Task {
          delete(id: ${item.id}) {
            id
          }
        }
      }
    }`;
    const result = yield (0, _graphql.graphql)(schema, mutation);
    (0, _utils.validateResult)(result);
    (0, _expect2.default)(result.data.models.Task.delete.id).toEqual(1);
    const query = `query { models { Task(where: {id: ${item.id}}) { id, name } } }`;
    const queryResult = yield (0, _graphql.graphql)(schema, query);
    (0, _utils.validateResult)(queryResult);
    return (0, _expect2.default)(queryResult.data.models.Task.length).toEqual(0);
  }));
  it("updateAll", _asyncToGenerator(function* () {
    const instance = yield (0, _utils.createSqlInstance)();
    const { Task } = instance.models;
    const items = yield Promise.all([Task.create({
      name: "item1"
    }), Task.create({
      name: "item2"
    }), Task.create({
      name: "item3"
    })]);
    const schema = yield (0, _index.createSchema)(instance);
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
    const mutationResult = yield (0, _graphql.graphql)(schema, mutation);
    (0, _utils.validateResult)(mutationResult);
    const item2Result = yield (0, _graphql.graphql)(schema, `query { models { Task(where: {id: ${items[1].id}}) { id, name } } }`);
    (0, _utils.validateResult)(item2Result);
    const item3Result = yield (0, _graphql.graphql)(schema, `query { models { Task(where: {id: ${items[2].id}}) { id, name } } }`);
    (0, _utils.validateResult)(item3Result);
    (0, _expect2.default)(item2Result.data.models.Task[0].name).toEqual("UPDATED");
    (0, _expect2.default)(item3Result.data.models.Task[0].name).toEqual("UPDATED");
  }));
  it("deleteAll", _asyncToGenerator(function* () {
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
    const mutation = `mutation {
      models {
        Task {
          deleteAll(where: {name: {in: ["item2", "item3"]}}) {
            id
          }
        }
      }
    }`;
    const result = yield (0, _graphql.graphql)(schema, mutation);
    (0, _utils.validateResult)(result);
    // console.log("result", result.data);
    (0, _expect2.default)(result.data.models.Task.deleteAll.length).toEqual(2);
    const queryResults = yield (0, _graphql.graphql)(schema, "query { models { Task { id, name } } }");
    // console.log("queryResults", queryResults.data.models.Task);
    (0, _expect2.default)(queryResults.data.models.Task.length).toEqual(1);
  }));
  it("classMethod", _asyncToGenerator(function* () {
    const instance = yield (0, _utils.createSqlInstance)();
    const { Task } = instance.models;
    yield Task.create({
      name: "item2"
    });
    const schema = yield (0, _index.createSchema)(instance);

    const mutation = `mutation {
      models {
        Task {
          reverseName(input: {amount: 2}) {
            name
          }
        }
      }
    }`;
    const result = yield (0, _graphql.graphql)(schema, mutation);
    (0, _utils.validateResult)(result);
    return (0, _expect2.default)(result.data.models.Task.reverseName.name).toEqual("reverseName2");
  }));
  it("create - before hook", _asyncToGenerator(function* () {
    const instance = yield (0, _utils.createSqlInstance)();
    const schema = yield (0, _index.createSchema)(instance);
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
    const mutationResult = yield (0, _graphql.graphql)(schema, mutation);
    (0, _utils.validateResult)(mutationResult);
    return (0, _expect2.default)(mutationResult.data.models.Task.create.mutationCheck).toEqual("create");
  }));

  it("update - before hook", _asyncToGenerator(function* () {
    const instance = yield (0, _utils.createSqlInstance)();
    const { Task } = instance.models;
    const item = yield Task.create({
      name: "item2"
    });
    const schema = yield (0, _index.createSchema)(instance);

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
    const result = yield (0, _graphql.graphql)(schema, mutation);
    (0, _utils.validateResult)(result);
    return (0, _expect2.default)(result.data.models.Task.update.mutationCheck).toEqual("update");
  }));
  it("create - hook variables {rootValue}", _asyncToGenerator(function* () {
    const taskModel = {
      name: "Task",
      define: {
        name: {
          type: _sequelize2.default.STRING,
          allowNull: false
        }
      },
      options: {
        tableName: "tasks",
        hooks: {
          beforeFind(options) {
            (0, _expect2.default)(options.rootValue).toBeDefined();
            (0, _expect2.default)(options.rootValue.req).toEqual("exists", `beforeFind: rootValue: {req: 'exists'} does not match. ${JSON.stringify(options.rootValue)}`);
            return undefined;
          },
          beforeCreate(instance, options) {
            (0, _expect2.default)(options.rootValue).toBeDefined();
            (0, _expect2.default)(options.rootValue.req).toEqual("exists", `beforeCreate: rootValue: {req: 'exists'} does not match. ${JSON.stringify(options.rootValue)}`);
            return undefined;
          },
          beforeUpdate(instance, options) {
            (0, _expect2.default)(false).toEqual(true, "beforeUpdate");
          },
          beforeDestroy(instance, options) {
            (0, _expect2.default)(false).toEqual(true, "beforeDestroy");
          }
        }
      }
    };

    let instance = new _sequelize2.default("database", "username", "password", {
      dialect: "sqlite",
      logging: false
    });
    (0, _index.connect)([taskModel], instance, {});
    yield instance.sync();
    const schema = yield (0, _index.createSchema)(instance);

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
    const createResult = yield (0, _graphql.graphql)(schema, createMutation, { req: "exists" });
    (0, _utils.validateResult)(createResult);
  }));
  it("update - hook variables {rootValue}", _asyncToGenerator(function* () {
    const taskModel = {
      name: "Task",
      define: {
        name: {
          type: _sequelize2.default.STRING,
          allowNull: false
        }
      },
      options: {
        tableName: "tasks",
        hooks: {
          beforeFind(options) {
            (0, _expect2.default)(options.rootValue).toBeDefined();
            (0, _expect2.default)(options.rootValue.req).toEqual("exists", `beforeFind: rootValue: {req: 'exists'} does not match. ${JSON.stringify(options.rootValue)}`);
            return undefined;
          },
          beforeUpdate(instance, options) {
            (0, _expect2.default)(options.rootValue).toBeDefined();
            (0, _expect2.default)(options.rootValue.req).toEqual("exists", `beforeUpdate: rootValue: {req: 'exists'} does not match. ${JSON.stringify(options.rootValue)}`);
            return undefined;
          },
          beforeDestroy(instance, options) {
            (0, _expect2.default)(false).toEqual(true, "beforeDestroy");
          }
        }
      }
    };

    let instance = new _sequelize2.default("database", "username", "password", {
      dialect: "sqlite",
      logging: false
    });
    (0, _index.connect)([taskModel], instance, {});
    yield instance.sync();
    const { Task } = instance.models;
    const item = yield Task.create({
      name: "item2"
    });
    const schema = yield (0, _index.createSchema)(instance);
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
    const updateResult = yield (0, _graphql.graphql)(schema, updateMutation, { req: "exists" });
    (0, _utils.validateResult)(updateResult);
  }));
  it("delete - hook variables {rootValue, context}", _asyncToGenerator(function* () {
    const taskModel = {
      name: "Task",
      define: {
        name: {
          type: _sequelize2.default.STRING,
          allowNull: false
        }
      },
      options: {
        tableName: "tasks",
        hooks: {
          beforeFind(options) {
            (0, _expect2.default)(options.rootValue).toBeDefined();
            (0, _expect2.default)(options.rootValue.req).toEqual("exists", `beforeFind: rootValue: {req: 'exists'} does not match. ${JSON.stringify(options.rootValue)}`);
            return undefined;
          },
          beforeUpdate(instance, options) {
            (0, _expect2.default)(false).toEqual(true, "beforeUpdate");
          },
          beforeDestroy(instance, options) {
            (0, _expect2.default)(options.rootValue).toBeDefined();
            (0, _expect2.default)(options.rootValue.req).toEqual("exists", `beforeDestroy: rootValue: {req: 'exists'} does not match. ${JSON.stringify(options.rootValue)}`);
            return undefined;
          }
        }
      }
    };

    let instance = new _sequelize2.default("database", "username", "password", {
      dialect: "sqlite",
      logging: false
    });
    (0, _index.connect)([taskModel], instance, {});
    yield instance.sync();
    const { Task } = instance.models;
    const item = yield Task.create({
      name: "item2"
    });
    const schema = yield (0, _index.createSchema)(instance);
    const deleteMutation = `mutation {
      models {
        Task {
          delete(id: ${item.id}) {
            id
          }
        }
      }
    }`;
    const deleteResult = yield (0, _graphql.graphql)(schema, deleteMutation, { req: "exists" });
    (0, _utils.validateResult)(deleteResult);
  }));
});
//# sourceMappingURL=mutation.test.js.map
