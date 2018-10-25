"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _sequelize = _interopRequireDefault(require("sequelize"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import {GraphQLID} from "graphql";
// import {toGlobalId} from "graphql-relay/lib/node/node";
var _default = {
  name: "Item",
  tableName: "items",
  define: {
    id: {
      type: _sequelize.default.UUID,
      allowNull: false,
      unique: true,
      primaryKey: true,
      defaultValue: _sequelize.default.UUIDV4 // Sequelize.literal("(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))"),

    },
    name: {
      type: _sequelize.default.STRING,
      allowNull: false
    }
  },
  relationships: [{
    type: "hasOne",
    model: "Item",
    name: "hasOne",
    options: {
      as: "hasOne",
      foreignKey: "hasOneId",
      sourceKey: "id"
    }
  }, {
    type: "belongsTo",
    model: "Item",
    name: "belongsTo",
    options: {
      as: "belongsTo",
      foreignKey: "belongsToId",
      sourceKey: "id"
    }
  }, {
    type: "hasMany",
    model: "Item",
    name: "children",
    options: {
      as: "children",
      foreignKey: "parentId",
      sourceKey: "id"
    }
  }, {
    type: "belongsTo",
    model: "Item",
    name: "parent",
    options: {
      as: "parent",
      foreignKey: "parentId",
      sourceKey: "id"
    }
  }, {
    type: "belongsTo",
    model: "Task",
    name: "task",
    options: {
      as: "task",
      foreignKey: "taskId",
      sourceKey: "id"
    }
  }, {
    type: "belongsToMany",
    model: "Task",
    name: "btmTasks",
    options: {
      through: "btm-tasks",
      foreignKey: "itemId"
    }
  }],
  options: {
    tableName: "items",
    hooks: {},
    classMethods: {},
    instanceMethods: {}
  },

  after({
    result
  }) {
    if (!result) {
      return result;
    }

    if ((result.edges || []).length > 0) {
      result.edges = result.edges.map(x => {
        const {
          node
        } = x;
        return node.name !== "item-null" ? x : null;
      });
      return result;
    }

    return result.name !== "item-null" ? result : null;
  }

};
exports.default = _default;
//# sourceMappingURL=item.js.map
