
import {
  GraphQLList,
  GraphQLObjectType
} from "graphql";

import {
  resolver,
  defaultListArgs,
  defaultArgs,
} from "graphql-sequelize";

import createBeforeAfter from "../models/create-before-after";
import getModelDefinition from "../utils/get-model-def";
import events from "../events";
import createMutationInputs from "./create-input";

import {onCreate, onUpdate, onDelete} from "./mutation-functions";

export default async function createMutationFunctions(models, keys, typeCollection, mutationCollection, options) {
  const mutationInputTypes = await createMutationInputs(models, keys, typeCollection, options);
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

    const requiredInput = mutationInputTypes[modelName].required;
    const optionalInput = mutationInputTypes[modelName].optional;
    let mutationFields = {};

    // const modelDefinition = getModelDefinition(models[modelName]);
    const createFunc = onCreate(models[modelName]);
    const updateFunc = onUpdate(models[modelName]);
    const deleteFunc = onDelete(models[modelName]);
    let create = {
      type: typeCollection[modelName],
      args: {
        input: {
          type: requiredInput,
        },
      },
      resolve: createFunc,
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
