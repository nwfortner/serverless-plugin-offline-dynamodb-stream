const { isNil, isFunction, map } = require('lodash');
const requireWithoutCache = require('require-without-cache');

const promisify = (foo) =>
  new Promise((resolve, reject) => {
    foo((error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });

const createHandler = (location, fn) => {
  const handler = requireWithoutCache(
    location + '/' + fn.handler.split('.')[0],
    require
  )[
    fn.handler
      .split('/')
      .pop()
      .split('.')[1]
  ];
  return (event, context = {}) =>
    promisify((cb) => {
      const maybeThennable = handler(event, context, cb);
      if (!isNil(maybeThennable) && isFunction(maybeThennable.then)) {
        maybeThennable.then((result) => cb(null, result)).catch((err) => {
          cb(err);
        });
      }
    });
};

const executeFunctions = (events = [], location, functions) => {
  return Promise.all(
    map(functions, (fn) => {
      const handler = createHandler(location, fn);
      return handler(events);
    })
  );
};

module.exports = executeFunctions;
