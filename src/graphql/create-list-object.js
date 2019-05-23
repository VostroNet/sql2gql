
import pageInfo from "./objects/page-info";
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLScalarType,
  GraphQLEnumType,
  GraphQLList,
  GraphQLInt,
  GraphQLString,
} from "graphql";

import {capitalize} from "../utils/word";


export default function createListObject(instance, targetDef, targetType, resolve, prefix = "", suffix = "") {
  const name = `${capitalize(prefix)}${capitalize(targetDef.name)}${capitalize(suffix)}`;
  return new GraphQLObjectType({
    name: `${name}`,
    fields: {
      pageInfo: {
        type: pageInfo,
      },
      total: {
        type: GraphQLInt,
      },
      edges: {
        type: new GraphQLList(new GraphQLObjectType({
          name: `${name}Edge`,
          fields: {
            node: {
              type: targetType,
            },
            cursor: {
              type: GraphQLString,
            }
          },
        })),
      },
      resolve,
    },
    args: Object.assign({
      after: {
        type: GraphQLString,
      },
      first: {
        type: GraphQLInt,
      },
      before: {
        type: GraphQLString,
      },
      last: {
        type: GraphQLInt,
      },
    }, instance.getDefaultListArgs(targetDef.name)),
  });
}

