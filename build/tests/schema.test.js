"use strict";

var _expect = require("expect");

var _expect2 = _interopRequireDefault(_expect);

var _utils = require("./utils");

var _graphql = require("graphql");

var _index = require("../index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

describe("schema", () => {
  it("type output", _asyncToGenerator(function* () {
    const instance = yield (0, _utils.createSqlInstance)();
    const schema = yield (0, _index.createSchema)(instance);
    (0, _expect2.default)(schema.$sql2gql).toBeDefined();
    (0, _expect2.default)(schema.$sql2gql.types).toBeDefined();
    (0, _expect2.default)(schema.$sql2gql.types.Task).toBeDefined();
    return (0, _expect2.default)(schema.$sql2gql.types.Task instanceof _graphql.GraphQLObjectType).toBeTruthy();
  }));
});
//# sourceMappingURL=schema.test.js.map
