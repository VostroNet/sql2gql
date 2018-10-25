

export default function waterfall(arr = [], func) {
  return arr.reduce(function(promise, val) {
    return promise.then(function(prevVal) {
      return func(val, prevVal);
    });
  }, Promise.resolve());
}
