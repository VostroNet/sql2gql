
import Sequelize from "sequelize";
import sourceMapSupport from "source-map-support";
sourceMapSupport.install();
import expect from "expect";

import {connect} from "../index";
import TaskModel from "./models/task";
import TaskItemModel from "./models/task-item";
import Item from "./models/item";

const schemas = [TaskModel, TaskItemModel, Item];
export function createSqlInstance(options) {
  let instance = new Sequelize("database", "username", "password", {
    dialect: "sqlite",
    logging: false,
  });

  connect(schemas, instance, Object.assign({}, options));
  return instance.sync().then(() => instance);
}

export function validateResult(result) {
  if ((result.errors || []).length > 0) {
    console.log("Graphql Error", result.errors); //eslint-disable-line
  }
  expect(((result || {}).errors || []).length).toEqual(0);
}
