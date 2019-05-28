
import Database from "../../src/manager";
import SequelizeAdapter from "../../src/adapters/sequelize";

import TaskModel from "./models/task";
import TaskItemModel from "./models/task-item";
import Item from "./models/item";


export async function createInstance() {
  const db = new Database();
  db.registerAdapter(new SequelizeAdapter({}, {
    dialect: "sqlite",
  }), "sqlite");
  db.addDefinition(TaskModel);
  db.addDefinition(TaskItemModel);
  db.addDefinition(Item);
  await db.initialise();
  return db;
}


export function validateResult(result) {
  if ((result.errors || []).length > 0) {
    console.log("Graphql Error", result.errors); //eslint-disable-line
    throw result.errors[0];
  }
  expect(((result || {}).errors || []).length).toEqual(0);
}
