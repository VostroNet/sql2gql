import {
  GraphQLList,
  GraphQLEnumType,
} from "graphql";
import {
  resolver,
  JSONType,
  relay,
} from "graphql-sequelize";

const {sequelizeConnection} =  relay;

// import createBaseModel from "./create-base";
import createBeforeAfter from "./create-before-after";
import resetInterfaces from "../utils/reset-interfaces";
import getModelDefinition from "../utils/get-model-def";

// const orderBy = new GraphQLEnumType({
//   name: "GeneralOrderBy",
//   values: {
//     ID: {value: ["id", "DESC"]}
//   },
// });

export default async function createComplexModels(models, keys, typeCollection, mutationFunctions, options = {}) {

  await Promise.all(keys.map(async(modelName) => {
    if (models[modelName].relationships) {
      if (!typeCollection[modelName]) {
        //target does not exist.. excluded from base types?
        return;
      }
      let {fields} = typeCollection[modelName]._typeConfig; //eslint-disable-line
      await Promise.all(Object.keys(models[modelName].relationships).map(async(relName) => {
        let relationship = models[modelName].relationships[relName];
        let targetType = typeCollection[relationship.source];
        // let mutationFunction = mutationFunctions[relationship.source];
        if (!targetType) {
          return;
        }
        if (options.permission) {
          if (options.permission.relationship) {
            const result = await options.permission.relationship(modelName, relName, relationship.source, options.permission.options);
            if (!result) {
              return;
            }
          }
        }
        const {before, after, afterList} = createBeforeAfter(models[modelName], options); //eslint-disable-line
        if (!targetType) {
          throw `targetType ${targetType} not defined for relationship`;
        }
        switch (relationship.type) {
          case "belongsToMany": //eslint-disable-line
            const bc = sequelizeConnection({
              name: `${modelName}${relName}`,
              nodeType: targetType,
              target: relationship.rel,
              // orderBy: def.orderBy,
              // edgeFields: def.edgeFields,
              // connectionFields: def.connectionFields,
              where: (key, value, currentWhere) => {
                // for custom args other than connectionArgs return a sequelize where parameter
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
            fields[relName] = {
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
            // let manyArgs = defaultListArgs();
            // if (options.version === 3 || options.compat === 3) {
            //   manyArgs = Object.assign({returnActionResults: {type: GraphQLBoolean}}, manyArgs, (mutationFunction || {}).fields);
            // }

            const modelDefinition = getModelDefinition(models[targetType.name]);
            const c = sequelizeConnection({
              name: `${modelName}${relName}`,
              nodeType: targetType,
              target: relationship.rel,
              orderBy: new GraphQLEnumType({
                name: `${modelName}${relName}OrderBy`,
                values: Object.keys(modelDefinition.define).reduce((obj, field) => {
                  return Object.assign({}, obj, {
                    [`${field}Asc`]: {value: [field, "ASC"]},
                    [`${field}Desc`]: {value: [field, "DESC"]},
                  });
                }, {
                  idAsc: {value: ["id", "ASC"]},
                  idDesc: {value: ["id", "DESC"]},
                }),
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
              before(findOptions, args, context, info) {
                const {source} = info;
                const model = models[modelName];
                const assoc = model.associations[relName];
                findOptions.where = {
                  $and: [{[assoc.foreignKey]: source.get(assoc.sourceKey)}],
                };
                return before(findOptions, args, context, info);
              }, after,
            });
            fields[relName] = {
              type: c.connectionType,
              args: {
                ...c.connectionArgs,
                where: {
                  type: JSONType.default,
                },
              },
              resolve: c.resolve,
            };
            break;
          case "hasOne": //eslint-disable-line
          case "belongsTo":
            fields[relName] = {
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
      }));
      typeCollection[modelName]._typeConfig.fields = fields;//eslint-disable-line
      resetInterfaces(typeCollection[modelName]);
    }
  }));
  keys.forEach((modelName) => {
    if (typeCollection[modelName]) {
      typeCollection[`${modelName}[]`] = new GraphQLList(typeCollection[modelName]);
    }
  });
  await Promise.all(keys.map(async(modelName) => {

    if (!typeCollection[modelName]) {
      //target does not exist.. excluded from base types?
      return;
    }

    const modelDefinition = getModelDefinition(models[modelName]);
    // console.log("found instance methods", {modelName, expose: modelDefinition.expose} );
    if (((modelDefinition.expose || {}).instanceMethods || {}).query) {
      const instanceMethods = modelDefinition.expose.instanceMethods.query;
      // console.log("found instance methods", instanceMethods);
      let {fields} = typeCollection[modelName]._typeConfig; //eslint-disable-line
      await Promise.all(Object.keys(instanceMethods).map(async(methodName) => {
        const methodDefinition = instanceMethods[methodName];
        const {type, args} = methodDefinition;
        let targetType = (type instanceof String || typeof type === "string") ? typeCollection[type] : type;
        if (!targetType) {
          //target does not exist.. excluded from base types?
          return;
        }
        if (options.permission) {
          if (options.permission.queryInstanceMethods) {
            const result = await options.permission.queryInstanceMethods(modelName, methodName, options.permission.options);
            if (!result) {
              return;
            }
          }
        }
        fields[methodName] = {
          type: targetType,
          args,
          resolve: (source, args, context, info) => {
            return source[methodName].apply(source, [args, context, info]);
          },
        };
      }));
      typeCollection[modelName]._typeConfig.fields = fields;//eslint-disable-line
      resetInterfaces(typeCollection[modelName]);
    }
  }));
  return typeCollection;
}
