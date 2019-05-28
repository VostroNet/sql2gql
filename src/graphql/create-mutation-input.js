import {
  GraphQLInputObjectType, GraphQLNonNull, GraphQLScalarType, GraphQLEnumType, GraphQLList
} from "graphql";

import createGQLInputObject from "./create-gql-input-object";
import { capitalize } from "../utils/word";
//(instance, defName, fields, relationships, inputTypes, false)
export function generateInputFields(instance, defName, definition, fields, relationships, inputTypes, schemaCache, forceOptional = false) {


  let def = Object.keys(fields).reduce((o, key) => {
    const field = fields[key];
    if (definition.override) {
      const overrideFieldDefinition = definition.override[key];

      if (overrideFieldDefinition) {
        const type = overrideFieldDefinition.inputType || overrideFieldDefinition.type;
        let name = type.name;
        if (!overrideFieldDefinition.inputType) {
          name = `${type.name}${capitalize(key)}Input`;
        }
        if (forceOptional) {
          name = `${capitalize(type.name)}Optional${capitalize(key)}`;
        }
        let inputType;
        if (!(overrideFieldDefinition.type instanceof GraphQLInputObjectType) &&
          !(overrideFieldDefinition.type instanceof GraphQLScalarType) &&
          !(overrideFieldDefinition.type instanceof GraphQLEnumType)) {
          inputType = createGQLInputObject(name, type.fields, schemaCache);
        } else {
          inputType = type;
        }

        if (!field.allowNull && !field.autoPopulated && !forceOptional) {
          o[key] = {type: new GraphQLNonNull(inputType)};
        } else {
          o[key] = {type: inputType};
        }
      }
    }
    if (!o[key]) {
      const type = instance.getGraphQLInputType(defName, key, field.type);
      o[key] = {
        type: field.allowNull || field.autoPopulated || !forceOptional
          ? type : new GraphQLNonNull(type),
      };
    }
    return o;
  }, {});

  return Object.keys(relationships).reduce((o, key) => {
    const relationship = relationships[key];
    if (!inputTypes[relationship.target]) {
      return o;
    }
    const fld = {};
    const filterType = instance.getFilterGraphQLType(relationship.target);
    const createInput = inputTypes[relationship.target].required;
    const updateInput = createGQLInputObject(`${defName}${capitalize(key)}Update`, {
      where: {
        type: filterType,
      },
      input: {
        type: inputTypes[relationship.target].optional,
      },
    }, schemaCache);
    switch (relationship.associationType) {
      case "hasMany":
      case "belongsToMany":
        fld.create = {
          type: new GraphQLList(createInput),
        };
        fld.update = {
          type: new GraphQLList(updateInput),
        };
        fld.add = {
          type: new GraphQLList(filterType),
        };
        fld.remove = {
          type: new GraphQLList(filterType),
        };
        fld.delete = {
          type: new GraphQLList(filterType),
        };
        break;
      default:
        fld.create = {
          type: createInput,
        };

        fld.update = {
          type: updateInput,
        };
        fld.delete = {
          type: filterType,
        };
        break;
    }
    o[key] = {
      type: createGQLInputObject(`${defName}${capitalize(key)}${capitalize(relationship.associationType)}Input`, fld, schemaCache),
    };
    return o;
  }, def);
}

export default function createMutationInput(instance, defName, schemaCache, inputTypes) {
  const fields = instance.getFields(defName);
  const relationships = instance.getRelationships(defName);
  const definition = instance.getDefinition(defName);
  const required = createGQLInputObject(`${defName}RequiredInput`, function() {
    return generateInputFields(instance, defName, definition, fields, relationships, inputTypes, schemaCache, false);
  }, schemaCache);
  const optional = createGQLInputObject(`${defName}RequiredInput`, function() {
    return generateInputFields(instance, defName, definition, fields, relationships, inputTypes, schemaCache, true);
  }, schemaCache);
  const filterType = instance.getFilterGraphQLType(defName);
  return {
    required, optional,
    create: new GraphQLList(required),
    update: new GraphQLList(createGQLInputObject(`${defName}UpdateInput`, {
      where: {
        type: filterType,
      },
      input: {
        type: optional,
      },
    }, schemaCache)),
    delete: new GraphQLList(filterType),
  };
}
