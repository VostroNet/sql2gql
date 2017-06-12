"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createSchema;

var _graphql = require("graphql");

var _graphqlSequelize = require("graphql-sequelize");

function resetInterfaces(impl) {
  delete impl._interfaces; //eslint-disable-line
  impl.getInterfaces().forEach(function (type) {
    type._implementations.push(impl); //eslint-disable-line
  });
}

function createBaseType(modelName, models, options) {
  var opts = options[modelName] || {};
  var fields = (0, _graphqlSequelize.attributeFields)(models[modelName], {
    exclude: opts.ignoreFields || []
  });
  var resolve = void 0;
  if (opts.resolver) {
    resolve = opts.resolver;
  } else {
    resolve = (0, _graphqlSequelize.resolver)(models[modelName], {
      before: opts.before,
      after: opts.after
    });
  }
  return new _graphql.GraphQLObjectType({
    name: modelName,
    description: "",
    fields: fields,
    resolve: resolve
  });
}
function createBeforeAfter(modelOpts, options) {
  var targetBeforeFuncs = [],
      targetAfterFuncs = [];
  if (options.before) {
    targetBeforeFuncs.push(options.before);
  }
  if (options.after) {
    targetAfterFuncs.push(options.after);
  }
  if (modelOpts) {
    if (modelOpts.before) {
      targetBeforeFuncs.push(modelOpts.before);
    }
    if (modelOpts.after) {
      targetAfterFuncs.push(modelOpts.after);
    }
  }
  var targetBefore = function targetBefore(findOptions, args, context, info) {
    if (targetBeforeFuncs.length === 0) {
      return findOptions;
    }
    var results = targetBeforeFuncs.reduce(function (prev, curr) {
      return curr(prev, args, context, info);
    }, findOptions);
    return results;
  };
  var targetAfter = function targetAfter(result, args, context, info) {
    if (targetAfterFuncs.length === 0) {
      return result;
    }
    return targetAfter.reduce(function (prev, curr) {
      return curr(prev, args, context, info);
    }, result);
  };
  var targetAfterArray = function targetAfterArray(results, args, context, info) {
    if (targetAfterFuncs.length === 0) {
      return results;
    }
    return results.map(function (result) {
      return targetAfter(result, args, context, info);
    });
  };

  return {
    before: targetBefore,
    after: targetAfter,
    afterList: targetAfterArray
  };
}

function generateTypes(models, keys) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var typeCollection = {};
  keys.forEach(function (modelName) {
    typeCollection[modelName] = createBaseType(modelName, models, options);
    typeCollection[modelName].model = models[modelName];
  });
  keys.forEach(function (modelName) {
    if (models[modelName].relationships) {
      var fields = typeCollection[modelName]._typeConfig.fields; //eslint-disable-line

      Object.keys(models[modelName].relationships).forEach(function (relName) {
        var relationship = models[modelName].relationships[relName];
        var targetType = typeCollection[relationship.source];
        var targetOpts = options[relationship.source];

        var _createBeforeAfter = createBeforeAfter(targetOpts, options),
            before = _createBeforeAfter.before,
            after = _createBeforeAfter.after,
            afterList = _createBeforeAfter.afterList;

        if (!targetType) {
          throw "targetType " + targetType + " not defined for relationship";
        }
        switch (relationship.type) {
          case "belongsToMany": //eslint-disable-line
          case "hasMany":
            fields[relName] = {
              type: new _graphql.GraphQLList(targetType),
              args: (0, _graphqlSequelize.defaultListArgs)(),
              resolve: (0, _graphqlSequelize.resolver)(relationship.rel, {
                before: before,
                after: afterList
              })
            };
            break;
          case "hasOne": //eslint-disable-line
          case "belongsTo":
            fields[relName] = {
              type: targetType,
              resolve: (0, _graphqlSequelize.resolver)(relationship.rel, {
                before: before,
                after: after
              })
            };
            break;
          default:
            throw "Unhandled Relationship type";
        }
      });
      typeCollection[modelName]._typeConfig.fields = fields; //eslint-disable-line
      resetInterfaces(typeCollection[modelName]);
    }
  });
  return typeCollection;
}

