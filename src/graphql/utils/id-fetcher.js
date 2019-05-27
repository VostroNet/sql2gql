// // https://github.com/mickhansen/graphql-sequelize/blob/master/src/relay.js
import {
  fromGlobalId,
} from "graphql-relay";


export default function idFetcher(database, nodeTypeMapper) {
  return async(globalId, context, info) => {
    const {type, id} = fromGlobalId(globalId);

    const nodeType = nodeTypeMapper.item(type);
    if (nodeType && typeof nodeType.resolve === "function") {
      const res = await Promise.resolve(nodeType.resolve(globalId, context, info));
      if (res) {
        res.__graphqlType__ = type; //eslint-disable-line
      }
      return res;
    }

    const model = Object.keys(database.models).find(model => model === type);
    if (model) {
      return database.models[model].findByPk(id);
      //TODO: probably should abstract this instead of accessing the models directly
    }

    if (nodeType) {
      return typeof nodeType.type === "string" ? info.schema.getType(nodeType.type) : nodeType.type;
    }

    return null;
  };
}
