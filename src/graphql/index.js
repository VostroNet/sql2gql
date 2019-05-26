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
import createListObject from "./create-list-object";
import createClassMethodQueries from "./create-classmethods-queries";
import createMutationModel from "./create-mutation-model";
import createMutationInput from "./create-mutation-input";
import createSchemaCache from "./create-schema-cache";

// function getGraphQLObject(defName, instance) {
//   return !(!instance.cache.get("objects", {})[defName]);
// }
export function createModelTypes(instance, options, nodeInterface, schemaCache) {
  return async(defName, o) => {
    if (options.permission) {
      if (options.permission.model) {
        const result = await options.permission.model(defName);
        if (!result) {
          return o;
        }
      }
    }
    o[defName] = await createModelType(defName, instance, options, nodeInterface, schemaCache);
    return o;
  };
}
export function createListObjects(instance, schemaCache, options) {
  return async(defName, o) => {
    if (schemaCache.types[defName]) {
      if (options.permission) {
        if (options.permission.query) {
          const result = await options.permission.query(defName, options.permission.options);
          if (!result) {
            return o;
          }
        }
      }
      o[defName] = createListObject(instance, schemaCache, defName, schemaCache.types[defName], (source, args, context, info) => {
        return instance.resolveFindAll(defName, source, args, context, info);
      }, "", "");
    }
    return o;
  };
}

function createMutationInputs(instance, definitions, options, schemaCache) {
  return async(defName, o) => {
    if (schemaCache.types[defName]) {
      if (options.permission) {
        if (options.permission.mutation) {
          const result = await options.permission.mutation(defName, options.permission.options);
          if (!result) {
            return o;
          }
        }
      }
      o[defName] = await createMutationInput(instance, defName, schemaCache, o);
    }
    return o;
  };
}

function createMutationModels(instance, definitions, options, schemaCache) {
  return async(defName, o) => {
    if (schemaCache.types[defName]) {
      let updateResult = true, deleteResult = true, createResult = true;
      if (options.permission) {
        if (options.permission.mutation) {
          const result = await options.permission.mutation(defName, options.permission.options);
          if (!result) {
            return o;
          }
        }
        if (options.permission.mutationUpdate) {
          updateResult = await options.permission.mutationUpdate(defName, options.permission.options);
        }
        if (options.permission.mutationDelete) {
          deleteResult = await options.permission.mutationDelete(defName, options.permission.options);
        }
        if (options.permission.mutationCreate) {
          createResult = await options.permission.mutationCreate(defName, options.permission.options);
        }
      }
      if (createResult || updateResult || deleteResult) {
        o[defName] = await createMutationModel(instance, defName, schemaCache, o,
          createResult, updateResult, deleteResult);
      }
    }
    return o;
  };
}

export async function createSchemaObjects(instance, options) {
  const rootSchema = {};
  const {nodeInterface, nodeField, nodeTypeMapper} = createNodeInterface(instance);
  const {subscriptions, extend = {}, root} = options;
  const definitions = instance.getDefinitions();
  const schemaCache = createSchemaCache();

  const types = await waterfall(Object.keys(definitions),
    createModelTypes(instance, options, nodeInterface, schemaCache), schemaCache.types);

  const queryLists = await waterfall(Object.keys(definitions),
    createListObjects(instance, schemaCache, options), schemaCache.lists);

  const classMethodQueries = await waterfall(Object.keys(definitions),
    createClassMethodQueries(instance, definitions, options, schemaCache), schemaCache.classMethods);

  const inputs = await waterfall(Object.keys(definitions),
    createMutationInputs(instance, definitions, options, schemaCache), schemaCache.mutationInputs);

  const mutationCollection = await waterfall(Object.keys(definitions),
    createMutationModels(instance, definitions, options, schemaCache), schemaCache.mutationModels);


  const queryRootFields = {
    node: nodeField,
  };
  const mutationRootFields = {};
  if (Object.keys(queryLists).length > 0) {
    queryRootFields.models = {
      type: new GraphQLObjectType({
        name: "QueryModels",
        fields() {
          return queryLists;
        },
      }),
      resolve() {
        return {};
      },
    };
  }
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



  if (Object.keys(mutationCollection).length > 0) {
    mutationRootFields.models = {
      type: new GraphQLObjectType({name: "MutationModels", fields: mutationCollection}),
      resolve() {
        return {};
      },
    };
  }
  // let classMethodMutations = await createMutationClassMethods(sqlInstance.models, validKeys, typeCollection, options);
  // if (Object.keys(classMethodMutations).length > 0) {
  //   mutationRootFields.classMethods = {
  //     type: new GraphQLObjectType({name: "MutationClassMethods", fields: classMethodMutations}),
  //     resolve() {
  //       return {};
  //     },
  //   };
  // }
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

  // const relayTypes = Object.keys(sqlInstance.models).reduce((types, name) => {
  //   if (typeCollection[name]) {
  //     types[name] = typeCollection[name];
  //   }
  //   return types;
  // }, {});

  // const relayTypes = Object.keys(instance.getModels());
  nodeTypeMapper.mapTypes(schemaCache.types);

  const subscriptionRootFields = Object.assign({}, subscriptions);

  // if ((sqlInstance.$sqlgql || {}).subscriptions) {
  //   const {pubsub} = (sqlInstance.$sqlgql || {}).subscriptions;
  //   subscriptionRootFields = await createSubscriptionFunctions(pubsub, sqlInstance.models, validKeys, typeCollection, options);
  //   if (Object.keys(subscriptionRootFields).length > 0) {
  //     rootSchema.subscription = new GraphQLObjectType({
  //       name: "Subscription",
  //       fields: subscriptionRootFields,
  //     });
  //   }
  // }
  // const extensions = {};
  // const schemaParams = Object.assign(rootSchema, extensions);

  if (!rootSchema.query) {
    throw new Error("GraphQLSchema requires query to be set. Are your permissions settings to aggressive?");
  }
  return {
    types: schemaCache.types,
    root: Object.assign(rootSchema, {...root})
  };
}



export async function createSchema(dbInstance, options = {}) {
  const schemaObjects = await createSchemaObjects(dbInstance, options);
  const schema = new GraphQLSchema(schemaObjects.root);
  schema.$sql2gql = {
    types: schemaObjects.types,
  };
  return schema;
}
