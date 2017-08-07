"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sequelize = require("sequelize");

var _sequelize2 = _interopRequireDefault(_sequelize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  name: "TaskItem",
  define: {
    name: {
      type: _sequelize2.default.STRING,
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
  // relationships: [{
  //   type: "belongsTo",
  //   model: "Task",
  //   name: "task",
  // }],
  options: {
    tableName: "task-items",
    classMethods: {},
    hooks: {
      beforeFind() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var _ref = options.rootValue || {},
            filterName = _ref.filterName;

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
    indexes: [{ unique: true, fields: ["name"] }],
    instanceMethods: {} }
};
//# sourceMappingURL=task-item.js.map
