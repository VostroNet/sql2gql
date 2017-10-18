import express from "express";
import bodyParser from "body-parser";
import { graphqlExpress, graphiqlExpress } from "apollo-server-express";

import {createSqlInstance} from "./utils";
import {createSchema} from "../index";

const PORT = 3000;
const app = express();
(async() => {
  const instance = await createSqlInstance();
  const schema = await createSchema(instance, {version: 3});
  app.use("/graphql", bodyParser.json(), graphqlExpress({ schema: schema }));
  app.get("/graphiql", graphiqlExpress({ endpointURL: "/graphql" }));
  app.listen(PORT);
})().then(() => {
  console.log("success");
}, (err) => {
  console.log("ERR", err);
});
