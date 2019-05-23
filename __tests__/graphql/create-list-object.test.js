import Database from "../../src/database";
import SequelizeAdapter from "../../src/adapters/sequelize";
import createModelType from "../../src/graphql/create-model-type";
import createListObject from "../../src/graphql/create-list-object";

import createNodeInterface from "../../src/graphql/utils/create-node-interface";
import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLString,
  GraphQLObjectType,
} from "graphql";
import Sequelize from "sequelize";

test("createListObject", async() => {
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
  const {nodeInterface} = createNodeInterface(db);
  let typeObjects = {};
  typeObjects.Item = createModelType(itemDef.name, db, {}, nodeInterface, typeObjects);
  const listObject = createListObject(db, itemDef, itemDef, "", "");
  expect(listObject).toBeInstanceOf(GraphQLObjectType);

  // expect(basicFieldsFunc).toBeInstanceOf(Function);
  // const fields = basicFieldsFunc();
  // expect(fields).toBeDefined();
  // expect(fields.id).toBeDefined();
  // expect(fields.id.type).toBeInstanceOf(GraphQLNonNull);
  // expect(fields.id.type.ofType).toEqual(GraphQLID);
});

