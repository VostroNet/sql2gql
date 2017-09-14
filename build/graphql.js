"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createSchema = exports.createSubscriptionFunctions = exports.createQueryFunctions = exports.createMutationFunctions = exports.createQueryLists = exports.generateTypes = exports.events = undefined;

var generateTypes = exports.generateTypes = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(models, keys) {
    var _this = this;

    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var typeCollection;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            typeCollection = {};
            _context6.next = 3;
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

              return function (_x5) {
                return _ref2.apply(this, arguments);
              };
            }()));

          case 3:
            _context6.next = 5;
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
                            var relationship, targetType, result, _createBeforeAfter2, before, after, afterList;

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
                                    _createBeforeAfter2 = createBeforeAfter(models[modelName], options), before = _createBeforeAfter2.before, after = _createBeforeAfter2.after, afterList = _createBeforeAfter2.afterList;

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

                          return function (_x7) {
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

              return function (_x6) {
                return _ref3.apply(this, arguments);
              };
            }()));

          case 5:
            _context6.next = 7;
            return Promise.all(keys.map(function () {
              var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(modelName) {
                var modelDefinition, instanceMethods, fields;
                return regeneratorRuntime.wrap(function _callee5$(_context5) {
                  while (1) {
                    switch (_context5.prev = _context5.next) {
                      case 0:
                        if (typeCollection[modelName]) {
                          _context5.next = 2;
                          break;
                        }

                        return _context5.abrupt("return");

                      case 2:
                        modelDefinition = getModelDefinition(models[modelName]);
                        // console.log("found instance methods", {modelName, expose: modelDefinition.expose} );

                        if (!((modelDefinition.expose || {}).instanceMethods || {}).query) {
                          _context5.next = 10;
                          break;
                        }

                        instanceMethods = modelDefinition.expose.instanceMethods.query;
                        // console.log("found instance methods", instanceMethods);

                        fields = typeCollection[modelName]._typeConfig.fields; //eslint-disable-line

                        _context5.next = 8;
                        return Promise.all(Object.keys(instanceMethods).map(function () {
                          var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(methodName) {
                            var methodDefinition, type, args, targetType, result;
                            return regeneratorRuntime.wrap(function _callee4$(_context4) {
                              while (1) {
                                switch (_context4.prev = _context4.next) {
                                  case 0:
                                    methodDefinition = instanceMethods[methodName];
                                    type = methodDefinition.type, args = methodDefinition.args;
                                    targetType = type instanceof String || typeof type === "string" ? typeCollection[type] : type;

                                    if (targetType) {
                                      _context4.next = 5;
                                      break;
                                    }

                                    return _context4.abrupt("return");

                                  case 5:
                                    if (!options.permission) {
                                      _context4.next = 12;
                                      break;
                                    }

                                    if (!options.permission.queryInstanceMethods) {
                                      _context4.next = 12;
                                      break;
                                    }

                                    _context4.next = 9;
                                    return options.permission.queryInstanceMethods(modelName, methodName, options.permission.options);

                                  case 9:
                                    result = _context4.sent;

                                    if (result) {
                                      _context4.next = 12;
                                      break;
                                    }

                                    return _context4.abrupt("return");

                                  case 12:
                                    fields[methodName] = {
                                      type: targetType,
                                      args,
                                      resolve: function resolve(source, args, context, info) {
                                        return source[methodName].apply(source, [args, context, info]);
                                      }
                                    };

                                  case 13:
                                  case "end":
                                    return _context4.stop();
                                }
                              }
                            }, _callee4, _this);
                          }));

                          return function (_x9) {
                            return _ref6.apply(this, arguments);
                          };
                        }()));

                      case 8:
                        typeCollection[modelName]._typeConfig.fields = fields; //eslint-disable-line
                        resetInterfaces(typeCollection[modelName]);

                      case 10:
                      case "end":
                        return _context5.stop();
                    }
                  }
                }, _callee5, _this);
              }));

              return function (_x8) {
                return _ref5.apply(this, arguments);
              };
            }()));

          case 7:
            return _context6.abrupt("return", typeCollection);

          case 8:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function generateTypes(_x3, _x4) {
    return _ref.apply(this, arguments);
  };
}();

