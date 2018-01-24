"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = resetInterfaces;

function resetInterfaces(impl) {
  delete impl._interfaces; //eslint-disable-line

  impl.getInterfaces().forEach(type => {
    type._implementations.push(impl); //eslint-disable-line

  });
}
//# sourceMappingURL=reset-interfaces.js.map
