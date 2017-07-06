import "babel-polyfill";
import * as database from "./database";
import * as graphql from "./graphql";
export const connect = database.connect;
export const createSchema = graphql.createSchema; //TODO: better way to lay this out?
