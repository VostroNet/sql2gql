import "babel-polyfill";
import * as database from "./database";
import * as graphql from "./graphql";
import pEvents from "./graphql/events";
import permHelper from "./permission-helper";
export const connect = database.connect;
export const createSchema = graphql.createSchema; //TODO: better way to lay this out?
export const events = pEvents;
export const permissionHelper = permHelper;
