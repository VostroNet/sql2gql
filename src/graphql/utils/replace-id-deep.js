
import {fromGlobalId} from "graphql-relay";

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
