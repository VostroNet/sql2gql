
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLList,
  // GraphQLString,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLBoolean,
} from "graphql";
import {
  resolver,
  defaultListArgs,
  defaultArgs,
  attributeFields,
  // typeMapper,
} from "graphql-sequelize";

function resetInterfaces(impl) {
  delete impl._interfaces; //eslint-disable-line
  impl.getInterfaces().forEach(type => {
    type._implementations.push(impl); //eslint-disable-line
  });
}

function createBaseType(modelName, models, options) {
  let opts = options[modelName] || {};
  let fields = attributeFields(models[modelName], {
    exclude: opts.ignoreFields || [],
  });
  let resolve;
  if (opts.resolver) {
    resolve = opts.resolver;
  } else {
    resolve = resolver(models[modelName], {
      before: opts.before,
      after: opts.after,
    });
  }
  return new GraphQLObjectType({
    name: modelName,
    description: "",
    fields: fields,
    resolve: resolve,
  });
}
function createBeforeAfter(modelOpts, options) {
  let targetBeforeFuncs = [], targetAfterFuncs = [];
  if (options.before) {
    targetBeforeFuncs.push(options.before);
  }
  if (options.after) {
    targetAfterFuncs.push(options.after);
  }
  if (modelOpts) {
    if (modelOpts.before) {
      targetBeforeFuncs.push(modelOpts.before);
    }
    if (modelOpts.after) {
      targetAfterFuncs.push(modelOpts.after);
    }
  }
  const targetBefore = (findOptions, args, context, info) => {
    if (targetBeforeFuncs.length === 0) {
      return findOptions;
    }
    const results = targetBeforeFuncs.reduce((prev, curr) => {
      return curr(prev, args, context, info);
    }, findOptions);
    return results;
  };
  const targetAfter = (result, args, context, info) => {
    if (targetAfterFuncs.length === 0) {
      return result;
    }
    return targetAfter.reduce((prev, curr) => {
      return curr(prev, args, context, info);
    }, result);
  };
  const targetAfterArray = (results, args, context, info) => {
    if (targetAfterFuncs.length === 0) {
      return results;
    }
    return results.map((result) => {
      return targetAfter(result, args, context, info);
    });
  };


  return {
    before: targetBefore,
    after: targetAfter,
    afterList: targetAfterArray,
  };
}

