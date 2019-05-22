import Cache from "../../src/utils/cache";

function sleep(ms) {
  return new Promise((resolve, reject) => {
    return setTimeout(resolve, ms);
  });
}

test("cache - initialise", () => {
  const cache = new Cache();
  expect(cache.store).toBeDefined();
});

test("cache - set", () => {
  const cache = new Cache();
  cache.set("field", "value");
  expect(cache.store.field).toBeDefined();
  expect(cache.store.field).toEqual("value");
});

test("cache - get", () => {
  const cache = new Cache();
  cache.set("field", "value");
  const val = cache.get("field");
  expect(val).toBeDefined();
  expect(val).toEqual("value");
});

test("cache - get - defaultValue", () => {
  const cache = new Cache();
  const val = cache.get("field", "value");
  expect(val).toBeDefined();
  expect(val).toEqual("value");
});


test("cache - set - with timeout", async() => {
  const cache = new Cache();
  cache.set("field", "value", 5);
  const val = cache.get("field");
  expect(val).toBeDefined();
  expect(val).toEqual("value");
  await sleep(10);
  const emptyVal = cache.get("field");
  expect(emptyVal).toBeUndefined();
});

test("cache - set - clear timeout", async() => {
  const cache = new Cache();
  cache.set("field", "value", 10);
  await sleep(5);
  cache.clearTimeout("field");
  await sleep(6);
  const val = cache.get("field");
  expect(val).toBeDefined();
  expect(val).toEqual("value");
});


test("cache - merge", async() => {
  const cache = new Cache();
  cache.set("field", {"key": "value"});
  const val = cache.get("field");
  expect(val).toBeDefined();
  expect(val.key).toBeDefined();
  expect(val.key).toEqual("value");
  cache.merge("field", {"key1": "value1"});
  const val2 = cache.get("field");
  expect(val2).toBeDefined();
  expect(val2.key).toBeDefined();
  expect(val2.key).toEqual("value");
  expect(val2.key1).toBeDefined();
  expect(val2.key1).toEqual("value1");
});
test("cache - merge from empty", async() => {
  const cache = new Cache();
  cache.merge("field", {"key": "value"});
  const val = cache.get("field");
  expect(val).toBeDefined();
  expect(val.key).toBeDefined();
  expect(val.key).toEqual("value");
});

