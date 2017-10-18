

// import expect from "expect";
// import {createSqlInstance, validateResult} from "./utils";
// import {graphql} from "graphql";
// import {createSchema, connect} from "../index";
// import Sequelize from "sequelize";

// describe("mutations v3", () => {
//   it("create", async() => {
//     const instance = await createSqlInstance();
//     const schema = await createSchema(instance, {
//       version: "3",
//     });
//     const mutation = `mutation {
//       models {
//         Task(create: {
//           name: "hi"
//         }) {
//           id,
//           name
//         }
//       }
//     }`;
//     const mutationResult = await graphql(schema, mutation);
//     validateResult(mutationResult);
//     const query = "query { models { Task { id, name } } }";
//     const queryResult = await graphql(schema, query);
//     validateResult(queryResult);
//     return expect(queryResult.data.models.Task.length).toEqual(1);
//   });
// });
