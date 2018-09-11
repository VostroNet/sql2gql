import {
  JSONType,
  relay,
} from "graphql-sequelize";
import getModelDefinition from "../utils/get-model-def";
import createBeforeAfter from "../models/create-before-after";

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
      // let targetOpts = options[modelName];
      const {before, after} = createBeforeAfter(models[modelName], options);
      const def = getModelDefinition(models[modelName]);
      const c = sequelizeConnection({
        name: `${modelName}`,
        nodeType: typeCollection[modelName],
        target: models[modelName],
        orderBy: def.orderBy,
        edgeFields: def.edgeFields,
        connectionFields: def.connectionFields,
        where: (key, value, currentWhere) => {
          // for custom args other than connectionArgs return a sequelize where parameter
          if (key === "where") {
            return value;
          }
          return {[key]: value};
        },
        before, after,
      });


      // fields[modelName] = {
      //   type: new GraphQLList(typeCollection[modelName]),
      //   args: defaultListArgs(),
      //   resolve: resolver(models[modelName], {
      //     before,
      //     after,
      //   }),
      // };
      fields[modelName] = {
        type: c.connectionType,
        args: {
          ...c.connectionArgs,
          where: {
            type: JSONType.default,
          }
        },
        async resolve(source, args, context, info) {
          return c.resolve(source, args, context, info);
        },
      };
    }
  }));
  return fields;
}
