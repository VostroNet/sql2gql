"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createSchema = exports.createSubscriptionFunctions = exports.createQueryFunctions = exports.createMutationFunctions = exports.createQueryLists = exports.generateTypes = undefined;

let generateTypes = exports.generateTypes = (() => {
  var _ref = _asyncToGenerator(function* (models, keys, options = {}) {
    let typeCollection = {};
    yield Promise.all(keys.map((() => {
      var _ref2 = _asyncToGenerator(function* (modelName) {
        if (options.permission) {
          if (options.permission.model) {
            const result = yield options.permission.model(modelName, options.permission.options);
            if (!result) {
              return;
            }
          }
        }
        typeCollection[modelName] = yield createBaseType(modelName, models, options);
        typeCollection[modelName].model = models[modelName];
      });

      return function (_x3) {
        return _ref2.apply(this, arguments);
      };
    })()));
    yield Promise.all(keys.map((() => {
      var _ref3 = _asyncToGenerator(function* (modelName) {
        if (models[modelName].relationships) {
          if (!typeCollection[modelName]) {
            //target does not exist.. excluded from base types?
            return;
          }
          let { fields } = typeCollection[modelName]._typeConfig; //eslint-disable-line
          yield Promise.all(Object.keys(models[modelName].relationships).map((() => {
            var _ref4 = _asyncToGenerator(function* (relName) {
              let relationship = models[modelName].relationships[relName];
              let targetType = typeCollection[relationship.source];
              // let targetOpts = options[relationship.source];
              if (!targetType) {
                //target does not exist.. excluded from base types?
                return;
              }
              if (options.permission) {
                if (options.permission.relationship) {
                  const result = yield options.permission.relationship(modelName, relName, relationship.source, options.permission.options);
                  if (!result) {
                    return;
                  }
                }
              }
              const { before, after, afterList } = createBeforeAfter(models[modelName], options);
              if (!targetType) {
                throw `targetType ${targetType} not defined for relationship`;
              }
              switch (relationship.type) {
                case "belongsToMany": //eslint-disable-line
                case "hasMany":
                  fields[relName] = {
                    type: new _graphql.GraphQLList(targetType),
                    args: (0, _graphqlSequelize.defaultListArgs)(),
                    resolve: (0, _graphqlSequelize.resolver)(relationship.rel, {
                      before,
                      after: afterList
                    })
                  };
                  break;
                case "hasOne": //eslint-disable-line
                case "belongsTo":
                  fields[relName] = {
                    type: targetType,
                    resolve: (0, _graphqlSequelize.resolver)(relationship.rel, {
                      before,
                      after
                    })
                  };
                  break;
                default:
                  throw "Unhandled Relationship type";
              }
            });

            return function (_x5) {
              return _ref4.apply(this, arguments);
            };
          })()));
          typeCollection[modelName]._typeConfig.fields = fields; //eslint-disable-line
          resetInterfaces(typeCollection[modelName]);
        }
      });

      return function (_x4) {
        return _ref3.apply(this, arguments);
      };
    })()));
    return typeCollection;
  });

  return function generateTypes(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

let createQueryLists = exports.createQueryLists = (() => {
  var _ref5 = _asyncToGenerator(function* (models, modelNames, typeCollection, options, fields = {}) {
    yield Promise.all(modelNames.map((() => {
      var _ref6 = _asyncToGenerator(function* (modelName) {
        if (typeCollection[modelName]) {
          if (options.permission) {
            if (options.permission.query) {
              const result = yield options.permission.query(modelName, options.permission.options);
              if (!result) {
                return;
              }
            }
          }
          // let targetOpts = options[modelName];
          const { before, after } = createBeforeAfter(models[modelName], options);
          fields[modelName] = {
            type: new _graphql.GraphQLList(typeCollection[modelName]),
            args: (0, _graphqlSequelize.defaultListArgs)(),
            resolve: (0, _graphqlSequelize.resolver)(models[modelName], {
              before,
              after
            })
          };
        }
      });

      return function (_x10) {
        return _ref6.apply(this, arguments);
      };
    })()));
    return fields;
  });

  return function createQueryLists(_x6, _x7, _x8, _x9) {
    return _ref5.apply(this, arguments);
  };
})();

let createMutationFunctions = exports.createMutationFunctions = (() => {
  var _ref7 = _asyncToGenerator(function* (models, keys, typeCollection, mutationCollection, options) {
    yield Promise.all(keys.map((() => {
      var _ref8 = _asyncToGenerator(function* (modelName) {
        if (!typeCollection[modelName]) {
          return;
        }
        if (options.permission) {
          if (options.permission.mutation) {
            const result = yield options.permission.mutation(modelName, options.permission.options);
            if (!result) {
              return;
            }
          }
        }
        let { fields } = typeCollection[modelName]._typeConfig; //eslint-disable-line

        let requiredInput = createMutationInput(modelName, models[modelName], fields, "Required");
        let optionalInput = createMutationInput(modelName, models[modelName], fields, "Optional", true);
        let mutationFields = {};

        const modelDefinition = getModelDefinition(models[modelName]);
        const createFunc = function (_, args, req, info) {
          let input = args.input;
          if (modelDefinition.override) {
            input = Object.keys(modelDefinition.override).reduce(function (data, fieldName) {
              if (modelDefinition.override[fieldName].input) {
                data[fieldName] = modelDefinition.override[fieldName].input(data[fieldName], args, req, info);
              }
              return data;
            }, input);
          }
          return models[modelName].create(input, { rootValue: { req, args } });
        };
        let create = {
          type: typeCollection[modelName],
          args: {
            input: {
              type: requiredInput
            }
          },
          resolve: createFunc
        };

        // console.log("createMutationFunctions - create", create);
        const updateFunc = function (item, args, req, gql) {
          let input = args.input;
          if (modelDefinition.override) {
            input = Object.keys(modelDefinition.override).reduce(function (data, fieldName) {
              if (modelDefinition.override[fieldName].input) {
                data[fieldName] = modelDefinition.override[fieldName].input(data[fieldName], args, req, gql);
              }
              return data;
            }, input);
          }
          return item.update(input, { rootValue: { req, args } });
        };

        let update = {
          type: typeCollection[modelName],
          args: Object.assign((0, _graphqlSequelize.defaultArgs)(models[modelName]), { input: { type: optionalInput } }),
          resolve: (0, _graphqlSequelize.resolver)(models[modelName], {
            after: updateFunc
          })
        };
        let del = {
          type: typeCollection[modelName],
          args: (0, _graphqlSequelize.defaultArgs)(models[modelName]),
          resolve: (0, _graphqlSequelize.resolver)(models[modelName], {
            after: function (item, args, req, gql) {
              return item.destroy({ rootValue: { req, args } }).then(() => item);
            }
          })
        };
        let updateAll = {
          type: new _graphql.GraphQLList(typeCollection[modelName]),
          args: Object.assign((0, _graphqlSequelize.defaultListArgs)(models[modelName]), { input: { type: optionalInput } }),
          resolve: (0, _graphqlSequelize.resolver)(models[modelName], {
            after: function (items, args, req, gql) {
              return Promise.all(items.map(function (item) {
                return updateFunc(item, args, req, gql);
              }));
            }
          })
        };
        let deleteAll = {
          type: new _graphql.GraphQLList(typeCollection[modelName]),
          args: (0, _graphqlSequelize.defaultListArgs)(models[modelName]),
          resolve: (0, _graphqlSequelize.resolver)(models[modelName], {
            after: function (items, args, req, gql) {
              return Promise.all(items.map(item => item.destroy({ rootValue: { req, args } }).then(() => item))); //TODO: needs to return id with boolean value
            }
          })
        };

        if (options.permission) {
          if (options.permission.mutationCreate) {
            const result = yield options.permission.mutationCreate(modelName, options.permission.options);
            if (result) {
              mutationFields.create = create;
            }
          } else {
            mutationFields.create = create;
          }

          if (options.permission.mutationUpdate) {
            const result = yield options.permission.mutationUpdate(modelName, options.permission.options);
            if (result) {
              mutationFields.update = update;
            }
          } else {
            mutationFields.update = update;
          }

          if (options.permission.mutationDelete) {
            const result = yield options.permission.mutationDelete(modelName, options.permission.options);
            if (result) {
              mutationFields.delete = del;
            }
          } else {
            mutationFields.delete = del;
          }
          if (options.permission.mutationUpdateAll) {
            const result = yield options.permission.mutationUpdateAll(modelName, options.permission.options);
            if (result) {
              mutationFields.updateAll = updateAll;
            }
          } else {
            mutationFields.updateAll = updateAll;
          }
          if (options.permission.mutationDeleteAll) {
            const result = yield options.permission.mutationDeleteAll(modelName, options.permission.options);
            if (result) {
              mutationFields.deleteAll = deleteAll;
            }
          } else {
            mutationFields.deleteAll = deleteAll;
          }
        } else {
          mutationFields.create = create;
          mutationFields.update = update;
          mutationFields.delete = del;
          mutationFields.updateAll = updateAll;
          mutationFields.deleteAll = deleteAll;
        }

        const { mutations } = (getModelDefinition(models[modelName]).expose || {}).classMethods || {};
        if (mutations) {
          yield Promise.all(Object.keys(mutations).map((() => {
            var _ref9 = _asyncToGenerator(function* (methodName) {
              const { type, args } = mutations[methodName];
              if (options.permission) {
                if (options.permission.mutationClassMethods) {
                  const result = yield options.permission.mutationClassMethods(modelName, methodName, options.permission.options);
                  if (!result) {
                    return;
                  }
                }
              }
              let outputType = type instanceof String || typeof type === "string" ? typeCollection[type] : type;
              mutationFields[methodName] = {
                type: outputType,
                args,
                resolve(item, args, req, gql) {
                  return models[modelName][methodName].apply(models[modelName], [args, req]);
                }
              };
              // }
            });

            return function (_x17) {
              return _ref9.apply(this, arguments);
            };
          })()));
        }
        if (Object.keys(mutationFields).length > 0) {
          mutationCollection[modelName] = {
            type: new _graphql.GraphQLObjectType({
              name: `${modelName}Mutator`,
              fields: mutationFields
            }),
            resolve() {
              return {}; // forces graphql to resolve the fields
            }
          };
        }
      });

      return function (_x16) {
        return _ref8.apply(this, arguments);
      };
    })()));
    return mutationCollection;
  });

  return function createMutationFunctions(_x11, _x12, _x13, _x14, _x15) {
    return _ref7.apply(this, arguments);
  };
})();

let createQueryFunctions = exports.createQueryFunctions = (() => {
  var _ref10 = _asyncToGenerator(function* (models, keys, typeCollection, options) {
    let queryCollection = {};
    yield Promise.all(keys.map((() => {
      var _ref11 = _asyncToGenerator(function* (modelName) {
        if (!typeCollection[modelName]) {
          return;
        }
        let { fields } = typeCollection[modelName]._typeConfig; //eslint-disable-line
        const { query } = (getModelDefinition(models[modelName]).expose || {}).classMethods || {};
        let queryFields = {};
        if (query) {
          yield Promise.all(Object.keys(query).map((() => {
            var _ref12 = _asyncToGenerator(function* (methodName) {
              if (options.permission) {
                if (options.permission.queryClassMethods) {
                  const result = yield options.permission.queryClassMethods(modelName, methodName, options.permission.options);
                  if (!result) {
                    return;
                  }
                }
              }
              const { type, args } = query[methodName];
              let outputType = type instanceof String || typeof type === "string" ? typeCollection[type] : type;
              queryFields[methodName] = {
                type: outputType,
                args,
                resolve(item, args, req, gql) {
                  return models[modelName][methodName].apply(models[modelName], [args, req]);
                }
              };
              // console.log("test", queryFields[methodName]);
            });

            return function (_x23) {
              return _ref12.apply(this, arguments);
            };
          })()));
          if (Object.keys(queryFields).length > 0) {
            queryCollection[modelName] = {
              type: new _graphql.GraphQLObjectType({
                name: `${modelName}Query`,
                fields: queryFields
              }),
              resolve() {
                return {}; // forces graphql to resolve the fields
              }
            };
          }
        }
      });

      return function (_x22) {
        return _ref11.apply(this, arguments);
      };
    })()));
    return queryCollection;
  });

  return function createQueryFunctions(_x18, _x19, _x20, _x21) {
    return _ref10.apply(this, arguments);
  };
})();

let createSubscriptionFunctions = exports.createSubscriptionFunctions = (() => {
  var _ref13 = _asyncToGenerator(function* (pubsub, models, keys, typeCollection, options) {

    let subCollection = {};
    yield Promise.all(keys.map((() => {
      var _ref14 = _asyncToGenerator(function* (modelName) {
        const model = models[modelName];
        const modelDefinition = getModelDefinition(model);
        const { subscriptions = {}, $subscriptions } = modelDefinition; //TODO expose subscriptions from model definition
        if ($subscriptions) {
          yield Promise.all(Object.keys($subscriptions.names).map(function (hookName) {
            const subscriptionName = $subscriptions.names[hookName];
            subCollection[subscriptionName] = {
              type: typeCollection[modelName],
              resolve(item, args, req, gql) {
                const { instance, options, hookName } = item;
                if (subscriptions[hookName]) {
                  return subscriptions[hookName](instance, args, req, gql);
                }
                return instance;
              },
              subscribe() {
                return pubsub.asyncIterator(subscriptionName);
              }
            };
          }));
        }
      });

      return function (_x29) {
        return _ref14.apply(this, arguments);
      };
    })()));
    return subCollection;
  });

  return function createSubscriptionFunctions(_x24, _x25, _x26, _x27, _x28) {
    return _ref13.apply(this, arguments);
  };
})();

let createSchema = exports.createSchema = (() => {
  var _ref15 = _asyncToGenerator(function* (sqlInstance, options = {}) {
    const { query, mutations, subscriptions, extend = {} } = options;
    let validKeys = Object.keys(sqlInstance.models).reduce(function (o, key) {
      if (getModelDefinition(sqlInstance.models[key])) {
        o.push(key);
      }
      return o;
    }, []);
    let typeCollection = yield generateTypes(sqlInstance.models, validKeys, options);
    let mutationCollection = yield createMutationFunctions(sqlInstance.models, validKeys, typeCollection, {}, options);
    let classMethodQueries = yield createQueryFunctions(sqlInstance.models, validKeys, typeCollection, options);
    let modelQueries = yield createQueryLists(sqlInstance.models, validKeys, typeCollection, options);
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
      subscriptionRootFields = yield createSubscriptionFunctions(pubsub, sqlInstance.models, validKeys, typeCollection, options);
      if (Object.keys(subscriptionRootFields).length > 0) {
        rootSchema.subscription = new _graphql.GraphQLObjectType({
          name: "Subscription",
          fields: subscriptionRootFields
        });
      }
    }
    return new _graphql.GraphQLSchema(Object.assign(rootSchema, extend));
  });

  return function createSchema(_x30) {
    return _ref15.apply(this, arguments);
  };
})();

exports.getModelDefinition = getModelDefinition;
exports.resetInterfaces = resetInterfaces;
exports.createBaseType = createBaseType;
exports.createBeforeAfter = createBeforeAfter;
exports.createMutationInput = createMutationInput;

var _graphql = require("graphql");

var _graphqlSequelize = require("graphql-sequelize");

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function getModelDefinition(model) {
  return model.$sqlgql;
}

function resetInterfaces(impl) {
  delete impl._interfaces; //eslint-disable-line
  impl.getInterfaces().forEach(type => {
    type._implementations.push(impl); //eslint-disable-line
  });
}

function createBaseType(modelName, models, options) {
  const model = models[modelName];
  const modelDefinition = getModelDefinition(model);
  let fields = (0, _graphqlSequelize.attributeFields)(model, {
    exclude: Object.keys(modelDefinition.override || {}).concat(modelDefinition.ignoreFields || [])
  });

  // console.log("createBaseType", fields.options);
  if (modelDefinition.override) {
    Object.keys(modelDefinition.override).forEach(fieldName => {
      const fieldDefinition = modelDefinition.define[fieldName];
      const overrideFieldDefinition = modelDefinition.override[fieldName];
      let type = new _graphql.GraphQLObjectType(overrideFieldDefinition.type);
      if (!fieldDefinition.allowNull) {
        type = new _graphql.GraphQLNonNull(type);
      }
      fields[fieldName] = {
        type,
        resolve: overrideFieldDefinition.output
      };
    });
  }
  // console.log("createBaseType", fields);
  let resolve;
  if (modelDefinition.resolver) {
    resolve = modelDefinition.resolver;
  } else {
    resolve = (0, _graphqlSequelize.resolver)(model, {
      before: modelDefinition.before,
      after: modelDefinition.after
    });
  }
  return new _graphql.GraphQLObjectType({
    name: modelName,
    description: "",
    fields: fields,
    resolve: resolve
  });
}
function createBeforeAfter(model, options) {
  let targetBeforeFuncs = [],
      targetAfterFuncs = [];
  const modelDefinition = getModelDefinition(model);
  if (options.before) {
    targetBeforeFuncs.push(function (findOptions, args, context, info) {
      return options.before(modelDefinition, findOptions, args, context, info);
    });
  }
  if (options.after) {
    targetAfterFuncs.push(function (result, args, context, info) {
      return options.after(modelDefinition, result, args, context, info);
    });
  }
  if (modelDefinition.before) {
    targetBeforeFuncs.push(modelDefinition.before);
  }
  if (modelDefinition.after) {
    targetAfterFuncs.push(modelDefinition.after);
  }
  const targetBefore = (findOptions, args, context, info) => {
    if (targetBeforeFuncs.length === 0) {
      return findOptions;
    }
    const results = targetBeforeFuncs.reduce((prev, curr) => {
      return curr(prev, args, context, info);
    }, findOptions);
    return results;
  };
  const targetAfter = (result, args, context, info) => {
    if (targetAfterFuncs.length === 0) {
      return result;
    }
    return targetAfterFuncs.reduce((prev, curr) => {
      return curr(prev, args, context, info);
    }, result);
  };
  const targetAfterArray = (results, args, context, info) => {
    if (targetAfterFuncs.length === 0) {
      return results;
    }
    return results.map(result => {
      return targetAfter(result, args, context, info);
    });
  };

  return {
    before: targetBefore,
    after: targetAfter,
    afterList: targetAfterArray
  };
}

function createMutationInput(modelName, model, gqlFields, prefix, allOptional = false) {
  const modelDefinition = getModelDefinition(model);
  let fields = {};
  Object.keys(gqlFields).forEach(fieldName => {
    const sqlFields = model.fieldRawAttributesMap;
    if (sqlFields[fieldName]) {
      if (!sqlFields[fieldName]._autoGenerated && !sqlFields[fieldName].autoIncrement) {
        //eslint-disable-line
        let gqlField = gqlFields[fieldName];
        if (allOptional) {
          if (gqlField.type instanceof _graphql.GraphQLNonNull) {
            gqlField = { type: gqlField.type.ofType };
          }
        }
        if (modelDefinition.override) {
          const overrideFieldDefinition = modelDefinition.override[fieldName];

          if (overrideFieldDefinition) {
            const fieldDefinition = modelDefinition.define[fieldName];
            const allowNull = fieldDefinition.allowNull;
            const type = overrideFieldDefinition.inputType || overrideFieldDefinition.type;
            let name = type.name;
            if (!overrideFieldDefinition.inputType) {
              name += "Input";
            }
            if (allOptional) {
              name = `Optional${name}`;
            }
            const inputType = new _graphql.GraphQLInputObjectType({
              name,
              fields: type.fields
            });
            if (allowNull || allOptional) {
              gqlField = { type: inputType };
            } else {
              gqlField = { type: new _graphql.GraphQLNonNull(inputType) };
            }
          }
        }
        fields[fieldName] = gqlField;
      }
    }
  });
  return new _graphql.GraphQLInputObjectType({
    name: `${modelName}${prefix}Input`,
    fields
  });
}
//# sourceMappingURL=graphql.js.map
