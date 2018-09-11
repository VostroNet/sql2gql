"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _sequelize = _interopRequireDefault(require("sequelize"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = {
  name: "TaskItem",
  define: {
    name: {
      type: _sequelize.default.STRING,
      allowNull: false,
      validate: {
        isAlphanumeric: {
          msg: "Your task item name can only use letters and numbers"
        },
        len: {
          args: [8, 50],
          msg: "Your task item name must be between 8 and 50 characters"
        }
      }
    }
  },
  relationships: [{
    type: "belongsTo",
    model: "Task",
    name: "task",
    options: {
      foreignKey: "taskId"
    }
  }],
  expose: {
    instanceMethods: {
      query: {
        testInstanceMethodArray: {
          type: "TaskItem[]",
          args: {}
        },
        testInstanceMethodSingle: {
          type: "TaskItem",
          args: {}
        }
      }
    },
    classMethods: {
      query: {
        getTaskItemsArray: {
          type: "TaskItem[]",
          args: {}
        },
        getTaskItemsSingle: {
          type: "TaskItem",
          args: {}
        }
      },
      mutations: {
        getTaskItemsArray: {
          type: "TaskItem[]",
          args: {}
        },
        getTaskItemsSingle: {
          type: "TaskItem",
          args: {}
        }
      }
    }
  },
  options: {
    tableName: "task-items",
    instanceMethods: {
      testInstanceMethodArray(args, {
        instance
      }) {
        return instance.models.TaskItem.findAll();
      },

      testInstanceMethodSingle(args, {
        instance
      }) {
        return instance.models.TaskItem.findOne({
          where: {
            id: 1
          }
        });
      }

    },
    classMethods: {
      getTaskItemsArray(args, {
        instance
      }) {
        return instance.models.TaskItem.findAll();
      },

      getTaskItemsSingle(args, {
        instance
      }) {
        return instance.models.TaskItem.findOne({
          where: {
            id: 1
          }
        });
      }

    },
    hooks: {
      beforeFind(options = {}) {
        const {
          filterName
        } = (options || {}).rootValue || {};

        if (filterName) {
          options.where = {
            name: {
              $ne: filterName
            }
          };
        }

        return options;
      },

      beforeCreate(instance, options, cb) {
        return undefined;
      },

      beforeUpdate(instance, options, cb) {
        return undefined;
      },

      beforeDestroy(instance, options, cb) {
        return undefined;
      }

    },
    indexes: [{
      unique: true,
      fields: ["name"]
    }]
  }
};
exports.default = _default;
//# sourceMappingURL=task-item.js.map
