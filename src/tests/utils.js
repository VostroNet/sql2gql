
import Sequelize from "sequelize";
import sourceMapSupport from "source-map-support";
sourceMapSupport.install();

import {connect} from "../index";
import TaskModel from "./models/task";
import TaskItemModel from "./models/task-item";

const schemas = [TaskModel, TaskItemModel];
export function createSqlInstance() {
  let instance = new Sequelize("database", "username", "password", {
    dialect: "sqlite",
    logging: false
  });
  connect(schemas, instance, {});
  return instance.sync().then(() => instance);
}
