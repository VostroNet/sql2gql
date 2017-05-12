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
  // relationships: [{
  //   type: "belongsTo",
  //   model: "Task",
  //   name: "task",
  // }],
  options: {
    tableName: "task-items",
    classMethods: {},
    hooks: {
      beforeFind(options, cb) {
        return cb(undefined, options);
      },
      beforeCreate(instance, options, cb) {
        return cb(undefined, instance, options);
      },
      beforeUpdate(instance, options, cb) {
        return cb(undefined, instance, options);
      },
      beforeDestroy(instance, options, cb) {
        return cb(undefined, instance, options);
      },
    },
    indexes: [
      {unique: true, fields: ["name"]},
    ],
    instanceMethods: {}, //TODO: figure out a way to expose this on graphql
  },
};
