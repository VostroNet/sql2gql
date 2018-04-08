"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createFunctions;

var _graphql = require("graphql");

var _graphqlSequelize = require("graphql-sequelize");

var _createBeforeAfter = _interopRequireDefault(require("../models/create-before-after"));

var _mutationFunctions = require("./mutation-functions");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function createFunctions(models, keys, typeCollection, mutationInputTypes, options) {
  const result = await keys.reduce((promise, modelName) => {
    return promise.then(async o => {
      if (!typeCollection[modelName]) {
        return o;
      }

      o[modelName] = await createFunctionForModel(modelName, models, mutationInputTypes, options);
      return o;
    });
  }, Promise.resolve({}));
  return result;
}

async function createFunctionForModel(modelName, models, mutationInputTypes, options) {
  if (options.permission) {
    if (options.permission.mutation) {
      const result = await options.permission.mutation(modelName, options.permission.options);

      if (!result) {
        return undefined;
      }
    }
  }

  const {
    optional,
    required
  } = mutationInputTypes[modelName];
  let fields = {},
      funcs = {};
  const updateFunc = (0, _mutationFunctions.onUpdate)(models[modelName]);
  const deleteFunc = (0, _mutationFunctions.onDelete)(models[modelName]);
  const {
    before
  } = (0, _createBeforeAfter.default)(models[modelName], options, {});
  let updateResult = true,
      deleteResult = true,
      createResult = true;

  if (options.permission) {
    if (options.permission.mutationUpdate) {
      updateResult = await options.permission.mutationUpdate(modelName, options.permission.options);
    }

    if (options.permission.mutationDelete) {
      deleteResult = await options.permission.mutationDelete(modelName, options.permission.options);
    }

    if (options.permission.mutationCreate) {
      createResult = await options.permission.mutationCreate(modelName, options.permission.options);
    }
  }

  if (createResult) {
    fields.create = {
      type: new _graphql.GraphQLList(required)
    };
    funcs.create = (0, _mutationFunctions.onCreate)(models[modelName]);
  }

  if (updateResult) {
    const {
      afterList: afterUpdateList
    } = (0, _createBeforeAfter.default)(models[modelName], options, {
      after: [updateFunc]
    });
    fields.update = {
      type: new _graphql.GraphQLList(new _graphql.GraphQLInputObjectType({
        name: `${modelName}CommandUpdateInput`,
        fields: Object.assign((0, _graphqlSequelize.defaultListArgs)(models[modelName]), {
          input: {
            type: new _graphql.GraphQLNonNull(optional)
          }
        })
      }))
    };
    funcs.update = (0, _graphqlSequelize.resolver)(models[modelName], {
      before,
      after: afterUpdateList
    });
  }

  if (deleteResult) {
    const {
      afterList: afterDeleteList
    } = (0, _createBeforeAfter.default)(models[modelName], options, {
      after: [deleteFunc]
    });
    fields.delete = {
      type: new _graphql.GraphQLList(new _graphql.GraphQLInputObjectType({
        name: `${modelName}CommandDeleteInput`,
        fields: (0, _graphqlSequelize.defaultListArgs)(models[modelName])
      }))
    };
    funcs.delete = (0, _graphqlSequelize.resolver)(models[modelName], {
      before,
      after: afterDeleteList
    });
  }

  if (createResult || updateResult || deleteResult) {
    return {
      funcs,
      fields
    };
  }

  return undefined;
}
//# sourceMappingURL=create-functions.js.map
