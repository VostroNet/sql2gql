import createListObject from "./create-list-object";
// import { fromCursor, toCursor } from "./objects/cursor";
import {capitalize} from "../utils/word";

export default function createRelatedFieldsFunc(
  defName,
  instance,
  definition,
  options,
  schemaCache
) {
  return function relatedFields() {
    let fields = instance.cache.get("relatedFields", {})[defName];
    if (!fields && schemaCache.types[defName]) {
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
                relationship.target,
                options.permission.options
              );
              if (!result) {
                return f;
              }
            }
          }
          const targetObject = schemaCache.types[relationship.target];
          const targetDef = instance.getDefinition(relationship.target);
          if (!targetObject) {
            // `targetType ${relationship.target} not defined for relationship`;
            return f;
          }
          switch (relationship.associationType) {
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
                },
              };
              break;
            default:
              f[relName] = createManyObject(instance, schemaCache, targetDef, targetObject, "", relationship);
              break;
          }

          return f;
        }, {});
      }
      instance.cache.merge("relatedFields", {[defName]: fields});
    }
    return fields;
  };
}

function createManyObject(instance, schemaCache, targetDef, targetObject, prefix, relationship) {
  return createListObject(instance, schemaCache, targetDef.name, targetObject, (source, args, context, info) => {
    return instance.resolveManyRelationship(
      targetDef.name,
      relationship,
      source,
      args,
      context,
      info,
    );
  }, prefix, `${relationship.associationType}${capitalize(relationship.name)}`);
}
