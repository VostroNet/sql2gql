
import {fromGlobalId} from "graphql-relay";
import waterfall from "./waterfall";
import {Op} from "sequelize";

function getProperties(obj) {
  return [].concat(Object.keys(obj), Object.getOwnPropertySymbols(obj));
}


function checkObject(value, keyMap, variableValues, isTagged) {
  if (typeof value === "function") {
    const result = value(variableValues);
    return checkObject(result, keyMap, variableValues, isTagged);
  } else if (Array.isArray(value)) {
    return value.map((val) => {
      return checkObject(val, keyMap, variableValues, isTagged);
    });
  } else if (Object.prototype.toString.call(value) === "[object Object]") {
    return replaceIdDeep(value, keyMap, variableValues, isTagged);
  } else if (isTagged) {
    try {
      return fromGlobalId(value).id;
    } catch {
      return value;
    }
  } else {
    return value;
  }
}

export default function replaceIdDeep(obj, keyMap, variableValues, isTagged = false) {
  return getProperties(obj).reduce((m, key) => {
    if (keyMap.indexOf(key) > -1 || isTagged) {
      m[key] = checkObject(obj[key], keyMap, variableValues, true);
    } else {
      m[key] = checkObject(obj[key], keyMap, variableValues, false);
    }
    return m;
  }, {});
}



function hasUserPrototype(obj) {
  if (!obj) {
    return false;
  }
  return Object.getPrototypeOf(obj) !== Object.prototype;
}
async function checkObjectForWhereOps(value, keyMap, params) {
  if (Array.isArray(value)) {
    return Promise.all(value.map((val) => {
      return checkObjectForWhereOps(val, keyMap, params);
    }));
  } else if (hasUserPrototype(value)) {
    return value;
  } else if (Object.prototype.toString.call(value) === "[object Object]") {
    return replaceDefWhereOperators(value, keyMap, params);
  } else {
    return value;
  }
}

export async function replaceDefWhereOperators(obj, keyMap, options) {
  return waterfall(getProperties(obj), async(key, memo) => {
    if (keyMap[key]) {
      const newWhereObj = await keyMap[key](memo, options, obj[key]);
      delete memo[key];
      memo = getProperties(newWhereObj).reduce((m, newKey) => {
        if (m[newKey]) {
          const newValue = {
            [newKey]: newWhereObj[newKey],
          };
          if (Array.isArray(m[newKey])) {
            m[newKey] = m[newKey].concat(newValue);
          } else if (m[Op.and]) {
            m[Op.and] = m[Op.and].concat(newValue);
          } else if (m.and) { //Cover both before and after replaceWhereOps
            m.and = m.and.concat(newValue);
          } else {
            const prevValue = {
              [newKey]: m[newKey],
            };
            m[Op.and] = [prevValue, newValue];
          }
        } else {
          m[newKey] = newWhereObj[newKey];
        }
        return m;
      }, memo);
      memo = await checkObjectForWhereOps(memo, keyMap, options);
    } else {
      memo[key] = await checkObjectForWhereOps(memo[key], keyMap, options);
    }
    // return the modified object
    return memo;

  }, Object.assign({}, obj));
}
