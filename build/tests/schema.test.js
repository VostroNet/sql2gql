"use strict";

var _expect = require("expect");

var _expect2 = _interopRequireDefault(_expect);

var _utils = require("./utils");

var _graphql = require("graphql");

var _index = require("../index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

describe("schema", function () {
  it("type output", _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
    var instance, schema;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _utils.createSqlInstance)();

          case 2:
            instance = _context.sent;
            _context.next = 5;
            return (0, _index.createSchema)(instance);

          case 5:
            schema = _context.sent;

            (0, _expect2.default)(schema.$sql2gql).toExist();
            (0, _expect2.default)(schema.$sql2gql.types).toExist();
            (0, _expect2.default)(schema.$sql2gql.types.Task).toExist();
            return _context.abrupt("return", (0, _expect2.default)(schema.$sql2gql.types.Task instanceof _graphql.GraphQLObjectType).toBeTruthy());

          case 10:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, undefined);
  })));
});
//# sourceMappingURL=schema.test.js.map
