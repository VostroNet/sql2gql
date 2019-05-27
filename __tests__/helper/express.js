import express from "express";
import {ApolloServer} from "apollo-server-express";

import {createInstance} from "./index";
import {createSchema} from "../../src/graphql/index";

const PORT = 3005;
const app = express();
(async() => {
  const instance = await createInstance();
  const schema = await createSchema(instance);
  const server = new ApolloServer({schema,
    context: () => {
      return {instance};
    }
  });
  server.applyMiddleware({app});
  app.listen(PORT);
})().then(() => {
  console.log("success", PORT);
}, (err) => {
  console.log("ERR", err);
});
