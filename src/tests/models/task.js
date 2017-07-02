import Sequelize from "sequelize";
import logger from "utils/logger";
// import {getDatabase} from "server/database";
// import Promise from "bluebird";
// import {InvalidUserNamePasswordError, FormSubmissionError, DatabasePermissionError} from "server/logic/errors";


// const log = logger("tests:models:task:");

import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLObjectType,
  GraphQLInt,
} from "graphql";


export default {
  name: "Task",
  define: {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        isAlphanumeric: {
          msg: "Your task name can only use letters and numbers",
        },
        len: {
          args: [1, 50],
          msg: "Your task name must be between 1 and 50 characters",
        },
      },
    },
  },
  relationships: [{
    type: "hasMany",
    model: "TaskItem",
    name: "items",
  }],
  expose: {
    classMethods: {
      mutations: {
        reverseName: {
          type: "Task",
          args: {
            input: {
              type: new GraphQLNonNull(new GraphQLInputObjectType({
                name: "TaskReverseNameInput",
                fields: {
                  amount: {type: new GraphQLNonNull(GraphQLInt)},
                },
              })),
            },
          },
        },
      },
      query: {
        getHiddenData: {
          type: new GraphQLObjectType({
            name: "TaskHiddenData",
            fields: () => ({
              hidden: {type: GraphQLString},
            }),
          }),
          args: {},
        },
      },
    },
  },
  options: {
    tableName: "tasks",
    classMethods: {
      reverseName({input: {amount}}, req) {
        return {
          id: 1,
          name: `reverseName${amount}`,
        };
      },
      getHiddenData(args, req) {
        return {
          hidden: "Hi",
        };
      },
    },
    hooks: {
      beforeFind(options) {
        return undefined;
      },
      beforeCreate(instance, options) {
        return undefined;
      },
      beforeUpdate(instance, options) {
        return undefined;
      },
      beforeDestroy(instance, options) {
        return undefined;
      },
    },
    indexes: [
      // {unique: true, fields: ["name"]},
    ],
    instanceMethods: {}, //TODO: figure out a way to expose this on graphql
  },
};
