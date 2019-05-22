
import Database from "../../src/database";
import createBeforeAfter from "../../src/graphql/create-before-after";
import events from "../../src/events";
import SequelizeAdapter from "../../src/adapters/sequelize";


import {
  toGlobalId,
} from "graphql-relay";
test("createBeforeAfter", async() => {
  const db = new Database();
  db.registerAdapter(new SequelizeAdapter({}, {
    dialect: "sqlite",
  }), "sqlite");
  const itemDef = {
    name: "Item",
    define: {},
    relationships: []
  };
  await db.addDefinition(itemDef);
  const {
    before,
    after,
    afterList,
  } = createBeforeAfter(itemDef.name, itemDef, db, {});
  expect(before).toBeDefined();
  expect(after).toBeDefined();
  expect(afterList).toBeDefined();

});

test("createBeforeAfter - before - without hooks", async() => {
  const db = new Database();
  db.registerAdapter(new SequelizeAdapter({}, {
    dialect: "sqlite",
  }), "sqlite");
  const itemDef = {
    name: "Item",
    define: {},
    relationships: [],
  };
  await db.addDefinition(itemDef);
  const {
    before,
  } = createBeforeAfter(itemDef.name, itemDef, db, {});
  expect(before).toBeDefined();
  const result = await before({value: 1}, "args", "context", "info");
  expect(result).toBeDefined();
  expect(result.value).toEqual(1);
});

test("createBeforeAfter - before - with hooks", async() => {
  const db = new Database();
  db.registerAdapter(new SequelizeAdapter({}, {
    dialect: "sqlite",
  }), "sqlite");
  const beforeFunc = function({
    params, args, context, info, modelDefinition, type,
  }) {
    expect(args).toEqual("args");
    expect(context).toEqual("context");
    expect(info).toEqual("info");
    expect(modelDefinition).toBeDefined();
    expect(type).toEqual(events.QUERY);
    return {
      value: params.value + 1,
    };
  };
  const itemDef = {
    name: "Item",
    define: {},
    relationships: [],
    before: beforeFunc,
  };
  await db.addDefinition(itemDef);
  const {
    before,
  } = createBeforeAfter(itemDef.name, itemDef, db, {
    before: beforeFunc,
  }, {
    before(findOptions, args, context, info) {
      expect(args).toEqual("args");
      expect(context).toEqual("context");
      expect(info).toEqual("info");
      return {
        value: findOptions.value + 1,
      };
    }
  });
  expect(before).toBeDefined();
  const result = await before({value: 1}, "args", "context", "info");
  expect(result).toBeDefined();
  expect(result.value).toEqual(4);
});


test("createBeforeAfter - before - replace primary key", async() => {
  const db = new Database();
  db.registerAdapter(new SequelizeAdapter({}, {
    dialect: "sqlite",
  }), "sqlite");
  const itemDef = {
    name: "Item",
    define: {},
    relationships: [],
  };
  await db.addDefinition(itemDef);
  const {
    before,
  } = createBeforeAfter(itemDef.name, itemDef, db, {}, {
    before(findOptions, args, context, info) {
      expect(findOptions.where.id).toEqual("1");
      expect(context).toEqual("context");
      expect(info).toEqual("info");
      return findOptions;
    }
  });
  expect(before).toBeDefined();
  const findOptions = await before({where: {
    id: toGlobalId("Item", "1"),
  }}, "args", "context", "info");
  expect(findOptions).toBeDefined();
  expect(findOptions.where.id).toEqual("1");
});

test("createBeforeAfter - before - replace foreign key", async() => {
  const db = new Database();
  db.registerAdapter(new SequelizeAdapter({}, {
    dialect: "sqlite",
  }), "sqlite");
  const itemDef = {
    name: "Item",
    define: {},
    relationships: [{
      type: "hasMany",
      model: "Item",
      name: "items",
      options: {
        foreignKey: "parentId",
      },
    }],
  };
  await db.addDefinition(itemDef);
  await db.initialise();
  const {
    before,
  } = createBeforeAfter(itemDef.name, itemDef, db, {}, {
    before(findOptions, args, context, info) {
      expect(findOptions.where.parentId).toEqual("1");
      expect(context).toEqual("context");
      expect(info).toEqual("info");
      return findOptions;
    }
  });
  expect(before).toBeDefined();
  const findOptions = await before({where: {
    parentId: toGlobalId("Item", "1"),
  }}, "args", "context", "info");
  expect(findOptions).toBeDefined();
  expect(findOptions.where.parentId).toEqual("1");
});

