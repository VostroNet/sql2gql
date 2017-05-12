import database from "./database";
import graphql from "./graphql";
export const connect = database;
export const createSchema = graphql; //TODO: better way to lay this out?
