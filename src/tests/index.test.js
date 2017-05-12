import expect from "expect";
// import deepFreeze from "deep-freeze";
import Sequelize from "sequelize";
import sourceMapSupport from "source-map-support";
sourceMapSupport.install();

import {graphql} from "graphql";

import logger from "utils/logger";
const log = logger("seeql::tests:index:");

import {connect, createSchema} from "../index";
import TaskModel from "./models/task";
import TaskItemModel from "./models/task-item";

const schemas = [TaskModel, TaskItemModel];

function createSqlInstance() {
  let instance = new Sequelize("database", "username", "password", {
    dialect: "sqlite",
  });
  connect(schemas, instance, {});
  return instance.sync().then(() => instance);
}


describe("index test", () => {
  it("basic query test", () => {
    return createSqlInstance().then((instance) => {
      const {Task} = instance.models;
      return Promise.all([
        Task.create({
          name: "item1",
        }),
        Task.create({
          name: "item2",
        }),
        Task.create({
          name: "item3",
        }),
      ]).then(() => {
        const schema = createSchema(instance);
        return graphql(schema, "query { models { Task { id, name } } }").then((result) => {
          return expect(result.data.models.Task.length).toEqual(3);
        });
      });
    });
  });
});





// function createInstance() {
//   const {host, username, password, database, debug, dialect, pool, sync} = config.database;
//   const db = new Sequelize(database, username, password, {
//     host: host,
//     dialect: dialect,
//     logging: (args) => {
//       if (debug) {
//         log.info(args);
//       }
//     },
//     pool: Object.assign({}, pool, {
//       max: 20,
//       min: 0,
//       idle: 10000,
//     }),
//     paranoid: true,
//     timestamps: true,
//   });
//   let models = loadSchemas(db);
//   db.models = models;
//   return db.sync(sync);
// }


// let instance;
// export function getDatabase() {
//   if (instance) {
//     return Promise.resolve(instance);
//   }
//   return createInstance().then((db) => {
//     instance = db;
//     return instance;
//   });
// }


