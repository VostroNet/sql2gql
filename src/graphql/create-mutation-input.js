import {
  GraphQLInputObjectType, GraphQLNonNull, GraphQLScalarType, GraphQLEnumType, GraphQLList
} from "graphql";
import { capitalize } from "../utils/word";

export function generateInputFields(instance, defName, definition, fields, relationships, inputTypes, forceOptional = false) {
  let def = Object.keys(fields).reduce((o, key) => {
    const field = fields[key];
    if (definition.override) {
      const overrideFieldDefinition = definition.override[key];

      if (overrideFieldDefinition) {
        const type = overrideFieldDefinition.inputType || overrideFieldDefinition.type;
        let name = type.name;
        if (!overrideFieldDefinition.inputType) {
          name += "Input";
        }
        if (forceOptional) {
          name = `Optional${name}`;
        }
        let inputType;
        if (!(overrideFieldDefinition.type instanceof GraphQLInputObjectType) &&
          !(overrideFieldDefinition.type instanceof GraphQLScalarType) &&
          !(overrideFieldDefinition.type instanceof GraphQLEnumType)) {
          inputType = new GraphQLInputObjectType({
            name,
            fields: type.fields,
          });
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
      const type = instance.getGraphQLInputType(defName, field.type);
      o[key] = {
        type: !field.allowNull && !field.autoPopulated && !forceOptional
          ? new GraphQLNonNull(type) : type,
      };
    }
    return o;
  }, def);
  return Object.keys(relationships).reduce((o, key) => {
    const relationship = relationships[key];
    o[key] = {
      type: new GraphQLInputObjectType({
        name: "",
        fields() {
          const fld = {};
          const filterType = instance.getFilterGraphQLType(relationship.target);
          const createInput = new GraphQLInputObjectType({
            name: `${defName}${capitalize(key)}Create`,
            fields: inputTypes[relationship.target].required,
          });
          const updateInput = new GraphQLInputObjectType({
            name: `${defName}${capitalize(key)}Update`,
            fields: {
              where: {
                type: filterType,
              },
              input: {
                type: new GraphQLInputObjectType({
                  name: `${defName}${capitalize(key)}}UpdateInput`,
                  fields: inputTypes[relationship.target].optional,
                }),
              },
            },
          });
          switch (relationship.type) {
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
              break;
            default:
              fld.create = {
                type: createInput,
              };

              fld.update = {
                type: updateInput,
              };
              break;
          }
          return fld;
        }
      })
    };
    return o;
  }, def);
}

export default function createMutationInput(instance, defName, inputTypes) {
  const fields = instance.getFields(defName);
  const relationships = instance.getRelationships(defName);

  inputTypes[defName] = {
    required: new GraphQLInputObjectType({
      name: `${defName}RequiredInput`,
      fields() {
        return generateInputFields(instance, defName, fields, relationships, inputTypes, false);
      },
    }),
    optional: new GraphQLInputObjectType({
      name: `${defName}OptionalInput`,
      fields() {
        return generateInputFields(instance, defName, fields, relationships, inputTypes, true);
      },
    }),
  };

  return inputTypes;
}
