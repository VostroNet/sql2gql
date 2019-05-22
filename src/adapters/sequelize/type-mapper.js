
import Sequelize from "sequelize";
import {toGraphQL} from "graphql-sequelize/lib/typeMapper";
export default function typeMapper(type) {
  return toGraphQL(type, Sequelize);
}
