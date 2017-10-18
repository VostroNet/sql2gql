
import {
  GraphQLSchema,
  GraphQLObjectType,
} from "graphql";


import getModelDefinition from "./utils/get-model-def";
import createBasicModels from "./models/create-base";
import createComplexModels from "./models/create-complex";

import createMutationCollection from "./mutation";

import createMutationV3 from "./mutation/v3";
import createMutationFunctions from "./mutation/v3/create-functions";
import createMutationInputs from "./mutation/create-input";

import createQueryLists from "./query/create-lists";
import createQueryClassMethods from "./query/create-class-methods";
import createSubscriptionFunctions from "./subscriptions";

export async function createSchema(sqlInstance, options = {}) {
  const {query, mutations, subscriptions, extend = {}} = options;
  let validKeys = Object.keys(sqlInstance.models).reduce((o, key) => {
    if (getModelDefinition(sqlInstance.models[key])) {
      o.push(key);
    }
    return o;
  }, []);
  let typeCollection = await createBasicModels(sqlInstance.models, validKeys, "", options);
  const mutationInputTypes = await createMutationInputs(sqlInstance.models, validKeys, typeCollection, options);
  const mutationFunctions = await createMutationFunctions(sqlInstance.models, validKeys, typeCollection, mutationInputTypes, options);
  typeCollection = await createComplexModels(sqlInstance.models, validKeys, typeCollection, mutationFunctions, options);
  let mutationCollection = {};
  if (options.version === 3) {
    mutationCollection = await createMutationV3(sqlInstance.models, validKeys, typeCollection, mutationCollection, mutationFunctions, options);
  } else {
    mutationCollection = await createMutationCollection(sqlInstance.models, validKeys, typeCollection, {}, options);
  }
  let classMethodQueries = await createQueryClassMethods(sqlInstance.models, validKeys, typeCollection, options);
  let modelQueries = await createQueryLists(sqlInstance.models, validKeys, typeCollection, options);
  let queryRootFields = Object.assign({}, query);
  let rootSchema = {};
  if (Object.keys(modelQueries).length > 0) {
    queryRootFields.models = {
      type: new GraphQLObjectType({name: "QueryModels", fields: modelQueries}),
      resolve() {
        return {};
      },
    };
  }
  if (Object.keys(classMethodQueries).length > 0) {
    queryRootFields.classMethods = {
      type: new GraphQLObjectType({name: "ClassMethods", fields: classMethodQueries}),
      resolve() {
        return {};
      },
    };
  }
  if (Object.keys(queryRootFields).length > 0) {
    rootSchema.query = new GraphQLObjectType({
      name: "RootQuery",
      fields: queryRootFields,
    });
  }
  let mutationRootFields = Object.assign({}, mutations);
  if (Object.keys(mutationCollection).length > 0) {
    mutationRootFields.models = {
      type: new GraphQLObjectType({name: "MutationModels", fields: mutationCollection}),
      resolve() {
        return {};
      },
    };
  }
  if (Object.keys(mutationRootFields).length > 0) {
    rootSchema.mutation = new GraphQLObjectType({
      name: "Mutation",
      fields: mutationRootFields,
    });
  }

  let subscriptionRootFields = Object.assign({}, subscriptions);

  if ((sqlInstance.$sqlgql || {}).subscriptions) {
    const {pubsub} = (sqlInstance.$sqlgql || {}).subscriptions;
    subscriptionRootFields = await createSubscriptionFunctions(pubsub, sqlInstance.models, validKeys, typeCollection, options);
    if (Object.keys(subscriptionRootFields).length > 0) {
      rootSchema.subscription = new GraphQLObjectType({
        name: "Subscription",
        fields: subscriptionRootFields,
      });
    }
  }
  const schemaParams = Object.assign(rootSchema, extend);

  if (!schemaParams.query) {
    throw new Error("GraphQLSchema requires query to be set. Are your permissions settings to aggressive?");
  }
  const schema = new GraphQLSchema(schemaParams);
  schema.$sql2gql = {
    types: typeCollection,
  };
  return schema;
}

/*

associations:Object {items: HasMany}
items:HasMany {source: , target: , options: Object, …}
accessors:Object {get: "getItems", set: "setItems", addMultiple: "addItems", …}
as:"items"
associationAccessor:"items"
associationType:"HasMany"
foreignKey:"TaskId"
foreignKeyAttribute:Object {}
foreignKeyField:"TaskId"
identifierField:"TaskId"
*/

