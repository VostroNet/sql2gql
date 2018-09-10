import express from "express";
import bodyParser from "body-parser";
import { ApolloServer } from "apollo-server-express";
// import graphqlExpress from "../express";

import {createSqlInstance} from "./utils";
import {createSchema} from "../index";


const PORT = 3000;
const app = express();
(async() => {
  const instance = await createSqlInstance();
  const schema = await createSchema(instance);
  const server = new ApolloServer({schema});
  server.applyMiddleware({app});
  app.listen(PORT);
})().then(() => {
  console.log("success");
}, (err) => {
  console.log("ERR", err);
});
