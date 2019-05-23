
import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLString,
} from "graphql";

export default new GraphQLObjectType({
  name: "PageInfo",
  fields() {
    return {
      "hasNextPage": {
        type: GraphQLBoolean,
      },
      "hasPreviousPage": {
        type: GraphQLBoolean,
      },
      "startCursor": {
        type: GraphQLString,
      },
      "endCursor": {
        type: GraphQLString,
      },
    };
  },
});
