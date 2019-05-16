import SequelizeAdapter from "../../src/adapters/sequelize/index";
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

test("adapter - addModel", async() => {
  const sequelizeAdapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await sequelizeAdapter.addModel(TaskModel);

  await sequelizeAdapter.reset();
  expect(sequelizeAdapter.getORM().models.Task).not.toBeUndefined();
});
test("adapter - getModel", async() => {
  const sequelizeAdapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await sequelizeAdapter.addModel(TaskModel);
  await sequelizeAdapter.reset();
  expect(sequelizeAdapter.getModel("Task")).not.toBeUndefined();
});
test("adapter - getModels", async() => {
  const sequelizeAdapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await sequelizeAdapter.addModel(TaskModel);
  await sequelizeAdapter.reset();
  expect(sequelizeAdapter.getModels().Task).not.toBeUndefined();
});
test("adapter - addInstanceFunction", async() => {
  const sequelizeAdapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await sequelizeAdapter.addModel(TaskModel);
  sequelizeAdapter.addInstanceFunction("Task", "test", () => {
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
  await sequelizeAdapter.addModel(TaskModel);
  sequelizeAdapter.addStaticFunction("Task", "test", () => {
    return true;
  });
  await sequelizeAdapter.reset();
  const Task = sequelizeAdapter.getModel("Task");
  expect(Task.test()).toEqual(true);
});


test("adapter - addRelationships", async() => {
  const sequelizeAdapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await sequelizeAdapter.addModel(TaskModel);
  await sequelizeAdapter.addModel(TaskItemModel);
  await sequelizeAdapter.addModel(ItemModel);

  await waterfall([TaskModel, TaskItemModel, ItemModel], async(model) => {
    return waterfall(model.relationships, async(rel) => {
      return sequelizeAdapter.addRelationship(model.name, rel.model, rel.name, rel.type, rel.options);
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
  await sequelizeAdapter.addModel(TaskModel);
  await sequelizeAdapter.reset();
  const Task = sequelizeAdapter.getModel("Task");
  const task = await Task.create({
    name: "ttttttttttttttt",
  });

  const func = await sequelizeAdapter.createFunctionForFind("Task", "hasMany");
  const proxyFunc = await func(task.id);
  const result = await proxyFunc();
  expect(result).not.toBeUndefined();
  expect(result).toHaveLength(1);
  expect(result[0].id).toEqual(task.id);
  // const Task = sequelizeAdapter.getModel("Task");
  // expect(Task.test()).toEqual(true);
});
