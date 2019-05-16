import expect from "expect";
import {createSqlInstance} from "./utils";
import {GraphQLObjectType} from "graphql";
import {createSchema} from "../index";

describe("schema", () => {
  it("type output", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);
    expect(schema.$sql2gql).toBeDefined();
    expect(schema.$sql2gql.types).toBeDefined();
    expect(schema.$sql2gql.types.Task).toBeDefined();
    return expect(schema.$sql2gql.types.Task instanceof GraphQLObjectType).toBeTruthy();
  });
});
