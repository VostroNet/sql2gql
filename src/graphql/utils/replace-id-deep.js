
import {fromGlobalId} from "graphql-relay";

export default function replaceIdDeep(obj, keyMap) {
  // return obj;
  return Object.keys(obj).reduce((m, key) => {
    if (keyMap.indexOf(key) > -1) {
      m[key] = fromGlobalId(obj[key]).id;
    } else {
      if (Array.isArray(m[key])) {
        obj[key].forEach((val, idx) => {
          if (Object.prototype.toString.call(val) === "[object Object]") {
            m[key][idx] = replaceIdDeep(val, keyMap);
          }
        });
      } else if (Object.prototype.toString.call(obj[key]) === "[object Object]") {
        m[key] = replaceIdDeep(obj[key], keyMap);
      }
    }
    return m;
  }, {});
}
