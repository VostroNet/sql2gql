"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createSubscriptionFunctions;

var _getModelDef = _interopRequireDefault(require("./utils/get-model-def"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @function createSubscriptionFunctions
 * @param {Object} pubsub
 * @param {Object} models
 * @param {string[]} keys
 * @param {Object} typeCollection
 * @param {Object} options
 * @param {Object} options
 * @return {Object}
*/
async function createSubscriptionFunctions(pubsub, models, keys, typeCollection, options) {
  let subCollection = {};
  await Promise.all(keys.map(async modelName => {
    const model = models[modelName];
    const modelDefinition = (0, _getModelDef.default)(model);
    const {
      subscriptions = {},
      $subscriptions
    } = modelDefinition; //TODO expose subscriptions from model definition

    if ($subscriptions) {
      await Promise.all(Object.keys($subscriptions.names).map(hookName => {
        if (options.permission) {
          if (options.permission.subscription) {
            if (!options.permission.subscription(modelName, hookName)) {
              return;
            }
          }
        }

        const subscriptionName = $subscriptions.names[hookName];
        subCollection[subscriptionName] = {
          type: typeCollection[modelName],

          resolve(item, args, context, gql) {
            const {
              instance,
              hookName
            } = (item || {})[subscriptionName];

            if (subscriptions[hookName]) {
              return subscriptions[hookName](instance, args, context, gql);
            }

            return instance;
          },

          subscribe() {
            return pubsub.asyncIterator(subscriptionName);
          }

        };
      }));
    }
  }));
  return subCollection;
}
//# sourceMappingURL=subscriptions.js.map
