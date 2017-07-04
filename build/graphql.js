"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var generateTypes = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(models, keys) {
    var _this = this;

    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var typeCollection;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            typeCollection = {};
            _context4.next = 3;
            return Promise.all(keys.map(function () {
              var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee(modelName) {
                var result;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        if (!options.permission) {
                          _context.next = 7;
                          break;
                        }

                        if (!options.permission.model) {
                          _context.next = 7;
                          break;
                        }

                        _context.next = 4;
                        return options.permission.model(modelName, options.permission.options);

                      case 4:
                        result = _context.sent;

                        if (result) {
                          _context.next = 7;
                          break;
                        }

                        return _context.abrupt("return");

                      case 7:
                        _context.next = 9;
                        return createBaseType(modelName, models, options);

                      case 9:
                        typeCollection[modelName] = _context.sent;

                        typeCollection[modelName].model = models[modelName];

                      case 11:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, _this);
              }));

              return function (_x4) {
                return _ref2.apply(this, arguments);
              };
            }()));

          case 3:
            _context4.next = 5;
            return Promise.all(keys.map(function () {
              var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(modelName) {
                var fields;
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        if (!models[modelName].relationships) {
                          _context3.next = 8;
                          break;
                        }

                        if (typeCollection[modelName]) {
                          _context3.next = 3;
                          break;
                        }

                        return _context3.abrupt("return");

                      case 3:
                        fields = typeCollection[modelName]._typeConfig.fields; //eslint-disable-line

                        _context3.next = 6;
                        return Promise.all(Object.keys(models[modelName].relationships).map(function () {
                          var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(relName) {
                            var relationship, targetType, result, _createBeforeAfter, before, after, afterList;

                            return regeneratorRuntime.wrap(function _callee2$(_context2) {
                              while (1) {
                                switch (_context2.prev = _context2.next) {
                                  case 0:
                                    relationship = models[modelName].relationships[relName];
                                    targetType = typeCollection[relationship.source];
                                    // let targetOpts = options[relationship.source];

                                    if (targetType) {
                                      _context2.next = 4;
                                      break;
                                    }

                                    return _context2.abrupt("return");

                                  case 4:
                                    if (!options.permission) {
                                      _context2.next = 11;
                                      break;
                                    }

                                    if (!options.permission.relationship) {
                                      _context2.next = 11;
                                      break;
                                    }

                                    _context2.next = 8;
                                    return options.permission.relationship(modelName, relName, relationship.source, options.permission.options);

                                  case 8:
                                    result = _context2.sent;

                                    if (result) {
                                      _context2.next = 11;
                                      break;
                                    }

                                    return _context2.abrupt("return");

                                  case 11:
                                    _createBeforeAfter = createBeforeAfter(models[modelName], options), before = _createBeforeAfter.before, after = _createBeforeAfter.after, afterList = _createBeforeAfter.afterList;

                                    if (targetType) {
                                      _context2.next = 14;
                                      break;
                                    }

                                    throw `targetType ${targetType} not defined for relationship`;

                                  case 14:
                                    _context2.t0 = relationship.type;
                                    _context2.next = _context2.t0 === "belongsToMany" ? 17 : _context2.t0 === "hasMany" ? 17 : _context2.t0 === "hasOne" ? 19 : _context2.t0 === "belongsTo" ? 19 : 21;
                                    break;

                                  case 17:
                                    fields[relName] = {
                                      type: new _graphql.GraphQLList(targetType),
                                      args: (0, _graphqlSequelize.defaultListArgs)(),
                                      resolve: (0, _graphqlSequelize.resolver)(relationship.rel, {
                                        before,
                                        after: afterList
                                      })
                                    };
                                    return _context2.abrupt("break", 22);

                                  case 19:
                                    fields[relName] = {
                                      type: targetType,
                                      resolve: (0, _graphqlSequelize.resolver)(relationship.rel, {
                                        before,
                                        after
                                      })
                                    };
                                    return _context2.abrupt("break", 22);

                                  case 21:
                                    throw "Unhandled Relationship type";

                                  case 22:
                                  case "end":
                                    return _context2.stop();
                                }
                              }
                            }, _callee2, _this);
                          }));

                          return function (_x6) {
                            return _ref4.apply(this, arguments);
                          };
                        }()));

                      case 6:
                        typeCollection[modelName]._typeConfig.fields = fields; //eslint-disable-line
                        resetInterfaces(typeCollection[modelName]);

                      case 8:
                      case "end":
                        return _context3.stop();
                    }
                  }
                }, _callee3, _this);
              }));

              return function (_x5) {
                return _ref3.apply(this, arguments);
              };
            }()));

          case 5:
            return _context4.abrupt("return", typeCollection);

          case 6:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function generateTypes(_x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

var createQueryLists = function () {
  var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(models, modelNames, typeCollection, fields, options) {
    var _this2 = this;

    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return Promise.all(modelNames.map(function () {
              var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(modelName) {
                var result, _createBeforeAfter2, before, after;

                return regeneratorRuntime.wrap(function _callee5$(_context5) {
                  while (1) {
                    switch (_context5.prev = _context5.next) {
                      case 0:
                        if (!typeCollection[modelName]) {
                          _context5.next = 10;
                          break;
                        }

                        if (!options.permission) {
                          _context5.next = 8;
                          break;
                        }

                        if (!options.permission.query) {
                          _context5.next = 8;
                          break;
                        }

                        _context5.next = 5;
                        return options.permission.query(modelName, options.permission.options);

                      case 5:
                        result = _context5.sent;

                        if (result) {
                          _context5.next = 8;
                          break;
                        }

                        return _context5.abrupt("return");

                      case 8:
                        // let targetOpts = options[modelName];
                        _createBeforeAfter2 = createBeforeAfter(models[modelName], options), before = _createBeforeAfter2.before, after = _createBeforeAfter2.after;

                        fields[modelName] = {
                          type: new _graphql.GraphQLList(typeCollection[modelName]),
                          args: (0, _graphqlSequelize.defaultListArgs)(),
                          resolve: (0, _graphqlSequelize.resolver)(models[modelName], {
                            before,
                            after
                          })
                        };

                      case 10:
                      case "end":
                        return _context5.stop();
                    }
                  }
                }, _callee5, _this2);
              }));

              return function (_x12) {
                return _ref6.apply(this, arguments);
              };
            }()));

          case 2:
            return _context6.abrupt("return", fields);

          case 3:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function createQueryLists(_x7, _x8, _x9, _x10, _x11) {
    return _ref5.apply(this, arguments);
  };
}();

