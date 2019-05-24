import SequelizeAdapter from "../../src/adapters/sequelize";
import ItemModel from "../helper/models/item";
import TaskModel from "../helper/models/task";
import TaskItemModel from "../helper/models/task-item";
import waterfall from "../../src/utils/waterfall";
import Sequelize from "sequelize";
import jsonType from "@vostro/graphql-types/lib/json";

test("adapter - getORM", () => {
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  expect(adapter.getORM()).not.toBeUndefined();
});

test("adapter - initialize", async() => {
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await adapter.initialise();
  expect(adapter.getORM()).not.toBeUndefined();
});

test("adapter - reset", async() => {
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await adapter.reset();
  expect(adapter.getORM()).not.toBeUndefined();
});

test("adapter - createModel", async() => {
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await adapter.createModel(TaskModel);

  await adapter.reset();
  expect(adapter.getORM().models.Task).not.toBeUndefined();
});
test("adapter - getModel", async() => {
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await adapter.createModel(TaskModel);
  await adapter.reset();
  expect(adapter.getModel("Task")).not.toBeUndefined();
});
test("adapter - getModels", async() => {
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await adapter.createModel(TaskModel);
  await adapter.reset();
  expect(adapter.getModels().Task).not.toBeUndefined();
});
test("adapter - addInstanceFunction", async() => {
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await adapter.createModel(TaskModel);
  adapter.addInstanceFunction("Task", "test", function() {
    expect(this).toBeInstanceOf(adapter.getModel("Task"));
    return true;
  });
  await adapter.reset();
  const Task = adapter.getModel("Task");
  const task = new Task();
  expect(task.test()).toEqual(true);
});

test("adapter - addStaticFunction", async() => {
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await adapter.createModel(TaskModel);
  adapter.addStaticFunction("Task", "test", function() {
    return true;
  });
  await adapter.reset();
  const Task = adapter.getModel("Task");
  expect(Task.test()).toEqual(true);
});

test("adapter - createRelationship", async() => {
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await adapter.createModel(TaskModel);
  await adapter.createModel(TaskItemModel);
  await adapter.createModel(ItemModel);

  await waterfall([TaskModel, TaskItemModel, ItemModel], async(model) => {
    return waterfall(model.relationships, async(rel) => {
      return adapter.createRelationship(model.name, rel.model, rel.name, rel.type, rel.options);
    });
  });

  await adapter.reset();
  expect(adapter.getORM().models.Task).not.toBeUndefined();
  expect(adapter.getORM().models.TaskItem).not.toBeUndefined();
  expect(adapter.getORM().models.Item).not.toBeUndefined();
});