var createQueryLists = exports.createQueryLists = function () {
  var _ref7 = _asyncToGenerator(regeneratorRuntime.mark(function _callee8(models, modelNames, typeCollection, options) {
    var _this2 = this;

    var fields = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    return regeneratorRuntime.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.next = 2;
            return Promise.all(modelNames.map(function () {
              var _ref8 = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(modelName) {
                var result, _createBeforeAfter3, before, after;

                return regeneratorRuntime.wrap(function _callee7$(_context7) {
                  while (1) {
                    switch (_context7.prev = _context7.next) {
                      case 0:
                        if (!typeCollection[modelName]) {
                          _context7.next = 10;
                          break;
                        }

                        if (!options.permission) {
                          _context7.next = 8;
                          break;
                        }

                        if (!options.permission.query) {
                          _context7.next = 8;
                          break;
                        }

                        _context7.next = 5;
                        return options.permission.query(modelName, options.permission.options);

                      case 5:
                        result = _context7.sent;

                        if (result) {
                          _context7.next = 8;
                          break;
                        }

                        return _context7.abrupt("return");

                      case 8:
                        // let targetOpts = options[modelName];
                        _createBeforeAfter3 = createBeforeAfter(models[modelName], options), before = _createBeforeAfter3.before, after = _createBeforeAfter3.after;

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
                        return _context7.stop();
                    }
                  }
                }, _callee7, _this2);
              }));

              return function (_x15) {
                return _ref8.apply(this, arguments);
              };
            }()));

          case 2:
            return _context8.abrupt("return", fields);

          case 3:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8, this);
  }));

  return function createQueryLists(_x11, _x12, _x13, _x14) {
    return _ref7.apply(this, arguments);
  };
}();

