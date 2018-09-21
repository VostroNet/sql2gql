"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getForeignKeysForModel = getForeignKeysForModel;
exports.getForeignKeyAssociation = getForeignKeyAssociation;

function getOriginalModel(model) {
  if (!Object.getPrototypeOf(model).getOriginalModel) {
    return model;
  } else {
    return Object.getPrototypeOf(model).getOriginalModel();
  }
}

function getForeignKeysForModel(model) {
  const {
    fieldRawAttributesMap
  } = getOriginalModel(model);
  return Object.keys(fieldRawAttributesMap).filter(k => {
    return !!fieldRawAttributesMap[k].references;
  });
}

function getForeignKeyAssociation(model, fk) {
  const {
    associations
  } = getOriginalModel(model);
  const assocName = Object.keys(associations).filter(assocName => {
    return associations[assocName].foreignKey === fk;
  })[0];
  return associations[assocName];
}
//# sourceMappingURL=models.js.map
