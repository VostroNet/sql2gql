import {Op} from "sequelize";
import {mergeFilterStatement} from "../../src/adapters/sequelize";
test("sequelize-adapter - mergeFilterStatement - simple match", async() => {
  const result = mergeFilterStatement("id", 1, true);
  expect(result.id).not.toBeUndefined();
  expect(result.id[Op.eq]).not.toBeUndefined();
  expect(result.id[Op.eq]).toEqual(1);
});
test("sequelize-adapter - mergeFilterStatement - simple negative match", async() => {
  const result = mergeFilterStatement("id", 1, false);
  expect(result.id).not.toBeUndefined();
  expect(result.id[Op.ne]).not.toBeUndefined();
  expect(result.id[Op.ne]).toEqual(1);
});


test("sequelize-adapter - mergeFilterStatement - simple match array", async() => {
  const arg = [1];
  const result = mergeFilterStatement("id", arg, true);
  expect(result.id).not.toBeUndefined();
  expect(result.id[Op.in]).not.toBeUndefined();
  expect(result.id[Op.in]).toEqual(arg);
});
test("sequelize-adapter - mergeFilterStatement - simple negative match array", async() => {
  const arg = [1];
  const result = mergeFilterStatement("id", arg, false);
  expect(result.id).not.toBeUndefined();
  expect(result.id[Op.notIn]).not.toBeUndefined();
  expect(result.id[Op.notIn]).toEqual(arg);
});

test("sequelize-adapter - mergeFilterStatement - merge match", async() => {
  const result = mergeFilterStatement("id", 1, true, {
    "id": 2
  });
  expect(result.id).toBeUndefined();
  expect(Object.getOwnPropertySymbols(result)).toHaveLength(1);
  expect(Object.keys(result)).toHaveLength(0);
  expect(result[Op.and]).not.toBeUndefined();
  expect(result[Op.and]).toHaveLength(2);
  expect(result[Op.and][0].id).not.toBeUndefined();
  expect(result[Op.and][0].id).toEqual(2);
  expect(result[Op.and][1].id).not.toBeUndefined();
  expect(result[Op.and][1].id[Op.eq]).toEqual(1);
});


test("sequelize-adapter - mergeFilterStatement - merge negative match", async() => {
  const result = mergeFilterStatement("id", 1, false, {
    "id": 2
  });
  expect(result.id).toBeUndefined();
  expect(result[Op.and]).not.toBeUndefined();
  expect(result[Op.and]).toHaveLength(2);
  expect(result[Op.and][0].id).not.toBeUndefined();
  expect(result[Op.and][0].id).toEqual(2);
  expect(result[Op.and][1].id).not.toBeUndefined();
  expect(result[Op.and][1].id[Op.ne]).toEqual(1);
});


test("sequelize-adapter - mergeFilterStatement - merge match array", async() => {
  const arg = [1];
  const result = mergeFilterStatement("id", arg, true, {
    "id": 2
  });
  expect(result.id).toBeUndefined();
  expect(result[Op.and]).not.toBeUndefined();
  expect(result[Op.and]).toHaveLength(2);
  expect(result[Op.and][0].id).not.toBeUndefined();
  expect(result[Op.and][0].id).toEqual(2);
  expect(result[Op.and][1].id).not.toBeUndefined();
  expect(result[Op.and][1].id[Op.in]).toEqual(arg);
});

test("sequelize-adapter - mergeFilterStatement - merge negative match array", async() => {
  const arg = [1];
  const result = mergeFilterStatement("id", arg, false, {
    "id": 2
  });
  expect(result.id).toBeUndefined();
  expect(result[Op.and]).not.toBeUndefined();
  expect(result[Op.and]).toHaveLength(2);
  expect(result[Op.and][0].id).not.toBeUndefined();
  expect(result[Op.and][0].id).toEqual(2);
  expect(result[Op.and][1].id).not.toBeUndefined();
  expect(result[Op.and][1].id[Op.notIn]).toEqual(arg);
});