var createMutationFunctions = exports.createMutationFunctions = function () {
  var _ref9 = _asyncToGenerator(regeneratorRuntime.mark(function _callee14(models, keys, typeCollection, mutationCollection, options) {
    var _this3 = this;

    return regeneratorRuntime.wrap(function _callee14$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            _context14.next = 2;
            return Promise.all(keys.map(function () {
              var _ref10 = _asyncToGenerator(regeneratorRuntime.mark(function _callee13(modelName) {
                var result, fields, requiredInput, optionalInput, mutationFields, modelDefinition, createFunc, create, updateFunc, deleteFunc, _createBeforeAfter4, before, afterUpdate, afterUpdateList, _createBeforeAfter5, afterDelete, afterDeleteList, update, del, updateAll, deleteAll, _result, _result2, _result3, _result4, _result5, _ref14, mutations;

                return regeneratorRuntime.wrap(function _callee13$(_context13) {
                  while (1) {
                    switch (_context13.prev = _context13.next) {
                      case 0:
                        if (typeCollection[modelName]) {
                          _context13.next = 2;
                          break;
                        }

                        return _context13.abrupt("return");

                      case 2:
                        if (!options.permission) {
                          _context13.next = 9;
                          break;
                        }

                        if (!options.permission.mutation) {
                          _context13.next = 9;
                          break;
                        }

                        _context13.next = 6;
                        return options.permission.mutation(modelName, options.permission.options);

                      case 6:
                        result = _context13.sent;

                        if (result) {
                          _context13.next = 9;
                          break;
                        }

                        return _context13.abrupt("return");

                      case 9:
                        fields = typeCollection[modelName]._typeConfig.fields; //eslint-disable-line

                        requiredInput = createMutationInput(modelName, models[modelName], fields, "Required");
                        optionalInput = createMutationInput(modelName, models[modelName], fields, "Optional", true);
                        mutationFields = {};
                        modelDefinition = getModelDefinition(models[modelName]);

                        createFunc = function () {
                          var _ref11 = _asyncToGenerator(regeneratorRuntime.mark(function _callee9(_, args, context, info) {
                            var input, model;
                            return regeneratorRuntime.wrap(function _callee9$(_context9) {
                              while (1) {
                                switch (_context9.prev = _context9.next) {
                                  case 0:
                                    input = args.input;

                                    if (modelDefinition.override) {
                                      input = Object.keys(modelDefinition.override).reduce(function (data, fieldName) {
                                        if (modelDefinition.override[fieldName].input) {
                                          data[fieldName] = modelDefinition.override[fieldName].input(data[fieldName], args, context, info);
                                        }
                                        return data;
                                      }, input);
                                    }

                                    if (!modelDefinition.before) {
                                      _context9.next = 6;
                                      break;
                                    }

                                    _context9.next = 5;
                                    return modelDefinition.before({
                                      params: input, args, context, info,
                                      modelDefinition,
                                      type: events.MUTATION_CREATE
                                    });

                                  case 5:
                                    input = _context9.sent;

                                  case 6:
                                    _context9.next = 8;
                                    return models[modelName].create(input, { context, rootValue: Object.assign({}, info.rootValue, { args }) });

                                  case 8:
                                    model = _context9.sent;

                                    if (!modelDefinition.after) {
                                      _context9.next = 13;
                                      break;
                                    }

                                    _context9.next = 12;
                                    return modelDefinition.after({
                                      result: model, args, context, info,
                                      modelDefinition,
                                      type: events.MUTATION_CREATE
                                    });

                                  case 12:
                                    return _context9.abrupt("return", _context9.sent);

                                  case 13:
                                    return _context9.abrupt("return", model);

                                  case 14:
                                  case "end":
                                    return _context9.stop();
                                }
                              }
                            }, _callee9, _this3);
                          }));

                          return function createFunc(_x23, _x24, _x25, _x26) {
                            return _ref11.apply(this, arguments);
                          };
                        }();

                        create = {
                          type: typeCollection[modelName],
                          args: {
                            input: {
                              type: requiredInput
                            }
                          },
                          resolve: createFunc
                        };

                        updateFunc = function () {
                          var _ref12 = _asyncToGenerator(regeneratorRuntime.mark(function _callee10(model, args, context, info) {
                            var input;
                            return regeneratorRuntime.wrap(function _callee10$(_context10) {
                              while (1) {
                                switch (_context10.prev = _context10.next) {
                                  case 0:
                                    input = args.input;

                                    if (modelDefinition.override) {
                                      input = Object.keys(modelDefinition.override).reduce(function (data, fieldName) {
                                        if (modelDefinition.override[fieldName].input) {
                                          data[fieldName] = modelDefinition.override[fieldName].input(data[fieldName], args, context, info);
                                        }
                                        return data;
                                      }, input);
                                    }

                                    if (!modelDefinition.before) {
                                      _context10.next = 6;
                                      break;
                                    }

                                    _context10.next = 5;
                                    return modelDefinition.before({
                                      params: input, args, context, info,
                                      model, modelDefinition,
                                      type: events.MUTATION_UPDATE
                                    });

                                  case 5:
                                    input = _context10.sent;

                                  case 6:
                                    _context10.next = 8;
                                    return model.update(input, { context, rootValue: Object.assign({}, info.rootValue, { args }) });

                                  case 8:
                                    model = _context10.sent;

                                    if (!modelDefinition.after) {
                                      _context10.next = 13;
                                      break;
                                    }

                                    _context10.next = 12;
                                    return modelDefinition.after({
                                      result: model, args, context, info,
                                      modelDefinition,
                                      type: events.MUTATION_UPDATE
                                    });

                                  case 12:
                                    return _context10.abrupt("return", _context10.sent);

                                  case 13:
                                    return _context10.abrupt("return", model);

                                  case 14:
                                  case "end":
                                    return _context10.stop();
                                }
                              }
                            }, _callee10, _this3);
                          }));

                          return function updateFunc(_x27, _x28, _x29, _x30) {
                            return _ref12.apply(this, arguments);
                          };
                        }();

                        deleteFunc = function () {
                          var _ref13 = _asyncToGenerator(regeneratorRuntime.mark(function _callee11(model, args, context, info) {
                            return regeneratorRuntime.wrap(function _callee11$(_context11) {
                              while (1) {
                                switch (_context11.prev = _context11.next) {
                                  case 0:
                                    if (!modelDefinition.before) {
                                      _context11.next = 4;
                                      break;
                                    }

                                    _context11.next = 3;
                                    return modelDefinition.before({
                                      params: model, args, context, info,
                                      model, modelDefinition,
                                      type: events.MUTATION_DELETE
                                    });

                                  case 3:
                                    model = _context11.sent;

                                  case 4:
                                    _context11.next = 6;
                                    return model.destroy({ context, rootValue: Object.assign({}, info.rootValue, { args }) });

                                  case 6:
                                    if (!modelDefinition.after) {
                                      _context11.next = 10;
                                      break;
                                    }

                                    _context11.next = 9;
                                    return modelDefinition.after({
                                      result: model, args, context, info,
                                      modelDefinition,
                                      type: events.MUTATION_DELETE
                                    });

                                  case 9:
                                    return _context11.abrupt("return", _context11.sent);

                                  case 10:
                                    return _context11.abrupt("return", model);

                                  case 11:
                                  case "end":
                                    return _context11.stop();
                                }
                              }
                            }, _callee11, _this3);
                          }));

                          return function deleteFunc(_x31, _x32, _x33, _x34) {
                            return _ref13.apply(this, arguments);
                          };
                        }();

                        // const {before, after, afterList} = createBeforeAfter(models[modelName], options, {after: [updateFunc]});


                        _createBeforeAfter4 = createBeforeAfter(models[modelName], options, { after: [updateFunc] }), before = _createBeforeAfter4.before, afterUpdate = _createBeforeAfter4.after, afterUpdateList = _createBeforeAfter4.afterList;
                        _createBeforeAfter5 = createBeforeAfter(models[modelName], options, { after: [deleteFunc] }), afterDelete = _createBeforeAfter5.after, afterDeleteList = _createBeforeAfter5.afterList;
                        update = {
                          type: typeCollection[modelName],
                          args: Object.assign((0, _graphqlSequelize.defaultArgs)(models[modelName]), { input: { type: optionalInput } }),
                          resolve: (0, _graphqlSequelize.resolver)(models[modelName], {
                            before: before,
                            after: afterUpdate
                          })
                        };
                        del = {
                          type: typeCollection[modelName],
                          args: (0, _graphqlSequelize.defaultArgs)(models[modelName]),
                          resolve: (0, _graphqlSequelize.resolver)(models[modelName], {
                            before: before,
                            after: afterDelete
                          })
                        };
                        updateAll = {
                          type: new _graphql.GraphQLList(typeCollection[modelName]),
                          args: Object.assign((0, _graphqlSequelize.defaultListArgs)(models[modelName]), { input: { type: optionalInput } }),
                          resolve: (0, _graphqlSequelize.resolver)(models[modelName], {
                            before: before,
                            after: afterUpdateList
                          })
                        };
                        deleteAll = {
                          type: new _graphql.GraphQLList(typeCollection[modelName]),
                          args: (0, _graphqlSequelize.defaultListArgs)(models[modelName]),
                          resolve: (0, _graphqlSequelize.resolver)(models[modelName], {
                            before: before,
                            after: afterDeleteList
                          })
                        };

                        if (!options.permission) {
                          _context13.next = 67;
                          break;
                        }

                        if (!options.permission.mutationCreate) {
                          _context13.next = 32;
                          break;
                        }

                        _context13.next = 28;
                        return options.permission.mutationCreate(modelName, options.permission.options);

                      case 28:
                        _result = _context13.sent;

                        if (_result) {
                          mutationFields.create = create;
                        }
                        _context13.next = 33;
                        break;

                      case 32:
                        mutationFields.create = create;

                      case 33:
                        if (!options.permission.mutationUpdate) {
                          _context13.next = 40;
                          break;
                        }

                        _context13.next = 36;
                        return options.permission.mutationUpdate(modelName, options.permission.options);

                      case 36:
                        _result2 = _context13.sent;

                        if (_result2) {
                          mutationFields.update = update;
                        }
                        _context13.next = 41;
                        break;

                      case 40:
                        mutationFields.update = update;

                      case 41:
                        if (!options.permission.mutationDelete) {
                          _context13.next = 48;
                          break;
                        }

                        _context13.next = 44;
                        return options.permission.mutationDelete(modelName, options.permission.options);

                      case 44:
                        _result3 = _context13.sent;

                        if (_result3) {
                          mutationFields.delete = del;
                        }
                        _context13.next = 49;
                        break;

                      case 48:
                        mutationFields.delete = del;

                      case 49:
                        if (!options.permission.mutationUpdateAll) {
                          _context13.next = 56;
                          break;
                        }

                        _context13.next = 52;
                        return options.permission.mutationUpdateAll(modelName, options.permission.options);

                      case 52:
                        _result4 = _context13.sent;

                        if (_result4) {
                          mutationFields.updateAll = updateAll;
                        }
                        _context13.next = 57;
                        break;

                      case 56:
                        mutationFields.updateAll = updateAll;

                      case 57:
                        if (!options.permission.mutationDeleteAll) {
                          _context13.next = 64;
                          break;
                        }

                        _context13.next = 60;
                        return options.permission.mutationDeleteAll(modelName, options.permission.options);

                      case 60:
                        _result5 = _context13.sent;

                        if (_result5) {
                          mutationFields.deleteAll = deleteAll;
                        }
                        _context13.next = 65;
                        break;

                      case 64:
                        mutationFields.deleteAll = deleteAll;

                      case 65:
                        _context13.next = 72;
                        break;

                      case 67:
                        mutationFields.create = create;
                        mutationFields.update = update;
                        mutationFields.delete = del;
                        mutationFields.updateAll = updateAll;
                        mutationFields.deleteAll = deleteAll;

                      case 72:
                        _ref14 = (getModelDefinition(models[modelName]).expose || {}).classMethods || {}, mutations = _ref14.mutations;

                        if (!mutations) {
                          _context13.next = 76;
                          break;
                        }

                        _context13.next = 76;
                        return Promise.all(Object.keys(mutations).map(function () {
                          var _ref15 = _asyncToGenerator(regeneratorRuntime.mark(function _callee12(methodName) {
                            var _mutations$methodName, type, args, _result6, outputType;

                            return regeneratorRuntime.wrap(function _callee12$(_context12) {
                              while (1) {
                                switch (_context12.prev = _context12.next) {
                                  case 0:
                                    _mutations$methodName = mutations[methodName], type = _mutations$methodName.type, args = _mutations$methodName.args;

                                    if (!options.permission) {
                                      _context12.next = 8;
                                      break;
                                    }

                                    if (!options.permission.mutationClassMethods) {
                                      _context12.next = 8;
                                      break;
                                    }

                                    _context12.next = 5;
                                    return options.permission.mutationClassMethods(modelName, methodName, options.permission.options);

                                  case 5:
                                    _result6 = _context12.sent;

                                    if (_result6) {
                                      _context12.next = 8;
                                      break;
                                    }

                                    return _context12.abrupt("return");

                                  case 8:
                                    outputType = type instanceof String || typeof type === "string" ? typeCollection[type] : type;
                                    _context12.t0 = outputType;
                                    _context12.t1 = args;
                                    mutationFields[methodName] = {
                                      type: _context12.t0,
                                      args: _context12.t1,

                                      resolve(item, args, context, gql) {
                                        return models[modelName][methodName].apply(models[modelName], [args, context]);
                                      }
                                    };

                                  case 12:
                                  case "end":
                                    return _context12.stop();
                                }
                              }
                            }, _callee12, _this3);
                          }));

                          return function (_x35) {
                            return _ref15.apply(this, arguments);
                          };
                        }()));

                      case 76:
                        if (!(Object.keys(mutationFields).length > 0)) {
                          _context13.next = 79;
                          break;
                        }

                        _context13.t0 = new _graphql.GraphQLObjectType({
                          name: `${modelName}Mutator`,
                          fields: mutationFields
                        });
                        mutationCollection[modelName] = {
                          type: _context13.t0,

                          resolve() {
                            return {}; // forces graphql to resolve the fields
                          }
                        };

                      case 79:
                      case "end":
                        return _context13.stop();
                    }
                  }
                }, _callee13, _this3);
              }));

              return function (_x22) {
                return _ref10.apply(this, arguments);
              };
            }()));

          case 2:
            return _context14.abrupt("return", mutationCollection);

          case 3:
          case "end":
            return _context14.stop();
        }
      }
    }, _callee14, this);
  }));

  return function createMutationFunctions(_x17, _x18, _x19, _x20, _x21) {
    return _ref9.apply(this, arguments);
  };
}();

