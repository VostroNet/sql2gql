import { GraphQLList, GraphQLNonNull } from "graphql";

export default async function processFK(outputType, method, model, args, context, gql) {
  const result = await method.apply(model, [args, context]);
  if (!result) {
    return undefined;
  }
  if (outputType instanceof GraphQLList) {
    const targetType = outputType.ofType;
    if (targetType.$sql2gql) {
      const {after} = targetType.$sql2gql.events;
      return result.map((r) => after(r, args, context, gql));
    }
    return result;
  }
  let type;
  if (outputType instanceof GraphQLNonNull) {
    type = outputType.ofType;
  } else {
    type = outputType;
  }
  if (type.$sql2gql) {
    const {after} = type.$sql2gql.events;
    return after(result, args, context, gql);
  }
  return result;
}
