import {
  GraphQLSchema,
  GraphQLObjectType,
} from "graphql";
import {
  relay,
} from "graphql-sequelize";

const {sequelizeNodeInterface} = relay;

import getModelDefinition from "./utils/get-model-def";

import createModels from "./models/create";

import createMutation from "./mutation/";
import createMutationFunctions from "./mutation/create-functions";
import createMutationInputs from "./mutation/create-input";
import createMutationClassMethods from "./mutation/create-class-methods";

import createQueryLists from "./query/create-lists";
import createQueryClassMethods from "./query/create-class-methods";
import createSubscriptionFunctions from "./subscriptions";
import waterfall from "../utils/waterfall";

/**
 * @function createSchema
 * @param {Object} sqlInstance
 * @param {Object} options
 * @return {GraphQLSchema}
*/

export async function createSchemaObjects(sqlInstance, options = {}) {
  const {nodeInterface, nodeField, nodeTypeMapper} = sequelizeNodeInterface(sqlInstance);
  const {subscriptions, extend = {}, root} = options;
  let validKeys = Object.keys(sqlInstance.models).reduce((o, key) => {
    if (getModelDefinition(sqlInstance.models[key])) {
      o.push(key);
    }
    return o;
  }, []);
  let typeCollection = await createModels(sqlInstance.models, validKeys, "", options, nodeInterface);
  const mutationInputTypes = await createMutationInputs(sqlInstance.models, validKeys, typeCollection, options);
  const mutationFunctions = await createMutationFunctions(sqlInstance.models, validKeys, typeCollection, mutationInputTypes, options, () => mutationFunctions);
  let mutationCollection = await createMutation(sqlInstance.models, validKeys, typeCollection, mutationFunctions, options);
  let queryRootFields = {
    node: nodeField,
  };
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
  if ((extend || {}).query) {
    queryRootFields = await waterfall(Object.keys(extend.query), async(k, o) => {
      if (options.permission) {
        if (options.permission.queryExtension) {
          const result = await options.permission.queryExtension(k, options.permission.options);
          if (!result) {
            return o;
          }
        }
      }
      o[k] = extend.query[k];
      return o;
    }, queryRootFields);
  }
  if (Object.keys(queryRootFields).length > 0) {
    rootSchema.query = new GraphQLObjectType({
      name: "RootQuery",
      fields: queryRootFields,
    });
  }
  let mutationRootFields = {};//Object.assign({}, extemmutations);
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
  if ((extend || {}).mutation) {
    mutationRootFields = await waterfall(Object.keys(extend.mutation), async(k, o) => {
      if (options.permission) {
        if (options.permission.mutationExtension) {
          const result = await options.permission.mutationExtension(k, options.permission.options);
          if (!result) {
            return o;
          }
        }
      }
      o[k] = extend.mutation[k];
      return o;
    }, mutationRootFields);
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
  // const extensions = {};
  // const schemaParams = Object.assign(rootSchema, extensions);

  if (!rootSchema.query) {
    throw new Error("GraphQLSchema requires query to be set. Are your permissions settings to aggressive?");
  }
  return {
    types: typeCollection,
    root: Object.assign(rootSchema, {...root})
  };

}



export async function createSchema(sqlInstance, options = {}) {
  const schemaObjects = await createSchemaObjects(sqlInstance, options);
  const schema = new GraphQLSchema(schemaObjects.root);
  schema.$sql2gql = {
    types: schemaObjects.types,
  };
  return schema;
}