function createQueryLists(models, keys, typeCollection, fields, options) {
  keys.forEach(function (key) {
    var targetOpts = options[key];

    var _createBeforeAfter2 = createBeforeAfter(targetOpts, options),
        before = _createBeforeAfter2.before,
        after = _createBeforeAfter2.after;

    fields[key] = {
      type: new _graphql.GraphQLList(typeCollection[key]),
      args: (0, _graphqlSequelize.defaultListArgs)(),
      resolve: (0, _graphqlSequelize.resolver)(models[key], {
        before: before,
        after: after
      })
    };
  });
  return fields;
}

function createMutationInput(modelName, model, gqlFields, prefix) {
  var allOptional = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;

  var fields = {};
  Object.keys(gqlFields).forEach(function (fieldName) {
    var sqlFields = model.fieldRawAttributesMap;
    if (sqlFields[fieldName]) {
      if (!sqlFields[fieldName]._autoGenerated && !sqlFields[fieldName].autoIncrement) {
        //eslint-disable-line
        var gqlField = gqlFields[fieldName];
        if (allOptional) {
          if (gqlField.type instanceof _graphql.GraphQLNonNull) {
            gqlField = { type: gqlField.type.ofType };
          }
        }
        fields[fieldName] = gqlField;
      }
    }
  });

  return new _graphql.GraphQLInputObjectType({
    name: "" + modelName + prefix + "Input",
    fields: fields
  });
}

function createMutationFunctions(models, keys, typeCollection, mutationCollection, userProfile) {
  keys.forEach(function (modelName) {
    var fields = typeCollection[modelName]._typeConfig.fields; //eslint-disable-line

    var requiredInput = createMutationInput(modelName, models[modelName], fields, "Required");
    var optionalInput = createMutationInput(modelName, models[modelName], fields, "Optional", true);
    var mutationFields = {
      create: {
        type: typeCollection[modelName],
        args: {
          input: {
            type: requiredInput
          }
        },
        resolve: function resolve(_, _ref, req, info) {
          var input = _ref.input;

          return models[modelName].create(input, { user: req.user });
        }
      },
      update: {
        type: typeCollection[modelName],
        args: Object.assign((0, _graphqlSequelize.defaultArgs)(models[modelName]), { input: { type: optionalInput } }),
        resolve: (0, _graphqlSequelize.resolver)(models[modelName], {
          after: function after(item, args, req, gql) {
            return item.update(args.input, { user: req.user });
          }
        })
      },
      delete: {
        type: _graphql.GraphQLBoolean,
        args: (0, _graphqlSequelize.defaultArgs)(models[modelName]),
        resolve: (0, _graphqlSequelize.resolver)(models[modelName], {
          after: function after(item, args, req, gql) {
            return item.destroy({ user: req.user }).then(function () {
              return true;
            });
          }
        })
      },
      updateAll: {
        type: new _graphql.GraphQLList(typeCollection[modelName]),
        args: Object.assign((0, _graphqlSequelize.defaultListArgs)(models[modelName]), { input: { type: optionalInput } }),
        resolve: (0, _graphqlSequelize.resolver)(models[modelName], {
          after: function after(items, args, req, gql) {
            return Promise.all(items.map(function (item) {
              return item.update(args.input, { user: req.user });
            }));
          }
        })
      },
      deleteAll: {
        type: new _graphql.GraphQLList(_graphql.GraphQLBoolean),
        args: (0, _graphqlSequelize.defaultListArgs)(models[modelName]),
        resolve: (0, _graphqlSequelize.resolver)(models[modelName], {
          after: function after(items, args, req, gql) {
            return Promise.all(items.map(function (item) {
              return item.destroy({ user: req.user }).then(function () {
                return true;
              });
            })); //TODO: needs to return id with boolean value
          }
        })
      }
    };

    var _ref2 = (models[modelName].$gqlsql.expose || {}).classMethods || {},
        mutations = _ref2.mutations;

    if (mutations) {
      Object.keys(mutations).forEach(function (methodName) {
        var _mutations$methodName = mutations[methodName],
            type = _mutations$methodName.type,
            args = _mutations$methodName.args,
            _mutations$methodName2 = _mutations$methodName.roles,
            roles = _mutations$methodName2 === undefined ? [] : _mutations$methodName2;

        if (roles.indexOf(userProfile) > -1) {
          var outputType = type instanceof String || typeof type === "string" ? typeCollection[type] : type;
          mutationFields[methodName] = {
            type: outputType,
            args: args,
            resolve: function resolve(item, args, req, gql) {
              return models[modelName][methodName].apply(models[modelName], [args, req]);
            }
          };
        }
      });
    }

    mutationCollection[modelName] = {
      type: new _graphql.GraphQLObjectType({
        name: modelName + "Mutator",
        fields: mutationFields
      }),
      resolve: function resolve() {
        return {}; // forces graphql to resolve the fields
      }
    };
  });
  return mutationCollection;
}

