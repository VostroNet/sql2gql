import Sequelize from "sequelize";
import {
  GraphQLInt,
  GraphQLString,
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLEnumType,
  GraphQLList,
  GraphQLScalarType,
} from "graphql";

import jsonType from "@vostro/graphql-types/lib/json";
import dateType from "@vostro/graphql-types/lib/date";

import {capitalize} from "../../utils/word";

export default function typeMapper(type, modelName, fieldName) {
  return toGraphQL(type, Sequelize, modelName, fieldName);
}


export const GraphQLUpload = new GraphQLScalarType({
  name: "Upload",
  description: "The `Upload` scalar type represents a file upload promise that resolves " +
    "an object containing `stream`, `filename`, `mimetype` and `encoding`.",
  parseValue: value => value,
  parseLiteral() {
    throw new Error("Upload scalar literal unsupported");
  },
  serialize() {
    throw new Error("Upload scalar serialization unsupported");
  },
});

/**
 * Checks the type of the sequelize data type and
 * returns the corresponding type in GraphQL
 * @param  {Object} sequelizeType
 * @param  {Object} sequelizeTypes
 * @return {Function} GraphQL type declaration
 */
export function toGraphQL(sequelizeType, sequelizeTypes, modelName, fieldName) {
  const {
    BOOLEAN,
    ENUM,
    FLOAT,
    REAL,
    CHAR,
    DECIMAL,
    DOUBLE,
    INTEGER,
    BIGINT,
    STRING,
    TEXT,
    UUID,
    DATE,
    DATEONLY,
    TIME,
    ARRAY,
    VIRTUAL,
    JSON,
    JSONB,
    GEOMETRY,
    UUIDV4,
    BLOB,
    MACADDR,
    CIDR,
    INET,
  } = sequelizeTypes;

  // Map of special characters
  const specialCharsMap = new Map([
    ["¼", "frac14"],
    ["½", "frac12"],
    ["¾", "frac34"]
  ]);

  if (sequelizeType instanceof BOOLEAN) {
    return GraphQLBoolean;
  }

  if (sequelizeType instanceof FLOAT ||
    sequelizeType instanceof REAL ||
    sequelizeType instanceof DOUBLE
  ) {
    return GraphQLFloat;
  }

  if (sequelizeType instanceof DATE) {
    return dateType;
  }

  if (
    sequelizeType instanceof CHAR ||
    sequelizeType instanceof STRING ||
    sequelizeType instanceof TEXT ||
    sequelizeType instanceof UUID ||
    sequelizeType instanceof DATEONLY ||
    sequelizeType instanceof TIME ||
    sequelizeType instanceof BIGINT ||
    sequelizeType instanceof DECIMAL ||
    sequelizeType instanceof UUIDV4 ||
    sequelizeType instanceof MACADDR ||
    sequelizeType instanceof CIDR ||
    sequelizeType instanceof INET
  ) {
    return GraphQLString;
  }

  if (sequelizeType instanceof INTEGER) {
    return GraphQLInt;
  }

  if (sequelizeType instanceof ARRAY) {
    let elementType = toGraphQL(sequelizeType.type, sequelizeTypes, modelName, fieldName);
    return new GraphQLList(elementType);
  }

  if (sequelizeType instanceof ENUM) {
    let values = sequelizeType.values.reduce((o, k) => {
      o[sanitizeEnumValue(k)] = {
        value: k
      };
      return o;
    }, {});
    return new GraphQLEnumType({
      name: `${capitalize(modelName)}${capitalize(fieldName)}Enum`,
      values,
    });
  }

  if (sequelizeType instanceof VIRTUAL) {
    let returnType = sequelizeType.returnType
      ? toGraphQL(sequelizeType.returnType, sequelizeTypes)
      : GraphQLString;
    return returnType;
  }

  if (sequelizeType instanceof JSONB || sequelizeType instanceof JSON || sequelizeType instanceof GEOMETRY) {
    return jsonType;
  }
  if (sequelizeType instanceof BLOB) {
    return GraphQLUpload;
  }
  throw new Error(
    `Unable to convert ${sequelizeType.key ||
      sequelizeType.toSql()} to a GraphQL type`
  );

  function sanitizeEnumValue(value) {
    return value
      .trim()
      .replace(/([^_a-zA-Z0-9])/g, (_, p) => specialCharsMap.get(p) || " ")
      .split(" ")
      .map((v, i) => (i ? capitalize(v) : v))
      .join("")
      .replace(/(^\d)/, "_$1");
  }
}
