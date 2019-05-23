import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLScalarType,
  GraphQLEnumType,
  GraphQLList,
} from "graphql";

import {
  fromGlobalId,
  connectionFromArray,
  nodeDefinitions,
  connectionDefinitions,
  connectionArgs,
  globalIdField
} from "graphql-relay";

import createNodeInterface from "./utils/create-node-interface";


import waterfall from "../utils/waterfall";
import createModelType from "./create-model-type";

// function getGraphQLObject(defName, instance) {
//   return !(!instance.cache.get("objects", {})[defName]);
// }




export async function createSchemaObjects(dbInstance, options) {
  const {nodeInterface, nodeField, nodeTypeMapper} = createNodeInterface(dbInstance);
  const {subscriptions, extend = {}, root} = options;
  const definitions = dbInstance.getDefinitions();
  let typeCollection = waterfall(Object.keys(definitions), async(defName, o) => {
    if (options.permission) {
      if (options.permission.model) {
        const result = await options.permission.model(defName);
        if (!result) {
          return undefined;
        }
      }
    }
    o[defName] = await createModelType(defName, dbInstance, options, nodeInterface, o);
    return o;
  }, {});


}



export async function createSchema(dbInstance, options = {}) {
  const schemaObjects = await createSchemaObjects(dbInstance, options);
  const schema = new GraphQLSchema(schemaObjects.root);
  schema.$sql2gql = {
    types: schemaObjects.types,
  };
  return schema;

}
