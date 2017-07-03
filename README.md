# sql2gql

Opininated Sequelize to GraphQL bridge, extending out graphql-sequelize with dynamically exposing relationships and functions via queries and mutations. We rely heavily on the Sequelize API for definition of the model classes.

[![Build Status](https://travis-ci.org/VostroNet/sql2gql.svg?branch=master)](https://travis-ci.org/VostroNet/sql2gql)

## Requirements
- NodeJs >= 4
- (Sequelize)[http://docs.sequelizejs.com/] v3/v4
- (graphql)[http://graphql.org/learn/]
- (graphql-sequelize)[https://github.com/mickhansen/graphql-sequelize]

## Features 

- Dynamic mapping of sequelize models and relationships to graphql for query and mutation.
- Exposing classMethods as mutation/query options.
- Permissions Mechanism to restrict access to parts of the schema.

## ES6/Babel Support
We use the stage-0 feature set from babel (03/07/2017) as well as await & async. To improve compatibility we target Node v4 as the build distribution for the npm package, but we include the source distribution for those who wish to optimize their implementation. Recommend using babel with "babel-preset-stage0" and "babel-preset-env".

```javascript
import {connect, createSchema} from "sql2gql/src";
```

## Example

```javascript

import Sequelize from "sequelize";
import {connect, createSchema} from "sql2gql";

import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLObjectType,
  GraphQLInt,
} from "graphql";


const TaskModel = {
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
  relationships: [],
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
  classMethods: {
    getHiddenData(args, req) {
      return {
        hidden: "Hi",
      };
    }
  },
  options: {
    tableName: "tasks",
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
  },
};


const schemas = [TaskModel];

(async() => {
  let instance = new Sequelize("database", "username", "password", {
    dialect: "sqlite",
    logging: false
  });
  connect(schemas, instance, {}); // this populates the sequelize instance with the appropriate models and referential information for schema generation
  await instance.sync();
  const {Task} = instance.models;
  await Promise.all([
    Task.create({
      name: "item1",
    }),
    Task.create({
      name: "item2",
    }),
    Task.create({
      name: "item3",
    }),
  ]);
  const schema = await createSchema(instance); //creates graphql schema
  const result = await graphql(schema, "query { models { Task { id, name } } }");
  return expect(result.data.models.Task.length).toEqual(3);
})();





```
