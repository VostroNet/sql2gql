import Database from "../src/database";
import Sequelize from "sequelize";
import SequelizeAdapter from "../src/adapters/sequelize";
// import ItemDef from "./models/item";
import TaskDef from "./models/task";
// import TaskItemDef from "./models/task-item";


test("database - registerAdapter", () => {
  const db = new Database();
  db.registerAdapter(new SequelizeAdapter({}, {
    dialect: "sqlite",
  }), "sqlite");
  expect(db.adapters.sqlite).not.toBeUndefined();
});

test("database - registerAdapter - check default adapter", () => {
  const db = new Database();
  db.registerAdapter(new SequelizeAdapter({}, {
    dialect: "sqlite",
  }), "sqlite");
  expect(db.defaultAdapter).toEqual("sqlite");
});

test("database - registerAdapter - multi adapters", () => {
  const db = new Database();
  db.registerAdapter(new SequelizeAdapter({}, {
    dialect: "sqlite",
  }), "sqlite");
  db.registerAdapter(new SequelizeAdapter({}, {
    dialect: "sqlite",
  }), "sqlite2");
  expect(db.defaultAdapter).toEqual("sqlite");
  expect(db.adapters.sqlite).not.toBeUndefined();
  expect(db.adapters.sqlite2).not.toBeUndefined();
});

test("database - addDefinition", async() => {
  const db = new Database();
  db.registerAdapter(new SequelizeAdapter({}, {
    dialect: "sqlite",
  }), "sqlite");
  await db.addDefinition(TaskDef);
  expect(db.defs[TaskDef.name]).not.toBeUndefined();
  expect(db.defsAdapters[TaskDef.name]).toEqual("sqlite");
  expect(db.models[TaskDef.name]).not.toBeUndefined();
  expect(db.adapters.sqlite.getModel(TaskDef.name)).not.toBeUndefined();
});

test("database - getModelAdapter", async() => {
  const db = new Database();
  const adapter = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  db.registerAdapter(adapter, "sqlite");
  await db.addDefinition(TaskDef);
  expect(db.getModelAdapter(TaskDef.name)).toEqual(adapter);
});


test("database - processRelationship - hasMany - single adapter", async() => {
  const db = new Database();
  const sqlite = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });

  db.registerAdapter(sqlite, "sqlite");
  const def = {
    name: "TestItem",
    define: {},
    relationships: [{
      type: "hasMany",
      model: "TestItem",
      name: "items",
      options: {
        foreignKey: "taskId",
      },
    }]
  };
  await db.addDefinition(def);
  await db.processRelationship(def, db.getModelAdapter("TestItem"), def.relationships[0]);
  expect(db.relationships.TestItem).not.toBeUndefined();
  expect(db.relationships.TestItem.items).not.toBeUndefined();
  expect(db.relationships.TestItem.items.internal).toEqual(true);
  expect(db.relationships.TestItem.items.sourceAdapter).toEqual(sqlite);
  expect(db.relationships.TestItem.items.targetAdapter).toEqual(sqlite);
});

test("database - processRelationship - hasMany - multi adapter", async() => {
  const db = new Database();
  const sqlite = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  const sqlite2 = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  db.registerAdapter(sqlite, "sqlite");
  db.registerAdapter(sqlite2, "sqlite2");
  const parentDef = {
    name: "Parent",
    define: {},
    relationships: [{
      type: "hasMany",
      model: "Child",
      name: "children",
      options: {
        foreignKey: "parentId",
      },
    }]
  };
  const childDef = {
    name: "Child",
    define: {},
    relationships: [{
      type: "belongsTo",
      model: "Parent",
      name: "parent",
      options: {
        foreignKey: "taskId",
        sourceKey: "id",
      },
    }]
  };
  await db.addDefinition(parentDef, "sqlite");
  await db.addDefinition(childDef, "sqlite2");
  await db.processRelationship(parentDef, db.getModelAdapter("Parent"), parentDef.relationships[0]);
  const ParentModel = db.getModel("Parent");
  expect(db.relationships.Parent).toBeDefined();
  expect(db.relationships.Parent.children).toBeDefined();
  expect(db.relationships.Parent.children.internal).toEqual(false);
  expect(db.relationships.Parent.children.sourceAdapter).toEqual(sqlite);
  expect(db.relationships.Parent.children.targetAdapter).toEqual(sqlite2);
  expect(ParentModel.prototype.getChildren).toBeDefined();
  const test = new ParentModel();
  expect(test.getChildren).toBeDefined();
});


