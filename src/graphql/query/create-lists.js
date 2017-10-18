

import {
  GraphQLList,
} from "graphql";

import {
  resolver,
  defaultListArgs,
} from "graphql-sequelize";

import createBeforeAfter from "../models/create-before-after";

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
      fields[modelName] = {
        type: new GraphQLList(typeCollection[modelName]),
        args: defaultListArgs(),
        resolve: resolver(models[modelName], {
          before,
          after,
        }),
      };
    }
  }));
  return fields;
}
