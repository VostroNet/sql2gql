import debug from "debug";

export default function(prefix = "") {
  return {
    err: debug(`${prefix}err`),
    error: debug(`${prefix}error`),
    info: debug(`${prefix}info`),
    warn: debug(`${prefix}warn`),
    debug: debug(`${prefix}debug`),
  };
}
