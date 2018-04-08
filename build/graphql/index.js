"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createSchema = createSchema;

var _graphql = require("graphql");

var _graphqlSequelize = require("graphql-sequelize");

var _getModelDef = _interopRequireDefault(require("./utils/get-model-def"));

var _createBase = _interopRequireDefault(require("./models/create-base"));

var _createComplex = _interopRequireDefault(require("./models/create-complex"));

var _mutation = _interopRequireDefault(require("./mutation/"));

var _createFunctions = _interopRequireDefault(require("./mutation/create-functions"));

var _createInput = _interopRequireDefault(require("./mutation/create-input"));

var _createLists = _interopRequireDefault(require("./query/create-lists"));

var _createClassMethods = _interopRequireDefault(require("./query/create-class-methods"));

var _subscriptions = _interopRequireDefault(require("./subscriptions"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  sequelizeNodeInterface
} = _graphqlSequelize.relay; // import deepmerge from "deepmerge";
// import Sequelize from "sequelize";
// import cls from "continuation-local-storage";
// const namespace = cls.createNamespace("sql2gql");
// Sequelize.useCLS(namespace);

async function createSchema(sqlInstance, options = {}) {
  const {
    nodeInterface,
    nodeField,
    nodeTypeMapper
  } = sequelizeNodeInterface(sqlInstance);
  const {
    query,
    mutations = {},
    subscriptions,
    extend = {}
  } = options;
  let validKeys = Object.keys(sqlInstance.models).reduce((o, key) => {
    if ((0, _getModelDef.default)(sqlInstance.models[key])) {
      o.push(key);
    }

    return o;
  }, []);
  let typeCollection = await (0, _createBase.default)(sqlInstance.models, validKeys, "", options, nodeInterface);
  const mutationInputTypes = await (0, _createInput.default)(sqlInstance.models, validKeys, typeCollection, options);
  const mutationFunctions = await (0, _createFunctions.default)(sqlInstance.models, validKeys, typeCollection, mutationInputTypes, options, () => mutationFunctions);
  typeCollection = await (0, _createComplex.default)(sqlInstance.models, validKeys, typeCollection, mutationFunctions, options);
  let mutationCollection = await (0, _mutation.default)(sqlInstance.models, validKeys, typeCollection, mutationFunctions, options);
  let queryRootFields = Object.assign({
    node: nodeField
  }, query);
  let rootSchema = {};
  let modelQueries = await (0, _createLists.default)(sqlInstance.models, validKeys, typeCollection, options);

  if (Object.keys(modelQueries).length > 0) {
    queryRootFields.models = {
      type: new _graphql.GraphQLObjectType({
        name: "QueryModels",
        fields: modelQueries
      }),

      resolve() {
        return {};
      }

    };
  }

  let classMethodQueries = await (0, _createClassMethods.default)(sqlInstance.models, validKeys, typeCollection, options);

  if (Object.keys(classMethodQueries).length > 0) {
    queryRootFields.classMethods = {
      type: new _graphql.GraphQLObjectType({
        name: "ClassMethods",
        fields: classMethodQueries
      }),

      resolve() {
        return {};
      }

    };
  }

  if (Object.keys(queryRootFields).length > 0) {
    rootSchema.query = new _graphql.GraphQLObjectType({
      name: "RootQuery",
      fields: queryRootFields
    });
  }

  let mutationRootFields = Object.assign({}, mutations);

  if (Object.keys(mutationCollection).length > 0) {
    mutationRootFields.models = {
      type: new _graphql.GraphQLObjectType({
        name: "MutationModels",
        fields: mutationCollection
      }),

      resolve() {
        return {};
      }

    };
  }

  if (Object.keys(mutationRootFields).length > 0) {
    rootSchema.mutation = new _graphql.GraphQLObjectType({
      name: "Mutation",
      fields: mutationRootFields
    });
  }

  const relayTypes = Object.keys(sqlInstance.models).reduce((types, name) => {
    if (typeCollection[name]) {
      types[name] = typeCollection[name];
    }

    return types;
  }, {});
  nodeTypeMapper.mapTypes(relayTypes);
  let subscriptionRootFields = Object.assign({}, subscriptions);

  if ((sqlInstance.$sqlgql || {}).subscriptions) {
    const {
      pubsub
    } = (sqlInstance.$sqlgql || {}).subscriptions;
    subscriptionRootFields = await (0, _subscriptions.default)(pubsub, sqlInstance.models, validKeys, typeCollection, options);

    if (Object.keys(subscriptionRootFields).length > 0) {
      rootSchema.subscription = new _graphql.GraphQLObjectType({
        name: "Subscription",
        fields: subscriptionRootFields
      });
    }
  }

  const schemaParams = Object.assign(rootSchema, extend);

  if (!schemaParams.query) {
    throw new Error("GraphQLSchema requires query to be set. Are your permissions settings to aggressive?");
  }

  const schema = new _graphql.GraphQLSchema(schemaParams);
  schema.$sql2gql = {
    types: typeCollection
  };
  return schema;
}
//# sourceMappingURL=index.js.map
