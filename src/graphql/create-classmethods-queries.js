
import waterfall from "../utils/waterfall";

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



export default function createClassMethodQueries(instance, definitions, options, schemaCache) {
  return async(defName, o) => {
    const definition = definitions[defName];
    const {query} = ((definition.expose || {}).classMethods || {});
    if (query) {
      const obj = await createClassMethodFields(instance, defName, definition, query, options, schemaCache);
      if (Object.keys(obj).length > 0) {
        o[defName] = {
          type: new GraphQLObjectType({
            name: `${defName}ClassMethods`,
            fields: obj,
          }),
          resolve() {
            return {};
          }
        };
      }
    }
    return o;
  };
}

export function createClassMethodFields(instance, defName, definition, query, options, schemaCache) {
  return waterfall(Object.keys(query), async(methodName, o) => {
    if (options.permission) {
      if (options.permission.queryClassMethods) {
        const result = await options.permission.queryClassMethods(defName, methodName, options.permission.options);
        if (!result) {
          return o;
        }
      }
    }
    const {type, args} = query[methodName];
    let outputType = (type instanceof String || typeof type === "string") ? schemaCache.types[type] : type;
    if (!outputType) {
      return o;
    }
    o[methodName] = {
      type: outputType,
      args,
      async resolve(source, args, context, info) {
        return instance.resolveClassMethod(defName, methodName, source, args, context, info);
      },
    };
    return o;

  }, {});
}