async function generateTypes(models, keys, options = {}) {
  let typeCollection = {};
  await Promise.all(keys.map(async(modelName) => {
    if (options.permission) {
      if (options.permission.model) {
        const result = await options.permission.model(modelName, options.permission.options);
        if (!result) {
          return;
        }
      }
    }
    typeCollection[modelName] = await createBaseType(modelName, models, options);
    typeCollection[modelName].model = models[modelName];
  }));
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
        let targetOpts = options[relationship.source];
        if (!targetType) {
          //target does not exist.. excluded from base types?
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
        const {before, after, afterList} = createBeforeAfter(targetOpts, options);
        if (!targetType) {
          throw `targetType ${targetType} not defined for relationship`;
        }
        switch (relationship.type) {
          case "belongsToMany": //eslint-disable-line
          case "hasMany":
            fields[relName] = {
              type: new GraphQLList(targetType),
              args: defaultListArgs(),
              resolve: resolver(relationship.rel, {
                before,
                after: afterList,
              }),
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
  return typeCollection;

}

async function createQueryLists(models, modelNames, typeCollection, fields, options) {
  await Promise.all(modelNames.map(async(modelName) => {
    if (typeCollection[modelName]) { //TODO: make this also a permission filter?
      if (options.permission) {
        if (options.permission.query) {
          const result = await options.permission.query(modelName, options.permission.options);
          if (!result) {
            return;
          }
        }
      }
      let targetOpts = options[modelName];
      const {before, after} = createBeforeAfter(targetOpts, options);
      fields[modelName] = {
        type: new GraphQLList(typeCollection[modelName]),
        args: defaultListArgs(),
        resolve: resolver(models[modelName], {
          before,
          after,
        }),
      };
    }
  }));
  return fields;
}


function createMutationInput(modelName, model, gqlFields, prefix, allOptional = false) {
  let fields = {};
  Object.keys(gqlFields).forEach((fieldName) => {
    const sqlFields = model.fieldRawAttributesMap;
    if (sqlFields[fieldName]) {
      if (!sqlFields[fieldName]._autoGenerated && !sqlFields[fieldName].autoIncrement) { //eslint-disable-line
        let gqlField = gqlFields[fieldName];
        if (allOptional) {
          if (gqlField.type instanceof GraphQLNonNull) {
            gqlField = {type: gqlField.type.ofType};
          }
        }
        fields[fieldName] = gqlField;
      }
    }
  });

  return new GraphQLInputObjectType({
    name: `${modelName}${prefix}Input`,
    fields,
  });
}

async function createMutationFunctions(models, keys, typeCollection, mutationCollection, options) {
  await Promise.all(keys.map(async(modelName) => {
    if (!typeCollection[modelName]) {
      return;
    }
    if (options.permission) {
      if (options.permission.mutation) {
        const result = await options.permission.mutation(modelName, options.permission.options);
        if (!result) {
          return;
        }
      }
    }
    let {fields} = typeCollection[modelName]._typeConfig; //eslint-disable-line
    let requiredInput = createMutationInput(modelName, models[modelName], fields, "Required");
    let optionalInput = createMutationInput(modelName, models[modelName], fields, "Optional", true);
    let mutationFields = {};
    let create = {
      type: typeCollection[modelName],
      args: {
        input: {
          type: requiredInput,
        },
      },
      resolve(_, args, req, info) {
        return models[modelName].create(args.input, {rootValue: {req, args}});
      },
    };
    let update = {
      type: typeCollection[modelName],
      args: Object.assign(defaultArgs(models[modelName]), {input: {type: optionalInput}}),
      resolve: resolver(models[modelName], {
        after: (item, args, req, gql) => {
          return item.update(args.input, {rootValue: {req, args}});
        },
      }),
    };
    let del = {
      type: GraphQLBoolean,
      args: defaultArgs(models[modelName]),
      resolve: resolver(models[modelName], {
        after: function(item, args, req, gql) {
          return item.destroy({rootValue: {req, args}})
            .then(() => true);
        },
      }),
    };
    let updateAll = {
      type: new GraphQLList(typeCollection[modelName]),
      args: Object.assign(defaultListArgs(models[modelName]), {input: {type: optionalInput}}),
      resolve: resolver(models[modelName], {
        after: (items, args, req, gql) => {
          return Promise.all(items.map((item) => item.update(args.input, {user: req.user})));
        },
      }),
    };
    let deleteAll = {
      type: new GraphQLList(GraphQLBoolean),
      args: defaultListArgs(models[modelName]),
      resolve: resolver(models[modelName], {
        after: function(items, args, req, gql) {
          return Promise.all(items.map((item) => item.destroy({user: req.user}).then(() => true))); //TODO: needs to return id with boolean value
        },
      }),
    };

    if (options.permission) {
      if (options.permission.mutationCreate) {
        const result = await options.permission.mutationCreate(modelName, options.permission.options);
        if (result) {
          mutationFields.create = create;
        }
      } else {
        mutationFields.create = create;
      }

      if (options.permission.mutationUpdate) {
        const result = await options.permission.mutationUpdate(modelName, options.permission.options);
        if (result) {
          mutationFields.update = update;
        }
      } else {
        mutationFields.update = update;
      }

      if (options.permission.mutationDelete) {
        const result = await options.permission.mutationDelete(modelName, options.permission.options);
        if (result) {
          mutationFields.delete = del;
        }
      } else {
        mutationFields.delete = del;
      }
      if (options.permission.mutationUpdateAll) {
        const result = await options.permission.mutationUpdateAll(modelName, options.permission.options);
        if (result) {
          mutationFields.updateAll = updateAll;
        }
      } else {
        mutationFields.updateAll = updateAll;
      }
      if (options.permission.mutationDeleteAll) {
        const result = await options.permission.mutationDeleteAll(modelName, options.permission.options);
        if (result) {
          mutationFields.deleteAll = deleteAll;
        }
      } else {
        mutationFields.deleteAll = deleteAll;
      }
    } else {
      mutationFields.create = create;
      mutationFields.update = update;
      mutationFields.delete = del;
      mutationFields.updateAll = updateAll;
      mutationFields.deleteAll = deleteAll;
    }

    const {mutations} = ((models[modelName].$gqlsql.expose || {}).classMethods || {});
    if (mutations) {
      await Promise.all(Object.keys(mutations).map(async(methodName) => {
        const {type, args} = mutations[methodName];
        if (options.permission) {
          if (options.permission.mutationClassMethods) {
            const result = await options.permission.mutationClassMethods(modelName, methodName, options.permission.options);
            if (!result) {
              return;
            }
          }
        }
        let outputType = (type instanceof String || typeof type === "string") ? typeCollection[type] : type;
        mutationFields[methodName] = {
          type: outputType,
          args,
          resolve(item, args, req, gql) {
            return models[modelName][methodName].apply(models[modelName], [args, req]);
          },
        };
        // }
      }));
    }
    if (Object.keys(mutationFields).length > 0) {
      mutationCollection[modelName] = {
        type: new GraphQLObjectType({
          name: `${modelName}Mutator`,
          fields: mutationFields,
        }),
        resolve() {
          return {}; // forces graphql to resolve the fields
        },
      };
    }
  }));
  return mutationCollection;
}

async function createQueryFunctions(models, keys, typeCollection, options) {
  let queryCollection = {};
  await Promise.all(keys.map(async(modelName) => {
    if (!typeCollection[modelName]) {
      return;
    }
    let {fields} = typeCollection[modelName]._typeConfig; //eslint-disable-line
    const {query} = ((models[modelName].$gqlsql.expose || {}).classMethods || {});
    let queryFields = {};
    if (query) {
      await Promise.all(Object.keys(query).map(async(methodName) => {
        if (options.permission) {
          if (options.permission.queryClassMethods) {
            const result = await options.permission.queryClassMethods(modelName, methodName, options.permission.options);
            if (!result) {
              return;
            }
          }
        }
        const {type, args} = query[methodName];
        let outputType = (type instanceof String || typeof type === "string") ? typeCollection[type] : type;
        queryFields[methodName] = {
          type: outputType,
          args,
          resolve(item, args, req, gql) {
            return models[modelName][methodName].apply(models[modelName], [args, req]);
          },
        };
        // console.log("test", queryFields[methodName]);
      }));
      if (Object.keys(queryFields).length > 0) {
        queryCollection[modelName] = {
          type: new GraphQLObjectType({
            name: `${modelName}Query`,
            fields: queryFields,
          }),
          resolve() {
            return {}; // forces graphql to resolve the fields
          },
        };
      }
    }
  }));
  return queryCollection;
}

export default async function createSchema(instance, options = {}) {
  const {query, mutations} = options;
  let validKeys = Object.keys(instance.models).reduce((o, key) => {
    if (instance.models[key].$gqlsql) {
      // o[key] = instance.models[key];
      o.push(key);
    }
    return o;
  }, []);
  let typeCollection = await generateTypes(instance.models, validKeys, options);
  let mutationCollection = await createMutationFunctions(instance.models, validKeys, typeCollection, {}, options);
  let classMethodQueries = await createQueryFunctions(instance.models, validKeys, typeCollection, options);
  let modelQueries = await createQueryLists(instance.models, validKeys, typeCollection, {}, options);
  let queryRootFields = Object.assign({}, query);
  if (Object.keys(modelQueries).length > 0) {
    queryRootFields.models = {
      type: new GraphQLObjectType({name: "QueryModels", fields: modelQueries}),
      resolve() {
        return {};
      },
    };
  }
  if (Object.keys(classMethodQueries).length > 0) {
    queryRootFields.classMethods = {
      type: new GraphQLObjectType({name: "ClassMethods", fields: classMethodQueries}),
      resolve() {
        return {};
      },
    };
  }
  let mutationRootFields = Object.assign({}, mutations);

  if (Object.keys(mutationCollection).length > 0) {
    mutationRootFields.models = {
      type: new GraphQLObjectType({name: "MutationModels", fields: mutationCollection}),
      resolve() {
        return {};
      },
    };
  }
  return new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "RootQuery",
      fields: queryRootFields,
    }),
    mutation: new GraphQLObjectType({
      name: "Mutation",
      fields: mutationRootFields,
    }),
  });
}
