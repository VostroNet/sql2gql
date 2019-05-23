import { unbase64, base64 } from "../utils/base64";

export function fromCursor(cursor) {
  let [id, index] = JSON.parse(unbase64(cursor));
  return {
    id,
    index,
  };
}
export function toCursor(id, index) {
  return base64(JSON.stringify([id, index]));
}
