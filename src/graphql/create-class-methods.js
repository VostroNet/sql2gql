
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
import { capitalize } from "../utils/word";



export default function createClassMethods(instance, definitions, options, schemaCache, targetName = "query") {
  return async(defName, o) => {
    const definition = definitions[defName];
    const target = ((definition.expose || {}).classMethods || {})[targetName];
    if (target) {
      const obj = await createClassMethodFields(instance, defName, definition, target, options, schemaCache, targetName);
      if (Object.keys(obj).length > 0) {
        o[defName] = {
          type: new GraphQLObjectType({
            name: `${defName}${capitalize(targetName)}ClassMethods`,
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

export function createClassMethodFields(instance, defName, definition, query, options, schemaCache, targetName) {
  return waterfall(Object.keys(query), async(methodName, o) => {
    if (options.permission) {
      if (options.permission.queryClassMethods && targetName === "query") {
        const result = await options.permission.queryClassMethods(defName, methodName, options.permission.options);
        if (!result) {
          return o;
        }
      } else if (options.permission.mutationClassMethods && targetName === "mutations") {
        const result = await options.permission.mutationClassMethods(defName, methodName, options.permission.options);
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
