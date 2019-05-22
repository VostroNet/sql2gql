import Database from "../../src/database";
import SequelizeAdapter from "../../src/adapters/sequelize";
import {createModelType} from "../../src/graphql";


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
  const graphqlModel = await createModelType(itemDef.name, db, {});
  expect(graphqlModel).toBeDefined();
});
