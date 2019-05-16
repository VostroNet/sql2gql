import GQL from "../src/index";
import SequelizeAdapter from "../src/adapters/sequelize";
import ItemModel from "./models/item";
import TaskModel from "./models/task";
import TaskItemModel from "./models/task-item";


test("register adapter", () => {
  const gql = new GQL();
  gql.registerAdapter(new SequelizeAdapter({}, {
    dialect: "sqlite",
  }), "sqlite");
  expect(gql.adapters.sqlite).not.toBeUndefined();
});

test("check default adapter", () => {
  const gql = new GQL();
  gql.registerAdapter(new SequelizeAdapter({}, {
    dialect: "sqlite",
  }), "sqlite");
  expect(gql.defaultAdapter).toEqual("sqlite");
});
