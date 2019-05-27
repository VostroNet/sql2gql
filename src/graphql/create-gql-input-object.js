import {
  GraphQLInputObjectType,
} from "graphql";

const validate = false;

export default function createGQLInputObject(name, fields, schemaCache) {
  // if (schemaCache.mutationInputFields[name] && validate) {
  //   let f;
  //   if (fields instanceof Function) {
  //     f = fields();
  //   } else {
  //     f = fields;
  //   }
  //   if(Object.keys(f).length !== Object.keys(schemaCache.mutationInputFields[name].__fields)) { // eslint-disable-line
  //     throw new Error("We have two graphql input objects with the same name but different fields");
  //   }
  // }
  if (!schemaCache.mutationInputFields[name]) {
    schemaCache.mutationInputFields[name] = new GraphQLInputObjectType({
      name,
      fields,
    });
    // if (validate) {
    //   schemaCache.mutationInputFields[name].__fields = fields; // eslint-disable-line
    // }
  }
  return schemaCache.mutationInputFields[name];
}
