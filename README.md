# sql2gql

Opininated Sequelize to GraphQL bridge, extending out graphql-sequelize with dynamically exposing relationships and functions via queries and mutations. We rely heavily on the Sequelize API for definition of the model classes.

[![Build Status](https://travis-ci.org/VostroNet/sql2gql.svg?branch=master)](https://travis-ci.org/VostroNet/sql2gql)

## Requirements
- [NodeJs](https://nodejs.org/) >= 4
- [Sequelize](http://docs.sequelizejs.com/) v3/v4
- [graphql](http://graphql.org/learn/)
- [graphql-sequelize](https://github.com/mickhansen/graphql-sequelize)

## Features 

- Dynamic mapping of sequelize models and relationships to graphql for query and mutation.
- Exposing classMethods as mutation/query options.
- Permissions Mechanism to restrict access to parts of the schema.


## API

### Model
The model object is the bread and butter of the setup, it basically serves two purposes, creating the data model in sequelize and the graphql model.

| Key | type |  Description |
| --- | --- | --- |
| name | [String(sequelize.define.modelName)](http://docs.sequelizejs.com/class/lib/sequelize.js~Sequelize.html#instance-method-define)) | Model name  |
| define | [Object(sequelize.define.attributes)](http://docs.sequelizejs.com/class/lib/sequelize.js~Sequelize.html#instance-method-define) | Model fields | 
| options | [Object(sequelize.define.options)](http://docs.sequelizejs.com/class/lib/sequelize.js~Sequelize.html#instance-method-define) | Model sequelize.define options |
| relationships | Array(Model.Relationship) | Model relationships |
| expose | Object(Model.Expose) | this is used to make classMethods/instanceMethods available via queries or mutations in graphql
| classMethods | Object | static typed functions that are set on the model under sequelize (for v3 this will be copied into options instead) |
| instanceMethods | Object | functions that are set on the model's prototype under sequelize (for v3 this will be copied into options instead) |

#### Model.Expose
```
TODO
```
#### Model.Relationship

| Key | type |  Description |
| --- | --- | --- |
| name | String | Relationship field name for model |
| type | [String(sequelize.association)](http://docs.sequelizejs.com/class/lib/associations/base.js~Association.html) | Executes the association function on the model. |
| model | String(Model.name) | target model of the association |
| options | Object(sequelize.association.options)[http://docs.sequelizejs.com/class/lib/associations/base.js~Association.html] | The available options depends on the type of association you pick |

#### connect
This creates sequelize models and injects appropriate metadata for the createSchema function

```javascript
import {connect} from "sql2gql";
```

| Parameter |  Description |
| --- | --- |
| Array(Model) | Array of models |
| [Sequelize.instance](http://docs.sequelizejs.com/manual/installation/getting-started.html#setting-up-a-connection) | Sequelize Instance |

#### createSchema
Generates a graphql schema from the metadata stored in the sequelize instance.

```javascript
import {createSchema} from "sql2gql";
```

| Parameter |  Description |
| --- | --- |
| [Sequelize.instance](http://docs.sequelizejs.com/manual/installation/getting-started.html#setting-up-a-connection) | Sequelize Instance |
| Object(createSchema.options) | createSchema options |

#### createSchema.options
Generates a graphql schema from the metadata stored in the sequelize instance.

Returns Object(GraphqlSchema)

| Key | type |  Description |
| --- | --- | --- |
| name | String | Relationship field name for model |
| permissions | Object(createSchema.options.permissions) | hooks to constrain visibility of fields and functions
| query | Object(GraphqlSchema) | merges into base RootQuery field via Object.assign
| mutation | Object(GraphqlSchema) | merges into base Mutation field via Object.assign

#### createSchema.options.permissions
hooks to constrain visibility of fields and functions will only hide elements by default if hook is defined,

| Key | type |  Description |
| --- | --- | --- |
| model | Function(modelName: String) => Boolean | False ensures the model itself is no where available across the entire schema |
| relationship | Function(modelName: String,relationshipName: String, targetModelName: String) => Boolean | False ensures model field option "modelName {relationshipName}" is unavailable |
| query | Function(modelName: String) => Boolean | False ensures query option "query {model {modelName}}" is unavailable |
| queryClassMethods | Function(modelName: String, methodName: String) => Boolean | False ensures query option "query {classMethods {modelName {methodName}}}" is unavailable |
| mutation | Function(modelName) => Boolean | False ensures mutation option "mutation {models {modelName}}" is unavailable |
| mutationUpdate | Function(modelName) => Boolean | False ensures mutation option "mutation {models {modelName{update}}}" is unavailable |
| mutationCreate | Function(modelName) => Boolean | False ensures mutation option "mutation {models {modelName{create}}}" is unavailable |
| mutationDelete | Function(modelName) => Boolean | False ensures mutation option "mutation {models {modelName{delete}}}" is unavailable |
| mutationUpdateAll | Function(modelName) => Boolean | False ensures mutation option "mutation {models {modelName{updateAll}}}" is unavailable |
| mutationDeleteAll | Function(modelName) => Boolean | False ensures mutation option "mutation {models {modelName{deleteAll}}}" is unavailable |
| mutationClassMethods | Function(modelName: String, methodName: String) => Boolean | False ensures mutation option "mutation {classMethods {modelName {methodName}}}" is unavailable |


#### GraphqlSchema
[graphql-sequlize helpers](https://github.com/mickhansen/graphql-sequelize#args-helpers)

##### Query
```graphql
query {
  models {
    modelName(defaultListArgs): GraphQLList<Model> {
      field
      relationship(args) {
        field
      }
    }
  }
  classMethods {
    modelName {
      functionName(params) {
        {definedModel}
      }
    }
  }
}
```

##### Mutation - TBC
```graphql
mutation {
  models {
    modelName {
      create(input: modelDefinition) {
        field
      }

      update(where: SequelizeJSONType, input: modelDefinition) {
        field
      }
    }
  }
  classMethods {
    modelName {
      functionName(params) {
        fields
      }
    }
  }
}
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
