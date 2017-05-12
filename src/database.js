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
    instance.models[schema.name].schema = schema;
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

