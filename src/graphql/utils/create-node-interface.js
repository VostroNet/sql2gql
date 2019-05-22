
import {
  nodeDefinitions,
} from "graphql-relay";

import NodeTypeMapper from "./node-type-mapper";
import idFetcher from "./id-fetcher";
import typeResolver from "./type-resolver";

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
