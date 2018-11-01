import {
  JSONType,
  relay,
} from "graphql-sequelize";
import {replaceWhereOperators} from "graphql-sequelize/lib/replaceWhereOperators";
import getModelDefinition from "../utils/get-model-def";
import createBeforeAfter from "../models/create-before-after";


import {
  GraphQLInt, GraphQLEnumType, GraphQLInputObjectType, GraphQLList,
  GraphQLBoolean,
} from "graphql";

/**
 * @function createModelLists
 * @param {Object} models
 * @param {string[]} modelNames
 * @param {Object} typeCollection
 * @param {Object} options
 * @param {Object} fields
 * @returns {Object}
*/

const {sequelizeConnection} =  relay;

export default async function createModelLists(models, modelNames, typeCollection, options, fields = {}) {
  await Promise.all(modelNames.map(async(modelName) => {
    if (typeCollection[modelName]) {
      if (options.permission) {
        if (options.permission.query) {
          const result = await options.permission.query(modelName, options.permission.options);
          if (!result) {
            return;
          }
        }
      }
      const {before, after} = createBeforeAfter(models[modelName], options);
      const def = getModelDefinition(models[modelName]);
      const basicFields = typeCollection[modelName].$sql2gql.basicFields();
      const relationMap = def.relationships.reduce((o, r) => {
        o[r.name] = r.model;
        return o;
      }, {});

      const values = Object.keys(basicFields).reduce((o, key) => {
        o[`${key}ASC`] = {
          value: [key, "ASC"],
        };
        o[`${key}DESC`] = {
          value: [key, "DESC"],
        };
        return o;
      }, {});
      const orderBy = new GraphQLEnumType({
        name: `${modelName}OrderBy`,
        values: Object.assign({}, values, def.orderBy),
      });

      const c = sequelizeConnection({
        name: `${modelName}`,
        nodeType: typeCollection[modelName],
        target: models[modelName],
        orderBy: orderBy,
        edgeFields: def.edgeFields,
        connectionFields: Object.assign({}, {
          total: {
            type: GraphQLInt,
            async resolve(source, a, context, info) {
              const {args} = source;
              if (args.first || args.last) {
                return models[modelName].count({where: args.where, context, info});
              }
              return (source.edges || []).length;
            },
          },
        }, def.connectionFields),
        where: (key, value, currentWhere) => {
          // for custom args other than connectionArgs return a sequelize where parameter
          if (key === "include") {
            return currentWhere;
          }
          if (key === "where") {
            return value;
          }
          return {[key]: value};
        },
        before(options, args, context, info) {
          if (args.include) {
            options.include = args.include.map((i) => {
              const {relName, where, required} = i;
              return {
                as: relName,
                model: models[relationMap[relName]],
                where: (where) ? replaceWhereOperators(where) : undefined,
                required,
              };
            });
          }

          return before(options, args, context, info);
        }, after,
      });
      const relatedFields = typeCollection[modelName].$sql2gql.relatedFields();
      const complexKeys = Object.keys(relatedFields);
      let include;
      if (complexKeys.length > 0) {
        include = new GraphQLList(new GraphQLInputObjectType({
          name: `${modelName}Include`,
          fields: {
            relName: {
              type: new GraphQLEnumType({
                name: `${modelName}IncludeEnum`,
                values: Object.keys(relatedFields).reduce((o, k) => {
                  o[k] = {value: k};
                  return o;
                }, {}),
              }),
            },
            where: {
              type: JSONType.default,
            },
            required: {
              type: GraphQLBoolean,
            }
          },
        }));
      }
      fields[modelName] = {
        type: c.connectionType,
        args: {
          ...c.connectionArgs,
          where: {
            type: JSONType.default,
          },
          include: (include) ? {type: include} : undefined,
        },
        async resolve(source, args, context, info) {
          return c.resolve(source, args, context, info);
        },
      };
    }
  }));
  return fields;
}
