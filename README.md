# sql2gql

Relay structured opininated Sequelize to GraphQL databinder, extending out graphql-sequelize with dynamically exposing relationships and functions via queries and mutations. We rely heavily on the Sequelize API for definition of the model classes.

[![Build Status](https://travis-ci.org/VostroNet/sql2gql.svg?branch=master)](https://travis-ci.org/VostroNet/sql2gql)

## Requirements

- [NodeJs](https://nodejs.org/) >= 8
- [Sequelize](http://docs.sequelizejs.com/) v3/v4
- [graphql](http://graphql.org/learn/)
- [graphql-sequelize](https://github.com/mickhansen/graphql-sequelize)

## Features

- Relay output structure for all components
- Dynamic mapping of sequelize models and relationships to graphql for query and mutation.
- Exposing class and instance methods as mutation/query options.
- Permissions to restrict access to parts of the graphql schema on generation.
- Generation of [subscriptions](https://github.com/apollographql/graphql-subscriptions) from sequelize hooks

## Mutations

At the moment graphql mutation documents only execute syncronously at the top level and as we structure alot of the functions in sections this causes the document to resolve asyncronously rather then syncronous and in order.

Proposal for fully syncronous mutations

[issue](https://github.com/facebook/graphql/issues/252)

Mutations will still work without the following its just they will not be consistant and in order.

### Temporary Fix

I have applied a fix to detect if the sub execution context is under a mutation and execute all in a fashion syncronous instead.

Version: 14.0.2 (as of 20181113 - let me know if you need a specific version in the Issues section)

```sh
yarn add graphql@npm:vostro/graphql
```

[commit](https://github.com/VostroNet/graphql-js/commit/ed3d0aee334ed3856db2ade13a40803fe1b9b9c6)

## TODO - 3.0.0 Release

### Test Cases

#### Mutation

- add/remove from relationships in create & update
- ensure all functions are executed synchronously from top to bottom left to right
- Create, Update and Delete are always executed in that order per Object.

#### General

- replaceIdDeep should resolve variables from parameters across all mutations and queries

#### Query

- belongsToMany
- paging
- orderBy

### Features

- set hasOne or belongsTo to null

### Bugs

### Tasks

- refactor code all duplicate code out
- evaluate performance (build stress test cases)
- test against sequelize 5
- rebuild documentation

### Ideas

- flag for mutation - delete to not include results or the object deleted, or should this be normal and reverse the logic on the flag?
