"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.connect = connect;
exports.createSubscriptionHook = createSubscriptionHook;
exports.loadSchemas = loadSchemas;

var _sequelize = require("sequelize");

var _sequelize2 = _interopRequireDefault(_sequelize);

var _logger = require("./utils/logger");

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var log = (0, _logger2.default)("sql2gql::database:");

function connect(schemas, sqlInstance, options) {
  loadSchemas(schemas, sqlInstance, options);
  return sqlInstance;
}

function createSubscriptionHook(schema, hookName, subscriptionName, pubsub) {
  var schemaOptions = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
  var hooks = schemaOptions.hooks;

  var schemaHook = hooks[hookName];
  if (schemaHook) {
    if (schemaHook.isSubHook) {
      log.error("returning existing hook", { schemaHookName: schemaHook.hookName, hookName });
      return schemaHook; //#12 return existing hook;
    }
  }
  var f = function () {
    var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(instance, options) {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!schemaHook) {
                _context.next = 14;
                break;
              }

              _context.prev = 1;

              if (schemaHook.isSubHook) {
                _context.next = 7;
                break;
              }

              _context.next = 5;
              return schemaHook.apply(instance, [instance, options]);

            case 5:
              _context.next = 8;
              break;

            case 7:
              log.error("attempting to call itself. check for BUGFIX#12", { hookName });

            case 8:
              _context.next = 14;
              break;

            case 10:
              _context.prev = 10;
              _context.t0 = _context["catch"](1);

              log.debug(`${hookName} threw error, will not fire subscription event`, { err: _context.t0 });
              return _context.abrupt("return", undefined);

            case 14:
              return _context.abrupt("return", pubsub.publish(subscriptionName, { instance, options, hookName }));

            case 15:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this, [[1, 10]]);
    }));

    return function f(_x2, _x3) {
      return _ref.apply(this, arguments);
    };
  }();
  f.isSubHook = true; // check for BUGFIX#12
  f.hookName = hookName;
  f.schemaName = schema.name;
  return f;
}

function loadSchemas(schemas, sqlInstance) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  // const schemas = s.slice(0);
  // console.log("calling loadSchemas");
  sqlInstance.$sqlgql = {};
  var defaultAttr = options.defaultAttr,
      defaultModel = options.defaultModel;

  var pubsub = void 0,
      subscriptionHooks = void 0;
  if (options.subscriptions) {
    if (!options.subscriptions.pubsub) {
      throw "PubSub is required for subscriptions to work - {options.subscriptions.pubsub} is undefined";
    }
    pubsub = options.subscriptions.pubsub;
    subscriptionHooks = options.subscriptions.hooks || ["afterCreate", "afterDestroy", "afterUpdate"];
    sqlInstance.$sqlgql = Object.assign(sqlInstance.$sqlgql, {
      subscriptions: {
        pubsub
      }
    });
  }

  var sc = schemas.map(function (s) {
    //BUGFIX #12 - clone schema and hooks as we like to polute the object
    var schema = Object.assign({}, s, {
      options: Object.assign({}, s.options, {
        hooks: Object.assign({}, (s.options || {}).hooks)
      })
    });
    var schemaOptions = Object.assign({}, defaultModel, schema.options);
    if (pubsub) {
      //TODO Restrict or Enable hooks per model
      schema.$subscriptions = subscriptionHooks.reduce(function (data, hookName) {
        var subscriptionName = `${hookName}${schema.name}`;
        var hookFunc = createSubscriptionHook(schema, hookName, subscriptionName, pubsub, schemaOptions);
        data.names[hookName] = subscriptionName;
        data.hooks[hookName] = hookFunc;
        return data;
      }, {
        names: {},
        hooks: {}
      });
      schemaOptions = Object.assign(schemaOptions, {
        hooks: Object.assign(schemaOptions.hooks || {}, schema.$subscriptions.hooks)
      });
    }

    var classMethods = schema.classMethods,
        instanceMethods = schema.instanceMethods;

    if (!/^4/.test(_sequelize2.default.version)) {
      // v3 compatibilty
      if (classMethods) {
        schema.options.classMethods = classMethods;
      }
      if (instanceMethods) {
        schema.options.instanceMethods = instanceMethods;
      }
    }
    sqlInstance.define(schema.name, Object.assign({}, defaultAttr, schema.define), schemaOptions);
    sqlInstance.models[schema.name].$sqlgql = schema;
    if (/^4/.test(_sequelize2.default.version)) {
      // v4 compatibilty
      if (schema.options) {
        if (schema.options.classMethods) {
          classMethods = schema.options.classMethods;
        }
        if (schema.options.instanceMethods) {
          instanceMethods = schema.options.instanceMethods;
        }
      }
      if (classMethods) {
        Object.keys(classMethods).forEach(function (classMethod) {
          sqlInstance.models[schema.name][classMethod] = classMethods[classMethod];
        });
      }
      if (instanceMethods) {
        Object.keys(instanceMethods).forEach(function (instanceMethod) {
          sqlInstance.models[schema.name].prototype[instanceMethod] = instanceMethods[instanceMethod];
        });
      }
    }
    return schema;
  });
  sc.forEach(function (schema) {
    (schema.relationships || []).forEach(function (relationship) {
      createRelationship(sqlInstance, schema.name, relationship.model, relationship.name, relationship.type, Object.assign({
        as: relationship.name
      }, relationship.options));
    });
  });
}

function createRelationship(sqlInstance, targetModel, sourceModel, name, type) {
  var options = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};

  var model = sqlInstance.models[targetModel];
  if (!model.relationships) {
    model.relationships = {};
  }
  try {
    model.relationships[name] = {
      type: type,
      source: sourceModel,
      target: targetModel,
      rel: model[type](sqlInstance.models[sourceModel], options)
    };
  } catch (err) {
    log.error("Error Mapping relationship", { model, sourceModel, name, type, options, err });
  }
  sqlInstance.models[targetModel] = model;
}
//# sourceMappingURL=database.js.map
