export default class Cache {
  constructor(defaultStore = {}) {
    this.store = defaultStore;
    this.timeouts = {};
  }
  set = (key, value, timeout) => {
    this.store[key] = value;
    if (timeout && timeout > 0) {
      this.clearTimeout(key);
      this.timeouts[key] = setTimeout(() => {
        this.store[key] = undefined;
      }, timeout);
    }
    return this.store[key];
  }
  merge = (key, value, timeout) => {
    return this.set(key, Object.assign(this.get(key, {}), value), timeout);
  }
  get = (key, defaultValue) => {
    if (!this.store[key]) {
      return defaultValue;
    }
    return this.store[key];
  }
  clearTimeout(key) {
    if (this.timeouts[key]) {
      clearTimeout(this.timeouts[key]);
    }
  }
}
