// https://github.com/mickhansen/graphql-sequelize/blob/master/src/relay.js

export default function typeResolver(nodeTypeMapper) {
  return (obj, context, info) => {
    var type =
      obj.__graphqlType__ || //eslint-disable-line
      (obj.Model
        ? obj.Model.options.name.singular
        : obj._modelOptions //eslint-disable-line
        ? obj._modelOptions.name.singular  //eslint-disable-line
        : obj.name); //eslint-disable-line

    if (!type) {
      throw new Error(
        `Unable to determine type of ${typeof obj}. ` +
          `Either specify a resolve function in 'NodeTypeMapper' object, or specify '__graphqlType__' property on object.`
      );
    }

    const nodeType = nodeTypeMapper.item(type);
    if (nodeType) {
      return typeof nodeType.type === "string"
        ? info.schema.getType(nodeType.type)
        : nodeType.type;
    }

    return null;
  };
}
