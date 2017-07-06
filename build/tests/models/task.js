"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sequelize = require("sequelize");

var _sequelize2 = _interopRequireDefault(_sequelize);

var _graphql = require("graphql");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  name: "Task",
  define: {
    name: {
      type: _sequelize2.default.STRING,
      allowNull: false,
      validate: {
        isAlphanumeric: {
          msg: "Your task name can only use letters and numbers"
        },
        len: {
          args: [1, 50],
          msg: "Your task name must be between 1 and 50 characters"
        }
      }
    },
    options: {
      type: _sequelize2.default.STRING,
      allowNull: true
    }
  },
  before(findOptions, args, context, info) {
    return findOptions;
  },
  after(result, args, context, info) {
    return result;
  },
  override: {
    options: {
      type: {
        name: "TaskOptions",
        fields: {
          hidden: { type: _graphql.GraphQLString }
        }
      },
      output(result, args, context, info) {
        return JSON.parse(result.get("options"));
      },
      input(field, args, context, info) {
        return JSON.stringify(field);
      }
    }
  },
  relationships: [{
    type: "hasMany",
    model: "TaskItem",
    name: "items"
  }],
  expose: {
    classMethods: {
      mutations: {
        reverseName: {
          type: "Task",
          args: {
            input: {
              type: new _graphql.GraphQLNonNull(new _graphql.GraphQLInputObjectType({
                name: "TaskReverseNameInput",
                fields: {
                  amount: { type: new _graphql.GraphQLNonNull(_graphql.GraphQLInt) }
                }
              }))
            }
          }
        }
      },
      query: {
        getHiddenData: {
          type: new _graphql.GraphQLObjectType({
            name: "TaskHiddenData",
            fields: function fields() {
              return {
                hidden: { type: _graphql.GraphQLString }
              };
            }
          }),
          args: {}
        },
        getHiddenData2: {
          type: new _graphql.GraphQLObjectType({
            name: "TaskHiddenData2",
            fields: function fields() {
              return {
                hidden: { type: _graphql.GraphQLString }
              };
            }
          }),
          args: {}
        }
      }
    }
  },
  options: {
    tableName: "tasks",
    classMethods: {
      reverseName(_ref, req) {
        var amount = _ref.input.amount;

        return {
          id: 1,
          name: `reverseName${amount}`
        };
      },
      getHiddenData(args, req) {
        return {
          hidden: "Hi"
        };
      },
      getHiddenData2(args, req) {
        return {
          hidden: "Hi2"
        };
      }
    },
    hooks: {
      beforeFind(options) {
        return undefined;
      },
      beforeCreate(instance, options) {
        return undefined;
      },
      beforeUpdate(instance, options) {
        return undefined;
      },
      beforeDestroy(instance, options) {
        return undefined;
      }
    },
    indexes: [
      // {unique: true, fields: ["name"]},
    ],
    instanceMethods: {} }
};
//# sourceMappingURL=task.js.map
