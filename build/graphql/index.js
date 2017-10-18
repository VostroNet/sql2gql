"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createSchema = undefined;

let createSchema = exports.createSchema = (() => {
  var _ref = _asyncToGenerator(function* (sqlInstance, options = {}) {
    const { query, mutations = {}, subscriptions, extend = {} } = options;
    let validKeys = Object.keys(sqlInstance.models).reduce(function (o, key) {
      if ((0, _getModelDef2.default)(sqlInstance.models[key])) {
        o.push(key);
      }
      return o;
    }, []);
    let typeCollection = yield (0, _createBase2.default)(sqlInstance.models, validKeys, "", options);
    const mutationInputTypes = yield (0, _createInput2.default)(sqlInstance.models, validKeys, typeCollection, options);
    const mutationFunctions = yield (0, _createFunctions2.default)(sqlInstance.models, validKeys, typeCollection, mutationInputTypes, options);
    typeCollection = yield (0, _createComplex2.default)(sqlInstance.models, validKeys, typeCollection, mutationFunctions, options);
    let mutationCollection = {};
    if (options.version === 3 && options.compat === 2) {
      mutations.v2 = {
        type: new _graphql.GraphQLObjectType({
          name: "v2Compat",
          fields: yield (0, _mutation2.default)(sqlInstance.models, validKeys, typeCollection, {}, mutationInputTypes, options)
        }),
        resolve: function () {}
      };
      mutationCollection = yield (0, _v2.default)(sqlInstance.models, validKeys, typeCollection, mutationFunctions, options);
    } else if (options.version === 2 && options.compat === 3) {
      mutations.v3 = {
        type: new _graphql.GraphQLObjectType({
          name: "v3Compat",
          fields: yield (0, _v2.default)(sqlInstance.models, validKeys, typeCollection, mutationFunctions, options)
        }),
        resolve: function () {}
      };
      mutationCollection = yield (0, _mutation2.default)(sqlInstance.models, validKeys, typeCollection, {}, mutationInputTypes, options);
    } else if (options.version === 3) {
      mutationCollection = yield (0, _v2.default)(sqlInstance.models, validKeys, typeCollection, mutationFunctions, options);
    } else {
      mutationCollection = yield (0, _mutation2.default)(sqlInstance.models, validKeys, typeCollection, {}, mutationInputTypes, options);
    }
    let classMethodQueries = yield (0, _createClassMethods2.default)(sqlInstance.models, validKeys, typeCollection, options);
    let modelQueries = yield (0, _createLists2.default)(sqlInstance.models, validKeys, typeCollection, options);
    let queryRootFields = Object.assign({}, query);
    let rootSchema = {};
    if (Object.keys(modelQueries).length > 0) {
      queryRootFields.models = {
        type: new _graphql.GraphQLObjectType({ name: "QueryModels", fields: modelQueries }),
        resolve() {
          return {};
        }
      };
    }
    if (Object.keys(classMethodQueries).length > 0) {
      queryRootFields.classMethods = {
        type: new _graphql.GraphQLObjectType({ name: "ClassMethods", fields: classMethodQueries }),
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
        type: new _graphql.GraphQLObjectType({ name: "MutationModels", fields: mutationCollection }),
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

    let subscriptionRootFields = Object.assign({}, subscriptions);

    if ((sqlInstance.$sqlgql || {}).subscriptions) {
      const { pubsub } = (sqlInstance.$sqlgql || {}).subscriptions;
      subscriptionRootFields = yield (0, _subscriptions2.default)(pubsub, sqlInstance.models, validKeys, typeCollection, options);
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
  });

  return function createSchema(_x) {
    return _ref.apply(this, arguments);
  };
})();

var _graphql = require("graphql");

var _deepmerge = require("deepmerge");

var _deepmerge2 = _interopRequireDefault(_deepmerge);

var _getModelDef = require("./utils/get-model-def");

var _getModelDef2 = _interopRequireDefault(_getModelDef);

var _createBase = require("./models/create-base");

var _createBase2 = _interopRequireDefault(_createBase);

var _createComplex = require("./models/create-complex");

var _createComplex2 = _interopRequireDefault(_createComplex);

var _mutation = require("./mutation");

var _mutation2 = _interopRequireDefault(_mutation);

var _v = require("./mutation/v3");

var _v2 = _interopRequireDefault(_v);

var _createFunctions = require("./mutation/v3/create-functions");

var _createFunctions2 = _interopRequireDefault(_createFunctions);

var _createInput = require("./mutation/create-input");

var _createInput2 = _interopRequireDefault(_createInput);

var _createLists = require("./query/create-lists");

var _createLists2 = _interopRequireDefault(_createLists);

var _createClassMethods = require("./query/create-class-methods");

var _createClassMethods2 = _interopRequireDefault(_createClassMethods);

var _subscriptions = require("./subscriptions");

var _subscriptions2 = _interopRequireDefault(_subscriptions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }
//# sourceMappingURL=index.js.map
