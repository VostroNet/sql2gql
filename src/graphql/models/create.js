import {
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLID,
  GraphQLInt,
  GraphQLInputObjectType,
  GraphQLBoolean,
} from "graphql";
import {
  resolver,
  attributeFields,
  JSONType,
  relay,
} from "graphql-sequelize";
import getModelDefinition from "../utils/get-model-def";
import createBeforeAfter from "./create-before-after";
import processFK from "../utils/process-fk";
import {toGlobalId} from "graphql-relay/lib/node/node";
import {getForeignKeysForModel} from "../utils/models";
import {replaceWhereOperators} from "graphql-sequelize/lib/replaceWhereOperators";

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
        return undefined;
      }
    }
  }
  const model = models[modelName];

  const {before, after} = createBeforeAfter(models[modelName], options); //eslint-disable-line
  const modelDefinition = getModelDefinition(model);

  function basicFields() {
    if (typeCollection[`${modelName}`].$sql2gql.fields.basic) {
      return typeCollection[`${modelName}`].$sql2gql.fields.basic;
    }
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
    const foreignKeys = getForeignKeysForModel(model);
    if (foreignKeys.length > 0) {
      foreignKeys.forEach((fk) => {
        if (!fieldDefinitions[fk]) {
          return;
        }
        const attr = model.fieldRawAttributesMap[fk];
        fieldDefinitions[fk] = {
          // description: 'The ID of an object',
          type: attr.allowNull ? GraphQLID : new GraphQLNonNull(GraphQLID),
          resolve: createForeignKeyResolver(attr.Model.name, fk),
        };
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
    typeCollection[`${modelName}`].$sql2gql.fields.basic = fieldDefinitions;
    return fieldDefinitions;
  }
  function relatedFields() {
    if (typeCollection[`${modelName}`].$sql2gql.fields.related) {
      return typeCollection[`${modelName}`].$sql2gql.fields.related;
    }
    let fieldDefinitions = {};
    if (models[modelName].relationships) {
      if (typeCollection[modelName]) {
        Object.keys(models[modelName].relationships).forEach((relName) => {
          let relationship = models[modelName].relationships[relName];
          let targetType = typeCollection[relationship.source];
          const model = models[modelName];
          const assoc = model.associations[relName];
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
          if (!targetType) {
            throw `targetType ${targetType} not defined for relationship`;
          }
          const modelDefinition = getModelDefinition(models[targetType.name]);

          //TODO change this to read the complex and basic fields, this goes around permissions
          // const orderByValues = Object.keys(modelDefinition.define).reduce((obj, field) => {
          //   return Object.assign({}, obj, {
          //     [`${field}Asc`]: {value: [field, "ASC"]},
          //     [`${field}Desc`]: {value: [field, "DESC"]},
          //   });
          // }, {
          //   idAsc: {value: ["id", "ASC"]},
          //   idDesc: {value: ["id", "DESC"]},
          //   createdAtAsc: {value: ["createdAt", "ASC"]},
          //   createdAtDesc: {value: ["createdAt", "DESC"]},
          //   updatedAtAsc: {value: ["updatedAt", "ASC"]},
          //   updatedAtDesc: {value: ["updatedAt", "DESC"]},
          // });
          const {basic} = typeCollection[modelName].$sql2gql.fields;

          const values = Object.keys(basic).reduce((o, key) => {
            o[`${key}ASC`] = {
              value: [key, "ASC"],
            };
            o[`${key}DESC`] = {
              value: [key, "DESC"],
            };
            return o;
          }, {});

          const relationMap = modelDefinition.relationships.reduce((o, r) => {
            o[r.name] = r.model;
            return o;
          }, {});
          let include;
          if (modelDefinition.relationships.length > 0) {
            include = new GraphQLList(new GraphQLInputObjectType({
              name: `${modelName}${relName}Include`,
              fields() {
                const relatedFields = typeCollection[targetType.name].$sql2gql.relatedFields();
                const complexKeys = Object.keys(relatedFields);
                if (complexKeys.length === 0) {
                  return undefined;
                }
                return {
                  relName: {
                    type: new GraphQLEnumType({
                      name: `${modelName}${relName}IncludeEnum`,
                      values: Object.keys(relatedFields).reduce((o, k) => {
                        o[k] = {value: k};
                        return o;
                      }, {}),
                    }),
                  },
                  where: {
                    type: JSONType.default,
                  },
                  required: {
                    type: GraphQLBoolean,
                  }
                };
              },
            }));
          }

          let conn = sequelizeConnection({
            name: `${modelName}${relName}`,
            nodeType: targetType,
            target: relationship.rel,
            connectionFields: {
              total: {
                type: GraphQLInt,
                async resolve({source}, args, context, info) {
                  return source[assoc.accessors.count].apply(source, [{where: args.where, context, info}]);
                },
              },
            },
            orderBy: new GraphQLEnumType({
              name: `${modelName}${relName}OrderBy`,
              values: Object.assign({}, values, modelDefinition.orderBy),
            }),
            where: (key, value, currentWhere) => {
              // for custom args other than connectionArgs return a sequelize where parameter
              if (key === "include") {
                return currentWhere;
              }
              if (key === "where") {
                return value;
              }
              return {[key]: value};
            },
            async before(findOptions, args, context, info) {
              const options = await before(findOptions, args, context, info);
              const {source} = info;
              if (options.dataloader) {
                findOptions = Object.assign(findOptions, options.dataloader);
              }
              const fk = source.get(assoc.sourceKey);
              options.where = {
                $and: [{[assoc.foreignKey]: fk}, options.where],
              };
              if (args.include) {
                options.include = args.include.map((i) => {
                  const {relName, where, required} = i;
                  return {
                    as: relName,
                    model: models[relationMap[relName]],
                    where: (where) ? replaceWhereOperators(where) : undefined,
                    required,
                  };
                });
              }
              return options;
            },
            after,
          });
          let bc;
          switch (relationship.type) {
            case "belongsToMany": //eslint-disable-line
              bc = sequelizeConnection({
                name: `${modelName}${relName}`,
                nodeType: targetType,
                target: relationship.rel,
                connectionFields: {
                  total: {
                    type: GraphQLInt,
                    async resolve({source}, args, context, info) {
                      return source[assoc.accessors.count].apply(source, [{where: args.where, context, info}]);
                    },
                  },
                },
                where: (key, value, currentWhere) => {
                  if (key === "include") {
                    return currentWhere;
                  }
                  if (key === "where") {
                    return value;
                  }
                  return {[key]: value};
                },
                before(findOptions, args, context, info) {
                  const model = models[modelName];
                  const assoc = model.associations[relName];
                  if (options.dataloader) {
                    findOptions = Object.assign(findOptions, options.dataloader);
                  }
                  if (!findOptions.include) {
                    findOptions.include = [];
                  }
                  let inc;
                  if (args.include) {
                    inc = args.include.map((i) => {
                      const {relName, where, required} = i;
                      return {
                        as: relName,
                        model: models[relationMap[relName]],
                        where: (where) ? replaceWhereOperators(where) : undefined,
                        required,
                      };
                    });
                  }
                  if (!assoc.paired) {
                    throw new Error(`${modelName} ${relName} .paired missing on belongsToMany association. You need to set up both sides of the association`);
                  }
                  let b2mInc = {
                    model: assoc.source,
                    as: assoc.paired.as,
                  };
                  if (inc) {
                    b2mInc.include = inc;
                  }
                  findOptions.include.push(b2mInc);
                  if (findOptions.where) {
                    findOptions.where = replaceWhereOperators(findOptions.where);
                  }
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

          if (include && fieldDefinitions[relName].args) {
            fieldDefinitions[relName].args.include = {type: include};
          }
        });
      }
    }
    return fieldDefinitions;
  }
  function complexFields() {
    if (typeCollection[`${modelName}`].$sql2gql.fields.complex) {
      return typeCollection[`${modelName}`].$sql2gql.fields.complex;
    }
    let fieldDefinitions = {};
    if (((modelDefinition.expose || {}).instanceMethods || {}).query) {
      const instanceMethods = modelDefinition.expose.instanceMethods.query;
      Object.keys(instanceMethods).forEach((methodName) => {
        const {type, args} = instanceMethods[methodName];
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
          async resolve(source, args, context, info) {
            return processFK(targetType, source[methodName], source, args, context, info);
          },
        };
      });
    }
    typeCollection[`${modelName}`].$sql2gql.fields.complex = fieldDefinitions;
    return fieldDefinitions;
  }
  const obj = new GraphQLObjectType({
    name: `${prefix}${modelName}`,
    description: "",
    fields() {
      return Object.assign({}, basicFields(), relatedFields(), complexFields());
    },
    interfaces: [nodeInterface],
  });
  obj.$sql2gql = {
    basicFields: basicFields,
    complexFields: complexFields,
    relatedFields: relatedFields,
    fields: {},
    events: {before, after}
  };

  typeCollection[`${modelName}[]`] = new GraphQLList(obj);
  return obj;
}

function createForeignKeyResolver(name, primaryKeyAttribute) {
  return function resolve(instance, args, context, info) {
    if (instance[primaryKeyAttribute]) {
      return toGlobalId(name, instance[primaryKeyAttribute]);
    }
    return instance[primaryKeyAttribute];
  };
}
