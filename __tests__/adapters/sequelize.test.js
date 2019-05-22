import SequelizeAdapter from "../../src/adapters/sequelize";
import ItemModel from "../models/item";
import TaskModel from "../models/task";
import TaskItemModel from "../models/task-item";
import waterfall from "../../src/utils/waterfall";
import Sequelize from "sequelize";
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

test("adapter - createRelationship - belongsToMany", async() => {
  const sequelizeAdapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  const itemDef = {
    name: "Item",
    define: {
      "name": {
        type: Sequelize.STRING,
        comment: "This is the name!",
        defaultValue: "test",
        allowNull: false,
      }
    },
    relationships: [{
      type: "belongsToMany",
      model: "ItemChild",
      name: "children",
      options: {
        through: {
          model: "ItemChildMap"
        },
        as: "children",
        foreignKey: "itemId",
      },
    }],
  };
  const itemChildMapDef = {
    name: "ItemChildMap",
    define: {},
    relationships: [{
      type: "belongsTo",
      model: "Item",
      name: "item",
      options: {
        as: "item",
        foreignKey: "itemId",
      },
    }],
  };
  const itemChildDef = {
    name: "ItemChild",
    define: {},
    relationships: [{
      type: "belongsToMany",
      model: "Item",
      name: "parents",
      options: {
        through: {
          model: "ItemChildMap"
        },
        as: "parents",
        foreignKey: "itemChildId",
      },
    }],
  };

  await sequelizeAdapter.createModel(itemDef);
  await sequelizeAdapter.createModel(itemChildMapDef);
  await sequelizeAdapter.createModel(itemChildDef);

  await waterfall([itemDef, itemChildMapDef, itemChildDef], async(model) => {
    return waterfall(model.relationships, async(rel) => {
      return sequelizeAdapter.createRelationship(model.name, rel.model, rel.name, rel.type, rel.options);
    });
  });

  await sequelizeAdapter.reset();
  const {models} = sequelizeAdapter.getORM();
  expect(models.Item).toBeDefined();
  expect(models.ItemChildMap).toBeDefined();
  expect(models.ItemChild).toBeDefined();
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



test("adapter - getFields - primary key", async() => {
  const sequelizeAdapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  const itemDef = {
    name: "Item",
    define: {},
    relationships: [],
  };
  await sequelizeAdapter.createModel(itemDef);
  await sequelizeAdapter.reset();
  const ItemFields = sequelizeAdapter.getFields("Item");
  expect(ItemFields).toBeDefined();
  expect(ItemFields.id).toBeDefined();
  expect(ItemFields.id.primaryKey).toEqual(true);
  expect(ItemFields.id.autoPopulated).toEqual(true);
  expect(ItemFields.id.allowNull).toEqual(false);
  expect(ItemFields.id.type).toBeInstanceOf(Sequelize.INTEGER);
});

test("adapter - getFields - define field", async() => {
  const sequelizeAdapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  const itemDef = {
    name: "Item",
    define: {
      "name": {
        type: Sequelize.STRING,
        comment: "This is the name!",
        defaultValue: "test",
        allowNull: false,
      }
    },
    relationships: [],
  };
  await sequelizeAdapter.createModel(itemDef);
  await sequelizeAdapter.reset();
  const ItemFields = sequelizeAdapter.getFields("Item");
  expect(ItemFields).toBeDefined();
  expect(ItemFields.name).toBeDefined();
  expect(ItemFields.name.type).toBeInstanceOf(Sequelize.STRING);
  expect(ItemFields.name.allowNull).toEqual(false);
  expect(ItemFields.name.description).toEqual(itemDef.define.name.comment);
  expect(ItemFields.name.defaultValue).toEqual(itemDef.define.name.defaultValue);
});

test("adapter - getFields - relationship foreign keys", async() => {
  const sequelizeAdapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  const itemDef = {
    name: "Item",
    define: {},
    relationships: [{
      type: "hasMany",
      model: "ItemChild",
      name: "children",
      options: {
        as: "children",
        foreignKey: "parentId",
      },
    }],
  };
  const itemChildDef = {
    name: "ItemChild",
    define: {},
    relationships: [{
      type: "belongsTo",
      model: "Item",
      name: "parent",
      options: {
        as: "parent",
        foreignKey: "parentId",
      },
    }],
  };
  await sequelizeAdapter.createModel(itemDef);
  await sequelizeAdapter.createModel(itemChildDef);
  await waterfall(itemDef.relationships, async(rel) => {
    return sequelizeAdapter.createRelationship(itemDef.name, rel.model, rel.name, rel.type, rel.options);
  });
  await waterfall(itemChildDef.relationships, async(rel) => {
    return sequelizeAdapter.createRelationship(itemChildDef.name, rel.model, rel.name, rel.type, rel.options);
  });
  await sequelizeAdapter.reset();
  const fields = sequelizeAdapter.getFields("ItemChild");
  expect(fields).toBeDefined();
  expect(fields.parentId).toBeDefined();
  expect(fields.parentId.foreignKey).toEqual(true);
  expect(fields.parentId.foreignTarget).toEqual("Item");
  expect(fields.parentId.type).toBeInstanceOf(Sequelize.INTEGER);
});


test("adapter - getFields - relationship not null foreign keys", async() => {
  const sequelizeAdapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  const itemDef = {
    name: "Item",
    define: {
      "parentId": {
        type: Sequelize.INTEGER,
        comment: "This is the foreign key!",
        allowNull: false,
      }
    },
    relationships: [{
      type: "hasMany",
      model: "Item",
      name: "children",
      options: {
        as: "children",
        foreignKey: "parentId",
      },
    }, {
      type: "belongsTo",
      model: "Item",
      name: "parent",
      options: {
        as: "parent",
        foreignKey: "parentId",
      },
    }],
  };
  await sequelizeAdapter.createModel(itemDef);
  await waterfall(itemDef.relationships, async(rel) => {
    return sequelizeAdapter.createRelationship(itemDef.name, rel.model, rel.name, rel.type, rel.options);
  });
  await sequelizeAdapter.reset();
  const ItemFields = sequelizeAdapter.getFields("Item");
  expect(ItemFields).toBeDefined();
  expect(ItemFields.parentId).toBeDefined();
  expect(ItemFields.parentId.allowNull).toEqual(false);
  expect(ItemFields.parentId.foreignKey).toEqual(true);
  expect(ItemFields.parentId.foreignTarget).toEqual("Item");
  expect(ItemFields.parentId.description).toEqual(itemDef.define.parentId.comment);
  expect(ItemFields.parentId.type).toBeInstanceOf(Sequelize.INTEGER);
});


test("adapter - getFields - timestamp fields", async() => {
  const sequelizeAdapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  const itemDef = {
    name: "Item",
    define: {
      "name": {
        type: Sequelize.STRING,
        comment: "This is the name!",
        defaultValue: "test",
        allowNull: false,
      }
    },
    relationships: [{
      type: "hasMany",
      model: "Item",
      name: "children",
      options: {
        as: "children",
        foreignKey: "parentId",
      },
    }, {
      type: "belongsTo",
      model: "Item",
      name: "parent",
      options: {
        as: "parent",
        foreignKey: "parentId",
      },
    }],
  };
  await sequelizeAdapter.createModel(itemDef);
  await waterfall(itemDef.relationships, async(rel) => {
    return sequelizeAdapter.createRelationship(itemDef.name, rel.model, rel.name, rel.type, rel.options);
  });
  await sequelizeAdapter.reset();
  const ItemFields = sequelizeAdapter.getFields("Item");
  expect(ItemFields).toBeDefined();
  expect(ItemFields.createdAt).toBeDefined();
  expect(ItemFields.createdAt.type).toBeInstanceOf(Sequelize.DATE);
  expect(ItemFields.createdAt.allowNull).toEqual(false);
  expect(ItemFields.createdAt.autoPopulated).toEqual(true);
});