test("database - hasMany - multi adapter", async() => {
  const db = new Database();
  const sqlite = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  const sqlite2 = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  db.registerAdapter(sqlite, "sqlite");
  db.registerAdapter(sqlite2, "sqlite2");
  const parentDef = {
    name: "Parent",
    define: {
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    },
    relationships: [{
      type: "hasMany",
      model: "Child",
      name: "children",
      options: {
        foreignKey: "parentId",
      },
    }]
  };
  const childDef = {
    name: "Child",
    define: {
      parentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    },
    relationships: [],
  };
  await db.addDefinition(parentDef, "sqlite");
  await db.addDefinition(childDef, "sqlite2");
  await db.initialise();
  const ParentModel = db.getModel("Parent");
  const ChildModel = db.getModel("Child");
  const parentModel = await ParentModel.create({
    name: "parent",
  });
  const childModel = await ChildModel.create({
    parentId: parentModel.id,
    name: "childModel",
  });
  const children = await parentModel.getChildren();
  expect(children).toHaveLength(1);
  expect(children[0].name).toEqual(childModel.name);
});


test("database - processRelationship - belongsTo - single adapter", async() => {
  const db = new Database();
  const sqlite = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });

  db.registerAdapter(sqlite, "sqlite");
  const parentDef = {
    name: "Parent",
    define: {
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    },
    relationships: [{
      type: "hasMany",
      model: "Child",
      name: "children",
      options: {
        foreignKey: "parentId",
      },
    }]
  };
  const childDef = {
    name: "Child",
    define: {
      parentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    },
    relationships: [{
      type: "belongsTo",
      model: "Parent",
      name: "parent",
      options: {
        foreignKey: "parentId",
      },
    }],
  };
  await db.addDefinition(parentDef);
  await db.addDefinition(childDef);
  await db.processRelationship(parentDef, db.getModelAdapter("Parent"), parentDef.relationships[0]);
  await db.processRelationship(childDef, db.getModelAdapter("Child"), childDef.relationships[0]);
  expect(db.relationships.Child).not.toBeUndefined();
  expect(db.relationships.Child.parent).not.toBeUndefined();
  expect(db.relationships.Child.parent.internal).toEqual(true);
  expect(db.relationships.Child.parent.sourceAdapter).toEqual(sqlite);
  expect(db.relationships.Child.parent.targetAdapter).toEqual(sqlite);
});




test("database - processRelationship - belongsTo - multi adapter", async() => {
  const db = new Database();

  const sqlite = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  const sqlite2 = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  db.registerAdapter(sqlite, "sqlite");
  db.registerAdapter(sqlite2, "sqlite2");

  const parentDef = {
    name: "Parent",
    define: {
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    },
    relationships: [{
      type: "hasMany",
      model: "Child",
      name: "children",
      options: {
        foreignKey: "parentId",
      },
    }]
  };
  const childDef = {
    name: "Child",
    define: {
      parentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    },
    relationships: [{
      type: "belongsTo",
      model: "Parent",
      name: "parent",
      options: {
        foreignKey: "parentId",
      },
    }],
  };
  await db.addDefinition(parentDef);
  await db.addDefinition(childDef, "sqlite2");
  await db.processRelationship(parentDef, db.getModelAdapter("Parent"), parentDef.relationships[0]);
  await db.processRelationship(childDef, db.getModelAdapter("Child"), childDef.relationships[0]);

  const ChildModel = db.getModel("Child");
  expect(db.relationships.Child).toBeDefined();
  expect(db.relationships.Child.parent).toBeDefined();
  expect(db.relationships.Child.parent.internal).toEqual(false);
  expect(db.relationships.Child.parent.sourceAdapter).toEqual(sqlite2);
  expect(db.relationships.Child.parent.targetAdapter).toEqual(sqlite);
  expect(ChildModel.prototype.getParent).toBeDefined();
  const test = new ChildModel();
  expect(test.getParent).toBeDefined();
});



test("database - belongsTo - multi adapter", async() => {
  const db = new Database();
  const sqlite = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  const sqlite2 = new SequelizeAdapter({}, {
    dialect: "sqlite",
  });
  db.registerAdapter(sqlite, "sqlite");
  db.registerAdapter(sqlite2, "sqlite2");
  const parentDef = {
    name: "Parent",
    define: {
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    },
    relationships: [{
      type: "hasMany",
      model: "Child",
      name: "children",
      options: {
        foreignKey: "parentId",
      },
    }]
  };
  const childDef = {
    name: "Child",
    define: {
      parentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    },
    relationships: [{
      type: "belongsTo",
      model: "Parent",
      name: "parent",
      options: {
        foreignKey: "parentId",
      },
    }],
  };
  await db.addDefinition(parentDef, "sqlite");
  await db.addDefinition(childDef, "sqlite2");
  await db.initialise();
  const ParentModel = db.getModel("Parent");
  const ChildModel = db.getModel("Child");
  const parentModel = await ParentModel.create({
    name: "parent",
  });
  const childModel = await ChildModel.create({
    parentId: parentModel.id,
    name: "childModel",
  });
  const parent = await childModel.getParent();
  expect(Array.isArray(parent)).toEqual(false);
  expect(parent.name).toEqual(parentModel.name);
});
