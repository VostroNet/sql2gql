"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getModelDef = require("./utils/get-model-def");

var _getModelDef2 = _interopRequireDefault(_getModelDef);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.default = (() => {
  var _ref = _asyncToGenerator(function* (pubsub, models, keys, typeCollection, options) {
    let subCollection = {};
    yield Promise.all(keys.map((() => {
      var _ref2 = _asyncToGenerator(function* (modelName) {
        const model = models[modelName];
        const modelDefinition = (0, _getModelDef2.default)(model);
        const { subscriptions = {}, $subscriptions } = modelDefinition; //TODO expose subscriptions from model definition
        if ($subscriptions) {
          yield Promise.all(Object.keys($subscriptions.names).map(function (hookName) {
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
                const { instance, hookName } = (item || {})[subscriptionName];
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
      });

      return function (_x6) {
        return _ref2.apply(this, arguments);
      };
    })()));
    return subCollection;
  });

  function createSubscriptionFunctions(_x, _x2, _x3, _x4, _x5) {
    return _ref.apply(this, arguments);
  }

  return createSubscriptionFunctions;
})();
//# sourceMappingURL=subscriptions.js.map
