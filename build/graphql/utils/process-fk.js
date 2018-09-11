"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = processFK;

var _graphql = require("graphql");

async function processFK(outputType, method, model, args, context, gql) {
  const result = await method.apply(model, [args, context]);

  if (!result) {
    return undefined;
  }

  if (outputType instanceof _graphql.GraphQLList) {
    const targetType = outputType.ofType;

    if (targetType.$sql2gql) {
      const {
        after
      } = targetType.$sql2gql.events;
      return result.map(r => after(r, args, context, gql));
    }

    return result;
  }

  let type;

  if (outputType instanceof _graphql.GraphQLNonNull) {
    type = outputType.ofType;
  } else {
    type = outputType;
  }

  if (type.$sql2gql) {
    const {
      after
    } = type.$sql2gql.events;
    return after(result, args, context, gql);
  }

  return result;
}
//# sourceMappingURL=process-fk.js.map
