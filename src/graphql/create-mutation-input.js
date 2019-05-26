import {
  GraphQLInputObjectType, GraphQLNonNull, GraphQLScalarType, GraphQLEnumType, GraphQLList
} from "graphql";
import { capitalize } from "../utils/word";
//(instance, defName, fields, relationships, inputTypes, false)
export function generateInputFields(instance, defName, definition, fields, relationships, inputTypes, forceOptional = false) {


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
  }, {});

  return Object.keys(relationships).reduce((o, key) => {
    const relationship = relationships[key];
    const fld = {};
    const filterType = instance.getFilterGraphQLType(relationship.target);
    const createInput = inputTypes[relationship.target].required;
    const updateInput = new GraphQLInputObjectType({
      name: `${defName}${capitalize(key)}Update`,
      fields: {
        where: {
          type: filterType,
        },
        input: {
          type: inputTypes[relationship.target].optional,
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
      type: new GraphQLInputObjectType({
        name: `${defName}${capitalize(key)}${capitalize(relationship.type)}Input`,
        fields: fld,
      }),
    };
    return o;
  }, def);
}

export default function createMutationInput(instance, defName, schemaCache, inputTypes) {
  const fields = instance.getFields(defName);
  const relationships = instance.getRelationships(defName);
  const definition = instance.getDefinition(defName);
  schemaCache.mutationInputFields[defName] = {};
  const required = new GraphQLInputObjectType({
    name: `${defName}RequiredInput`,
    fields() {
      if(schemaCache.mutationInputFields[defName].req) {
        return schemaCache.mutationInputFields[defName].req;
      }
      const f = generateInputFields(instance, defName, definition, fields, relationships, inputTypes, false);
      schemaCache.mutationInputFields[defName].req = f;
      //(instance, defName, definition, fields, relationships, inputTypes, forceOptional
      return f;
    },
  });
  const optional = new GraphQLInputObjectType({
    name: `${defName}OptionalInput`,
    fields() {
      if(schemaCache.mutationInputFields[defName].opt) {
        return schemaCache.mutationInputFields[defName].opt;
      }
      const f = generateInputFields(instance, defName, definition, fields, relationships, inputTypes, true);
      schemaCache.mutationInputFields[defName].opt = f;
      return f;
    },
  });
  const filterType = instance.getFilterGraphQLType(defName);
  return {
    required, optional,
    create: new GraphQLList(required),
    update: new GraphQLList(optional),
    delete: new GraphQLList(filterType),
  };
}