test("createBeforeAfter - after - without hooks", async() => {
  const db = new Database();
  db.registerAdapter(new SequelizeAdapter({}, {
    dialect: "sqlite",
  }), "sqlite");

  const itemDef = {
    name: "Item",
    define: {},
    relationships: [],
  };
  await db.addDefinition(itemDef);
  const {
    after,
  } = createBeforeAfter(itemDef.name, itemDef, db, {});
  expect(after).toBeDefined();
  const result = await after({value: 1}, "args", "context", "info");
  expect(result).toBeDefined();
  expect(result.value).toEqual(1);
});


test("createBeforeAfter - after - with hooks", async() => {
  const db = new Database();
  db.registerAdapter(new SequelizeAdapter({}, {
    dialect: "sqlite",
  }), "sqlite");
  const afterFunc = function({
    result, args, context, info, modelDefinition, type,
  }) {
    expect(args).toEqual("args");
    expect(context).toEqual("context");
    expect(info).toEqual("info");
    expect(modelDefinition).toBeDefined();
    expect(type).toEqual(events.QUERY);
    return {
      value: result.value + 1,
    };
  };
  const itemDef = {
    name: "Item",
    define: {},
    relationships: [],
    after: afterFunc,
  };
  await db.addDefinition(itemDef);
  const {
    after,
  } = createBeforeAfter(itemDef.name, itemDef, db, {
    after: afterFunc,
  }, {
    after(findOptions, args, context, info) {
      expect(args).toEqual("args");
      expect(context).toEqual("context");
      expect(info).toEqual("info");
      return {
        value: findOptions.value + 1,
      };
    }
  });
  expect(after).toBeDefined();
  const result = await after({value: 1}, "args", "context", "info");
  expect(result).toBeDefined();
  expect(result.value).toEqual(4);
});


test("createBeforeAfter - afterList", async() => {
  const db = new Database();
  db.registerAdapter(new SequelizeAdapter({}, {
    dialect: "sqlite",
  }), "sqlite");
  const afterFunc = function({
    result, args, context, info, modelDefinition, type,
  }) {
    expect(args).toEqual("args");
    expect(context).toEqual("context");
    expect(info).toEqual("info");
    expect(modelDefinition).toBeDefined();
    expect(type).toEqual(events.QUERY);
    return {
      value: result.value + 1,
    };
  };
  const itemDef = {
    name: "Item",
    define: {},
    relationships: [],
    after: afterFunc,
  };
  await db.addDefinition(itemDef);
  const {
    afterList,
  } = createBeforeAfter(itemDef.name, itemDef, db, {
    after: afterFunc,
  }, {
    after(findOptions, args, context, info) {
      expect(args).toEqual("args");
      expect(context).toEqual("context");
      expect(info).toEqual("info");
      return {
        value: findOptions.value + 1,
      };
    }
  });
  expect(afterList).toBeDefined();
  const result = await afterList([{value: 1}, {value: 2}], "args", "context", "info");
  expect(result).toHaveLength(2);
  expect(result[0].value).toEqual(4);
  expect(result[1].value).toEqual(5);
});



//TODO: do we really need this functionality in this section?
test("createBeforeAfter - after - filter undefined edges", async() => {
  const db = new Database();
  db.registerAdapter(new SequelizeAdapter({}, {
    dialect: "sqlite",
  }), "sqlite");
  const itemDef = {
    name: "Item",
    define: {},
    relationships: []
  };
  await db.addDefinition(itemDef);
  const {
    after,
  } = createBeforeAfter(itemDef.name, itemDef, db, {});
  expect(after).toBeDefined();
  const result = await after({edges: [
    undefined,
    1
  ]}, "args", "context", "info");
  expect(result).toBeDefined();
  expect(result.edges).toHaveLength(1);

});
