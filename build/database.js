"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = connect;

var _sequelize = require("sequelize");

var _sequelize2 = _interopRequireDefault(_sequelize);

var _logger = require("./utils/logger");

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = (0, _logger2.default)("sql2gql::database:");

function connect(schemas, instance) {
  loadSchemas(schemas, instance);
  return instance;
}

function loadSchemas(schemas, instance) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var defaultAttr = options.defaultAttr,
      defaultModel = options.defaultModel;

  schemas.forEach(function (schema) {
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
    instance.define(schema.name, Object.assign({}, defaultAttr, schema.define), Object.assign({}, defaultModel, schema.options));
    instance.models[schema.name].$sqlgql = schema;
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
          instance.models[schema.name][classMethod] = classMethods[classMethod];
        });
      }
      if (instanceMethods) {
        Object.keys(instanceMethods).forEach(function (instanceMethod) {
          instance.models[schema.name].prototype[instanceMethod] = instanceMethods[instanceMethod];
        });
      }
    }
  });
  schemas.forEach(function (schema) {
    (schema.relationships || []).forEach(function (relationship) {
      createRelationship(instance, schema.name, relationship.model, relationship.name, relationship.type, Object.assign({ as: relationship.name }, relationship.options));
    });
  });
}

function createRelationship(instance, targetModel, sourceModel, name, type) {
  var options = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};

  var model = instance.models[targetModel];
  if (!model.relationships) {
    model.relationships = {};
  }
  try {
    model.relationships[name] = {
      type: type,
      source: sourceModel,
      target: targetModel,
      rel: model[type](instance.models[sourceModel], options)
    };
  } catch (err) {
    log.error("Error Mapping relationship", { model, sourceModel, name, type, options, err });
  }
  instance.models[targetModel] = model;
}
//# sourceMappingURL=database.js.map
