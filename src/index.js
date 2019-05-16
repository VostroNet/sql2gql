
import waterfall from "./utils/waterfall";

export default class GQL {
  constructor() {
    this.models = {};
    this.modelsAdapters = {};
    this.adapters = {};
    this.defaultAdapter = undefined;
  }
  registerAdapter = (adapter, adapterName) => {
    this.adapters[adapterName || adapter.name] = adapter;
    if (!this.defaultAdapter) {
      this.defaultAdapter = adapterName || adapter.name;
    }
  }
  addModel(model) {
    const datasource = model.datasource || this.defaultAdapter;
    if (this.models[model.name]) {
      throw new Error(`Model with the name ${model.name} has already been added`);
    }
    this.models[model.name] = model;
    this.modelsAdapters[model.name] = datasource;
    this.adapters[datasource].addModel(model);
  }
  async initialise(reset = false) {
    await Promise.all(Object.keys(this.models).map((modelName) => {
      const model = this.models[modelName];
    }));
    await Promise.all(Object.keys(this.adapters).map((adapterName) => {
      const adapter = this.adapters[adapterName];
      if (reset) {
        return adapter.reset();
      }
      return adapter.initialise();
    }));
  }

}