var createMutationFunctions = function () {
  var _ref7 = _asyncToGenerator(regeneratorRuntime.mark(function _callee9(models, keys, typeCollection, mutationCollection, options) {
    var _this3 = this;

    return regeneratorRuntime.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.next = 2;
            return Promise.all(keys.map(function () {
              var _ref8 = _asyncToGenerator(regeneratorRuntime.mark(function _callee8(modelName) {
                var result, fields, requiredInput, optionalInput, mutationFields, modelDefinition, createFunc, create, updateFunc, update, del, updateAll, deleteAll, _result, _result2, _result3, _result4, _result5, _ref9, mutations;

                return regeneratorRuntime.wrap(function _callee8$(_context8) {
                  while (1) {
                    switch (_context8.prev = _context8.next) {
                      case 0:
                        if (typeCollection[modelName]) {
                          _context8.next = 2;
                          break;
                        }

                        return _context8.abrupt("return");

                      case 2:
                        if (!options.permission) {
                          _context8.next = 9;
                          break;
                        }

                        if (!options.permission.mutation) {
                          _context8.next = 9;
                          break;
                        }

                        _context8.next = 6;
                        return options.permission.mutation(modelName, options.permission.options);

                      case 6:
                        result = _context8.sent;

                        if (result) {
                          _context8.next = 9;
                          break;
                        }

                        return _context8.abrupt("return");

                      case 9:
                        fields = typeCollection[modelName]._typeConfig.fields; //eslint-disable-line

                        requiredInput = createMutationInput(modelName, models[modelName], fields, "Required");
                        optionalInput = createMutationInput(modelName, models[modelName], fields, "Optional", true);
                        mutationFields = {};
                        modelDefinition = getModelDefinition(models[modelName]);

                        createFunc = function createFunc(_, args, req, info) {
                          var input = args.input;
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

                        create = {
                          type: typeCollection[modelName],
                          args: {
                            input: {
                              type: requiredInput
                            }
                          },
                          resolve: createFunc
                        };

                        // console.log("createMutationFunctions - create", create);

                        updateFunc = function updateFunc(item, args, req, gql) {
                          var input = args.input;
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

                        update = {
                          type: typeCollection[modelName],
                          args: Object.assign((0, _graphqlSequelize.defaultArgs)(models[modelName]), { input: { type: optionalInput } }),
                          resolve: (0, _graphqlSequelize.resolver)(models[modelName], {
                            after: updateFunc
                          })
                        };
                        del = {
                          type: _graphql.GraphQLBoolean,
                          args: (0, _graphqlSequelize.defaultArgs)(models[modelName]),
                          resolve: (0, _graphqlSequelize.resolver)(models[modelName], {
                            after: function after(item, args, req, gql) {
                              return item.destroy({ rootValue: { req, args } }).then(function () {
                                return true;
                              });
                            }
                          })
                        };
                        updateAll = {
                          type: new _graphql.GraphQLList(typeCollection[modelName]),
                          args: Object.assign((0, _graphqlSequelize.defaultListArgs)(models[modelName]), { input: { type: optionalInput } }),
                          resolve: (0, _graphqlSequelize.resolver)(models[modelName], {
                            after: function after(items, args, req, gql) {
                              return Promise.all(items.map(function (item) {
                                return updateFunc(item, args, req, gql);
                              }));
                            }
                          })
                        };
                        deleteAll = {
                          type: new _graphql.GraphQLList(_graphql.GraphQLBoolean),
                          args: (0, _graphqlSequelize.defaultListArgs)(models[modelName]),
                          resolve: (0, _graphqlSequelize.resolver)(models[modelName], {
                            after: function after(items, args, req, gql) {
                              return Promise.all(items.map(function (item) {
                                return item.destroy({ rootValue: { req, args } }).then(function () {
                                  return true;
                                });
                              })); //TODO: needs to return id with boolean value
                            }
                          })
                        };

                        if (!options.permission) {
                          _context8.next = 64;
                          break;
                        }

                        if (!options.permission.mutationCreate) {
                          _context8.next = 29;
                          break;
                        }

                        _context8.next = 25;
                        return options.permission.mutationCreate(modelName, options.permission.options);

                      case 25:
                        _result = _context8.sent;

                        if (_result) {
                          mutationFields.create = create;
                        }
                        _context8.next = 30;
                        break;

                      case 29:
                        mutationFields.create = create;

                      case 30:
                        if (!options.permission.mutationUpdate) {
                          _context8.next = 37;
                          break;
                        }

                        _context8.next = 33;
                        return options.permission.mutationUpdate(modelName, options.permission.options);

                      case 33:
                        _result2 = _context8.sent;

                        if (_result2) {
                          mutationFields.update = update;
                        }
                        _context8.next = 38;
                        break;

                      case 37:
                        mutationFields.update = update;

                      case 38:
                        if (!options.permission.mutationDelete) {
                          _context8.next = 45;
                          break;
                        }

                        _context8.next = 41;
                        return options.permission.mutationDelete(modelName, options.permission.options);

                      case 41:
                        _result3 = _context8.sent;

                        if (_result3) {
                          mutationFields.delete = del;
                        }
                        _context8.next = 46;
                        break;

                      case 45:
                        mutationFields.delete = del;

                      case 46:
                        if (!options.permission.mutationUpdateAll) {
                          _context8.next = 53;
                          break;
                        }

                        _context8.next = 49;
                        return options.permission.mutationUpdateAll(modelName, options.permission.options);

                      case 49:
                        _result4 = _context8.sent;

                        if (_result4) {
                          mutationFields.updateAll = updateAll;
                        }
                        _context8.next = 54;
                        break;

                      case 53:
                        mutationFields.updateAll = updateAll;

                      case 54:
                        if (!options.permission.mutationDeleteAll) {
                          _context8.next = 61;
                          break;
                        }

                        _context8.next = 57;
                        return options.permission.mutationDeleteAll(modelName, options.permission.options);

                      case 57:
                        _result5 = _context8.sent;

                        if (_result5) {
                          mutationFields.deleteAll = deleteAll;
                        }
                        _context8.next = 62;
                        break;

                      case 61:
                        mutationFields.deleteAll = deleteAll;

                      case 62:
                        _context8.next = 69;
                        break;

                      case 64:
                        mutationFields.create = create;
                        mutationFields.update = update;
                        mutationFields.delete = del;
                        mutationFields.updateAll = updateAll;
                        mutationFields.deleteAll = deleteAll;

                      case 69:
                        _ref9 = (getModelDefinition(models[modelName]).expose || {}).classMethods || {}, mutations = _ref9.mutations;

                        if (!mutations) {
                          _context8.next = 73;
                          break;
                        }

                        _context8.next = 73;
                        return Promise.all(Object.keys(mutations).map(function () {
                          var _ref10 = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(methodName) {
                            var _mutations$methodName, type, args, _result6, outputType;

                            return regeneratorRuntime.wrap(function _callee7$(_context7) {
                              while (1) {
                                switch (_context7.prev = _context7.next) {
                                  case 0:
                                    _mutations$methodName = mutations[methodName], type = _mutations$methodName.type, args = _mutations$methodName.args;

                                    if (!options.permission) {
                                      _context7.next = 8;
                                      break;
                                    }

                                    if (!options.permission.mutationClassMethods) {
                                      _context7.next = 8;
                                      break;
                                    }

                                    _context7.next = 5;
                                    return options.permission.mutationClassMethods(modelName, methodName, options.permission.options);

                                  case 5:
                                    _result6 = _context7.sent;

                                    if (_result6) {
                                      _context7.next = 8;
                                      break;
                                    }

                                    return _context7.abrupt("return");

                                  case 8:
                                    outputType = type instanceof String || typeof type === "string" ? typeCollection[type] : type;
                                    _context7.t0 = outputType;
                                    _context7.t1 = args;
                                    mutationFields[methodName] = {
                                      type: _context7.t0,
                                      args: _context7.t1,

                                      resolve(item, args, req, gql) {
                                        return models[modelName][methodName].apply(models[modelName], [args, req]);
                                      }
                                    };

                                  case 12:
                                  case "end":
                                    return _context7.stop();
                                }
                              }
                            }, _callee7, _this3);
                          }));

                          return function (_x20) {
                            return _ref10.apply(this, arguments);
                          };
                        }()));

                      case 73:
                        if (!(Object.keys(mutationFields).length > 0)) {
                          _context8.next = 76;
                          break;
                        }

                        _context8.t0 = new _graphql.GraphQLObjectType({
                          name: `${modelName}Mutator`,
                          fields: mutationFields
                        });
                        mutationCollection[modelName] = {
                          type: _context8.t0,

                          resolve() {
                            return {}; // forces graphql to resolve the fields
                          }
                        };

                      case 76:
                      case "end":
                        return _context8.stop();
                    }
                  }
                }, _callee8, _this3);
              }));

              return function (_x19) {
                return _ref8.apply(this, arguments);
              };
            }()));

          case 2:
            return _context9.abrupt("return", mutationCollection);

          case 3:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9, this);
  }));

  return function createMutationFunctions(_x14, _x15, _x16, _x17, _x18) {
    return _ref7.apply(this, arguments);
  };
}();

