import Sequelize from "sequelize";
import logger from "utils/logger";
const log = logger("seeql::database:");


export default function connect(schemas, instance, options) {
  loadSchemas(schemas, instance);
  return instance;
}


function loadSchemas(schemas, instance, options = {}) {
  const {defaultAttr, defaultModel} = options;
  schemas.forEach((schema) => {
    instance.define(schema.name, Object.assign({}, defaultAttr, schema.define), Object.assign({}, defaultModel, schema.options));
    instance.models[schema.name].$gqlsql = schema;
    if (/^4/.test(Sequelize.version) && schema.options) {
      const {classMethods, instanceMethods} = schema.options;
      if (classMethods) {
        Object.keys(classMethods).forEach((classMethod) => {
          instance.models[schema.name][classMethod] = classMethods[classMethod];
        });
      }
      if (instanceMethods) {
        Object.keys(instanceMethods).forEach((instanceMethod) => {
          instance.models[schema.name].prototype[instanceMethod] = instanceMethods[instanceMethod];
        });
      }
    }
  });
  schemas.forEach((schema) => {
    (schema.relationships || []).forEach((relationship) => {
      createRelationship(instance, schema.name, relationship.model, relationship.name, relationship.type, Object.assign({as: relationship.name}, relationship.options));
    });
  });
}

function createRelationship(instance, targetModel, sourceModel, name, type, options = {}) {
  let model = instance.models[targetModel];
  if (!model.relationships) {
    model.relationships = {};
  }
  try {
    model.relationships[name] = {
      type: type,
      source: sourceModel,
      target: targetModel,
      rel: model[type](instance.models[sourceModel], options),
    };
  } catch (err) {
    log.error("Error Mapping relationship", {model, sourceModel, name, type, options, err});
  }
  instance.models[targetModel] = model;
}

