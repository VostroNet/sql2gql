"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = graphqlExpress;

var _graphql = require("graphql");

var _apolloServerCore = require("apollo-server-core");

/**
 * @function graphqlExpress
 * @param {Object} options
*/
function graphqlExpress(options) {
  if (!options) {
    throw new Error("Apollo Server requires options.");
  }

  if (arguments.length > 1) {
    throw new Error(`Apollo Server expects exactly one argument, got ${arguments.length}`);
  }

  return async (req, res, next) => {
    const t = await options.sequelize.transaction();
    let rollback = false;

    try {
      const gqlResponse = await (0, _apolloServerCore.runHttpQuery)([req, res], {
        method: req.method,
        options: Object.assign({}, options, {
          context: Object.assign({
            transaction: t
          }, options.context),

          formatError(target, source1, source2) {
            rollback = true;
            return (0, _graphql.formatError)(target, source1, source2);
          }

        }),
        query: req.method === "POST" ? req.body : req.query
      });
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Length", Buffer.byteLength(gqlResponse, "utf8"));
      res.write(gqlResponse);
    } catch (error) {
      if (error.name !== "HttpQueryError") {
        return next(error);
      }

      if (error.headers) {
        Object.keys(error.headers).forEach(header => {
          res.setHeader(header, error.headers[header]);
        });
      }

      res.statusCode = error.statusCode;
      res.write(error.message);
    }

    if (!rollback) {
      await t.commit();
    } else {
      await t.rollback();
    }

    return res.end();
  };
}
//# sourceMappingURL=express.js.map
