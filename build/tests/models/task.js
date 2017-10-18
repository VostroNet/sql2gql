"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sequelize = require("sequelize");

var _sequelize2 = _interopRequireDefault(_sequelize);

var _graphql = require("graphql");

var _index = require("../../index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function delay(ms = 1) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

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
    mutationCheck: {
      type: _sequelize2.default.STRING,
      allowNull: true
    },
    options: {
      type: _sequelize2.default.STRING,
      allowNull: true
    },
    options2: {
      type: _sequelize2.default.STRING,
      allowNull: true
    }
  },
  before(req) {
    if (req.type === _index.events.MUTATION_CREATE) {
      return Object.assign({}, req.params, {
        mutationCheck: "create"
      });
    }
    if (req.type === _index.events.MUTATION_UPDATE) {
      return Object.assign({}, req.params, {
        mutationCheck: "update"
      });
    }
    return req.params;
  },
  after(req) {
    return req.result;
  },
  override: {
    options: {
      type: {
        name: "TaskOptions",
        fields: {
          hidden: { type: _graphql.GraphQLString },
          hidden2: { type: _graphql.GraphQLString }
        }
      },
      output(result, args, context, info) {
        return JSON.parse(result.get("options"));
      },
      input(field, args, context, info, model) {
        if (model) {
          const currOpts = model.get("options");
          if (currOpts) {
            const opts = JSON.parse(currOpts);
            return JSON.stringify(Object.assign({}, opts, field));
          }
        }
        return JSON.stringify(field);
      }
    },
    options2: {
      type: _graphql.GraphQLString,
      output(result, args, context, info) {
        return JSON.parse(result.get("options2"));
      },
      input(field, args, context, info, model) {
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
    instanceMethods: {
      query: {
        testInstanceMethod: {
          type: "Task[]",
          args: {
            input: {
              type: new _graphql.GraphQLNonNull(new _graphql.GraphQLInputObjectType({
                name: "TestInstanceMethodInput",
                fields: {
                  amount: { type: new _graphql.GraphQLNonNull(_graphql.GraphQLInt) }
                }
              }))
            }
          }
        }
      }
    },
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
        reverseNameArray: {
          type: "Task[]",
          args: undefined
        },
        getHiddenData: {
          type: new _graphql.GraphQLObjectType({
            name: "TaskHiddenData",
            fields: () => ({
              hidden: { type: _graphql.GraphQLString }
            })
          }),
          args: {}
        },
        getHiddenData2: {
          type: new _graphql.GraphQLObjectType({
            name: "TaskHiddenData2",
            fields: () => ({
              hidden: { type: _graphql.GraphQLString }
            })
          }),
          args: {}
        }
      }
    }
  },
  options: {
    tableName: "tasks",
    // paranoid: true,
    classMethods: {
      reverseName({ input: { amount } }, req) {
        return {
          id: 1,
          name: `reverseName${amount}`
        };
      },
      reverseNameArray(args, req) {
        return [{
          id: 1,
          name: "reverseName4"
        }, {
          id: 2,
          name: "reverseName3"
        }];
      },
      getHiddenData(args, req) {
        return _asyncToGenerator(function* () {
          yield delay();
          return {
            hidden: "Hi"
          };
        })();
      },
      getHiddenData2(args, req) {
        return {
          hidden: "Hi2"
        };
      }
    },
    instanceMethods: {
      testInstanceMethod({ input: { amount } }, req) {
        return [{
          id: this.id,
          name: `${this.name}${amount}`
        }];
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
    ]
  }
};
//# sourceMappingURL=task.js.map
