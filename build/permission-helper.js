"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createRoleBasedPermissions;

var _deepmerge = require("deepmerge");

var _deepmerge2 = _interopRequireDefault(_deepmerge);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function validateKey(key, defaultDeny) {
  // console.log("DEFAULT", !defaultDeny, key);
  if (key === "deny") {
    return false;
  }
  if (key === "allow") {
    return true;
  }
  return !defaultDeny;
}

function validateSection(permSection, keyName, defaultDeny) {
  if (permSection === "deny") {
    return false;
  }
  if (permSection === "allow") {
    return true;
  }
  return validateKey(permSection[keyName], defaultDeny);
}

/* 
  options = {
    defaultDeny: true
  }

  defaultPerm = {
    "fields": {
      "User": {
        "password": "deny",
      },
    },
    "classMethods": {
      "User": {
        "login": "allow",
        "logout": "allow",
      },
    },
  };

  rules = {
    "admin": {
      "field": {
        "User": "allow",
      } 
      "model": "allow",
      "classMethods": {
        "User": {
          "login": "deny",
        },
      },
    },
    "user": {
      "mutation": "deny",
    },
  };

*/

function createRoleBasedPermissions(role, rules, options = {}) {
  const { defaultDeny = true, defaults: defaultPerms = {} } = options;
  let compiledRules = Object.keys(rules).reduce((curr, key) => {
    curr[key] = (0, _deepmerge2.default)(defaultPerms, rules[key]);
    return curr;
  }, {})[role] || {};
  let permission = Object.assign(["field", "relationship", "mutationClassMethods", "queryInstanceMethods", "queryClassMethods", "subscription"].reduce((obj, key) => {
    if (compiledRules[key]) {
      obj[key] = (modelName, fieldName) => {
        const target = compiledRules[key];
        if (target === "allow") {
          return true;
        }
        if (target === "deny") {
          return false;
        }
        let result = !defaultDeny;
        if (target[modelName]) {
          result = validateSection(target[modelName], fieldName, defaultDeny);
        }
        return result;
      };
      return obj;
    } else if (defaultDeny) {
      obj[key] = () => false;
    }
    return obj;
  }, {}), ["query", "model", "mutation", "mutationUpdate", "mutationCreate", "mutationDelete", "mutationUpdateAll", "mutationDeleteAll"].reduce((obj, key) => {
    if (compiledRules[key]) {
      obj[key] = modelName => {
        const target = compiledRules[key];
        if (target === "allow") {
          return true;
        }
        if (target === "deny") {
          return false;
        }
        return validateSection(compiledRules[key], modelName, defaultDeny);
      };
      return obj;
    } else if (defaultDeny) {
      obj[key] = () => false;
    }
    return obj;
  }, {}));
  return permission;
}
//# sourceMappingURL=permission-helper.js.map