var createQueryFunctions = function () {
  var _ref11 = _asyncToGenerator(regeneratorRuntime.mark(function _callee12(models, keys, typeCollection, options) {
    var _this4 = this;

    var queryCollection;
    return regeneratorRuntime.wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            queryCollection = {};
            _context12.next = 3;
            return Promise.all(keys.map(function () {
              var _ref12 = _asyncToGenerator(regeneratorRuntime.mark(function _callee11(modelName) {
                var fields, _ref13, query, queryFields;

                return regeneratorRuntime.wrap(function _callee11$(_context11) {
                  while (1) {
                    switch (_context11.prev = _context11.next) {
                      case 0:
                        if (typeCollection[modelName]) {
                          _context11.next = 2;
                          break;
                        }

                        return _context11.abrupt("return");

                      case 2:
                        fields = typeCollection[modelName]._typeConfig.fields; //eslint-disable-line

                        _ref13 = (getModelDefinition(models[modelName]).expose || {}).classMethods || {}, query = _ref13.query;
                        queryFields = {};

                        if (!query) {
                          _context11.next = 11;
                          break;
                        }

                        _context11.next = 8;
                        return Promise.all(Object.keys(query).map(function () {
                          var _ref14 = _asyncToGenerator(regeneratorRuntime.mark(function _callee10(methodName) {
                            var result, _query$methodName, type, args, outputType;

                            return regeneratorRuntime.wrap(function _callee10$(_context10) {
                              while (1) {
                                switch (_context10.prev = _context10.next) {
                                  case 0:
                                    if (!options.permission) {
                                      _context10.next = 7;
                                      break;
                                    }

                                    if (!options.permission.queryClassMethods) {
                                      _context10.next = 7;
                                      break;
                                    }

                                    _context10.next = 4;
                                    return options.permission.queryClassMethods(modelName, methodName, options.permission.options);

                                  case 4:
                                    result = _context10.sent;

                                    if (result) {
                                      _context10.next = 7;
                                      break;
                                    }

                                    return _context10.abrupt("return");

                                  case 7:
                                    _query$methodName = query[methodName], type = _query$methodName.type, args = _query$methodName.args;
                                    outputType = type instanceof String || typeof type === "string" ? typeCollection[type] : type;
                                    _context10.t0 = outputType;
                                    _context10.t1 = args;
                                    queryFields[methodName] = {
                                      type: _context10.t0,
                                      args: _context10.t1,

                                      resolve(item, args, req, gql) {
                                        return models[modelName][methodName].apply(models[modelName], [args, req]);
                                      }
                                    };

                                  case 12:
                                  case "end":
                                    return _context10.stop();
                                }
                              }
                            }, _callee10, _this4);
                          }));

                          return function (_x26) {
                            return _ref14.apply(this, arguments);
                          };
                        }()));

                      case 8:
                        if (!(Object.keys(queryFields).length > 0)) {
                          _context11.next = 11;
                          break;
                        }

                        _context11.t0 = new _graphql.GraphQLObjectType({
                          name: `${modelName}Query`,
                          fields: queryFields
                        });
                        queryCollection[modelName] = {
                          type: _context11.t0,

                          resolve() {
                            return {}; // forces graphql to resolve the fields
                          }
                        };

                      case 11:
                      case "end":
                        return _context11.stop();
                    }
                  }
                }, _callee11, _this4);
              }));

              return function (_x25) {
                return _ref12.apply(this, arguments);
              };
            }()));

          case 3:
            return _context12.abrupt("return", queryCollection);

          case 4:
          case "end":
            return _context12.stop();
        }
      }
    }, _callee12, this);
  }));

  return function createQueryFunctions(_x21, _x22, _x23, _x24) {
    return _ref11.apply(this, arguments);
  };
}();

