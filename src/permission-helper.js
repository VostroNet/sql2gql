
import deepmerge from "deepmerge";

function validateKey(key, defaultDeny) {
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

/**
 * @function createRoleBasedPermissions
 * @param {string} role
 * @param {Object} rules
 * @param {Object} options
 * @return {GraphQLSchema}
*/

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

export default function createRoleBasedPermissions(role, rules, options = {}) {
  const {defaultDeny = true, defaults: defaultPerms = {}} = options;
  let compiledRules = Object.keys(rules).reduce((curr, key) => {
    curr[key] = deepmerge(defaultPerms, rules[key]);
    return curr;
  }, {})[role] || {};
  let permission = Object.assign([
    "field",
    "relationship",
    "mutationClassMethods",
    "queryInstanceMethods",
    "queryClassMethods",
    "subscription",
  ].reduce((obj, key) => {
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
  }, {}), [
    "query",
    "model",
    "mutation",
    "mutationUpdate",
    "mutationCreate",
    "mutationDelete",
    "mutationUpdateAll",
    "mutationDeleteAll",
    "extensions",
  ].reduce((obj, key) => {
    if (compiledRules[key]) {
      obj[key] = (modelName) => {
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
