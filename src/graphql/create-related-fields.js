import createListObject from "./create-list-object";
import { fromCursor, toCursor } from "./objects/cursor";

export default function createRelatedFieldsFunc(
  defName,
  instance,
  definition,
  options,
  typeCollection
) {
  return function relatedFields() {
    let fields = instance.cache.get("relatedFields", {})[defName];
    if (!fields && typeCollection[defName]) {
      const relationships = instance.getRelationships(defName);
      const relationshipKeys = Object.keys(relationships);

      let include;
      if (relationshipKeys.length > 0) {
        fields = relationshipKeys.reduce((f, relName) => {
          const relationship = relationships[relName];
          if (options.permission) {
            if (options.permission.relationship) {
              const result = options.permission.relationship(
                defName,
                relName,
                relationship.source,
                options.permission.options
              );
              if (!result) {
                return f;
              }
            }
          }
          const targetObject = typeCollection[relationship.target];
          const targetDef = instance.getDefinition(relationship.target);
          if (!targetObject) {
            // `targetType ${relationship.target} not defined for relationship`;
            return f;
          }
          switch (relationship.type) {
            case "hasOne":
            case "belongsTo":
              f[relName] = {
                type: targetObject,
                resolve(source, args, context, info) {
                  return instance.resolveSingleRelationship(
                    targetDef.name,
                    relationship,
                    source,
                    args,
                    context,
                    info,
                  );
                }
              };
              break;
            default:
              f[relName] = createManyObject(instance, targetDef, targetObject, "", relName);
              break;
          }

          return f;
        }, {});
      }
      instance.cache.merge("relatedFields", { [defName]: fields });
    }
    return fields;
  };
}
function processDefaultArgs(args) {
  const newArgs = {};
  if (args.first) {
    newArgs.first = fromCursor(args.first);
  }
  if (args.last) {
    newArgs.last = fromCursor(args.last);
  }
  return Object.assign({}, args, newArgs);
}
function createManyObject(instance, targetDef, targetObject, prefix, relationship) {
  return {
    type: createListObject(instance, targetDef, targetObject, prefix, relationship.name),
    async resolve(source, args, context, info) {
      const a = processDefaultArgs(args);
      let cursor;
      if (args.after || args.before) {
        cursor = args.after || args.before;
      }
      const { total, models } = instance.resolveManyRelationship(
        targetDef.name,
        relationship,
        source,
        a,
        context,
        info,
      );
      const edges = models.map((row, idx) => {
        let startIndex = null;
        if (cursor) {
          startIndex = Number(cursor.index);
        }
        if (startIndex !== null) {
          startIndex++;
        } else {
          startIndex = 0;
        }
        return {
          cursor: toCursor(targetDef.name, idx + startIndex),
          node: row,
        };
      });

      let startCursor, endCursor;
      if (edges.length > 0) {
        startCursor = edges[0].cursor;
        endCursor = edges[edges.length - 1].cursor;
      }
      let hasNextPage = false;
      let hasPreviousPage = false;
      if (args.first || args.last) {
        const count = parseInt(args.first || args.last, 10);
        let index = cursor ? Number(cursor.index) : null;
        if (index !== null) {
          index++;
        } else {
          index = 0;
        }
        hasNextPage = index + 1 + count <= total;
        hasPreviousPage = index - count >= 0;
        if (args.last) {
          [hasNextPage, hasPreviousPage] = [hasPreviousPage, hasNextPage];
        }
      }
      return {
        pageInfo: {
          hasNextPage,
          hasPreviousPage,
          startCursor,
          endCursor,
        },
        total,
        edges,
      };
    }
  };
}
