import SequelizeAdapter from "../../src/adapters/sequelize";
import ItemModel from "../models/item";
import TaskModel from "../models/task";
import TaskItemModel from "../models/task-item";
import waterfall from "../../src/utils/waterfall";
test("adapter - getORM", () => {
  const sequelizeAdapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  expect(sequelizeAdapter.getORM()).not.toBeUndefined();
});

test("adapter - initialize", async() => {
  const sequelizeAdapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await sequelizeAdapter.initialise();
  expect(sequelizeAdapter.getORM()).not.toBeUndefined();
});

test("adapter - reset", async() => {
  const sequelizeAdapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await sequelizeAdapter.reset();
  expect(sequelizeAdapter.getORM()).not.toBeUndefined();
});

test("adapter - createModel", async() => {
  const sequelizeAdapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await sequelizeAdapter.createModel(TaskModel);

  await sequelizeAdapter.reset();
  expect(sequelizeAdapter.getORM().models.Task).not.toBeUndefined();
});
test("adapter - getModel", async() => {
  const sequelizeAdapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await sequelizeAdapter.createModel(TaskModel);
  await sequelizeAdapter.reset();
  expect(sequelizeAdapter.getModel("Task")).not.toBeUndefined();
});
test("adapter - getModels", async() => {
  const sequelizeAdapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await sequelizeAdapter.createModel(TaskModel);
  await sequelizeAdapter.reset();
  expect(sequelizeAdapter.getModels().Task).not.toBeUndefined();
});
test("adapter - addInstanceFunction", async() => {
  const sequelizeAdapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await sequelizeAdapter.createModel(TaskModel);
  sequelizeAdapter.addInstanceFunction("Task", "test", function() {
    expect(this).toBeInstanceOf(sequelizeAdapter.getModel("Task"));
    return true;
  });
  await sequelizeAdapter.reset();
  const Task = sequelizeAdapter.getModel("Task");
  const task = new Task();
  expect(task.test()).toEqual(true);
});

test("adapter - addStaticFunction", async() => {
  const sequelizeAdapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await sequelizeAdapter.createModel(TaskModel);
  sequelizeAdapter.addStaticFunction("Task", "test", function() {
    return true;
  });
  await sequelizeAdapter.reset();
  const Task = sequelizeAdapter.getModel("Task");
  expect(Task.test()).toEqual(true);
});


test("adapter - createRelationship", async() => {
  const sequelizeAdapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await sequelizeAdapter.createModel(TaskModel);
  await sequelizeAdapter.createModel(TaskItemModel);
  await sequelizeAdapter.createModel(ItemModel);

  await waterfall([TaskModel, TaskItemModel, ItemModel], async(model) => {
    return waterfall(model.relationships, async(rel) => {
      return sequelizeAdapter.createRelationship(model.name, rel.model, rel.name, rel.type, rel.options);
    });
  });

  await sequelizeAdapter.reset();
  expect(sequelizeAdapter.getORM().models.Task).not.toBeUndefined();
  expect(sequelizeAdapter.getORM().models.TaskItem).not.toBeUndefined();
  expect(sequelizeAdapter.getORM().models.Item).not.toBeUndefined();
});


test("adapter - createFunctionForFind", async() => {
  const sequelizeAdapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await sequelizeAdapter.createModel(TaskModel);
  await sequelizeAdapter.reset();
  const Task = sequelizeAdapter.getModel("Task");
  const task = await Task.create({
    name: "ttttttttttttttt",
  });

  const func = await sequelizeAdapter.createFunctionForFind("Task", false);
  const proxyFunc = await func(task.id, "id");
  const result = await proxyFunc();
  expect(result).not.toBeUndefined();
  expect(result).toHaveLength(1);
  expect(result[0].id).toEqual(task.id);
});
test("adapter - getPrimaryKeyNameForModel", async() => {
  const sequelizeAdapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await sequelizeAdapter.createModel(TaskModel);
  await sequelizeAdapter.reset();
  const primaryKeyName = sequelizeAdapter.getPrimaryKeyNameForModel("Task");
  expect(primaryKeyName).toEqual("id");
});
test("adapter - getValueFromInstance", async() => {
  const sequelizeAdapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await sequelizeAdapter.createModel(TaskModel);
  await sequelizeAdapter.reset();
  const model = await sequelizeAdapter.getModel("Task").create({
    name: "111111111111111111",
  });
  expect(sequelizeAdapter.getValueFromInstance(model, "name")).toEqual("111111111111111111");
});
