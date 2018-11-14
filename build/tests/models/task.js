"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _sequelize = _interopRequireWildcard(require("sequelize"));

var _graphql = require("graphql");

var _index = require("../../index");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function delay(ms = 1) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

var _default = {
  name: "Task",
  define: {
    name: {
      type: _sequelize.default.STRING,
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
      type: _sequelize.default.STRING,
      allowNull: true
    },
    options: {
      type: _sequelize.default.STRING,
      allowNull: true
    },
    options2: {
      type: _sequelize.default.STRING,
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
          hidden: {
            type: _graphql.GraphQLString
          },
          hidden2: {
            type: _graphql.GraphQLString
          }
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
    name: "items",
    options: {
      foreignKey: "taskId"
    }
  }, {
    type: "hasOne",
    model: "Item",
    name: "item",
    options: {
      foreignKey: "taskId"
    }
  }, {
    type: "belongsToMany",
    model: "Item",
    name: "btmItems",
    options: {
      through: "btm-tasks",
      foreignKey: "taskId"
    }
  }],
  whereOperators: {
    async hasNoItems(newWhere, findOptions) {
      const {
        context
      } = findOptions;
      const {
        instance
      } = context;
      return {
        id: {
          [_sequelize.Op.notIn]: instance.literal(`(SELECT DISTINCT("taskId") FROM "task-items")`)
        }
      };
    },

    async innerTest(newWhere, findOptions) {
      // const {context} = findOptions;
      // const {instance} = context;
      return {
        hasNoItems: true
      };
    }

  },
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
                  amount: {
                    type: new _graphql.GraphQLNonNull(_graphql.GraphQLInt)
                  }
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
                  amount: {
                    type: new _graphql.GraphQLNonNull(_graphql.GraphQLInt)
                  }
                }
              }))
            }
          }
        },
        reverseName2: {
          type: "Task",
          args: {
            input: {
              type: new _graphql.GraphQLNonNull(new _graphql.GraphQLInputObjectType({
                name: "TaskReverseName2Input",
                fields: {
                  amount: {
                    type: new _graphql.GraphQLNonNull(_graphql.GraphQLInt)
                  }
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
              hidden: {
                type: _graphql.GraphQLString
              }
            })
          }),
          args: {}
        },
        getHiddenData2: {
          type: new _graphql.GraphQLObjectType({
            name: "TaskHiddenData2",
            fields: () => ({
              hidden: {
                type: _graphql.GraphQLString
              }
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
      reverseName({
        input: {
          amount
        }
      }, req) {
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

      async getHiddenData(args, req) {
        await delay();
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
    instanceMethods: {
      testInstanceMethod({
        input: {
          amount
        }
      }, req) {
        return [{
          id: this.id,
          name: `${this.name}${amount}`
        }];
      }

    },
    hooks: {
      beforeFind(options) {
        return options;
      },

      beforeCreate(instance, options) {
        return instance;
      },

      beforeUpdate(instance, options) {
        return instance;
      },

      beforeDestroy(instance, options) {
        return instance;
      }

    },
    indexes: [// {unique: true, fields: ["name"]},
    ]
  }
};
exports.default = _default;
//# sourceMappingURL=task.js.map