var createQueryFunctions = exports.createQueryFunctions = function () {
  var _ref16 = _asyncToGenerator(regeneratorRuntime.mark(function _callee17(models, keys, typeCollection, options) {
    var _this4 = this;

    var queryCollection;
    return regeneratorRuntime.wrap(function _callee17$(_context17) {
      while (1) {
        switch (_context17.prev = _context17.next) {
          case 0:
            queryCollection = {};
            _context17.next = 3;
            return Promise.all(keys.map(function () {
              var _ref17 = _asyncToGenerator(regeneratorRuntime.mark(function _callee16(modelName) {
                var fields, _ref18, query, queryFields;

                return regeneratorRuntime.wrap(function _callee16$(_context16) {
                  while (1) {
                    switch (_context16.prev = _context16.next) {
                      case 0:
                        if (typeCollection[modelName]) {
                          _context16.next = 2;
                          break;
                        }

                        return _context16.abrupt("return");

                      case 2:
                        fields = typeCollection[modelName]._typeConfig.fields; //eslint-disable-line

                        _ref18 = (getModelDefinition(models[modelName]).expose || {}).classMethods || {}, query = _ref18.query;
                        queryFields = {};

                        if (!query) {
                          _context16.next = 11;
                          break;
                        }

                        _context16.next = 8;
                        return Promise.all(Object.keys(query).map(function () {
                          var _ref19 = _asyncToGenerator(regeneratorRuntime.mark(function _callee15(methodName) {
                            var result, _query$methodName, type, args, outputType;

                            return regeneratorRuntime.wrap(function _callee15$(_context15) {
                              while (1) {
                                switch (_context15.prev = _context15.next) {
                                  case 0:
                                    if (!options.permission) {
                                      _context15.next = 7;
                                      break;
                                    }

                                    if (!options.permission.queryClassMethods) {
                                      _context15.next = 7;
                                      break;
                                    }

                                    _context15.next = 4;
                                    return options.permission.queryClassMethods(modelName, methodName, options.permission.options);

                                  case 4:
                                    result = _context15.sent;

                                    if (result) {
                                      _context15.next = 7;
                                      break;
                                    }

                                    return _context15.abrupt("return");

                                  case 7:
                                    _query$methodName = query[methodName], type = _query$methodName.type, args = _query$methodName.args;
                                    outputType = type instanceof String || typeof type === "string" ? typeCollection[type] : type;
                                    _context15.t0 = outputType;
                                    _context15.t1 = args;
                                    queryFields[methodName] = {
                                      type: _context15.t0,
                                      args: _context15.t1,

                                      resolve(item, args, context, gql) {
                                        return models[modelName][methodName].apply(models[modelName], [args, context]);
                                      }
                                    };

                                  case 12:
                                  case "end":
                                    return _context15.stop();
                                }
                              }
                            }, _callee15, _this4);
                          }));

                          return function (_x41) {
                            return _ref19.apply(this, arguments);
                          };
                        }()));

                      case 8:
                        if (!(Object.keys(queryFields).length > 0)) {
                          _context16.next = 11;
                          break;
                        }

                        _context16.t0 = new _graphql.GraphQLObjectType({
                          name: `${modelName}Query`,
                          fields: queryFields
                        });
                        queryCollection[modelName] = {
                          type: _context16.t0,

                          resolve() {
                            return {}; // forces graphql to resolve the fields
                          }
                        };

                      case 11:
                      case "end":
                        return _context16.stop();
                    }
                  }
                }, _callee16, _this4);
              }));

              return function (_x40) {
                return _ref17.apply(this, arguments);
              };
            }()));

          case 3:
            return _context17.abrupt("return", queryCollection);

          case 4:
          case "end":
            return _context17.stop();
        }
      }
    }, _callee17, this);
  }));

  return function createQueryFunctions(_x36, _x37, _x38, _x39) {
    return _ref16.apply(this, arguments);
  };
}();

