import Database from "../../src/manager";
import SequelizeAdapter from "../../src/adapters/sequelize";
import createModelType from "../../src/graphql/create-model-type";

import createSchemaCache from "../../src/graphql/create-schema-cache";

test("createModelType", async() => {
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
  await db.initialise();
  //(defName, instance, options, nodeInterface, typeCollection, prefix = "")
  const schemaCache = createSchemaCache();
  const graphqlModel = await createModelType(itemDef.name, db, {}, {}, schemaCache, "");
  expect(graphqlModel).toBeDefined();
  expect(schemaCache.types.Item).toBeDefined();
  expect(schemaCache.types["Item[]"]).toBeDefined();
});
