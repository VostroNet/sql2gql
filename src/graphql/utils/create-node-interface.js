
import {
  nodeDefinitions,
} from "graphql-relay";

import NodeTypeMapper from "./utils/node-type-mapper";
import idFetcher from "./utils/id-fetcher";
import typeResolver from "./utils/type-resolver";

export default function createNodeInterface(dbInstance) {
  let nodeTypeMapper = new NodeTypeMapper();
  const nodeObjects = nodeDefinitions(
    idFetcher(dbInstance, nodeTypeMapper),
    typeResolver(nodeTypeMapper)
  );

  return {
    nodeTypeMapper,
    ...nodeObjects,
  };
}