var createSubscriptionFunctions = exports.createSubscriptionFunctions = function () {
  var _ref20 = _asyncToGenerator(regeneratorRuntime.mark(function _callee19(pubsub, models, keys, typeCollection, options) {
    var _this5 = this;

    var subCollection;
    return regeneratorRuntime.wrap(function _callee19$(_context19) {
      while (1) {
        switch (_context19.prev = _context19.next) {
          case 0:
            subCollection = {};
            _context19.next = 3;
            return Promise.all(keys.map(function () {
              var _ref21 = _asyncToGenerator(regeneratorRuntime.mark(function _callee18(modelName) {
                var model, modelDefinition, _modelDefinition$subs, subscriptions, $subscriptions;

                return regeneratorRuntime.wrap(function _callee18$(_context18) {
                  while (1) {
                    switch (_context18.prev = _context18.next) {
                      case 0:
                        model = models[modelName];
                        modelDefinition = getModelDefinition(model);
                        _modelDefinition$subs = modelDefinition.subscriptions, subscriptions = _modelDefinition$subs === undefined ? {} : _modelDefinition$subs, $subscriptions = modelDefinition.$subscriptions; //TODO expose subscriptions from model definition

                        if (!$subscriptions) {
                          _context18.next = 6;
                          break;
                        }

                        _context18.next = 6;
                        return Promise.all(Object.keys($subscriptions.names).map(function (hookName) {
                          var subscriptionName = $subscriptions.names[hookName];
                          subCollection[subscriptionName] = {
                            type: typeCollection[modelName],
                            resolve(item, args, context, gql) {
                              var instance = item.instance,
                                  hookName = item.hookName;

                              if (subscriptions[hookName]) {
                                return subscriptions[hookName](instance, args, context, gql);
                              }
                              return instance;
                            },
                            subscribe() {
                              return pubsub.asyncIterator(subscriptionName);
                            }
                          };
                        }));

                      case 6:
                      case "end":
                        return _context18.stop();
                    }
                  }
                }, _callee18, _this5);
              }));

              return function (_x47) {
                return _ref21.apply(this, arguments);
              };
            }()));

          case 3:
            return _context19.abrupt("return", subCollection);

          case 4:
          case "end":
            return _context19.stop();
        }
      }
    }, _callee19, this);
  }));

  return function createSubscriptionFunctions(_x42, _x43, _x44, _x45, _x46) {
    return _ref20.apply(this, arguments);
  };
}();

