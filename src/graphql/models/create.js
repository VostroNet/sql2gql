import {
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLList,
} from "graphql";
import {
  resolver,
  attributeFields,
  JSONType,
  relay,
} from "graphql-sequelize";
import getModelDefinition from "../utils/get-model-def";
import createBeforeAfter from "./create-before-after";
import { toGlobalId } from "graphql-relay/lib/node/node";

const {sequelizeConnection} =  relay;

export default async function createModelTypes(models, keys, prefix = "", options, nodeInterface) {
  const result = await keys.reduce((promise, modelName) => {
    return promise.then(async(o) => {
      o[modelName] = await createModelType(modelName, models, prefix, options, nodeInterface, o);
      return o;
    });
  }, Promise.resolve({}));
  return result;
}

async function createModelType(modelName, models, prefix = "", options = {}, nodeInterface, typeCollection) {
  if (options.permission) {
    if (options.permission.model) {
      const result = await options.permission.model(modelName);
      if (!result) {
        // console.log("exluding", modelName);
        return undefined;
      }
    }
  }
  const model = models[modelName];
  const modelDefinition = getModelDefinition(model);
  let resolve;
  if (modelDefinition.resolver) {
    resolve = modelDefinition.resolver;
  } else {
    const {
      before,
      after,
    } = createBeforeAfter(model, options);
    resolve = resolver(model, {
      before,
      after,
    });
  }
  function basicFields() {
    let exclude = Object.keys(modelDefinition.override || {})
      .concat(modelDefinition.ignoreFields || []);
    if (options.permission) {
      if (options.permission.field) {
        exclude = exclude.concat(Object.keys(model.rawAttributes).filter((keyName) => !options.permission.field(modelName, keyName)));
      }
    }
    let fieldDefinitions = attributeFields(model, {
      exclude,
      globalId: true, //TODO: need to add check for primaryKey field as exclude ignores it if this is true.
    });
    const foreignKeys = Object.keys(model.fieldRawAttributesMap).filter(k => {
      return !(!model.fieldRawAttributesMap[k].references);
    });
    if (foreignKeys.length > 0) {
      foreignKeys.forEach((fk) => {
        if (!fieldDefinitions[fk]) {
          return;
        }
        if (model.fieldRawAttributesMap[fk].allowNull) {
          fieldDefinitions[fk].type = GraphQLString;
        } else {
          fieldDefinitions[fk].type = new GraphQLNonNull(GraphQLString);
        }
      });
    }
    if (modelDefinition.override) {
      Object.keys(modelDefinition.override).forEach((fieldName) => {
        if (options.permission) {
          if (options.permission.field) {
            if (!options.permission.field(modelName, fieldName)) {
              return;
            }
          }
        }
        const fieldDefinition = modelDefinition.define[fieldName];
        if (!fieldDefinition) {
          throw new Error(`Unable to find the field definition for ${modelName}->${fieldName}. Please check your model definition for invalid configuration.`);
        }
        const overrideFieldDefinition = modelDefinition.override[fieldName];
        let type;
        if (!(overrideFieldDefinition.type instanceof GraphQLObjectType) &&
          !(overrideFieldDefinition.type instanceof GraphQLScalarType) &&
          !(overrideFieldDefinition.type instanceof GraphQLEnumType)) {
          type = new GraphQLObjectType(overrideFieldDefinition.type);
        } else {
          type = overrideFieldDefinition.type;
        }
        if (!fieldDefinition.allowNull) {
          type = new GraphQLNonNull(type);
        }
        fieldDefinitions[fieldName] = {
          type,
          resolve: overrideFieldDefinition.output,
        };
      });
    }
    return fieldDefinitions;
  }
  function complexFields() {
    let fieldDefinitions = {};
    if (models[modelName].relationships) {
      if (typeCollection[modelName]) {
        Object.keys(models[modelName].relationships).forEach((relName) => {
          let relationship = models[modelName].relationships[relName];
          let targetType = typeCollection[relationship.source];
          // let mutationFunction = mutationFunctions[relationship.source];
          if (!targetType) {
            return;
          }
          if (options.permission) {
            if (options.permission.relationship) {
              const result = options.permission.relationship(modelName, relName, relationship.source, options.permission.options); //TODO move this outside to resolve via promise
              if (!result) {
                return;
              }
            }
          }
          const {before, after, afterList} = createBeforeAfter(models[modelName], options); //eslint-disable-line
          if (!targetType) {
            throw `targetType ${targetType} not defined for relationship`;
          }
          const modelDefinition = getModelDefinition(models[targetType.name]);
          const orderByValues = Object.keys(modelDefinition.define).reduce((obj, field) => {
            return Object.assign({}, obj, {
              [`${field}Asc`]: {value: [field, "ASC"]},
              [`${field}Desc`]: {value: [field, "DESC"]},
            });
          }, {
            idAsc: {value: ["id", "ASC"]},
            idDesc: {value: ["id", "DESC"]},
            createdAtAsc: {value: ["createdAt", "ASC"]},
            createdAtDesc: {value: ["createdAt", "DESC"]},
            updatedAtAsc: {value: ["updatedAt", "ASC"]},
            updatedAtDesc: {value: ["updatedAt", "DESC"]},
          });
          let conn = sequelizeConnection({
            name: `${modelName}${relName}`,
            nodeType: targetType,
            target: relationship.rel,
            orderBy: new GraphQLEnumType({
              name: `${modelName}${relName}OrderBy`,
              values: orderByValues,
            }),
            // edgeFields: def.edgeFields,
            // connectionFields: def.connectionFields,
            where: (key, value, currentWhere) => {
              // for custom args other than connectionArgs return a sequelize where parameter
              if (key === "where") {
                return value;
              }
              return {[key]: value};
            },
            async before(findOptions, args, context, info) {
              const options = await before(findOptions, args, context, info);
              const {source} = info;
              const model = models[modelName];
              const assoc = model.associations[relName];
              options.where = {
                $and: [{[assoc.foreignKey]: source.get(assoc.sourceKey)}, options.where],
              };
              return options;
            },
            after(result, args, context, info) {
              result.edges.forEach((e) => {
                const fk = relationship.rel.foreignKeyField;
                const globalId = toGlobalId(relationship.target, e.node.get(fk));
                e.node.set(fk, globalId);
              });
              return after(result, args, context, info);
            },
          });
          let bc;
          switch (relationship.type) {
            case "belongsToMany": //eslint-disable-line
              bc = sequelizeConnection({
                name: `${modelName}${relName}`,
                nodeType: targetType,
                target: relationship.rel,
                where: (key, value, currentWhere) => {
                  if (key === "where") {
                    return value;
                  }
                  return {[key]: value};
                },
                before(findOptions, args, context, info) {
                  // const {source} = info;
                  const model = models[modelName];
                  const assoc = model.associations[relName];
                  if (!findOptions.include) {
                    findOptions.include = [];
                  }
                  findOptions.include.push({
                    model: assoc.source,
                    as: assoc.paired.as,
                  });
                  return before(findOptions, args, context, info);
                }, after,
              });
              fieldDefinitions[relName] = {
                type: bc.connectionType,
                args: {
                  ...bc.connectionArgs,
                  where: {
                    type: JSONType.default,
                  },
                },
                resolve: bc.resolve,
              };
              break;
            case "hasMany":
              fieldDefinitions[relName] = {
                type: conn.connectionType,
                args: {
                  ...conn.connectionArgs,
                  where: {
                    type: JSONType.default,
                  },
                },
                resolve: conn.resolve,
              };
              break;
            case "hasOne": //eslint-disable-line
            case "belongsTo":
              fieldDefinitions[relName] = {
                type: targetType,
                resolve: resolver(relationship.rel, {
                  before,
                  after,
                }),
              };
              break;
            default:
              throw "Unhandled Relationship type";
          }
        });
      }
    }
    if (((modelDefinition.expose || {}).instanceMethods || {}).query) {
      const instanceMethods = modelDefinition.expose.instanceMethods.query;
      Object.keys(instanceMethods).forEach((methodName) => {
        const {type, args} = instanceMethods[methodName];
        // const {type, args} = instanceMethod;
        let targetType = (type instanceof String || typeof type === "string") ? typeCollection[type] : type;
        if (!targetType) {
          //target does not exist.. excluded from base types?
          return;
        }
        if (options.permission) {
          if (options.permission.queryInstanceMethods) {
            const result = options.permission.queryInstanceMethods(modelName, methodName, options.permission.options);
            if (!result) {
              return;
            }
          }
        }
        fieldDefinitions[methodName] = {
          type: targetType,
          args,
          resolve: (source, args, context, info) => {
            return source[methodName].apply(source, [args, context, info]);
          },
        };
      });
    }
    return fieldDefinitions;
  }
  const obj = new GraphQLObjectType({
    name: `${prefix}${modelName}`,
    description: "",
    fields() {
      return Object.assign({}, basicFields(), complexFields());
    },
    resolve,
    interfaces: [nodeInterface],
  });
  obj.basicFields = basicFields;
  obj.complexFields = complexFields;
  typeCollection[`${modelName}[]`] = new GraphQLList(obj);
  return obj;
}