var _graphql = require("graphql");

var _graphqlSequelize = require("graphql-sequelize");

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function getModelDefinition(model) {
  return model.$sqlgql;
}

function resetInterfaces(impl) {
  delete impl._interfaces; //eslint-disable-line
  impl.getInterfaces().forEach(function (type) {
    type._implementations.push(impl); //eslint-disable-line
  });
}

function createBaseType(modelName, models, options) {
  var model = models[modelName];
  var modelDefinition = getModelDefinition(model);
  var fields = (0, _graphqlSequelize.attributeFields)(model, {
    exclude: Object.keys(modelDefinition.override || {}).concat(modelDefinition.ignoreFields || [])
  });

  // console.log("createBaseType", fields.options);
  if (modelDefinition.override) {
    Object.keys(modelDefinition.override).forEach(function (fieldName) {
      var fieldDefinition = modelDefinition.define[fieldName];
      var overrideFieldDefinition = modelDefinition.override[fieldName];
      var type = new _graphql.GraphQLObjectType(overrideFieldDefinition.type);
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
  var resolve = void 0;
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
  var targetBeforeFuncs = [],
      targetAfterFuncs = [];
  var modelDefinition = getModelDefinition(model);
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
    return targetAfterFuncs.reduce(function (prev, curr) {
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

function createMutationInput(modelName, model, gqlFields, prefix) {
  var allOptional = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;

  var modelDefinition = getModelDefinition(model);
  var fields = {};
  Object.keys(gqlFields).forEach(function (fieldName) {
    var sqlFields = model.fieldRawAttributesMap;
    // const fieldDefinition = model.define[fieldName];
    if (sqlFields[fieldName]) {
      if (!sqlFields[fieldName]._autoGenerated && !sqlFields[fieldName].autoIncrement) {
        //eslint-disable-line
        var gqlField = gqlFields[fieldName];
        if (allOptional) {
          if (gqlField.type instanceof _graphql.GraphQLNonNull) {
            gqlField = { type: gqlField.type.ofType };
          }
        }
        if (modelDefinition.override) {
          var overrideFieldDefinition = modelDefinition.override[fieldName];

          if (overrideFieldDefinition) {
            var fieldDefinition = modelDefinition.define[fieldName];
            var allowNull = fieldDefinition.allowNull;
            var type = overrideFieldDefinition.inputType || overrideFieldDefinition.type;
            var name = type.name;
            if (!overrideFieldDefinition.inputType) {
              name += "Input";
            }
            if (allOptional) {
              name = `Optional${name}`;
            }
            var inputType = new _graphql.GraphQLInputObjectType({
              name,
              fields: type.fields
            });
            if (allowNull || allOptional) {
              gqlField = { type: inputType };
            } else {
              // console.log("createMutationInput - GraphQLNonNull", name, allowNull);
              gqlField = { type: new _graphql.GraphQLNonNull(inputType) };
            }
          }
        }
        // if (!(gqlField.type instanceof GraphQLInputObjectType)) {
        // console.log("GraphQLInputObjectType", fieldName, gqlField);
        // }
        fields[fieldName] = gqlField;
      }
    }
  });
  return new _graphql.GraphQLInputObjectType({
    name: `${modelName}${prefix}Input`,
    fields
  });
}

exports.default = function () {
  var _ref15 = _asyncToGenerator(regeneratorRuntime.mark(function _callee13(instance) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var query, mutations, validKeys, typeCollection, mutationCollection, classMethodQueries, modelQueries, queryRootFields, mutationRootFields;
    return regeneratorRuntime.wrap(function _callee13$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            query = options.query, mutations = options.mutations;
            validKeys = Object.keys(instance.models).reduce(function (o, key) {
              if (getModelDefinition(instance.models[key])) {
                // o[key] = instance.models[key];
                o.push(key);
              }
              return o;
            }, []);
            _context13.next = 4;
            return generateTypes(instance.models, validKeys, options);

          case 4:
            typeCollection = _context13.sent;
            _context13.next = 7;
            return createMutationFunctions(instance.models, validKeys, typeCollection, {}, options);

          case 7:
            mutationCollection = _context13.sent;
            _context13.next = 10;
            return createQueryFunctions(instance.models, validKeys, typeCollection, options);

          case 10:
            classMethodQueries = _context13.sent;
            _context13.next = 13;
            return createQueryLists(instance.models, validKeys, typeCollection, {}, options);

          case 13:
            modelQueries = _context13.sent;
            queryRootFields = Object.assign({}, query);

            if (!(Object.keys(modelQueries).length > 0)) {
              _context13.next = 18;
              break;
            }

            _context13.t0 = new _graphql.GraphQLObjectType({ name: "QueryModels", fields: modelQueries });
            queryRootFields.models = {
              type: _context13.t0,

              resolve() {
                return {};
              }
            };

          case 18:
            if (!(Object.keys(classMethodQueries).length > 0)) {
              _context13.next = 21;
              break;
            }

            _context13.t1 = new _graphql.GraphQLObjectType({ name: "ClassMethods", fields: classMethodQueries });
            queryRootFields.classMethods = {
              type: _context13.t1,

              resolve() {
                return {};
              }
            };

          case 21:
            mutationRootFields = Object.assign({}, mutations);

            if (!(Object.keys(mutationCollection).length > 0)) {
              _context13.next = 25;
              break;
            }

            _context13.t2 = new _graphql.GraphQLObjectType({ name: "MutationModels", fields: mutationCollection });
            mutationRootFields.models = {
              type: _context13.t2,

              resolve() {
                return {};
              }
            };

          case 25:
            return _context13.abrupt("return", new _graphql.GraphQLSchema({
              query: new _graphql.GraphQLObjectType({
                name: "RootQuery",
                fields: queryRootFields
              }),
              mutation: new _graphql.GraphQLObjectType({
                name: "Mutation",
                fields: mutationRootFields
              })
            }));

          case 26:
          case "end":
            return _context13.stop();
        }
      }
    }, _callee13, this);
  }));

  function createSchema(_x28) {
    return _ref15.apply(this, arguments);
  }

  return createSchema;
}();
//# sourceMappingURL=graphql.js.map
