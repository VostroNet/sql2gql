"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createSchema = createSchema;

var _graphql = require("graphql");

var _graphqlSequelize = require("graphql-sequelize");

var _getModelDef = _interopRequireDefault(require("./utils/get-model-def"));

var _create = _interopRequireDefault(require("./models/create"));

var _mutation = _interopRequireDefault(require("./mutation/"));

var _createFunctions = _interopRequireDefault(require("./mutation/create-functions"));

var _createInput = _interopRequireDefault(require("./mutation/create-input"));

var _createClassMethods = _interopRequireDefault(require("./mutation/create-class-methods"));

var _createLists = _interopRequireDefault(require("./query/create-lists"));

var _createClassMethods2 = _interopRequireDefault(require("./query/create-class-methods"));

var _subscriptions = _interopRequireDefault(require("./subscriptions"));

var _waterfall = _interopRequireDefault(require("../utils/waterfall"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const {
  sequelizeNodeInterface
} = _graphqlSequelize.relay;

/**
 * @function createSchema
 * @param {Object} sqlInstance
 * @param {Object} options
 * @return {GraphQLSchema}
*/
async function createSchema(sqlInstance, options = {}) {
  const {
    nodeInterface,
    nodeField,
    nodeTypeMapper
  } = sequelizeNodeInterface(sqlInstance);
  const {
    subscriptions,
    extend = {},
    root
  } = options;
  let validKeys = Object.keys(sqlInstance.models).reduce((o, key) => {
    if ((0, _getModelDef.default)(sqlInstance.models[key])) {
      o.push(key);
    }

    return o;
  }, []);
  let typeCollection = await (0, _create.default)(sqlInstance.models, validKeys, "", options, nodeInterface);
  const mutationInputTypes = await (0, _createInput.default)(sqlInstance.models, validKeys, typeCollection, options);
  const mutationFunctions = await (0, _createFunctions.default)(sqlInstance.models, validKeys, typeCollection, mutationInputTypes, options, () => mutationFunctions);
  let mutationCollection = await (0, _mutation.default)(sqlInstance.models, validKeys, typeCollection, mutationFunctions, options);
  let queryRootFields = {
    node: nodeField
  };
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

  let classMethodQueries = await (0, _createClassMethods2.default)(sqlInstance.models, validKeys, typeCollection, options);

  if (Object.keys(classMethodQueries).length > 0) {
    queryRootFields.classMethods = {
      type: new _graphql.GraphQLObjectType({
        name: "QueryClassMethods",
        fields: classMethodQueries
      }),

      resolve() {
        return {};
      }

    };
  }

  if ((extend || {}).query) {
    queryRootFields = await (0, _waterfall.default)(Object.keys(extend.query), async (k, o) => {
      if (options.permission) {
        if (options.permission.queryExtension) {
          const result = await options.permission.queryExtension(k, options.permission.options);

          if (!result) {
            return o;
          }
        }
      }

      o[k] = extend.query[k];
      return o;
    }, queryRootFields);
  }

  if (Object.keys(queryRootFields).length > 0) {
    rootSchema.query = new _graphql.GraphQLObjectType({
      name: "RootQuery",
      fields: queryRootFields
    });
  }

  let mutationRootFields = {}; //Object.assign({}, extemmutations);

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

  let classMethodMutations = await (0, _createClassMethods.default)(sqlInstance.models, validKeys, typeCollection, options);

  if (Object.keys(classMethodMutations).length > 0) {
    mutationRootFields.classMethods = {
      type: new _graphql.GraphQLObjectType({
        name: "MutationClassMethods",
        fields: classMethodMutations
      }),

      resolve() {
        return {};
      }

    };
  }

  if ((extend || {}).mutation) {
    mutationRootFields = await (0, _waterfall.default)(Object.keys(extend.mutation), async (k, o) => {
      if (options.permission) {
        if (options.permission.mutationExtension) {
          const result = await options.permission.mutationExtension(k, options.permission.options);

          if (!result) {
            return o;
          }
        }
      }

      o[k] = extend.mutation[k];
      return o;
    }, mutationRootFields);
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
  } // const extensions = {};
  // const schemaParams = Object.assign(rootSchema, extensions);


  if (!rootSchema.query) {
    throw new Error("GraphQLSchema requires query to be set. Are your permissions settings to aggressive?");
  }

  const schema = new _graphql.GraphQLSchema(Object.assign(rootSchema, _objectSpread({}, root)));
  schema.$sql2gql = {
    types: typeCollection
  };
  return schema;
}
//# sourceMappingURL=index.js.map