test("adapter - createRelationship - belongsToMany", async() => {
  const adapter = new SequelizeAdapter({}, {
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

  await adapter.createModel(itemDef);
  await adapter.createModel(itemChildMapDef);
  await adapter.createModel(itemChildDef);

  await waterfall([itemDef, itemChildMapDef, itemChildDef], async(model) => {
    return waterfall(model.relationships, async(rel) => {
      return adapter.createRelationship(model.name, rel.model, rel.name, rel.type, rel.options);
    });
  });

  await adapter.reset();
  const {models} = adapter.getORM();
  expect(models.Item).toBeDefined();
  expect(models.ItemChildMap).toBeDefined();
  expect(models.ItemChild).toBeDefined();
});

test("adapter - createFunctionForFind", async() => {
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await adapter.createModel(TaskModel);
  await adapter.reset();
  const Task = adapter.getModel("Task");
  const task = await Task.create({
    name: "ttttttttttttttt",
  });

  const func = await adapter.createFunctionForFind("Task", false);
  const proxyFunc = await func(task.id, "id");
  const result = await proxyFunc();
  expect(result).not.toBeUndefined();
  expect(result).toHaveLength(1);
  expect(result[0].id).toEqual(task.id);
});
test("adapter - getPrimaryKeyNameForModel", async() => {
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await adapter.createModel(TaskModel);
  await adapter.reset();
  const primaryKeyName = adapter.getPrimaryKeyNameForModel("Task");
  expect(primaryKeyName).toEqual("id");
});
test("adapter - getValueFromInstance", async() => {
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  await adapter.createModel(TaskModel);
  await adapter.reset();
  const model = await adapter.getModel("Task").create({
    name: "111111111111111111",
  });
  expect(adapter.getValueFromInstance(model, "name")).toEqual("111111111111111111");
});



test("adapter - getFields - primary key", async() => {
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  const itemDef = {
    name: "Item",
    define: {},
    relationships: [],
  };
  await adapter.createModel(itemDef);
  await adapter.reset();
  const ItemFields = adapter.getFields("Item");
  expect(ItemFields).toBeDefined();
  expect(ItemFields.id).toBeDefined();
  expect(ItemFields.id.primaryKey).toEqual(true);
  expect(ItemFields.id.autoPopulated).toEqual(true);
  expect(ItemFields.id.allowNull).toEqual(false);
  expect(ItemFields.id.type).toBeInstanceOf(Sequelize.INTEGER);
});

test("adapter - getFields - define field", async() => {
  const adapter = new SequelizeAdapter({}, {
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
  await adapter.createModel(itemDef);
  await adapter.reset();
  const ItemFields = adapter.getFields("Item");
  expect(ItemFields).toBeDefined();
  expect(ItemFields.name).toBeDefined();
  expect(ItemFields.name.type).toBeInstanceOf(Sequelize.STRING);
  expect(ItemFields.name.allowNull).toEqual(false);
  expect(ItemFields.name.description).toEqual(itemDef.define.name.comment);
  expect(ItemFields.name.defaultValue).toEqual(itemDef.define.name.defaultValue);
});

test("adapter - getFields - relationship foreign keys", async() => {
  const adapter = new SequelizeAdapter({}, {
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
  await adapter.createModel(itemDef);
  await adapter.createModel(itemChildDef);
  await waterfall(itemDef.relationships, async(rel) => {
    return adapter.createRelationship(itemDef.name, rel.model, rel.name, rel.type, rel.options);
  });
  await waterfall(itemChildDef.relationships, async(rel) => {
    return adapter.createRelationship(itemChildDef.name, rel.model, rel.name, rel.type, rel.options);
  });
  await adapter.reset();
  const fields = adapter.getFields("ItemChild");
  expect(fields).toBeDefined();
  expect(fields.parentId).toBeDefined();
  expect(fields.parentId.foreignKey).toEqual(true);
  expect(fields.parentId.foreignTarget).toEqual("Item");
  expect(fields.parentId.type).toBeInstanceOf(Sequelize.INTEGER);
});


test("adapter - getFields - relationship not null foreign keys", async() => {
  const adapter = new SequelizeAdapter({}, {
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
  await adapter.createModel(itemDef);
  await waterfall(itemDef.relationships, async(rel) => {
    return adapter.createRelationship(itemDef.name, rel.model, rel.name, rel.type, rel.options);
  });
  await adapter.reset();
  const ItemFields = adapter.getFields("Item");
  expect(ItemFields).toBeDefined();
  expect(ItemFields.parentId).toBeDefined();
  expect(ItemFields.parentId.allowNull).toEqual(false);
  expect(ItemFields.parentId.foreignKey).toEqual(true);
  expect(ItemFields.parentId.foreignTarget).toEqual("Item");
  expect(ItemFields.parentId.description).toEqual(itemDef.define.parentId.comment);
  expect(ItemFields.parentId.type).toBeInstanceOf(Sequelize.INTEGER);
});


test("adapter - getFields - timestamp fields", async() => {
  const adapter = new SequelizeAdapter({}, {
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
  await adapter.createModel(itemDef);
  await waterfall(itemDef.relationships, async(rel) => {
    return adapter.createRelationship(itemDef.name, rel.model, rel.name, rel.type, rel.options);
  });
  await adapter.reset();
  const ItemFields = adapter.getFields("Item");
  expect(ItemFields).toBeDefined();
  expect(ItemFields.createdAt).toBeDefined();
  expect(ItemFields.createdAt.type).toBeInstanceOf(Sequelize.DATE);
  expect(ItemFields.createdAt.allowNull).toEqual(false);
  expect(ItemFields.createdAt.autoPopulated).toEqual(true);
});



test("adapter - getRelationships - hasMany", async() => {
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  const itemDef = {
    name: "Item",
    define: {},
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
  await adapter.createModel(itemDef);
  await waterfall(itemDef.relationships, async(rel) => {
    return adapter.createRelationship(itemDef.name, rel.model, rel.name, rel.type, rel.options);
  });
  await adapter.reset();
  const rels = adapter.getRelationships("Item");
  expect(rels).toBeDefined();
  expect(rels.parent).toBeDefined();
  expect(rels.parent.name).toEqual("parent");
  expect(rels.parent.target).toEqual("Item");
  expect(rels.parent.source).toEqual("Item");
  expect(rels.parent.associationType).toEqual("belongsTo");
  expect(rels.parent.foreignKey).toEqual("parentId");
  expect(rels.parent.targetKey).toEqual("id");
  expect(rels.parent.accessors).toBeDefined();
  expect(rels.parent.accessors.get).toBeDefined();
  expect(rels.parent.accessors.set).toBeDefined();
  expect(rels.parent.accessors.create).toBeDefined();
});


test("adapter - getRelationships - belongsTo", async() => {
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  const itemDef = {
    name: "Item",
    define: {},
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
  await adapter.createModel(itemDef);
  await waterfall(itemDef.relationships, async(rel) => {
    return adapter.createRelationship(itemDef.name, rel.model, rel.name, rel.type, rel.options);
  });
  await adapter.reset();
  const rels = adapter.getRelationships("Item");
  expect(rels).toBeDefined();
  expect(rels.children).toBeDefined();
  expect(rels.children.name).toEqual("children");
  expect(rels.children.target).toEqual("Item");
  expect(rels.children.source).toEqual("Item");
  expect(rels.children.associationType).toEqual("hasMany");
  expect(rels.children.foreignKey).toEqual("parentId");
  expect(rels.children.sourceKey).toEqual("id");
  expect(rels.children.accessors).toBeDefined();
  expect(rels.children.accessors.add).toBeDefined();
  expect(rels.children.accessors.addMultiple).toBeDefined();
  expect(rels.children.accessors.count).toBeDefined();
  expect(rels.children.accessors.create).toBeDefined();
  expect(rels.children.accessors.get).toBeDefined();
  expect(rels.children.accessors.hasAll).toBeDefined();
  expect(rels.children.accessors.hasSingle).toBeDefined();
  expect(rels.children.accessors.remove).toBeDefined();
  expect(rels.children.accessors.removeMultiple).toBeDefined();
  expect(rels.children.accessors.set).toBeDefined();
});


test("adapter - getDefaultListArgs", async() => {
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  const defaultArgs = adapter.getDefaultListArgs();
  expect(defaultArgs).toBeDefined();
  expect(defaultArgs.where).toBeDefined();
  expect(defaultArgs.where.type).toEqual(jsonType);
});

test("adapter - hasInlineCountFeature - sqlite", async() => {
  const adapter = new SequelizeAdapter({
    disableInlineCount: false,
  }, {
    dialect: "sqlite",
  });
  const result = adapter.hasInlineCountFeature();
  expect(result).toEqual(true);
});
test("adapter - hasInlineCountFeature - disable inline count", async() => {
  const adapter = new SequelizeAdapter({
    disableInlineCount: true,
  }, {
    dialect: "sqlite",
  });
  const result = adapter.hasInlineCountFeature();
  expect(result).toEqual(false);
});

test("adapter - hasInlineCountFeature - postgres", async() => {
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  adapter.sequelize.dialect.name = "postgres";
  const result = adapter.hasInlineCountFeature();
  expect(result).toEqual(true);
});

test("adapter - hasInlineCountFeature - mssql", async() => {
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  adapter.sequelize.dialect.name = "mssql";
  const result = adapter.hasInlineCountFeature();
  expect(result).toEqual(true);
});


test("adapter - processListArgsToOptions - hasInlineCount", async() => {
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  const itemDef = {
    name: "Item",
    define: {},
    relationships: []
  };
  await adapter.createModel(itemDef);

  const {getOptions, countOptions} = adapter.processListArgsToOptions({}, "Item", {
    first: 1,
  });
  expect(countOptions).toBeUndefined();
  expect(getOptions).toBeDefined();
  expect(getOptions.limit).toEqual(1);
  expect(getOptions.attributes).toHaveLength(4);
  expect(getOptions.attributes[getOptions.attributes.length - 1]).toHaveLength(2);
  expect(getOptions.attributes[getOptions.attributes.length - 1][0].val).toEqual("COUNT(1) OVER()");
  expect(getOptions.attributes[getOptions.attributes.length - 1][1]).toEqual("full_count");
});

test("adapter - processListArgsToOptions - hasInlineCount - full_count args already exist", async() => {
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  const itemDef = {
    name: "Item",
    define: {},
    relationships: []
  };

  await adapter.createModel(itemDef);
  const {getOptions, countOptions} = adapter.processListArgsToOptions({}, "Item", {
    first: 1,
  }, {
    attributes: [[
      adapter.sequelize.literal("COUNT(1) OVER()"),
      "full_count",
    ]],
  });
  expect(countOptions).toBeUndefined();
  expect(getOptions).toBeDefined();
  expect(getOptions.limit).toEqual(1);
  expect(getOptions.attributes).toHaveLength(4);
  expect(getOptions.attributes[getOptions.attributes.length - 1]).toHaveLength(2);
  expect(getOptions.attributes[getOptions.attributes.length - 1][0].val).toEqual("COUNT(1) OVER()");
  expect(getOptions.attributes[getOptions.attributes.length - 1][1]).toEqual("full_count");
});

test("adapter - processListArgsToOptions - hasInlineCount - mssql", async() => {
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  const itemDef = {
    name: "Item",
    define: {},
    relationships: []
  };

  await adapter.createModel(itemDef);
  adapter.sequelize.dialect.name = "mssql";
  const {getOptions, countOptions} = adapter.processListArgsToOptions({}, "Item", {
    first: 1,
  });
  expect(countOptions).toBeUndefined();
  expect(getOptions).toBeDefined();
  expect(getOptions.limit).toEqual(1);
  expect(getOptions.attributes).toHaveLength(4);
  expect(getOptions.attributes[getOptions.attributes.length - 1]).toHaveLength(2);
  expect(getOptions.attributes[getOptions.attributes.length - 1][0].val).toEqual("COUNT(1) OVER()");
  expect(getOptions.attributes[getOptions.attributes.length - 1][1]).toEqual("full_count");
});

test("adapter - processListArgsToOptions - hasInlineCount - postgres", async() => {
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  adapter.sequelize.dialect.name = "postgres";
  const itemDef = {
    name: "Item",
    define: {},
    relationships: []
  };

  await adapter.createModel(itemDef);
  const {getOptions, countOptions} = adapter.processListArgsToOptions({}, "Item", {
    first: 1,
  });
  expect(countOptions).toBeUndefined();
  expect(getOptions).toBeDefined();
  expect(getOptions.limit).toEqual(1);
  expect(getOptions.attributes).toHaveLength(4);
  expect(getOptions.attributes[getOptions.attributes.length - 1]).toHaveLength(2);
  expect(getOptions.attributes[getOptions.attributes.length - 1][0].val).toEqual("COUNT(*) OVER()");
  expect(getOptions.attributes[getOptions.attributes.length - 1][1]).toEqual("full_count");
});

test("adapter - processListArgsToOptions - no inlineCount", async() => {
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  const itemDef = {
    name: "Item",
    define: {},
    relationships: []
  };

  await adapter.createModel(itemDef);
  adapter.sequelize.dialect.name = "unknown";
  const {getOptions, countOptions} = adapter.processListArgsToOptions({}, "Item", {
    first: 1,
  });
  expect(countOptions).toBeDefined();
  expect(countOptions.limit).toBeUndefined();
  expect(getOptions).toBeDefined();
  expect(getOptions.limit).toEqual(1);
  expect(getOptions.attributes).toHaveLength(0);
});

test("adapter - getTypeMapper", async() => {
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  const typeMapper = adapter.getTypeMapper();
  expect(typeMapper).toBeDefined();
  expect(typeMapper).toBeInstanceOf(Function);
});
