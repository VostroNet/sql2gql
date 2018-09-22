"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getForeignKeysForModel = getForeignKeysForModel;
exports.getForeignKeyAssociation = getForeignKeyAssociation;

function getForeignKeysForModel(model) {
  const {
    fieldRawAttributesMap
  } = model;
  return Object.keys(fieldRawAttributesMap).filter(k => {
    return !!fieldRawAttributesMap[k].references;
  });
}

function getForeignKeyAssociation(model, fk) {
  const {
    associations
  } = model;
  const assocName = Object.keys(associations).filter(assocName => {
    return associations[assocName].foreignKey === fk;
  })[0];
  return associations[assocName];
}
//# sourceMappingURL=models.js.map
