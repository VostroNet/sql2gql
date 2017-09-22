
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLEnumType,
  GraphQLList,
  GraphQLInputObjectType,
  GraphQLNonNull,
} from "graphql";

import {
  resolver,
  defaultListArgs,
  defaultArgs,
  attributeFields,
  // typeMapper,
} from "graphql-sequelize";

export const events = {
  "QUERY": 1,
  "MUTATION_CREATE": 2,
  "MUTATION_UPDATE": 3,
  "MUTATION_DELETE": 4,
};

export function getModelDefinition(model) {
  return model.$sqlgql;
}

export function resetInterfaces(impl) {
  delete impl._interfaces; //eslint-disable-line
  impl.getInterfaces().forEach(type => {
    type._implementations.push(impl); //eslint-disable-line
  });
}

export function createBaseType(modelName, models, options = {}) {
  const model = models[modelName];
  const modelDefinition = getModelDefinition(model);
  let exclude = Object.keys(modelDefinition.override || {})
    .concat(modelDefinition.ignoreFields || []);
  if (options.permission) {
    if (options.permission.field) {
      exclude = exclude.concat(Object.keys(model.rawAttributes).filter((keyName) => !options.permission.field(modelName, keyName)));
    }
  }

  let fields = attributeFields(model, {
    exclude,
  });
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
      fields[fieldName] = {
        type,
        resolve: overrideFieldDefinition.output,
      };
    });
  }
  let resolve;
  if (modelDefinition.resolver) {
    resolve = modelDefinition.resolver;
  } else {
    const {before, after} = createBeforeAfter(model, options);
    resolve = resolver(model, {before, after});
  }
  return new GraphQLObjectType({
    name: modelName,
    description: "",
    fields: fields,
    resolve: resolve,
  });
}
export function createBeforeAfter(model, options, hooks = {}) {
  let targetBeforeFuncs = [], targetAfterFuncs = [];
  if (hooks.after) {
    targetAfterFuncs = targetAfterFuncs.concat(hooks.after);
  }
  const modelDefinition = getModelDefinition(model);
  if (options.before) {
    targetBeforeFuncs.push(function(params, args, context, info) {
      return options.before({
        params, args, context, info,
        modelDefinition,
        type: events.QUERY,
      });
    });
  }
  if (options.after) {
    targetAfterFuncs.push(function(result, args, context, info) {
      return options.after({
        result, args, context, info,
        modelDefinition,
        type: events.QUERY,
      });
    });
  }
  if (modelDefinition.before) {
    targetBeforeFuncs.push(function(params, args, context, info) {
      return modelDefinition.before({
        params, args, context, info,
        modelDefinition,
        type: events.QUERY,
      });
    });
  }
  if (modelDefinition.after) {
    targetAfterFuncs.push(function(result, args, context, info) {
      return modelDefinition.after({
        result, args, context, info,
        modelDefinition: modelDefinition,
        type: events.QUERY,
      });
    });
  }
  if (hooks.before) {
    targetBeforeFuncs = targetBeforeFuncs.concat(hooks.before);
  }
  const targetBefore = (findOptions, args, context, info) => {
    // console.log("weee", {context, rootValue: info.rootValue})
    findOptions.context = context;
    findOptions.rootValue = info.rootValue;
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
    return targetAfterFuncs.reduce((prev, curr) => {
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

export async function generateTypes(models, keys, options = {}) {
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
        // let targetOpts = options[relationship.source];
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
        const {before, after, afterList} = createBeforeAfter(models[modelName], options);
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

export async function createQueryLists(models, modelNames, typeCollection, options, fields = {}) {
  await Promise.all(modelNames.map(async(modelName) => {
    if (typeCollection[modelName]) {
      if (options.permission) {
        if (options.permission.query) {
          const result = await options.permission.query(modelName, options.permission.options);
          if (!result) {
            return;
          }
        }
      }
      // let targetOpts = options[modelName];
      const {before, after} = createBeforeAfter(models[modelName], options);
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


export function createMutationInput(modelName, model, gqlFields, prefix, allOptional = false) {
  const modelDefinition = getModelDefinition(model);
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
        if (modelDefinition.override) {
          const overrideFieldDefinition = modelDefinition.override[fieldName];

          if (overrideFieldDefinition) {
            const fieldDefinition = modelDefinition.define[fieldName];
            const allowNull = fieldDefinition.allowNull;
            const type = overrideFieldDefinition.inputType || overrideFieldDefinition.type;
            let name = type.name;
            if (!overrideFieldDefinition.inputType) {
              name += "Input";
            }
            if (allOptional) {
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

            if (allowNull || allOptional) {
              gqlField = {type: inputType};
            } else {
              gqlField = {type: new GraphQLNonNull(inputType)};
            }

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

export async function createMutationFunctions(models, keys, typeCollection, mutationCollection, options) {
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


    const modelDefinition = getModelDefinition(models[modelName]);
    const createFunc = async(_, args, context, info) => {
      let input = args.input;
      if (modelDefinition.override) {
        input = Object.keys(modelDefinition.override).reduce((data, fieldName) => {
          if (modelDefinition.override[fieldName].input) {
            data[fieldName] = modelDefinition.override[fieldName].input(data[fieldName], args, context, info);
          }
          return data;
        }, input);
      }
      if (modelDefinition.before) {
        input = await modelDefinition.before({
          params: input, args, context, info,
          modelDefinition,
          type: events.MUTATION_CREATE,
        });
      }
      let model = await models[modelName].create(input, {context, rootValue: Object.assign({}, info.rootValue, {args})});
      if (modelDefinition.after) {
        return await modelDefinition.after({
          result: model, args, context, info,
          modelDefinition,
          type: events.MUTATION_CREATE,
        });
      }
      return model;
    };
    let create = {
      type: typeCollection[modelName],
      args: {
        input: {
          type: requiredInput,
        },
      },
      resolve: createFunc,
    };
    const updateFunc = async(model, args, context, info) => {
      let input = args.input;
      if (modelDefinition.override) {
        input = Object.keys(modelDefinition.override).reduce((data, fieldName) => {
          if (modelDefinition.override[fieldName].input) {
            data[fieldName] = modelDefinition.override[fieldName].input(data[fieldName], args, context, info, model);
          }
          return data;
        }, input);
      }
      if (modelDefinition.before) {
        input = await modelDefinition.before({
          params: input, args, context, info,
          model, modelDefinition,
          type: events.MUTATION_UPDATE,
        });
      }
      model = await model.update(input, {context, rootValue: Object.assign({}, info.rootValue, {args})});
      if (modelDefinition.after) {
        return await modelDefinition.after({
          result: model, args, context, info,
          modelDefinition,
          type: events.MUTATION_UPDATE,
        });
      }
      return model;
    };
    const deleteFunc = async(model, args, context, info) => {
      if (modelDefinition.before) {
        model = await modelDefinition.before({
          params: model, args, context, info,
          model, modelDefinition,
          type: events.MUTATION_DELETE,
        });
      }
      await model.destroy({context, rootValue: Object.assign({}, info.rootValue, {args})});
      if (modelDefinition.after) {
        return await modelDefinition.after({
          result: model, args, context, info,
          modelDefinition,
          type: events.MUTATION_DELETE,
        });
      }
      return model;
    };

    // const {before, after, afterList} = createBeforeAfter(models[modelName], options, {after: [updateFunc]});
    const {before, after: afterUpdate, afterList: afterUpdateList} = createBeforeAfter(models[modelName], options, {after: [updateFunc]});
    const {after: afterDelete, afterList: afterDeleteList} = createBeforeAfter(models[modelName], options, {after: [deleteFunc]});
    let update = {
      type: typeCollection[modelName],
      args: Object.assign(defaultArgs(models[modelName]), {input: {type: optionalInput}}),
      resolve: resolver(models[modelName], {
        before: before,
        after: afterUpdate,
      }),
    };
    let del = {
      type: typeCollection[modelName],
      args: defaultArgs(models[modelName]),
      resolve: resolver(models[modelName], {
        before: before,
        after: afterDelete,
      }),
    };
    let updateAll = {
      type: new GraphQLList(typeCollection[modelName]),
      args: Object.assign(defaultListArgs(models[modelName]), {input: {type: optionalInput}}),
      resolve: resolver(models[modelName], {
        before: before,
        after: afterUpdateList,
      }),
    };
    let deleteAll = {
      type: new GraphQLList(typeCollection[modelName]),
      args: defaultListArgs(models[modelName]),
      resolve: resolver(models[modelName], {
        before: before,
        after: afterDeleteList,
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

    const {mutations} = ((getModelDefinition(models[modelName]).expose || {}).classMethods || {});
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
          resolve(item, args, context, gql) {
            return models[modelName][methodName].apply(models[modelName], [args, context]);
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

export async function createQueryFunctions(models, keys, typeCollection, options) {
  let queryCollection = {};
  await Promise.all(keys.map(async(modelName) => {
    if (!typeCollection[modelName]) {
      return;
    }
    let {fields} = typeCollection[modelName]._typeConfig; //eslint-disable-line
    const {query} = ((getModelDefinition(models[modelName]).expose || {}).classMethods || {});
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
        // console.log("OUTPUT TYPE", outputType);
        queryFields[methodName] = {
          type: outputType,
          args,
          resolve(item, args, context, gql) {
            return models[modelName][methodName].apply(models[modelName], [args, context]);
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


export async function createSubscriptionFunctions(pubsub, models, keys, typeCollection, options) {

  let subCollection = {};
  await Promise.all(keys.map(async(modelName) => {
    const model = models[modelName];
    const modelDefinition = getModelDefinition(model);
    const {subscriptions = {}, $subscriptions} = modelDefinition; //TODO expose subscriptions from model definition
    if ($subscriptions) {
      await Promise.all(Object.keys($subscriptions.names).map((hookName) => {
        if (options.permission) {
          if (options.permission.subscription) {
            if (!options.permission.subscription(modelName, hookName)) {
              return;
            }
          }
        }
        const subscriptionName = $subscriptions.names[hookName];
        subCollection[subscriptionName] = {
          type: typeCollection[modelName],
          resolve(item, args, context, gql) {
            const {instance, hookName} = (item || {})[subscriptionName];
            if (subscriptions[hookName]) {
              return subscriptions[hookName](instance, args, context, gql);
            }
            return instance;
          },
          subscribe() {
            return pubsub.asyncIterator(subscriptionName);
          },
        };
      }));
    }
  }));
  return subCollection;
}

export async function createSchema(sqlInstance, options = {}) {
  const {query, mutations, subscriptions, extend = {}} = options;
  let validKeys = Object.keys(sqlInstance.models).reduce((o, key) => {
    if (getModelDefinition(sqlInstance.models[key])) {
      o.push(key);
    }
    return o;
  }, []);
  let typeCollection = await generateTypes(sqlInstance.models, validKeys, options);
  let mutationCollection = await createMutationFunctions(sqlInstance.models, validKeys, typeCollection, {}, options);
  let classMethodQueries = await createQueryFunctions(sqlInstance.models, validKeys, typeCollection, options);
  let modelQueries = await createQueryLists(sqlInstance.models, validKeys, typeCollection, options);
  let queryRootFields = Object.assign({}, query);
  let rootSchema = {};
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
  if (Object.keys(queryRootFields).length > 0) {
    rootSchema.query = new GraphQLObjectType({
      name: "RootQuery",
      fields: queryRootFields,
    });
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
  if (Object.keys(mutationRootFields).length > 0) {
    rootSchema.mutation = new GraphQLObjectType({
      name: "Mutation",
      fields: mutationRootFields,
    });
  }

  let subscriptionRootFields = Object.assign({}, subscriptions);

  if ((sqlInstance.$sqlgql || {}).subscriptions) {
    const {pubsub} = (sqlInstance.$sqlgql || {}).subscriptions;
    subscriptionRootFields = await createSubscriptionFunctions(pubsub, sqlInstance.models, validKeys, typeCollection, options);
    if (Object.keys(subscriptionRootFields).length > 0) {
      rootSchema.subscription = new GraphQLObjectType({
        name: "Subscription",
        fields: subscriptionRootFields,
      });
    }
  }
  const schemaParams = Object.assign(rootSchema, extend);

  if (!schemaParams.query) {
    throw new Error("GraphQLSchema requires query to be set. Are your permissions settings to aggressive?");
  }
  const schema = new GraphQLSchema(schemaParams);
  schema.$sql2gql = {
    types: typeCollection,
  };
  return schema;
}
