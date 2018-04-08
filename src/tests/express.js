import express from "express";
import bodyParser from "body-parser";
import { graphiqlExpress } from "apollo-server-express";
import graphqlExpress from "../express";

import {createSqlInstance} from "./utils";
import {createSchema} from "../index";


const PORT = 3000;
const app = express();
(async() => {
  const instance = await createSqlInstance();
  const schema = await createSchema(instance);
  app.use("/graphql", bodyParser.json(), graphqlExpress({schema: schema, sequelize: instance}));
  app.get("/graphiql", graphiqlExpress({endpointURL: "/graphql"}));
  app.listen(PORT);
})().then(() => {
  console.log("success");
}, (err) => {
  console.log("ERR", err);
});