var createSchema = exports.createSchema = function () {
  var _ref22 = _asyncToGenerator(regeneratorRuntime.mark(function _callee20(sqlInstance) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var query, mutations, subscriptions, _options$extend, extend, validKeys, typeCollection, mutationCollection, classMethodQueries, modelQueries, queryRootFields, rootSchema, mutationRootFields, subscriptionRootFields, pubsub, schema;

    return regeneratorRuntime.wrap(function _callee20$(_context20) {
      while (1) {
        switch (_context20.prev = _context20.next) {
          case 0:
            query = options.query, mutations = options.mutations, subscriptions = options.subscriptions, _options$extend = options.extend, extend = _options$extend === undefined ? {} : _options$extend;
            validKeys = Object.keys(sqlInstance.models).reduce(function (o, key) {
              if (getModelDefinition(sqlInstance.models[key])) {
                o.push(key);
              }
              return o;
            }, []);
            _context20.next = 4;
            return generateTypes(sqlInstance.models, validKeys, options);

          case 4:
            typeCollection = _context20.sent;
            _context20.next = 7;
            return createMutationFunctions(sqlInstance.models, validKeys, typeCollection, {}, options);

          case 7:
            mutationCollection = _context20.sent;
            _context20.next = 10;
            return createQueryFunctions(sqlInstance.models, validKeys, typeCollection, options);

          case 10:
            classMethodQueries = _context20.sent;
            _context20.next = 13;
            return createQueryLists(sqlInstance.models, validKeys, typeCollection, options);

          case 13:
            modelQueries = _context20.sent;
            queryRootFields = Object.assign({}, query);
            rootSchema = {};

            if (!(Object.keys(modelQueries).length > 0)) {
              _context20.next = 19;
              break;
            }

            _context20.t0 = new _graphql.GraphQLObjectType({ name: "QueryModels", fields: modelQueries });
            queryRootFields.models = {
              type: _context20.t0,

              resolve() {
                return {};
              }
            };

          case 19:
            if (!(Object.keys(classMethodQueries).length > 0)) {
              _context20.next = 22;
              break;
            }

            _context20.t1 = new _graphql.GraphQLObjectType({ name: "ClassMethods", fields: classMethodQueries });
            queryRootFields.classMethods = {
              type: _context20.t1,

              resolve() {
                return {};
              }
            };

          case 22:
            if (Object.keys(queryRootFields).length > 0) {
              rootSchema.query = new _graphql.GraphQLObjectType({
                name: "RootQuery",
                fields: queryRootFields
              });
            }
            mutationRootFields = Object.assign({}, mutations);

            if (!(Object.keys(mutationCollection).length > 0)) {
              _context20.next = 27;
              break;
            }

            _context20.t2 = new _graphql.GraphQLObjectType({ name: "MutationModels", fields: mutationCollection });
            mutationRootFields.models = {
              type: _context20.t2,

              resolve() {
                return {};
              }
            };

          case 27:
            if (Object.keys(mutationRootFields).length > 0) {
              rootSchema.mutation = new _graphql.GraphQLObjectType({
                name: "Mutation",
                fields: mutationRootFields
              });
            }

            subscriptionRootFields = Object.assign({}, subscriptions);

            if (!(sqlInstance.$sqlgql || {}).subscriptions) {
              _context20.next = 35;
              break;
            }

            pubsub = (sqlInstance.$sqlgql || {}).subscriptions.pubsub;
            _context20.next = 33;
            return createSubscriptionFunctions(pubsub, sqlInstance.models, validKeys, typeCollection, options);

          case 33:
            subscriptionRootFields = _context20.sent;

            if (Object.keys(subscriptionRootFields).length > 0) {
              rootSchema.subscription = new _graphql.GraphQLObjectType({
                name: "Subscription",
                fields: subscriptionRootFields
              });
            }

          case 35:
            schema = new _graphql.GraphQLSchema(Object.assign(rootSchema, extend));

            schema.$sql2gql = {
              types: typeCollection
            };
            return _context20.abrupt("return", schema);

          case 38:
          case "end":
            return _context20.stop();
        }
      }
    }, _callee20, this);
  }));

  return function createSchema(_x49) {
    return _ref22.apply(this, arguments);
  };
}();

