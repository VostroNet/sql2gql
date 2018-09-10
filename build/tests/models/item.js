"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _sequelize = _interopRequireDefault(require("sequelize"));

var _graphql = require("graphql");

var _node = require("graphql-relay/lib/node/node");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = {
  name: "Item",
  tableName: "items",
  define: {
    id: {
      type: _sequelize.default.UUID,
      allowNull: false,
      unique: true,
      primaryKey: true,
      defaultValue: _sequelize.default.literal("(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))")
    },
    name: {
      type: _sequelize.default.STRING,
      allowNull: false
    }
  },
  override: {
    id: {
      type: _graphql.GraphQLID,

      output(result, args, context, info) {
        return (0, _node.toGlobalId)("Item", result.id);
      },

      input(field, args, context, info) {
        return field;
      }

    }
  },
  relationships: [{
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
