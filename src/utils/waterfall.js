

export default function waterfall(arr = [], func, start) {
  return arr.reduce(function(promise, val) {
    return promise.then(function(prevVal) {
      return func(val, prevVal);
    });
  }, Promise.resolve(start));
}
