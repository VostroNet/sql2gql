import {
  GraphQLSchema,
  GraphQLObjectType,
} from "graphql";
import {
  relay,
} from "graphql-sequelize";

const {sequelizeNodeInterface} = relay;

import getModelDefinition from "./utils/get-model-def";
// import createBasicModels from "./models/create-base";
// import createComplexModels from "./models/create-complex";

import createModels from "./models/create-new";

import createMutation from "./mutation/";
import createMutationFunctions from "./mutation/create-functions";
import createMutationInputs from "./mutation/create-input";
import createMutationClassMethods from "./mutation/create-class-methods";

import createQueryLists from "./query/create-lists";
import createQueryClassMethods from "./query/create-class-methods";
import createSubscriptionFunctions from "./subscriptions";

/**
 * @function createSchema
 * @param {Object} sqlInstance
 * @param {Object} options
 * @return {GraphQLSchema}
*/

export async function createSchema(sqlInstance, options = {}) {
  const {nodeInterface, nodeField, nodeTypeMapper} = sequelizeNodeInterface(sqlInstance);
  const {query, mutations = {}, subscriptions, extend = {}} = options;
  let validKeys = Object.keys(sqlInstance.models).reduce((o, key) => {
    if (getModelDefinition(sqlInstance.models[key])) {
      o.push(key);
    }
    return o;
  }, []);
  let typeCollection = await createModels(sqlInstance.models, validKeys, "", options, nodeInterface);
  const mutationInputTypes = await createMutationInputs(sqlInstance.models, validKeys, typeCollection, options);
  const mutationFunctions = await createMutationFunctions(sqlInstance.models, validKeys, typeCollection, mutationInputTypes, options, () => mutationFunctions);
  // typeCollection = await createComplexModels(sqlInstance.models, validKeys, typeCollection, mutationFunctions, options);
  let mutationCollection = await createMutation(sqlInstance.models, validKeys, typeCollection, mutationFunctions, options);
  let queryRootFields = Object.assign({
    node: nodeField,
  }, query);
  let rootSchema = {};
  let modelQueries = await createQueryLists(sqlInstance.models, validKeys, typeCollection, options);
  if (Object.keys(modelQueries).length > 0) {
    queryRootFields.models = {
      type: new GraphQLObjectType({name: "QueryModels", fields: modelQueries}),
      resolve() {
        return {};
      },
    };
  }
  let classMethodQueries = await createQueryClassMethods(sqlInstance.models, validKeys, typeCollection, options);
  if (Object.keys(classMethodQueries).length > 0) {
    queryRootFields.classMethods = {
      type: new GraphQLObjectType({name: "QueryClassMethods", fields: classMethodQueries}),
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
  let classMethodMutations = await createMutationClassMethods(sqlInstance.models, validKeys, typeCollection, options);
  if (Object.keys(classMethodMutations).length > 0) {
    mutationRootFields.classMethods = {
      type: new GraphQLObjectType({name: "MutationClassMethods", fields: classMethodMutations}),
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

  const relayTypes = Object.keys(sqlInstance.models).reduce((types, name) => {
    if (typeCollection[name]) {
      types[name] = typeCollection[name];
    }
    return types;
  }, {});

  nodeTypeMapper.mapTypes(relayTypes);

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
