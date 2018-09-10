import Sequelize from "sequelize";

export default {
  name: "TaskItem",
  define: {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        isAlphanumeric: {
          msg: "Your task item name can only use letters and numbers",
        },
        len: {
          args: [8, 50],
          msg: "Your task item name must be between 8 and 50 characters",
        },
      },
    },
  },
  relationships: [{
    type: "belongsTo",
    model: "Task",
    name: "task",
    options: {
      foreignKey: "taskId",
    },
  }],
  options: {
    tableName: "task-items",
    classMethods: {},
    hooks: {
      beforeFind(options = {}) {
        const {filterName} = (options.info.rootValue || {});
        if (filterName) {
          options.where = {
            name: {
              $ne: filterName,
            },
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
      },
    },
    indexes: [
      {unique: true, fields: ["name"]},
    ],
    instanceMethods: {}, //TODO: figure out a way to expose this on graphql
  },
};
