import expect from "expect";
import {GraphQLObjectType} from "graphql";

import {createInstance, validateResult} from "./helper";
import {createSchema} from "../src/graphql/index";

describe("schema", () => {
  it("type output", async() => {
    const instance = await createInstance();
    const schema = await createSchema(instance);
    expect(schema.$sql2gql).toBeDefined();
    expect(schema.$sql2gql.types).toBeDefined();
    expect(schema.$sql2gql.types.Task).toBeDefined();
    return expect(schema.$sql2gql.types.Task instanceof GraphQLObjectType).toBeTruthy();
  });
});
