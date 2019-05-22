
export default function createRelatedFieldsFunc(defName, instance, definition, options, typeCollection) {
  return function relatedFields() {
    let fields = instance.cache.get("relatedFields", {})[defName];
    if (!fields && typeCollection[defName]) {
      const relationships = instance.getRelationships(defName);

      fields = Object.keys(relationships).reduce((f, relName) => {
        const relationship = relationships[relName];
        if (options.permission) {
          if (options.permission.relationship) {
            const result = options.permission.relationship(defName, relName, relationship.source, options.permission.options);
            if (!result) {
              return f;
            }
          }
        }
        const targetObject = typeCollection[relationship.target];
        if (!targetObject) {
          // `targetType ${relationship.target} not defined for relationship`;
          return f;
        }
        switch(relationship.type) {
          case "hasMany":
            
        }


        return f;
      }, {});


      instance.cache.merge("relatedFields", {[defName]: fields});
    }
    return fields;
  };
}
