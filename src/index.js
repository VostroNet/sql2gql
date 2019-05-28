import db from "./manager";
import sqlAdapter from "./adapters/sequelize/index";
import {createSchema as create} from "./graphql/index";
export const Database = db;
export const SequelizeAdapter = sqlAdapter;
export const createSchema = create;
