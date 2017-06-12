"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sequelize = require("sequelize");

var _sequelize2 = _interopRequireDefault(_sequelize);

var _logger = require("../../utils/logger");

var _logger2 = _interopRequireDefault(_logger);

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
        }
      }
    }
  },
  options: {
    tableName: "tasks",
    classMethods: {
      reverseName: function reverseName(_ref, req) {
        var amount = _ref.input.amount;

        return {
          id: 1,
          name: "reverseName" + amount
        };
      },
      getHiddenData: function getHiddenData(args, req) {
        return {
          hidden: "Hi"
        };
      }
    },
    hooks: {
      beforeFind: function beforeFind(options, cb) {
        return cb(undefined, options);
      },
      beforeCreate: function beforeCreate(instance, options, cb) {
        return cb(undefined, instance, options);
      },
      beforeUpdate: function beforeUpdate(instance, options, cb) {
        return cb(undefined, instance, options);
      },
      beforeDestroy: function beforeDestroy(instance, options, cb) {
        return cb(undefined, instance, options);
      }
    },
    indexes: [
      // {unique: true, fields: ["name"]},
    ],
    instanceMethods: {} }
};
// import {getDatabase} from "server/database";
// import Promise from "bluebird";
// import {InvalidUserNamePasswordError, FormSubmissionError, DatabasePermissionError} from "server/logic/errors";


// const log = logger("tests:models:task:");
//# sourceMappingURL=task.js.map