function createQueryFunctions(models, keys, typeCollection, userProfile) {
  var queryCollection = {};
  keys.forEach(function (modelName) {
    var fields = typeCollection[modelName]._typeConfig.fields; //eslint-disable-line

    var _ref3 = (models[modelName].$gqlsql.expose || {}).classMethods || {},
        query = _ref3.query;

    var queryFields = {};
    if (query) {
      Object.keys(query).forEach(function (methodName) {
        var _query$methodName = query[methodName],
            type = _query$methodName.type,
            args = _query$methodName.args;

        var outputType = type instanceof String || typeof type === "string" ? typeCollection[type] : type;
        queryFields[methodName] = {
          type: outputType,
          args: args,
          resolve: function resolve(item, args, req, gql) {
            return models[modelName][methodName].apply(models[modelName], [args, req]);
          }
        };
        // console.log("test", queryFields[methodName]);
      });
      queryCollection[modelName] = {
        type: new _graphql.GraphQLObjectType({
          name: modelName + "Query",
          fields: queryFields
        }),
        resolve: function resolve() {
          return {}; // forces graphql to resolve the fields
        }
      };
    }
  });
  return queryCollection;
}

function createSchema(instance) {
  var fields = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var mutations = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var userProfile = arguments[4];

  var validKeys = Object.keys(instance.models).reduce(function (o, key) {
    if (instance.models[key].$gqlsql) {
      // o[key] = instance.models[key];
      o.push(key);
    }
    return o;
  }, []);
  var typeCollection = generateTypes(instance.models, validKeys, options);
  var mutationCollection = createMutationFunctions(instance.models, validKeys, typeCollection, mutations, userProfile);
  var queryCollection = createQueryFunctions(instance.models, validKeys, typeCollection, userProfile);
  fields = createQueryLists(instance.models, validKeys, typeCollection, fields, options);
  var queryRootFields = {
    models: {
      type: new _graphql.GraphQLObjectType({ name: "Models", fields: fields }),
      resolve: function resolve() {
        return {};
      }
    },
    classMethods: {
      type: new _graphql.GraphQLObjectType({ name: "ClassMethods", fields: queryCollection }),
      resolve: function resolve() {
        return {};
      }
    }
  };
  return new _graphql.GraphQLSchema({
    query: new _graphql.GraphQLObjectType({
      name: "RootQuery",
      fields: queryRootFields
    }),
    mutation: new _graphql.GraphQLObjectType({
      name: "Mutation",
      fields: mutationCollection
    })
  });
}
//# sourceMappingURL=graphql.js.map
