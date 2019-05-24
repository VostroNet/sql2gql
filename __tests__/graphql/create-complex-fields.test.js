import Database from "../../src/database";
import SequelizeAdapter from "../../src/adapters/sequelize";
import createComplexFieldsFunc from "../../src/graphql/create-complex-fields";
import {GraphQLObjectType, GraphQLInt} from "graphql";
test("createComplexFieldsFunc - empty define", async() => {
  const db = new Database();
  db.registerAdapter(new SequelizeAdapter({}, {
    dialect: "sqlite",
  }), "sqlite");
  const itemDef = {
    name: "Item",
    define: {},
    relationships: [],
    expose: {
      instanceMethods: {
        query: {
          testInstanceMethod: {
            type: GraphQLInt,
          },
        },
      },
    },
    instanceMethods: {
      testInstanceMethod() {
        return 2;
      },
    },
  };
  await db.addDefinition(itemDef);
  await db.initialise();
  const func = createComplexFieldsFunc(itemDef.name, db, itemDef, {}, {
    types: {
      "Item": new GraphQLObjectType({
        name: "Item",
      })
    }
  });
  expect(func).toBeInstanceOf(Function);
  const fields = func();
  expect(fields).toBeDefined();
  expect(fields.testInstanceMethod).toBeDefined();
  expect(fields.testInstanceMethod.resolve).toBeInstanceOf(Function);
  expect(fields.testInstanceMethod.type).toEqual(GraphQLInt);
});
