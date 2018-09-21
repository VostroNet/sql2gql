
function getOriginalModel(model) {
  if (!Object.getPrototypeOf(model).getOriginalModel) {
    return model;
  } else {
    return Object.getPrototypeOf(model).getOriginalModel();
  }
}

export function getForeignKeysForModel(model) {
  const {fieldRawAttributesMap} = getOriginalModel(model);
  return Object.keys(fieldRawAttributesMap).filter(k => {
    return !(!fieldRawAttributesMap[k].references);
  });
}

export function getForeignKeyAssociation(model, fk) {
  const {associations} = getOriginalModel(model);
  const assocName = Object.keys(associations).filter((assocName) => {
    return associations[assocName].foreignKey === fk;
  })[0];
  return associations[assocName];
}
