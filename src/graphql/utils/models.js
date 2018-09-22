export function getForeignKeysForModel(model) {
  const {fieldRawAttributesMap} = model;
  return Object.keys(fieldRawAttributesMap).filter(k => {
    return !(!fieldRawAttributesMap[k].references);
  });
}


export function getForeignKeyAssociation(model, fk) {
  const {associations} = model;
  const assocName = Object.keys(associations).filter((assocName) => {
    return associations[assocName].foreignKey === fk;
  })[0];
  return associations[assocName];
}
