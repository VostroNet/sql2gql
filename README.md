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
- Permissions to restrict access to parts of the graphql schema on generation.
- Generation of [subscriptions](https://github.com/apollographql/graphql-subscriptions) from sequelize hooks


## API

### Model
The model object is the bread and butter of the setup, it basically serves two purposes, creating the data model in sequelize and the graphql model.

| Key | type |  Description |
| --- | --- | --- |
| name | [String(sequelize.define.modelName)](http://docs.sequelizejs.com/class/lib/sequelize.js~Sequelize.html#instance-method-define)) | Model name  |
| define | [Object(sequelize.define.attributes)](http://docs.sequelizejs.com/class/lib/sequelize.js~Sequelize.html#instance-method-define) | Model fields | 
| options | [Object(sequelize.define.options)](http://docs.sequelizejs.com/class/lib/sequelize.js~Sequelize.html#instance-method-define) | Model sequelize.define options |
| relationships | Array[Model.Relationship] | Model relationships |
| expose | Object(Model.Expose) | this is used to make classMethods/instanceMethods available via queries or mutations in graphql
| classMethods | Object | static typed functions that are set on the model under sequelize (for v3 this will be copied into options instead) |
| instanceMethods | Object | functions that are set on the model's prototype under sequelize (for v3 this will be copied into options instead) |
| ignoreFields | Array[String] | TODO |
| before | ({params, args, context, info, type}) =>  return params | This function is executed before graphql-sequelize resolver is tasked, you must return the params for it to be able to continue |
| after | ({result, args, context, info, type}) => return result | This function is executed after graphql-sequelize resolver has completed but before the result is passed up to graphql for queries, , , type determines ns |
| override | HashObject[fieldName -> Model.override] | overrides the field resolver functions to allow for complex types on on simple fields e.g. JSON,JSONB |
| resolver | () => Object | the replaces graphql-sequelize resolver completely |
| subscriptions | HashObject[hookName -> (instance, args, req, gql) => {return instance}] | overrides default action of subscription hook event, this occurs after all sequelize hooks and must return a model. |

#### Model.Override

| Key | type |  Description |
| --- | --- | --- |
| type | {name: String, fields: [GraphQLFieldConfigMap](http://graphql.org/graphql-js/type/#graphqlobjecttype)} | GraphQLObject definition |
| output | (result, args, context, info) => fieldData | This function processes outgoing data for the the field, the result is the parent model. |
| output | (field, args, context, info) => fieldData | This function processes incoming data for the the field, the field param is the input argument set for the field. |

#### Model.Expose

| Key | type |  Description |
| --- | --- | --- |
| classMethods | Object({query: Model.Expose.Definition, mutation: Model.Expose.Definition}) | Object containing the graphql definition of classMethods you wish to expose on either query or mutation |
| instanceMethods | Object({query: Model.Expose.Definition}) | Object containing the graphql definition of instanceMethods you wish to expose as a field query |

#### Model.Expose.Definition
This object is a HashObject which the key must match the function name targeted.

| Key | type |  Description |
| --- | --- | --- |
| type | String or [GraphQLObjectType](http://graphql.org/graphql-js/type/#graphqlobjecttype) | If this is a string it will use the models generated graphql type as the return value, other wise if it is [GraphQLObjectType](http://graphql.org/graphql-js/type/#graphqlobjecttype) it will use this instead  |
| args | Key value hash object that require [GraphQLInputObjectType](http://graphql.org/graphql-js/type/#graphqlinputobjecttype)  |

#### Model.Relationship

| Key | type |  Description |
| --- | --- | --- |
| name | String | Relationship field name for model |
| type | [String(sequelize.association)](http://docs.sequelizejs.com/class/lib/associations/base.js~Association.html) | Executes the association function on the model. |
| model | String(Model.name) | target model of the association |
| options | [Object(sequelize.association.options)](http://docs.sequelizejs.com/class/lib/associations/base.js~Association.html) | The available options depends on the type of association you pick |

#### connect
This creates sequelize models and injects appropriate metadata for the createSchema function

```javascript
import {connect} from "sql2gql";
```

| Parameter |  Description |
| --- | --- |
| Array(Model) | Array of models |
| [Sequelize.instance](http://docs.sequelizejs.com/manual/installation/getting-started.html#setting-up-a-connection) | Sequelize connection instance |

#### createSchema
Generates a graphql schema from the metadata stored in the sequelize instance.

```javascript
import {createSchema} from "sql2gql";
```

| Parameter |  Description |
| --- | --- |
| [Sequelize.connection](http://docs.sequelizejs.com/manual/installation/getting-started.html#setting-up-a-connection) | Sequelize connection instance |
| Object(createSchema.options) | createSchema options |

#### createSchema.options
Generates a graphql schema from the metadata stored in the sequelize instance.

Returns Object([GraphQLSchema](http://graphql.org/graphql-js/type/#graphqlschema))

| Key | type |  Description |
| --- | --- | --- |
| name | String | Relationship field name for model |
| permissions | Object(createSchema.options.permissions) | optional hooks to constrain visibility of fields and functions
| query | Object([GraphQLSchema](http://graphql.org/graphql-js/type/#graphqlschema)) | merges into base RootQuery field via Object.assign |
| mutation | Object([GraphQLSchema](http://graphql.org/graphql-js/type/#graphqlschema)) | merges into base Mutation field via Object.assign |
| before | (model: Model, findOptions, args, context, info) =>  return findOptions | |
| after | (model: Model, result, args, context, info) => return result | |
| subscriptions | Object[createSchema.options.subscriptions] | config options for the subscriptions |
#### createSchema.options.subscriptions

| Key | type |  Description |
| --- | --- | --- |
| hookNames | [String] | list of hooks that will be registered per model, please see [Sequelize.Hooks](http://docs.sequelizejs.com/manual/tutorial/hooks.html) for the full list of available. ["afterCreate", "afterDestroy", "afterUpdate"] are the default settings. Currently only (instance, options) typed hooks are automatically support as each subscription is configured to return the type of the model it is for.|
| pubsub | [PubSub](https://github.com/apollographql/graphql-subscriptions) | pubsub is required for handling events between sequelize and the graphql instance. Please see [GraphQL Subscriptions](http://dev.apollodata.com/tools/graphql-subscriptions/index.html) for more information |


#### createSchema.options.permissions
hooks to constrain visibility of fields and functions will only hide elements by default if hook is defined,

| Key | type |  Description |
| --- | --- | --- |
| model | (modelName: String) => Boolean | False ensures the model itself is no where available across the entire schema |
| field | (modelName: String, fieldName: String) => Boolean | False ensures model field "query {model {modelName {fieldName}}}" is unavailable |
| relationship | (modelName: String,relationshipName: String, targetModelName: String) => Boolean | False ensures model field option "modelName {relationshipName}" is unavailable |
| query | (modelName: String) => Boolean | False ensures query option "query {model {modelName}}" is unavailable |
| queryClassMethods | (modelName: String, methodName: String) => Boolean | False ensures query option "query {classMethods {modelName {methodName}}}" is unavailable |
| queryInstanceMethods | (modelName: String, methodName: String) => Boolean | False ensures query option "query {classMethods {modelName {methodName}}}" is unavailable |
| mutation | (modelName) => Boolean | False ensures mutation option "mutation {models {modelName}}" is unavailable |
| mutationUpdate | (modelName) => Boolean | False ensures mutation option "mutation {models {modelName{update}}}" is unavailable |
| mutationCreate | (modelName) => Boolean | False ensures mutation option "mutation {models {modelName{create}}}" is unavailable |
| mutationDelete | (modelName) => Boolean | False ensures mutation option "mutation {models {modelName{delete}}}" is unavailable |
| mutationUpdateAll | (modelName) => Boolean | False ensures mutation option "mutation {models {modelName{updateAll}}}" is unavailable |
| mutationDeleteAll | (modelName) => Boolean | False ensures mutation option "mutation {models {modelName{deleteAll}}}" is unavailable |
| mutationClassMethods | (modelName: String, methodName: String) => Boolean | False ensures mutation option "mutation {classMethods {modelName {methodName}}}" is unavailable |
| subscription | (modelName, hookName) => Boolean | False ensures mutation option "subscription { \`{$hookName}${modelName}\`{ id } }" is unavailable |

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

##### Mutation
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
      classMethod(params) {
        field
      }
    }
  }
}
```

##### Subscription 
[Reference](https://github.com/apollographql/graphql-subscriptions)
```graphql
subscription X {
  afterCreateTask {
    id,
    name
  }
  afterUpdateTask {
    id,
    name
  }
}
```

## Example
[Github Repo](https://github.com/VostroNet/sql2gql-example)

```javascript
import Sequelize from "sequelize";
import {connect, createSchema} from "sql2gql";
import expect from "expect";
import {
  graphql,
  GraphQLString,
  GraphQLNonNull,
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
    options: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  },
  before(findOptions, args, context, info) {
    return findOptions;
  },
  after(result, args, context, info) {
    return result;
  },
  override: {
    options: {
      type: {
        name: "TaskOptions",
        fields: {
          hidden: {type: GraphQLString},
        },
      },
      output(result, args, context, info) {
        return JSON.parse(result.get("options"));
      },
      input(field, args, context, info) {
        return JSON.stringify(field);
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
        getHiddenData2: {
          type: new GraphQLObjectType({
            name: "TaskHiddenData2",
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
      reverseName({input: {amount}}, context) {
        return {
          id: 1,
          name: `reverseName${amount}`,
        };
      },
      getHiddenData(args, context) {
        return {
          hidden: "Hi",
        };
      },
      getHiddenData2(args, context) {
        return {
          hidden: "Hi2",
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
    //instanceMethods: {}, //TODO: figure out a way to expose this on graphql
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

  const schema = await createSchema(instance); //creates graphql schema
  const mutation = `mutation {
    models {
      Task {
        create(input: {name: "item1", options: {hidden: "nowhere"}}) {
          id, 
          name
          options {
            hidden
          }
        }
      }
    }
  }`; // create item in database
  const mutationResult = await graphql(schema, mutation);
  expect(mutationResult.data.models.Task.create.options.hidden).toEqual("nowhere");
  const queryResult = await graphql(schema, "query { models { Task { id, name, options {hidden} } } }"); // retrieves information from database
  return expect(queryResult.data.models.Task[0].options.hidden).toEqual("nowhere");
})();
```

## Permission Helper
The is a simple role base helper for hooking into the permission events for deny and allowing sections during schema generation based on roles provided.

```javascript
/* 
  options = {
    defaultDeny: true
    defaults: {

    }
  }
  defaultPerm = {
    "fields": {
      "Task": {
        "options": "deny",
      },
    },
    "classMethods": {
      "User": {
        "login": "allow",
        "logout": "allow",
      },
    },
  };

  rules = {
    "admin": {
      "field": {
        "User": "allow",
      } 
      "model": "allow",
      "classMethods": {
        "User": {
          "login": "deny",
        },
      },
    },
    "user": {
      "mutation": "deny",
    },
  };

*/

const ruleSet = {
  "someone": "deny",
  "anyone": {
    "query": "allow",
    "model": {
      "Task": "allow",
    },
    "field": {
      "Task": {
        "name": "allow",
      },
    },
  },
};

const anyoneSchema = await createSchema(instance, {
  permission: permissionHelper("anyone", ruleSet)
});

const someoneSchema = await createSchema(instance, {
  permission: permissionHelper("someone", ruleSet)
});

```


## ChangeLog
1.1.0
- delete mutations now return object that it has deleted instead of boolean - **[Breaking change from 1.0.0]**
- subscriptions are now supported, defaults will hook into afterCreate, afterUpdate, afterDestroy on the sequelize models
- added extend to options in createScheme for supporting unknown/future root variables 
- set all functions to export to allow for anyone wanting to use the api directly

1.2.0

- changed before and after hooks on the model definition to include mutations, the arguments have been reduced to a single object - **[Breaking change from 1.1.0]**

1.2.1

- fixed before, after hooks arguments for mutations 

1.2.2

- adding rootValue and context to the findOptions statement provided to sequelize. accessible from the hook beforeFind. 
- updated base model before after hooks.

1.2.4

- updated override to allow scalar and enum types to be set as the field type directly 

1.2.5

- added Instance Methods to the query field definition if exposed.

1.2.6

- exposed generated types via $sql2gql.types on the schema returned from connect

1.2.7

- Added field permission option

2.0.0

- Added subscription permission option
- added a simple role based permission helper
- fixed field permissions return value to be correct
- removed some let over debugging mechanics from 1.2.7
- updated package dependencies
- switch to the official graphql subscriptions mechanic in the test cases
- updated all the tests to match the jest version of expect
- implemented a basic role based permission helper.
- added checks for over aggressive permission handling
- added the default fields to the permission check
- dropping node support for anything lesser then current LTS aka compile target is currently v6.11.3