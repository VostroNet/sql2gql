import expect from "expect";
import {createSqlInstance, validateResult} from "./utils";
import {graphql, GraphQLObjectType} from "graphql";
import {createSchema} from "../index";

describe("schema", () => {
  it("type output", async() => {
    const instance = await createSqlInstance();
    const schema = await createSchema(instance);
    expect(schema.$sql2gql).toExist();
    expect(schema.$sql2gql.types).toExist();
    expect(schema.$sql2gql.types.Task).toExist();
    return expect(schema.$sql2gql.types.Task instanceof GraphQLObjectType).toBeTruthy();
  });
});