exports.getModelDefinition = getModelDefinition;
exports.resetInterfaces = resetInterfaces;
exports.createBaseType = createBaseType;
exports.createBeforeAfter = createBeforeAfter;
exports.createMutationInput = createMutationInput;

var _graphql = require("graphql");

var _graphqlSequelize = require("graphql-sequelize");

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var events = exports.events = {
  "QUERY": 1,
  "MUTATION_CREATE": 2,
  "MUTATION_UPDATE": 3,
  "MUTATION_DELETE": 4
};

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
  var exclude = Object.keys(modelDefinition.override || {}).concat(modelDefinition.ignoreFields || []);
  if (options.permission) {
    if (options.permission.field) {
      exclude = exclude.concat(Object.keys(modelDefinition.define).filter(function (keyName) {
        return options.permission.field(modelName, keyName);
      }));
      console.log("FIELDS", { modelName, exclude });
    }
  }

  var fields = (0, _graphqlSequelize.attributeFields)(model, {
    exclude
  });
  if (modelDefinition.override) {
    Object.keys(modelDefinition.override).forEach(function (fieldName) {
      var fieldDefinition = modelDefinition.define[fieldName];
      var overrideFieldDefinition = modelDefinition.override[fieldName];
      var type = void 0;
      if (!(overrideFieldDefinition.type instanceof _graphql.GraphQLObjectType) && !(overrideFieldDefinition.type instanceof _graphql.GraphQLScalarType) && !(overrideFieldDefinition.type instanceof _graphql.GraphQLEnumType)) {
        type = new _graphql.GraphQLObjectType(overrideFieldDefinition.type);
      } else {
        type = overrideFieldDefinition.type;
      }
      if (!fieldDefinition.allowNull) {
        type = new _graphql.GraphQLNonNull(type);
      }
      fields[fieldName] = {
        type,
        resolve: overrideFieldDefinition.output
      };
    });
  }
  var resolve = void 0;
  if (modelDefinition.resolver) {
    resolve = modelDefinition.resolver;
  } else {
    var _createBeforeAfter = createBeforeAfter(model, options),
        before = _createBeforeAfter.before,
        after = _createBeforeAfter.after;

    resolve = (0, _graphqlSequelize.resolver)(model, { before, after });
  }
  return new _graphql.GraphQLObjectType({
    name: modelName,
    description: "",
    fields: fields,
    resolve: resolve
  });
}
function createBeforeAfter(model, options) {
  var hooks = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var targetBeforeFuncs = [],
      targetAfterFuncs = [];
  if (hooks.after) {
    targetAfterFuncs = targetAfterFuncs.concat(hooks.after);
  }
  var modelDefinition = getModelDefinition(model);
  if (options.before) {
    targetBeforeFuncs.push(function (params, args, context, info) {
      return options.before({
        params, args, context, info,
        modelDefinition,
        type: events.QUERY
      });
    });
  }
  if (options.after) {
    targetAfterFuncs.push(function (result, args, context, info) {
      return options.after({
        result, args, context, info,
        modelDefinition,
        type: events.QUERY
      });
    });
  }
  if (modelDefinition.before) {
    targetBeforeFuncs.push(function (params, args, context, info) {
      return modelDefinition.before({
        params, args, context, info,
        modelDefinition,
        type: events.QUERY
      });
    });
  }
  if (modelDefinition.after) {
    targetAfterFuncs.push(function (result, args, context, info) {
      return modelDefinition.after({
        result, args, context, info,
        modelDefinition: modelDefinition,
        type: events.QUERY
      });
    });
  }
  if (hooks.before) {
    targetBeforeFuncs = targetBeforeFuncs.concat(hooks.before);
  }
  var targetBefore = function targetBefore(findOptions, args, context, info) {
    // console.log("weee", {context, rootValue: info.rootValue})
    findOptions.context = context;
    findOptions.rootValue = info.rootValue;
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
            var inputType = void 0;
            if (!(overrideFieldDefinition.type instanceof _graphql.GraphQLInputObjectType) && !(overrideFieldDefinition.type instanceof _graphql.GraphQLScalarType) && !(overrideFieldDefinition.type instanceof _graphql.GraphQLEnumType)) {
              inputType = new _graphql.GraphQLInputObjectType({
                name,
                fields: type.fields
              });
            } else {
              inputType = type;
            }

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
