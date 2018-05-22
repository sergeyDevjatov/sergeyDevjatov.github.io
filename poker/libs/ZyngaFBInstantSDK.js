/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
 * @version   4.1.1
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define('es6-promise.auto',factory) :
	(global.ES6Promise = factory());
}(this, (function () { 'use strict';

function objectOrFunction(x) {
  var type = typeof x;
  return x !== null && (type === 'object' || type === 'function');
}

function isFunction(x) {
  return typeof x === 'function';
}

var _isArray = undefined;
if (Array.isArray) {
  _isArray = Array.isArray;
} else {
  _isArray = function (x) {
    return Object.prototype.toString.call(x) === '[object Array]';
  };
}

var isArray = _isArray;

var len = 0;
var vertxNext = undefined;
var customSchedulerFn = undefined;

var asap = function asap(callback, arg) {
  queue[len] = callback;
  queue[len + 1] = arg;
  len += 2;
  if (len === 2) {
    // If len is 2, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    if (customSchedulerFn) {
      customSchedulerFn(flush);
    } else {
      scheduleFlush();
    }
  }
};

function setScheduler(scheduleFn) {
  customSchedulerFn = scheduleFn;
}

function setAsap(asapFn) {
  asap = asapFn;
}

var browserWindow = typeof window !== 'undefined' ? window : undefined;
var browserGlobal = browserWindow || {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && ({}).toString.call(process) === '[object process]';

// test for web worker but not in IE10
var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

// node
function useNextTick() {
  // node version 0.10.x displays a deprecation warning when nextTick is used recursively
  // see https://github.com/cujojs/when/issues/410 for details
  return function () {
    return process.nextTick(flush);
  };
}

// vertx
function useVertxTimer() {
  if (typeof vertxNext !== 'undefined') {
    return function () {
      vertxNext(flush);
    };
  }

  return useSetTimeout();
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function () {
    node.data = iterations = ++iterations % 2;
  };
}

// web worker
function useMessageChannel() {
  var channel = new MessageChannel();
  channel.port1.onmessage = flush;
  return function () {
    return channel.port2.postMessage(0);
  };
}

function useSetTimeout() {
  // Store setTimeout reference so es6-promise will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var globalSetTimeout = setTimeout;
  return function () {
    return globalSetTimeout(flush, 1);
  };
}

var queue = new Array(1000);
function flush() {
  for (var i = 0; i < len; i += 2) {
    var callback = queue[i];
    var arg = queue[i + 1];

    callback(arg);

    queue[i] = undefined;
    queue[i + 1] = undefined;
  }

  len = 0;
}

function attemptVertx() {
  try {
    var r = require;
    var vertx = r('vertx');
    vertxNext = vertx.runOnLoop || vertx.runOnContext;
    return useVertxTimer();
  } catch (e) {
    return useSetTimeout();
  }
}

var scheduleFlush = undefined;
// Decide what async method to use to triggering processing of queued callbacks:
if (isNode) {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else if (isWorker) {
  scheduleFlush = useMessageChannel();
} else if (browserWindow === undefined && typeof require === 'function') {
  scheduleFlush = attemptVertx();
} else {
  scheduleFlush = useSetTimeout();
}

function then(onFulfillment, onRejection) {
  var _arguments = arguments;

  var parent = this;

  var child = new this.constructor(noop);

  if (child[PROMISE_ID] === undefined) {
    makePromise(child);
  }

  var _state = parent._state;

  if (_state) {
    (function () {
      var callback = _arguments[_state - 1];
      asap(function () {
        return invokeCallback(_state, child, callback, parent._result);
      });
    })();
  } else {
    subscribe(parent, child, onFulfillment, onRejection);
  }

  return child;
}

/**
  `Promise.resolve` returns a promise that will become resolved with the
  passed `value`. It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @static
  @param {Any} value value that the returned promise will be resolved with
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
function resolve$1(object) {
  /*jshint validthis:true */
  var Constructor = this;

  if (object && typeof object === 'object' && object.constructor === Constructor) {
    return object;
  }

  var promise = new Constructor(noop);
  resolve(promise, object);
  return promise;
}

var PROMISE_ID = Math.random().toString(36).substring(16);

function noop() {}

var PENDING = void 0;
var FULFILLED = 1;
var REJECTED = 2;

var GET_THEN_ERROR = new ErrorObject();

function selfFulfillment() {
  return new TypeError("You cannot resolve a promise with itself");
}

function cannotReturnOwn() {
  return new TypeError('A promises callback cannot return that same promise.');
}

function getThen(promise) {
  try {
    return promise.then;
  } catch (error) {
    GET_THEN_ERROR.error = error;
    return GET_THEN_ERROR;
  }
}

function tryThen(then$$1, value, fulfillmentHandler, rejectionHandler) {
  try {
    then$$1.call(value, fulfillmentHandler, rejectionHandler);
  } catch (e) {
    return e;
  }
}

function handleForeignThenable(promise, thenable, then$$1) {
  asap(function (promise) {
    var sealed = false;
    var error = tryThen(then$$1, thenable, function (value) {
      if (sealed) {
        return;
      }
      sealed = true;
      if (thenable !== value) {
        resolve(promise, value);
      } else {
        fulfill(promise, value);
      }
    }, function (reason) {
      if (sealed) {
        return;
      }
      sealed = true;

      reject(promise, reason);
    }, 'Settle: ' + (promise._label || ' unknown promise'));

    if (!sealed && error) {
      sealed = true;
      reject(promise, error);
    }
  }, promise);
}

function handleOwnThenable(promise, thenable) {
  if (thenable._state === FULFILLED) {
    fulfill(promise, thenable._result);
  } else if (thenable._state === REJECTED) {
    reject(promise, thenable._result);
  } else {
    subscribe(thenable, undefined, function (value) {
      return resolve(promise, value);
    }, function (reason) {
      return reject(promise, reason);
    });
  }
}

function handleMaybeThenable(promise, maybeThenable, then$$1) {
  if (maybeThenable.constructor === promise.constructor && then$$1 === then && maybeThenable.constructor.resolve === resolve$1) {
    handleOwnThenable(promise, maybeThenable);
  } else {
    if (then$$1 === GET_THEN_ERROR) {
      reject(promise, GET_THEN_ERROR.error);
      GET_THEN_ERROR.error = null;
    } else if (then$$1 === undefined) {
      fulfill(promise, maybeThenable);
    } else if (isFunction(then$$1)) {
      handleForeignThenable(promise, maybeThenable, then$$1);
    } else {
      fulfill(promise, maybeThenable);
    }
  }
}

function resolve(promise, value) {
  if (promise === value) {
    reject(promise, selfFulfillment());
  } else if (objectOrFunction(value)) {
    handleMaybeThenable(promise, value, getThen(value));
  } else {
    fulfill(promise, value);
  }
}

function publishRejection(promise) {
  if (promise._onerror) {
    promise._onerror(promise._result);
  }

  publish(promise);
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) {
    return;
  }

  promise._result = value;
  promise._state = FULFILLED;

  if (promise._subscribers.length !== 0) {
    asap(publish, promise);
  }
}

function reject(promise, reason) {
  if (promise._state !== PENDING) {
    return;
  }
  promise._state = REJECTED;
  promise._result = reason;

  asap(publishRejection, promise);
}

function subscribe(parent, child, onFulfillment, onRejection) {
  var _subscribers = parent._subscribers;
  var length = _subscribers.length;

  parent._onerror = null;

  _subscribers[length] = child;
  _subscribers[length + FULFILLED] = onFulfillment;
  _subscribers[length + REJECTED] = onRejection;

  if (length === 0 && parent._state) {
    asap(publish, parent);
  }
}

function publish(promise) {
  var subscribers = promise._subscribers;
  var settled = promise._state;

  if (subscribers.length === 0) {
    return;
  }

  var child = undefined,
      callback = undefined,
      detail = promise._result;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    if (child) {
      invokeCallback(settled, child, callback, detail);
    } else {
      callback(detail);
    }
  }

  promise._subscribers.length = 0;
}

function ErrorObject() {
  this.error = null;
}

var TRY_CATCH_ERROR = new ErrorObject();

function tryCatch(callback, detail) {
  try {
    return callback(detail);
  } catch (e) {
    TRY_CATCH_ERROR.error = e;
    return TRY_CATCH_ERROR;
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value = undefined,
      error = undefined,
      succeeded = undefined,
      failed = undefined;

  if (hasCallback) {
    value = tryCatch(callback, detail);

    if (value === TRY_CATCH_ERROR) {
      failed = true;
      error = value.error;
      value.error = null;
    } else {
      succeeded = true;
    }

    if (promise === value) {
      reject(promise, cannotReturnOwn());
      return;
    }
  } else {
    value = detail;
    succeeded = true;
  }

  if (promise._state !== PENDING) {
    // noop
  } else if (hasCallback && succeeded) {
      resolve(promise, value);
    } else if (failed) {
      reject(promise, error);
    } else if (settled === FULFILLED) {
      fulfill(promise, value);
    } else if (settled === REJECTED) {
      reject(promise, value);
    }
}

function initializePromise(promise, resolver) {
  try {
    resolver(function resolvePromise(value) {
      resolve(promise, value);
    }, function rejectPromise(reason) {
      reject(promise, reason);
    });
  } catch (e) {
    reject(promise, e);
  }
}

var id = 0;
function nextId() {
  return id++;
}

function makePromise(promise) {
  promise[PROMISE_ID] = id++;
  promise._state = undefined;
  promise._result = undefined;
  promise._subscribers = [];
}

function Enumerator$1(Constructor, input) {
  this._instanceConstructor = Constructor;
  this.promise = new Constructor(noop);

  if (!this.promise[PROMISE_ID]) {
    makePromise(this.promise);
  }

  if (isArray(input)) {
    this.length = input.length;
    this._remaining = input.length;

    this._result = new Array(this.length);

    if (this.length === 0) {
      fulfill(this.promise, this._result);
    } else {
      this.length = this.length || 0;
      this._enumerate(input);
      if (this._remaining === 0) {
        fulfill(this.promise, this._result);
      }
    }
  } else {
    reject(this.promise, validationError());
  }
}

function validationError() {
  return new Error('Array Methods must be provided an Array');
}

Enumerator$1.prototype._enumerate = function (input) {
  for (var i = 0; this._state === PENDING && i < input.length; i++) {
    this._eachEntry(input[i], i);
  }
};

Enumerator$1.prototype._eachEntry = function (entry, i) {
  var c = this._instanceConstructor;
  var resolve$$1 = c.resolve;

  if (resolve$$1 === resolve$1) {
    var _then = getThen(entry);

    if (_then === then && entry._state !== PENDING) {
      this._settledAt(entry._state, i, entry._result);
    } else if (typeof _then !== 'function') {
      this._remaining--;
      this._result[i] = entry;
    } else if (c === Promise$3) {
      var promise = new c(noop);
      handleMaybeThenable(promise, entry, _then);
      this._willSettleAt(promise, i);
    } else {
      this._willSettleAt(new c(function (resolve$$1) {
        return resolve$$1(entry);
      }), i);
    }
  } else {
    this._willSettleAt(resolve$$1(entry), i);
  }
};

Enumerator$1.prototype._settledAt = function (state, i, value) {
  var promise = this.promise;

  if (promise._state === PENDING) {
    this._remaining--;

    if (state === REJECTED) {
      reject(promise, value);
    } else {
      this._result[i] = value;
    }
  }

  if (this._remaining === 0) {
    fulfill(promise, this._result);
  }
};

Enumerator$1.prototype._willSettleAt = function (promise, i) {
  var enumerator = this;

  subscribe(promise, undefined, function (value) {
    return enumerator._settledAt(FULFILLED, i, value);
  }, function (reason) {
    return enumerator._settledAt(REJECTED, i, reason);
  });
};

/**
  `Promise.all` accepts an array of promises, and returns a new promise which
  is fulfilled with an array of fulfillment values for the passed promises, or
  rejected with the reason of the first passed promise to be rejected. It casts all
  elements of the passed iterable to promises as it runs this algorithm.

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = resolve(2);
  let promise3 = resolve(3);
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = reject(new Error("2"));
  let promise3 = reject(new Error("3"));
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @static
  @param {Array} entries array of promises
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
  @static
*/
function all$1(entries) {
  return new Enumerator$1(this, entries).promise;
}

/**
  `Promise.race` returns a new promise which is settled in the same way as the
  first passed promise to settle.

  Example:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 2');
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // result === 'promise 2' because it was resolved before promise1
    // was resolved.
  });
  ```

  `Promise.race` is deterministic in that only the state of the first
  settled promise matters. For example, even if other promises given to the
  `promises` array argument are resolved, but the first settled promise has
  become rejected before the other promises became fulfilled, the returned
  promise will become rejected:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error('promise 2'));
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // Code here never runs
  }, function(reason){
    // reason.message === 'promise 2' because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  An example real-world use case is implementing timeouts:

  ```javascript
  Promise.race([ajax('foo.json'), timeout(5000)])
  ```

  @method race
  @static
  @param {Array} promises array of promises to observe
  Useful for tooling.
  @return {Promise} a promise which settles in the same way as the first passed
  promise to settle.
*/
function race$1(entries) {
  /*jshint validthis:true */
  var Constructor = this;

  if (!isArray(entries)) {
    return new Constructor(function (_, reject) {
      return reject(new TypeError('You must pass an array to race.'));
    });
  } else {
    return new Constructor(function (resolve, reject) {
      var length = entries.length;
      for (var i = 0; i < length; i++) {
        Constructor.resolve(entries[i]).then(resolve, reject);
      }
    });
  }
}

/**
  `Promise.reject` returns a promise rejected with the passed `reason`.
  It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @static
  @param {Any} reason value that the returned promise will be rejected with.
  Useful for tooling.
  @return {Promise} a promise rejected with the given `reason`.
*/
function reject$1(reason) {
  /*jshint validthis:true */
  var Constructor = this;
  var promise = new Constructor(noop);
  reject(promise, reason);
  return promise;
}

function needsResolver() {
  throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
}

function needsNew() {
  throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
}

/**
  Promise objects represent the eventual result of an asynchronous operation. The
  primary way of interacting with a promise is through its `then` method, which
  registers callbacks to receive either a promise's eventual value or the reason
  why the promise cannot be fulfilled.

  Terminology
  -----------

  - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
  - `thenable` is an object or function that defines a `then` method.
  - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
  - `exception` is a value that is thrown using the throw statement.
  - `reason` is a value that indicates why a promise was rejected.
  - `settled` the final resting state of a promise, fulfilled or rejected.

  A promise can be in one of three states: pending, fulfilled, or rejected.

  Promises that are fulfilled have a fulfillment value and are in the fulfilled
  state.  Promises that are rejected have a rejection reason and are in the
  rejected state.  A fulfillment value is never a thenable.

  Promises can also be said to *resolve* a value.  If this value is also a
  promise, then the original promise's settled state will match the value's
  settled state.  So a promise that *resolves* a promise that rejects will
  itself reject, and a promise that *resolves* a promise that fulfills will
  itself fulfill.


  Basic Usage:
  ------------

  ```js
  let promise = new Promise(function(resolve, reject) {
    // on success
    resolve(value);

    // on failure
    reject(reason);
  });

  promise.then(function(value) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Advanced Usage:
  ---------------

  Promises shine when abstracting away asynchronous interactions such as
  `XMLHttpRequest`s.

  ```js
  function getJSON(url) {
    return new Promise(function(resolve, reject){
      let xhr = new XMLHttpRequest();

      xhr.open('GET', url);
      xhr.onreadystatechange = handler;
      xhr.responseType = 'json';
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send();

      function handler() {
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            resolve(this.response);
          } else {
            reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
          }
        }
      };
    });
  }

  getJSON('/posts.json').then(function(json) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Unlike callbacks, promises are great composable primitives.

  ```js
  Promise.all([
    getJSON('/posts'),
    getJSON('/comments')
  ]).then(function(values){
    values[0] // => postsJSON
    values[1] // => commentsJSON

    return values;
  });
  ```

  @class Promise
  @param {function} resolver
  Useful for tooling.
  @constructor
*/
function Promise$3(resolver) {
  this[PROMISE_ID] = nextId();
  this._result = this._state = undefined;
  this._subscribers = [];

  if (noop !== resolver) {
    typeof resolver !== 'function' && needsResolver();
    this instanceof Promise$3 ? initializePromise(this, resolver) : needsNew();
  }
}

Promise$3.all = all$1;
Promise$3.race = race$1;
Promise$3.resolve = resolve$1;
Promise$3.reject = reject$1;
Promise$3._setScheduler = setScheduler;
Promise$3._setAsap = setAsap;
Promise$3._asap = asap;

Promise$3.prototype = {
  constructor: Promise$3,

  /**
    The primary way of interacting with a promise is through its `then` method,
    which registers callbacks to receive either a promise's eventual value or the
    reason why the promise cannot be fulfilled.
  
    ```js
    findUser().then(function(user){
      // user is available
    }, function(reason){
      // user is unavailable, and you are given the reason why
    });
    ```
  
    Chaining
    --------
  
    The return value of `then` is itself a promise.  This second, 'downstream'
    promise is resolved with the return value of the first promise's fulfillment
    or rejection handler, or rejected if the handler throws an exception.
  
    ```js
    findUser().then(function (user) {
      return user.name;
    }, function (reason) {
      return 'default name';
    }).then(function (userName) {
      // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
      // will be `'default name'`
    });
  
    findUser().then(function (user) {
      throw new Error('Found user, but still unhappy');
    }, function (reason) {
      throw new Error('`findUser` rejected and we're unhappy');
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
      // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
    });
    ```
    If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
  
    ```js
    findUser().then(function (user) {
      throw new PedagogicalException('Upstream error');
    }).then(function (value) {
      // never reached
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // The `PedgagocialException` is propagated all the way down to here
    });
    ```
  
    Assimilation
    ------------
  
    Sometimes the value you want to propagate to a downstream promise can only be
    retrieved asynchronously. This can be achieved by returning a promise in the
    fulfillment or rejection handler. The downstream promise will then be pending
    until the returned promise is settled. This is called *assimilation*.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // The user's comments are now available
    });
    ```
  
    If the assimliated promise rejects, then the downstream promise will also reject.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // If `findCommentsByAuthor` fulfills, we'll have the value here
    }, function (reason) {
      // If `findCommentsByAuthor` rejects, we'll have the reason here
    });
    ```
  
    Simple Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let result;
  
    try {
      result = findResult();
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
    findResult(function(result, err){
      if (err) {
        // failure
      } else {
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findResult().then(function(result){
      // success
    }, function(reason){
      // failure
    });
    ```
  
    Advanced Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let author, books;
  
    try {
      author = findAuthor();
      books  = findBooksByAuthor(author);
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
  
    function foundBooks(books) {
  
    }
  
    function failure(reason) {
  
    }
  
    findAuthor(function(author, err){
      if (err) {
        failure(err);
        // failure
      } else {
        try {
          findBoooksByAuthor(author, function(books, err) {
            if (err) {
              failure(err);
            } else {
              try {
                foundBooks(books);
              } catch(reason) {
                failure(reason);
              }
            }
          });
        } catch(error) {
          failure(err);
        }
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findAuthor().
      then(findBooksByAuthor).
      then(function(books){
        // found books
    }).catch(function(reason){
      // something went wrong
    });
    ```
  
    @method then
    @param {Function} onFulfilled
    @param {Function} onRejected
    Useful for tooling.
    @return {Promise}
  */
  then: then,

  /**
    `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
    as the catch block of a try/catch statement.
  
    ```js
    function findAuthor(){
      throw new Error('couldn't find that author');
    }
  
    // synchronous
    try {
      findAuthor();
    } catch(reason) {
      // something went wrong
    }
  
    // async with promises
    findAuthor().catch(function(reason){
      // something went wrong
    });
    ```
  
    @method catch
    @param {Function} onRejection
    Useful for tooling.
    @return {Promise}
  */
  'catch': function _catch(onRejection) {
    return this.then(null, onRejection);
  }
};

/*global self*/
function polyfill$1() {
    var local = undefined;

    if (typeof global !== 'undefined') {
        local = global;
    } else if (typeof self !== 'undefined') {
        local = self;
    } else {
        try {
            local = Function('return this')();
        } catch (e) {
            throw new Error('polyfill failed because global object is unavailable in this environment');
        }
    }

    var P = local.Promise;

    if (P) {
        var promiseToString = null;
        try {
            promiseToString = Object.prototype.toString.call(P.resolve());
        } catch (e) {
            // silently ignored
        }

        if (promiseToString === '[object Promise]' && !P.cast) {
            return;
        }
    }

    local.Promise = Promise$3;
}

// Strange compat..
Promise$3.polyfill = polyfill$1;
Promise$3.Promise = Promise$3;

Promise$3.polyfill();

return Promise$3;

})));

//# sourceMappingURL=es6-promise.auto.map
;

/**
 * @license almond 0.3.3 Copyright jQuery Foundation and other contributors.
 * Released under MIT license, http://github.com/requirejs/almond/LICENSE
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part, normalizedBaseParts,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name) {
            name = name.split('/');
            lastIndex = name.length - 1;

            // If wanting node ID compatibility, strip .js from end
            // of IDs. Have to do this here, and not in nameToUrl
            // because node allows either .js or non .js to map
            // to same file.
            if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
            }

            // Starts with a '.' so need the baseName
            if (name[0].charAt(0) === '.' && baseParts) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that 'directory' and not name of the baseName's
                //module. For instance, baseName of 'one/two/three', maps to
                //'one/two/three.js', but we want the directory, 'one/two' for
                //this normalization.
                normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                name = normalizedBaseParts.concat(name);
            }

            //start trimDots
            for (i = 0; i < name.length; i++) {
                part = name[i];
                if (part === '.') {
                    name.splice(i, 1);
                    i -= 1;
                } else if (part === '..') {
                    // If at the start, or previous value is still ..,
                    // keep them so that when converted to a path it may
                    // still work when converted to a path, even though
                    // as an ID it is less than ideal. In larger point
                    // releases, may be better to just kick out an error.
                    if (i === 0 || (i === 1 && name[2] === '..') || name[i - 1] === '..') {
                        continue;
                    } else if (i > 0) {
                        name.splice(i - 1, 2);
                        i -= 2;
                    }
                }
            }
            //end trimDots

            name = name.join('/');
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    //Creates a parts array for a relName where first part is plugin ID,
    //second part is resource ID. Assumes relName has already been normalized.
    function makeRelParts(relName) {
        return relName ? splitPrefix(relName) : [];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relParts) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0],
            relResourceName = relParts[1];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relResourceName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relResourceName));
            } else {
                name = normalize(name, relResourceName);
            }
        } else {
            name = normalize(name, relResourceName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i, relParts,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;
        relParts = makeRelParts(relName);

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relParts);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, makeRelParts(callback)).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {
        if (typeof name !== 'string') {
            throw new Error('See almond README: incorrect module build, no module name');
        }

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("almond", function(){});


/**
 * [js-md5]{@link https://github.com/emn178/js-md5}
 *
 * @namespace md5
 * @version 0.4.2
 * @author Chen, Yi-Cyuan [emn178@gmail.com]
 * @copyright Chen, Yi-Cyuan 2014-2017
 * @license MIT
 */
(function () {
  'use strict';

  var root = typeof window === 'object' ? window : {};
  var NODE_JS = !root.JS_MD5_NO_NODE_JS && typeof process === 'object' && process.versions && process.versions.node;
  if (NODE_JS) {
    root = global;
  }
  var COMMON_JS = !root.JS_MD5_NO_COMMON_JS && typeof module === 'object' && module.exports;
  var AMD = typeof define === 'function' && define.amd;
  var ARRAY_BUFFER = !root.JS_MD5_NO_ARRAY_BUFFER && typeof ArrayBuffer !== 'undefined';
  var HEX_CHARS = '0123456789abcdef'.split('');
  var EXTRA = [128, 32768, 8388608, -2147483648];
  var SHIFT = [0, 8, 16, 24];
  var OUTPUT_TYPES = ['hex', 'array', 'digest', 'buffer', 'arrayBuffer'];

  var blocks = [], buffer8;
  if (ARRAY_BUFFER) {
    var buffer = new ArrayBuffer(68);
    buffer8 = new Uint8Array(buffer);
    blocks = new Uint32Array(buffer);
  }

  /**
   * @method hex
   * @memberof md5
   * @description Output hash as hex string
   * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
   * @returns {String} Hex string
   * @example
   * md5.hex('The quick brown fox jumps over the lazy dog');
   * // equal to
   * md5('The quick brown fox jumps over the lazy dog');
   */
  /**
   * @method digest
   * @memberof md5
   * @description Output hash as bytes array
   * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
   * @returns {Array} Bytes array
   * @example
   * md5.digest('The quick brown fox jumps over the lazy dog');
   */
  /**
   * @method array
   * @memberof md5
   * @description Output hash as bytes array
   * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
   * @returns {Array} Bytes array
   * @example
   * md5.array('The quick brown fox jumps over the lazy dog');
   */
  /**
   * @method arrayBuffer
   * @memberof md5
   * @description Output hash as ArrayBuffer
   * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
   * @returns {ArrayBuffer} ArrayBuffer
   * @example
   * md5.arrayBuffer('The quick brown fox jumps over the lazy dog');
   */
  /**
   * @method buffer
   * @deprecated This maybe confuse with Buffer in node.js. Please use arrayBuffer instead.
   * @memberof md5
   * @description Output hash as ArrayBuffer
   * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
   * @returns {ArrayBuffer} ArrayBuffer
   * @example
   * md5.buffer('The quick brown fox jumps over the lazy dog');
   */
  var createOutputMethod = function (outputType) {
    return function (message) {
      return new Md5(true).update(message)[outputType]();
    };
  };

  /**
   * @method create
   * @memberof md5
   * @description Create Md5 object
   * @returns {Md5} Md5 object.
   * @example
   * var hash = md5.create();
   */
  /**
   * @method update
   * @memberof md5
   * @description Create and update Md5 object
   * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
   * @returns {Md5} Md5 object.
   * @example
   * var hash = md5.update('The quick brown fox jumps over the lazy dog');
   * // equal to
   * var hash = md5.create();
   * hash.update('The quick brown fox jumps over the lazy dog');
   */
  var createMethod = function () {
    var method = createOutputMethod('hex');
    if (NODE_JS) {
      method = nodeWrap(method);
    }
    method.create = function () {
      return new Md5();
    };
    method.update = function (message) {
      return method.create().update(message);
    };
    for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
      var type = OUTPUT_TYPES[i];
      method[type] = createOutputMethod(type);
    }
    return method;
  };

  var nodeWrap = function (method) {
    var crypto = require('crypto');
    var Buffer = require('buffer').Buffer;
    var nodeMethod = function (message) {
      if (typeof message === 'string') {
        return crypto.createHash('md5').update(message, 'utf8').digest('hex');
      } else if (message.constructor === ArrayBuffer) {
        message = new Uint8Array(message);
      } else if (message.length === undefined) {
        return method(message);
      }
      return crypto.createHash('md5').update(new Buffer(message)).digest('hex');
    };
    return nodeMethod;
  };

  /**
   * Md5 class
   * @class Md5
   * @description This is internal class.
   * @see {@link md5.create}
   */
  function Md5(sharedMemory) {
    if (sharedMemory) {
      blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] =
      blocks[4] = blocks[5] = blocks[6] = blocks[7] =
      blocks[8] = blocks[9] = blocks[10] = blocks[11] =
      blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
      this.blocks = blocks;
      this.buffer8 = buffer8;
    } else {
      if (ARRAY_BUFFER) {
        var buffer = new ArrayBuffer(68);
        this.buffer8 = new Uint8Array(buffer);
        this.blocks = new Uint32Array(buffer);
      } else {
        this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      }
    }
    this.h0 = this.h1 = this.h2 = this.h3 = this.start = this.bytes = 0;
    this.finalized = this.hashed = false;
    this.first = true;
  }

  /**
   * @method update
   * @memberof Md5
   * @instance
   * @description Update hash
   * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
   * @returns {Md5} Md5 object.
   * @see {@link md5.update}
   */
  Md5.prototype.update = function (message) {
    if (this.finalized) {
      return;
    }
    var notString = typeof(message) != 'string';
    if (notString && message.constructor == root.ArrayBuffer) {
      message = new Uint8Array(message);
    }
    var code, index = 0, i, length = message.length || 0, blocks = this.blocks;
    var buffer8 = this.buffer8;

    while (index < length) {
      if (this.hashed) {
        this.hashed = false;
        blocks[0] = blocks[16];
        blocks[16] = blocks[1] = blocks[2] = blocks[3] =
        blocks[4] = blocks[5] = blocks[6] = blocks[7] =
        blocks[8] = blocks[9] = blocks[10] = blocks[11] =
        blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
      }

      if (notString) {
        if (ARRAY_BUFFER) {
          for (i = this.start; index < length && i < 64; ++index) {
            buffer8[i++] = message[index];
          }
        } else {
          for (i = this.start; index < length && i < 64; ++index) {
            blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
          }
        }
      } else {
        if (ARRAY_BUFFER) {
          for (i = this.start; index < length && i < 64; ++index) {
            code = message.charCodeAt(index);
            if (code < 0x80) {
              buffer8[i++] = code;
            } else if (code < 0x800) {
              buffer8[i++] = 0xc0 | (code >> 6);
              buffer8[i++] = 0x80 | (code & 0x3f);
            } else if (code < 0xd800 || code >= 0xe000) {
              buffer8[i++] = 0xe0 | (code >> 12);
              buffer8[i++] = 0x80 | ((code >> 6) & 0x3f);
              buffer8[i++] = 0x80 | (code & 0x3f);
            } else {
              code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
              buffer8[i++] = 0xf0 | (code >> 18);
              buffer8[i++] = 0x80 | ((code >> 12) & 0x3f);
              buffer8[i++] = 0x80 | ((code >> 6) & 0x3f);
              buffer8[i++] = 0x80 | (code & 0x3f);
            }
          }
        } else {
          for (i = this.start; index < length && i < 64; ++index) {
            code = message.charCodeAt(index);
            if (code < 0x80) {
              blocks[i >> 2] |= code << SHIFT[i++ & 3];
            } else if (code < 0x800) {
              blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i++ & 3];
              blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
            } else if (code < 0xd800 || code >= 0xe000) {
              blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i++ & 3];
              blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
              blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
            } else {
              code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
              blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i++ & 3];
              blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i++ & 3];
              blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
              blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
            }
          }
        }
      }
      this.lastByteIndex = i;
      this.bytes += i - this.start;
      if (i >= 64) {
        this.start = i - 64;
        this.hash();
        this.hashed = true;
      } else {
        this.start = i;
      }
    }
    return this;
  };

  Md5.prototype.finalize = function () {
    if (this.finalized) {
      return;
    }
    this.finalized = true;
    var blocks = this.blocks, i = this.lastByteIndex;
    blocks[i >> 2] |= EXTRA[i & 3];
    if (i >= 56) {
      if (!this.hashed) {
        this.hash();
      }
      blocks[0] = blocks[16];
      blocks[16] = blocks[1] = blocks[2] = blocks[3] =
      blocks[4] = blocks[5] = blocks[6] = blocks[7] =
      blocks[8] = blocks[9] = blocks[10] = blocks[11] =
      blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
    }
    blocks[14] = this.bytes << 3;
    this.hash();
  };

  Md5.prototype.hash = function () {
    var a, b, c, d, bc, da, blocks = this.blocks;

    if (this.first) {
      a = blocks[0] - 680876937;
      a = (a << 7 | a >>> 25) - 271733879 << 0;
      d = (-1732584194 ^ a & 2004318071) + blocks[1] - 117830708;
      d = (d << 12 | d >>> 20) + a << 0;
      c = (-271733879 ^ (d & (a ^ -271733879))) + blocks[2] - 1126478375;
      c = (c << 17 | c >>> 15) + d << 0;
      b = (a ^ (c & (d ^ a))) + blocks[3] - 1316259209;
      b = (b << 22 | b >>> 10) + c << 0;
    } else {
      a = this.h0;
      b = this.h1;
      c = this.h2;
      d = this.h3;
      a += (d ^ (b & (c ^ d))) + blocks[0] - 680876936;
      a = (a << 7 | a >>> 25) + b << 0;
      d += (c ^ (a & (b ^ c))) + blocks[1] - 389564586;
      d = (d << 12 | d >>> 20) + a << 0;
      c += (b ^ (d & (a ^ b))) + blocks[2] + 606105819;
      c = (c << 17 | c >>> 15) + d << 0;
      b += (a ^ (c & (d ^ a))) + blocks[3] - 1044525330;
      b = (b << 22 | b >>> 10) + c << 0;
    }

    a += (d ^ (b & (c ^ d))) + blocks[4] - 176418897;
    a = (a << 7 | a >>> 25) + b << 0;
    d += (c ^ (a & (b ^ c))) + blocks[5] + 1200080426;
    d = (d << 12 | d >>> 20) + a << 0;
    c += (b ^ (d & (a ^ b))) + blocks[6] - 1473231341;
    c = (c << 17 | c >>> 15) + d << 0;
    b += (a ^ (c & (d ^ a))) + blocks[7] - 45705983;
    b = (b << 22 | b >>> 10) + c << 0;
    a += (d ^ (b & (c ^ d))) + blocks[8] + 1770035416;
    a = (a << 7 | a >>> 25) + b << 0;
    d += (c ^ (a & (b ^ c))) + blocks[9] - 1958414417;
    d = (d << 12 | d >>> 20) + a << 0;
    c += (b ^ (d & (a ^ b))) + blocks[10] - 42063;
    c = (c << 17 | c >>> 15) + d << 0;
    b += (a ^ (c & (d ^ a))) + blocks[11] - 1990404162;
    b = (b << 22 | b >>> 10) + c << 0;
    a += (d ^ (b & (c ^ d))) + blocks[12] + 1804603682;
    a = (a << 7 | a >>> 25) + b << 0;
    d += (c ^ (a & (b ^ c))) + blocks[13] - 40341101;
    d = (d << 12 | d >>> 20) + a << 0;
    c += (b ^ (d & (a ^ b))) + blocks[14] - 1502002290;
    c = (c << 17 | c >>> 15) + d << 0;
    b += (a ^ (c & (d ^ a))) + blocks[15] + 1236535329;
    b = (b << 22 | b >>> 10) + c << 0;
    a += (c ^ (d & (b ^ c))) + blocks[1] - 165796510;
    a = (a << 5 | a >>> 27) + b << 0;
    d += (b ^ (c & (a ^ b))) + blocks[6] - 1069501632;
    d = (d << 9 | d >>> 23) + a << 0;
    c += (a ^ (b & (d ^ a))) + blocks[11] + 643717713;
    c = (c << 14 | c >>> 18) + d << 0;
    b += (d ^ (a & (c ^ d))) + blocks[0] - 373897302;
    b = (b << 20 | b >>> 12) + c << 0;
    a += (c ^ (d & (b ^ c))) + blocks[5] - 701558691;
    a = (a << 5 | a >>> 27) + b << 0;
    d += (b ^ (c & (a ^ b))) + blocks[10] + 38016083;
    d = (d << 9 | d >>> 23) + a << 0;
    c += (a ^ (b & (d ^ a))) + blocks[15] - 660478335;
    c = (c << 14 | c >>> 18) + d << 0;
    b += (d ^ (a & (c ^ d))) + blocks[4] - 405537848;
    b = (b << 20 | b >>> 12) + c << 0;
    a += (c ^ (d & (b ^ c))) + blocks[9] + 568446438;
    a = (a << 5 | a >>> 27) + b << 0;
    d += (b ^ (c & (a ^ b))) + blocks[14] - 1019803690;
    d = (d << 9 | d >>> 23) + a << 0;
    c += (a ^ (b & (d ^ a))) + blocks[3] - 187363961;
    c = (c << 14 | c >>> 18) + d << 0;
    b += (d ^ (a & (c ^ d))) + blocks[8] + 1163531501;
    b = (b << 20 | b >>> 12) + c << 0;
    a += (c ^ (d & (b ^ c))) + blocks[13] - 1444681467;
    a = (a << 5 | a >>> 27) + b << 0;
    d += (b ^ (c & (a ^ b))) + blocks[2] - 51403784;
    d = (d << 9 | d >>> 23) + a << 0;
    c += (a ^ (b & (d ^ a))) + blocks[7] + 1735328473;
    c = (c << 14 | c >>> 18) + d << 0;
    b += (d ^ (a & (c ^ d))) + blocks[12] - 1926607734;
    b = (b << 20 | b >>> 12) + c << 0;
    bc = b ^ c;
    a += (bc ^ d) + blocks[5] - 378558;
    a = (a << 4 | a >>> 28) + b << 0;
    d += (bc ^ a) + blocks[8] - 2022574463;
    d = (d << 11 | d >>> 21) + a << 0;
    da = d ^ a;
    c += (da ^ b) + blocks[11] + 1839030562;
    c = (c << 16 | c >>> 16) + d << 0;
    b += (da ^ c) + blocks[14] - 35309556;
    b = (b << 23 | b >>> 9) + c << 0;
    bc = b ^ c;
    a += (bc ^ d) + blocks[1] - 1530992060;
    a = (a << 4 | a >>> 28) + b << 0;
    d += (bc ^ a) + blocks[4] + 1272893353;
    d = (d << 11 | d >>> 21) + a << 0;
    da = d ^ a;
    c += (da ^ b) + blocks[7] - 155497632;
    c = (c << 16 | c >>> 16) + d << 0;
    b += (da ^ c) + blocks[10] - 1094730640;
    b = (b << 23 | b >>> 9) + c << 0;
    bc = b ^ c;
    a += (bc ^ d) + blocks[13] + 681279174;
    a = (a << 4 | a >>> 28) + b << 0;
    d += (bc ^ a) + blocks[0] - 358537222;
    d = (d << 11 | d >>> 21) + a << 0;
    da = d ^ a;
    c += (da ^ b) + blocks[3] - 722521979;
    c = (c << 16 | c >>> 16) + d << 0;
    b += (da ^ c) + blocks[6] + 76029189;
    b = (b << 23 | b >>> 9) + c << 0;
    bc = b ^ c;
    a += (bc ^ d) + blocks[9] - 640364487;
    a = (a << 4 | a >>> 28) + b << 0;
    d += (bc ^ a) + blocks[12] - 421815835;
    d = (d << 11 | d >>> 21) + a << 0;
    da = d ^ a;
    c += (da ^ b) + blocks[15] + 530742520;
    c = (c << 16 | c >>> 16) + d << 0;
    b += (da ^ c) + blocks[2] - 995338651;
    b = (b << 23 | b >>> 9) + c << 0;
    a += (c ^ (b | ~d)) + blocks[0] - 198630844;
    a = (a << 6 | a >>> 26) + b << 0;
    d += (b ^ (a | ~c)) + blocks[7] + 1126891415;
    d = (d << 10 | d >>> 22) + a << 0;
    c += (a ^ (d | ~b)) + blocks[14] - 1416354905;
    c = (c << 15 | c >>> 17) + d << 0;
    b += (d ^ (c | ~a)) + blocks[5] - 57434055;
    b = (b << 21 | b >>> 11) + c << 0;
    a += (c ^ (b | ~d)) + blocks[12] + 1700485571;
    a = (a << 6 | a >>> 26) + b << 0;
    d += (b ^ (a | ~c)) + blocks[3] - 1894986606;
    d = (d << 10 | d >>> 22) + a << 0;
    c += (a ^ (d | ~b)) + blocks[10] - 1051523;
    c = (c << 15 | c >>> 17) + d << 0;
    b += (d ^ (c | ~a)) + blocks[1] - 2054922799;
    b = (b << 21 | b >>> 11) + c << 0;
    a += (c ^ (b | ~d)) + blocks[8] + 1873313359;
    a = (a << 6 | a >>> 26) + b << 0;
    d += (b ^ (a | ~c)) + blocks[15] - 30611744;
    d = (d << 10 | d >>> 22) + a << 0;
    c += (a ^ (d | ~b)) + blocks[6] - 1560198380;
    c = (c << 15 | c >>> 17) + d << 0;
    b += (d ^ (c | ~a)) + blocks[13] + 1309151649;
    b = (b << 21 | b >>> 11) + c << 0;
    a += (c ^ (b | ~d)) + blocks[4] - 145523070;
    a = (a << 6 | a >>> 26) + b << 0;
    d += (b ^ (a | ~c)) + blocks[11] - 1120210379;
    d = (d << 10 | d >>> 22) + a << 0;
    c += (a ^ (d | ~b)) + blocks[2] + 718787259;
    c = (c << 15 | c >>> 17) + d << 0;
    b += (d ^ (c | ~a)) + blocks[9] - 343485551;
    b = (b << 21 | b >>> 11) + c << 0;

    if (this.first) {
      this.h0 = a + 1732584193 << 0;
      this.h1 = b - 271733879 << 0;
      this.h2 = c - 1732584194 << 0;
      this.h3 = d + 271733878 << 0;
      this.first = false;
    } else {
      this.h0 = this.h0 + a << 0;
      this.h1 = this.h1 + b << 0;
      this.h2 = this.h2 + c << 0;
      this.h3 = this.h3 + d << 0;
    }
  };

  /**
   * @method hex
   * @memberof Md5
   * @instance
   * @description Output hash as hex string
   * @returns {String} Hex string
   * @see {@link md5.hex}
   * @example
   * hash.hex();
   */
  Md5.prototype.hex = function () {
    this.finalize();

    var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3;

    return HEX_CHARS[(h0 >> 4) & 0x0F] + HEX_CHARS[h0 & 0x0F] +
       HEX_CHARS[(h0 >> 12) & 0x0F] + HEX_CHARS[(h0 >> 8) & 0x0F] +
       HEX_CHARS[(h0 >> 20) & 0x0F] + HEX_CHARS[(h0 >> 16) & 0x0F] +
       HEX_CHARS[(h0 >> 28) & 0x0F] + HEX_CHARS[(h0 >> 24) & 0x0F] +
       HEX_CHARS[(h1 >> 4) & 0x0F] + HEX_CHARS[h1 & 0x0F] +
       HEX_CHARS[(h1 >> 12) & 0x0F] + HEX_CHARS[(h1 >> 8) & 0x0F] +
       HEX_CHARS[(h1 >> 20) & 0x0F] + HEX_CHARS[(h1 >> 16) & 0x0F] +
       HEX_CHARS[(h1 >> 28) & 0x0F] + HEX_CHARS[(h1 >> 24) & 0x0F] +
       HEX_CHARS[(h2 >> 4) & 0x0F] + HEX_CHARS[h2 & 0x0F] +
       HEX_CHARS[(h2 >> 12) & 0x0F] + HEX_CHARS[(h2 >> 8) & 0x0F] +
       HEX_CHARS[(h2 >> 20) & 0x0F] + HEX_CHARS[(h2 >> 16) & 0x0F] +
       HEX_CHARS[(h2 >> 28) & 0x0F] + HEX_CHARS[(h2 >> 24) & 0x0F] +
       HEX_CHARS[(h3 >> 4) & 0x0F] + HEX_CHARS[h3 & 0x0F] +
       HEX_CHARS[(h3 >> 12) & 0x0F] + HEX_CHARS[(h3 >> 8) & 0x0F] +
       HEX_CHARS[(h3 >> 20) & 0x0F] + HEX_CHARS[(h3 >> 16) & 0x0F] +
       HEX_CHARS[(h3 >> 28) & 0x0F] + HEX_CHARS[(h3 >> 24) & 0x0F];
  };

  /**
   * @method toString
   * @memberof Md5
   * @instance
   * @description Output hash as hex string
   * @returns {String} Hex string
   * @see {@link md5.hex}
   * @example
   * hash.toString();
   */
  Md5.prototype.toString = Md5.prototype.hex;

  /**
   * @method digest
   * @memberof Md5
   * @instance
   * @description Output hash as bytes array
   * @returns {Array} Bytes array
   * @see {@link md5.digest}
   * @example
   * hash.digest();
   */
  Md5.prototype.digest = function () {
    this.finalize();

    var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3;
    return [
      h0 & 0xFF, (h0 >> 8) & 0xFF, (h0 >> 16) & 0xFF, (h0 >> 24) & 0xFF,
      h1 & 0xFF, (h1 >> 8) & 0xFF, (h1 >> 16) & 0xFF, (h1 >> 24) & 0xFF,
      h2 & 0xFF, (h2 >> 8) & 0xFF, (h2 >> 16) & 0xFF, (h2 >> 24) & 0xFF,
      h3 & 0xFF, (h3 >> 8) & 0xFF, (h3 >> 16) & 0xFF, (h3 >> 24) & 0xFF
    ];
  };

  /**
   * @method array
   * @memberof Md5
   * @instance
   * @description Output hash as bytes array
   * @returns {Array} Bytes array
   * @see {@link md5.array}
   * @example
   * hash.array();
   */
  Md5.prototype.array = Md5.prototype.digest;

  /**
   * @method arrayBuffer
   * @memberof Md5
   * @instance
   * @description Output hash as ArrayBuffer
   * @returns {ArrayBuffer} ArrayBuffer
   * @see {@link md5.arrayBuffer}
   * @example
   * hash.arrayBuffer();
   */
  Md5.prototype.arrayBuffer = function () {
    this.finalize();

    var buffer = new ArrayBuffer(16);
    var blocks = new Uint32Array(buffer);
    blocks[0] = this.h0;
    blocks[1] = this.h1;
    blocks[2] = this.h2;
    blocks[3] = this.h3;
    return buffer;
  };

  /**
   * @method buffer
   * @deprecated This maybe confuse with Buffer in node.js. Please use arrayBuffer instead.
   * @memberof Md5
   * @instance
   * @description Output hash as ArrayBuffer
   * @returns {ArrayBuffer} ArrayBuffer
   * @see {@link md5.buffer}
   * @example
   * hash.buffer();
   */
  Md5.prototype.buffer = Md5.prototype.arrayBuffer;

  var exports = createMethod();

  if (COMMON_JS) {
    module.exports = exports;
  } else {
    /**
     * @method md5
     * @description Md5 hash function, export to global in browsers.
     * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
     * @returns {String} md5 hashes
     * @example
     * md5(''); // d41d8cd98f00b204e9800998ecf8427e
     * md5('The quick brown fox jumps over the lazy dog'); // 9e107d9d372bb6826bd81d3542a419d6
     * md5('The quick brown fox jumps over the lazy dog.'); // e4d909c290d0fb1ca068ffaddf22cbd0
     *
     * // It also supports UTF-8 encoding
     * md5('中文'); // a7bac2239fcdcb3a067903d8077c4a07
     *
     * // It also supports byte `Array`, `Uint8Array`, `ArrayBuffer`
     * md5([]); // d41d8cd98f00b204e9800998ecf8427e
     * md5(new Uint8Array([])); // d41d8cd98f00b204e9800998ecf8427e
     */
    root.md5 = exports;
    if (AMD) {
      define('md5',[],function () {
        return exports;
      });
    }
  }
})();

define("ZyngaMd5", ["require", "exports", "md5"], function (require, exports, md5) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = md5; // Just a wrapper to rename a developer supplied md5 to ZyngaMd5
	return md5;
});


!function() {
    'use strict';
    function VNode() {}
    function h(nodeName, attributes) {
        var lastSimple, child, simple, i, children = EMPTY_CHILDREN;
        for (i = arguments.length; i-- > 2; ) stack.push(arguments[i]);
        if (attributes && null != attributes.children) {
            if (!stack.length) stack.push(attributes.children);
            delete attributes.children;
        }
        while (stack.length) if ((child = stack.pop()) && void 0 !== child.pop) for (i = child.length; i--; ) stack.push(child[i]); else {
            if ('boolean' == typeof child) child = null;
            if (simple = 'function' != typeof nodeName) if (null == child) child = ''; else if ('number' == typeof child) child = String(child); else if ('string' != typeof child) simple = !1;
            if (simple && lastSimple) children[children.length - 1] += child; else if (children === EMPTY_CHILDREN) children = [ child ]; else children.push(child);
            lastSimple = simple;
        }
        var p = new VNode();
        p.nodeName = nodeName;
        p.children = children;
        p.attributes = null == attributes ? void 0 : attributes;
        p.key = null == attributes ? void 0 : attributes.key;
        if (void 0 !== options.vnode) options.vnode(p);
        return p;
    }
    function extend(obj, props) {
        for (var i in props) obj[i] = props[i];
        return obj;
    }
    function cloneElement(vnode, props) {
        return h(vnode.nodeName, extend(extend({}, vnode.attributes), props), arguments.length > 2 ? [].slice.call(arguments, 2) : vnode.children);
    }
    function enqueueRender(component) {
        if (!component.__d && (component.__d = !0) && 1 == items.push(component)) (options.debounceRendering || defer)(rerender);
    }
    function rerender() {
        var p, list = items;
        items = [];
        while (p = list.pop()) if (p.__d) renderComponent(p);
    }
    function isSameNodeType(node, vnode, hydrating) {
        if ('string' == typeof vnode || 'number' == typeof vnode) return void 0 !== node.splitText;
        if ('string' == typeof vnode.nodeName) return !node._componentConstructor && isNamedNode(node, vnode.nodeName); else return hydrating || node._componentConstructor === vnode.nodeName;
    }
    function isNamedNode(node, nodeName) {
        return node.__n === nodeName || node.nodeName.toLowerCase() === nodeName.toLowerCase();
    }
    function getNodeProps(vnode) {
        var props = extend({}, vnode.attributes);
        props.children = vnode.children;
        var defaultProps = vnode.nodeName.defaultProps;
        if (void 0 !== defaultProps) for (var i in defaultProps) if (void 0 === props[i]) props[i] = defaultProps[i];
        return props;
    }
    function createNode(nodeName, isSvg) {
        var node = isSvg ? document.createElementNS('http://www.w3.org/2000/svg', nodeName) : document.createElement(nodeName);
        node.__n = nodeName;
        return node;
    }
    function removeNode(node) {
        var parentNode = node.parentNode;
        if (parentNode) parentNode.removeChild(node);
    }
    function setAccessor(node, name, old, value, isSvg) {
        if ('className' === name) name = 'class';
        if ('key' === name) ; else if ('ref' === name) {
            if (old) old(null);
            if (value) value(node);
        } else if ('class' === name && !isSvg) node.className = value || ''; else if ('style' === name) {
            if (!value || 'string' == typeof value || 'string' == typeof old) node.style.cssText = value || '';
            if (value && 'object' == typeof value) {
                if ('string' != typeof old) for (var i in old) if (!(i in value)) node.style[i] = '';
                for (var i in value) node.style[i] = 'number' == typeof value[i] && !1 === IS_NON_DIMENSIONAL.test(i) ? value[i] + 'px' : value[i];
            }
        } else if ('dangerouslySetInnerHTML' === name) {
            if (value) node.innerHTML = value.__html || '';
        } else if ('o' == name[0] && 'n' == name[1]) {
            var useCapture = name !== (name = name.replace(/Capture$/, ''));
            name = name.toLowerCase().substring(2);
            if (value) {
                if (!old) node.addEventListener(name, eventProxy, useCapture);
            } else node.removeEventListener(name, eventProxy, useCapture);
            (node.__l || (node.__l = {}))[name] = value;
        } else if ('list' !== name && 'type' !== name && !isSvg && name in node) {
            setProperty(node, name, null == value ? '' : value);
            if (null == value || !1 === value) node.removeAttribute(name);
        } else {
            var ns = isSvg && name !== (name = name.replace(/^xlink\:?/, ''));
            if (null == value || !1 === value) if (ns) node.removeAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase()); else node.removeAttribute(name); else if ('function' != typeof value) if (ns) node.setAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase(), value); else node.setAttribute(name, value);
        }
    }
    function setProperty(node, name, value) {
        try {
            node[name] = value;
        } catch (e) {}
    }
    function eventProxy(e) {
        return this.__l[e.type](options.event && options.event(e) || e);
    }
    function flushMounts() {
        var c;
        while (c = mounts.pop()) {
            if (options.afterMount) options.afterMount(c);
            if (c.componentDidMount) c.componentDidMount();
        }
    }
    function diff(dom, vnode, context, mountAll, parent, componentRoot) {
        if (!diffLevel++) {
            isSvgMode = null != parent && void 0 !== parent.ownerSVGElement;
            hydrating = null != dom && !('__preactattr_' in dom);
        }
        var ret = idiff(dom, vnode, context, mountAll, componentRoot);
        if (parent && ret.parentNode !== parent) parent.appendChild(ret);
        if (!--diffLevel) {
            hydrating = !1;
            if (!componentRoot) flushMounts();
        }
        return ret;
    }
    function idiff(dom, vnode, context, mountAll, componentRoot) {
        var out = dom, prevSvgMode = isSvgMode;
        if (null == vnode || 'boolean' == typeof vnode) vnode = '';
        if ('string' == typeof vnode || 'number' == typeof vnode) {
            if (dom && void 0 !== dom.splitText && dom.parentNode && (!dom._component || componentRoot)) {
                if (dom.nodeValue != vnode) dom.nodeValue = vnode;
            } else {
                out = document.createTextNode(vnode);
                if (dom) {
                    if (dom.parentNode) dom.parentNode.replaceChild(out, dom);
                    recollectNodeTree(dom, !0);
                }
            }
            out.__preactattr_ = !0;
            return out;
        }
        var vnodeName = vnode.nodeName;
        if ('function' == typeof vnodeName) return buildComponentFromVNode(dom, vnode, context, mountAll);
        isSvgMode = 'svg' === vnodeName ? !0 : 'foreignObject' === vnodeName ? !1 : isSvgMode;
        vnodeName = String(vnodeName);
        if (!dom || !isNamedNode(dom, vnodeName)) {
            out = createNode(vnodeName, isSvgMode);
            if (dom) {
                while (dom.firstChild) out.appendChild(dom.firstChild);
                if (dom.parentNode) dom.parentNode.replaceChild(out, dom);
                recollectNodeTree(dom, !0);
            }
        }
        var fc = out.firstChild, props = out.__preactattr_, vchildren = vnode.children;
        if (null == props) {
            props = out.__preactattr_ = {};
            for (var a = out.attributes, i = a.length; i--; ) props[a[i].name] = a[i].value;
        }
        if (!hydrating && vchildren && 1 === vchildren.length && 'string' == typeof vchildren[0] && null != fc && void 0 !== fc.splitText && null == fc.nextSibling) {
            if (fc.nodeValue != vchildren[0]) fc.nodeValue = vchildren[0];
        } else if (vchildren && vchildren.length || null != fc) innerDiffNode(out, vchildren, context, mountAll, hydrating || null != props.dangerouslySetInnerHTML);
        diffAttributes(out, vnode.attributes, props);
        isSvgMode = prevSvgMode;
        return out;
    }
    function innerDiffNode(dom, vchildren, context, mountAll, isHydrating) {
        var j, c, f, vchild, child, originalChildren = dom.childNodes, children = [], keyed = {}, keyedLen = 0, min = 0, len = originalChildren.length, childrenLen = 0, vlen = vchildren ? vchildren.length : 0;
        if (0 !== len) for (var i = 0; i < len; i++) {
            var _child = originalChildren[i], props = _child.__preactattr_, key = vlen && props ? _child._component ? _child._component.__k : props.key : null;
            if (null != key) {
                keyedLen++;
                keyed[key] = _child;
            } else if (props || (void 0 !== _child.splitText ? isHydrating ? _child.nodeValue.trim() : !0 : isHydrating)) children[childrenLen++] = _child;
        }
        if (0 !== vlen) for (var i = 0; i < vlen; i++) {
            vchild = vchildren[i];
            child = null;
            var key = vchild.key;
            if (null != key) {
                if (keyedLen && void 0 !== keyed[key]) {
                    child = keyed[key];
                    keyed[key] = void 0;
                    keyedLen--;
                }
            } else if (!child && min < childrenLen) for (j = min; j < childrenLen; j++) if (void 0 !== children[j] && isSameNodeType(c = children[j], vchild, isHydrating)) {
                child = c;
                children[j] = void 0;
                if (j === childrenLen - 1) childrenLen--;
                if (j === min) min++;
                break;
            }
            child = idiff(child, vchild, context, mountAll);
            f = originalChildren[i];
            if (child && child !== dom && child !== f) if (null == f) dom.appendChild(child); else if (child === f.nextSibling) removeNode(f); else dom.insertBefore(child, f);
        }
        if (keyedLen) for (var i in keyed) if (void 0 !== keyed[i]) recollectNodeTree(keyed[i], !1);
        while (min <= childrenLen) if (void 0 !== (child = children[childrenLen--])) recollectNodeTree(child, !1);
    }
    function recollectNodeTree(node, unmountOnly) {
        var component = node._component;
        if (component) unmountComponent(component); else {
            if (null != node.__preactattr_ && node.__preactattr_.ref) node.__preactattr_.ref(null);
            if (!1 === unmountOnly || null == node.__preactattr_) removeNode(node);
            removeChildren(node);
        }
    }
    function removeChildren(node) {
        node = node.lastChild;
        while (node) {
            var next = node.previousSibling;
            recollectNodeTree(node, !0);
            node = next;
        }
    }
    function diffAttributes(dom, attrs, old) {
        var name;
        for (name in old) if ((!attrs || null == attrs[name]) && null != old[name]) setAccessor(dom, name, old[name], old[name] = void 0, isSvgMode);
        for (name in attrs) if (!('children' === name || 'innerHTML' === name || name in old && attrs[name] === ('value' === name || 'checked' === name ? dom[name] : old[name]))) setAccessor(dom, name, old[name], old[name] = attrs[name], isSvgMode);
    }
    function collectComponent(component) {
        var name = component.constructor.name;
        (components[name] || (components[name] = [])).push(component);
    }
    function createComponent(Ctor, props, context) {
        var inst, list = components[Ctor.name];
        if (Ctor.prototype && Ctor.prototype.render) {
            inst = new Ctor(props, context);
            Component.call(inst, props, context);
        } else {
            inst = new Component(props, context);
            inst.constructor = Ctor;
            inst.render = doRender;
        }
        if (list) for (var i = list.length; i--; ) if (list[i].constructor === Ctor) {
            inst.__b = list[i].__b;
            list.splice(i, 1);
            break;
        }
        return inst;
    }
    function doRender(props, state, context) {
        return this.constructor(props, context);
    }
    function setComponentProps(component, props, opts, context, mountAll) {
        if (!component.__x) {
            component.__x = !0;
            if (component.__r = props.ref) delete props.ref;
            if (component.__k = props.key) delete props.key;
            if (!component.base || mountAll) {
                if (component.componentWillMount) component.componentWillMount();
            } else if (component.componentWillReceiveProps) component.componentWillReceiveProps(props, context);
            if (context && context !== component.context) {
                if (!component.__c) component.__c = component.context;
                component.context = context;
            }
            if (!component.__p) component.__p = component.props;
            component.props = props;
            component.__x = !1;
            if (0 !== opts) if (1 === opts || !1 !== options.syncComponentUpdates || !component.base) renderComponent(component, 1, mountAll); else enqueueRender(component);
            if (component.__r) component.__r(component);
        }
    }
    function renderComponent(component, opts, mountAll, isChild) {
        if (!component.__x) {
            var rendered, inst, cbase, props = component.props, state = component.state, context = component.context, previousProps = component.__p || props, previousState = component.__s || state, previousContext = component.__c || context, isUpdate = component.base, nextBase = component.__b, initialBase = isUpdate || nextBase, initialChildComponent = component._component, skip = !1;
            if (isUpdate) {
                component.props = previousProps;
                component.state = previousState;
                component.context = previousContext;
                if (2 !== opts && component.shouldComponentUpdate && !1 === component.shouldComponentUpdate(props, state, context)) skip = !0; else if (component.componentWillUpdate) component.componentWillUpdate(props, state, context);
                component.props = props;
                component.state = state;
                component.context = context;
            }
            component.__p = component.__s = component.__c = component.__b = null;
            component.__d = !1;
            if (!skip) {
                rendered = component.render(props, state, context);
                if (component.getChildContext) context = extend(extend({}, context), component.getChildContext());
                var toUnmount, base, childComponent = rendered && rendered.nodeName;
                if ('function' == typeof childComponent) {
                    var childProps = getNodeProps(rendered);
                    inst = initialChildComponent;
                    if (inst && inst.constructor === childComponent && childProps.key == inst.__k) setComponentProps(inst, childProps, 1, context, !1); else {
                        toUnmount = inst;
                        component._component = inst = createComponent(childComponent, childProps, context);
                        inst.__b = inst.__b || nextBase;
                        inst.__u = component;
                        setComponentProps(inst, childProps, 0, context, !1);
                        renderComponent(inst, 1, mountAll, !0);
                    }
                    base = inst.base;
                } else {
                    cbase = initialBase;
                    toUnmount = initialChildComponent;
                    if (toUnmount) cbase = component._component = null;
                    if (initialBase || 1 === opts) {
                        if (cbase) cbase._component = null;
                        base = diff(cbase, rendered, context, mountAll || !isUpdate, initialBase && initialBase.parentNode, !0);
                    }
                }
                if (initialBase && base !== initialBase && inst !== initialChildComponent) {
                    var baseParent = initialBase.parentNode;
                    if (baseParent && base !== baseParent) {
                        baseParent.replaceChild(base, initialBase);
                        if (!toUnmount) {
                            initialBase._component = null;
                            recollectNodeTree(initialBase, !1);
                        }
                    }
                }
                if (toUnmount) unmountComponent(toUnmount);
                component.base = base;
                if (base && !isChild) {
                    var componentRef = component, t = component;
                    while (t = t.__u) (componentRef = t).base = base;
                    base._component = componentRef;
                    base._componentConstructor = componentRef.constructor;
                }
            }
            if (!isUpdate || mountAll) mounts.unshift(component); else if (!skip) {
                if (component.componentDidUpdate) component.componentDidUpdate(previousProps, previousState, previousContext);
                if (options.afterUpdate) options.afterUpdate(component);
            }
            if (null != component.__h) while (component.__h.length) component.__h.pop().call(component);
            if (!diffLevel && !isChild) flushMounts();
        }
    }
    function buildComponentFromVNode(dom, vnode, context, mountAll) {
        var c = dom && dom._component, originalComponent = c, oldDom = dom, isDirectOwner = c && dom._componentConstructor === vnode.nodeName, isOwner = isDirectOwner, props = getNodeProps(vnode);
        while (c && !isOwner && (c = c.__u)) isOwner = c.constructor === vnode.nodeName;
        if (c && isOwner && (!mountAll || c._component)) {
            setComponentProps(c, props, 3, context, mountAll);
            dom = c.base;
        } else {
            if (originalComponent && !isDirectOwner) {
                unmountComponent(originalComponent);
                dom = oldDom = null;
            }
            c = createComponent(vnode.nodeName, props, context);
            if (dom && !c.__b) {
                c.__b = dom;
                oldDom = null;
            }
            setComponentProps(c, props, 1, context, mountAll);
            dom = c.base;
            if (oldDom && dom !== oldDom) {
                oldDom._component = null;
                recollectNodeTree(oldDom, !1);
            }
        }
        return dom;
    }
    function unmountComponent(component) {
        if (options.beforeUnmount) options.beforeUnmount(component);
        var base = component.base;
        component.__x = !0;
        if (component.componentWillUnmount) component.componentWillUnmount();
        component.base = null;
        var inner = component._component;
        if (inner) unmountComponent(inner); else if (base) {
            if (base.__preactattr_ && base.__preactattr_.ref) base.__preactattr_.ref(null);
            component.__b = base;
            removeNode(base);
            collectComponent(component);
            removeChildren(base);
        }
        if (component.__r) component.__r(null);
    }
    function Component(props, context) {
        this.__d = !0;
        this.context = context;
        this.props = props;
        this.state = this.state || {};
    }
    function render(vnode, parent, merge) {
        return diff(merge, vnode, {}, !1, parent, !1);
    }
    var options = {};
    var stack = [];
    var EMPTY_CHILDREN = [];
    var defer = 'function' == typeof Promise ? Promise.resolve().then.bind(Promise.resolve()) : setTimeout;
    var IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;
    var items = [];
    var mounts = [];
    var diffLevel = 0;
    var isSvgMode = !1;
    var hydrating = !1;
    var components = {};
    extend(Component.prototype, {
        setState: function(state, callback) {
            var s = this.state;
            if (!this.__s) this.__s = extend({}, s);
            extend(s, 'function' == typeof state ? state(s, this.props) : state);
            if (callback) (this.__h = this.__h || []).push(callback);
            enqueueRender(this);
        },
        forceUpdate: function(callback) {
            if (callback) (this.__h = this.__h || []).push(callback);
            renderComponent(this, 2);
        },
        render: function() {}
    });
    var preact = {
        h: h,
        createElement: h,
        cloneElement: cloneElement,
        Component: Component,
        render: render,
        rerender: rerender,
        options: options
    };
    if ('undefined' != typeof module) module.exports = preact; else self.preact = preact;
}();
//# sourceMappingURL=preact.js.map;
define("preact", (function (global) {
    return function () {
        var ret, fn;
        return ret || global.preact;
    };
}(this)));


define("Zynga", ["require", "exports", "ZyngaCore"], function (require, exports, ZyngaCore) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ObjectAssign = ZyngaCore.ObjectAssign;
    var zyngaDefaultConfig = {
        authSocialNetworkID: 24,
        clientVersion: 'unset'
    };
    /**
     * Initialize Zynga Instant SDK
     * @param config - A config object.  Can include specific app overrides
     */
    function init(config) {
        var mergedConfig;
        var apps = config && config.apps || {};
        var keys = Object.keys(apps);
        var allKeys = keys.join('');
        var url = window.location.href;
        var fbAppId = ZyngaCore.ArrayFind(keys, function (key) {
            // return true we find the fb app id in the URL surrounded by non-digit chars
            return (url.match(new RegExp(".*[^0-9]" + key + "[^0-9].*", 'g')) !== null);
        });
        var overrides = {};
        if (fbAppId) {
            // We have app-specific overrides
            overrides = apps[fbAppId];
        }
        mergedConfig = ObjectAssign({}, zyngaDefaultConfig, config, overrides);
        delete mergedConfig.apps; // May have inherited this from "config", we don't wan it
        exports.Event.fire(exports.Events.CONFIG, mergedConfig);
    }
    exports.init = init;
    exports.Event = new ZyngaCore.EventMixin();
    exports.Events = {
        APP_ID: 'Zynga.AppId',
        CLIENT_VERSION: 'Zynga.ClientVersion',
        CONFIG: 'Zynga.Config',
        URL_BASE: 'Zynga.URLBase'
    };
    function setAppId(appId) {
        init({
            appId: appId
        });
    }
    exports.setAppId = setAppId;
    function setClientVersion(versionString) {
        exports.clientVersion = versionString;
        exports.Event.fire(exports.Events.CLIENT_VERSION, versionString);
    }
    exports.setClientVersion = setClientVersion;
    exports.apiURLBase = '/atg-turns/v1';
    function setApiURLBase(url) {
        exports.apiURLBase = url;
        exports.Event.fire(exports.Events.URL_BASE, url);
    }
    exports.setApiURLBase = setApiURLBase;
    function getApiURLBase(system) {
        return system ? exports.apiURLBase + "/" + system : exports.apiURLBase;
    }
    exports.getApiURLBase = getApiURLBase;
    function getAPIVersion() {
        /* In the format:
            a.b.c.z
    
            where:
              a = FB SDK Major version
              b = FB SDK Minor version
              c = FB SDK Debug version (not typically used, use 0)
              z = Zynga SDK version number, increment each time a release happens.
        */
        return '6.0.0.10';
    }
    exports.getAPIVersion = getAPIVersion;
    exports.Event.last(exports.Events.CONFIG, function (config) {
        if (config.clientVersion) {
            setClientVersion(config.clientVersion);
        }
        if (config.apiURLBase) {
            setApiURLBase(config.apiURLBase);
        }
        // NOTE: Important that this is last as setting it will kick off a lot of other
        //       processes that may rely on data set above.
        if (config.appId) {
            exports.Event.fire(exports.Events.APP_ID, config.appId);
        }
    });
});



var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define("ZyngaAccount", ["require", "exports", "Zynga", "ZyngaCore", "ZyngaInstant", "ZyngaNet"], function (require, exports, Zynga, ZyngaCore, ZyngaInstant, ZyngaNet) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ObjectAssign = ZyngaCore.ObjectAssign;
    var ANON_INFO_KEY = '__ZYNGA_ANON_INFO_';
    var PASSWD_MIN_LEN = 20;
    var PASSWD_MAX_LEN = 40;
    var RAND_CHAR_START = 35; // #
    var RAND_CHAR_END = 126; // ~
    var FBIG_INFO_KEY = '__ZYNGA_FBIG_INFO_';
    var FBIG_INFO_KEY_DRAFT6 = '__ZYNGA_FBIG_INFO_6_';
    var EARLY_RENEW_SECONDS = 30;
    var SN42_TOKEN_DURATION_SECONDS = 60 * 60 * 24 * 7; // 1 week
    var migrationHandler; // This can be set to handle account migrations
    var win = window;
    var localCache = win.localStorage || {
        getItem: function () { return null; },
        setItem: function () { return; }
    };
    var tokenMap = {};
    /********************/
    /* Helper functions */
    /********************/
    // anon info storage key
    function getStorageKeyAsync(keyType) {
        return Zynga.Event.last(Zynga.Events.APP_ID)
            .then(function (appId) {
            return Promise.resolve(keyType + appId);
        });
    }
    // Type checking helpers.  Very basic
    function isObject(x) {
        return typeof x === 'object';
    }
    function isString(x) {
        return typeof x === 'string';
    }
    function isNumber(x) {
        return typeof x === 'number';
    }
    function isInteger(x) {
        return isNumber(x) && (parseInt(x + '', 10) === x);
    }
    // Basic random string related helper function
    function getRandom(start, end) {
        return start + Math.round(Math.random() * (end - start));
    }
    function getRandomChar(startPos, endPos) {
        return String.fromCharCode(getRandom(startPos, endPos));
    }
    function getRandomString(length, charStartPos, charEndPos) {
        var chars = new Array(length);
        while (length >= 0) {
            chars[--length] = getRandomChar(charStartPos, charEndPos);
        }
        return chars.join('');
    }
    // For deep clone of objects
    function cloneObject(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    /**
     * URL and Base64 decodes a string
     * @param str URL and Base64 Encoded string
     */
    function urlBase64Decode(str) {
        return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    }
    function generatePassword() {
        var password = getRandomString(getRandom(PASSWD_MIN_LEN, PASSWD_MAX_LEN), RAND_CHAR_START, RAND_CHAR_END);
        var fixChar = getRandomString(1, 38, RAND_CHAR_END); // Get a new random char in the same range but ABOVE % (37)
        var fixedPassword = password.replace(/%/g, fixChar); // Replace all "%" chars with the new character.
        // There is a bug in FB Android apps where "%" chars can cause data corruption
        // on read.  To help prevent new users from suffering from this on older clients
        // we have this workaround in place to just not use "%"
        return fixedPassword;
    }
    function getNewFBIGAuthDetails(version) {
        if (version === void 0) { version = '1'; }
        return Promise.all([
            Zynga.Event.last(Zynga.Events.APP_ID),
            ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT) // Wait for SDK TOS acceptance
        ])
            .then(function (details) {
            var appID = details[0];
            var stringToSign = JSON.stringify({ a: appID });
            return ZyngaInstant.player.getSignedPlayerInfoAsync(stringToSign) // Get FB to sign out app id payload
                .then(function (playerInfo) {
                var token = "sn42v" + version + "." + playerInfo.getSignature(); // Signature is our actual token, prepend sn46.
                var _a = playerInfo.getSignature().split('.'), hashUrlBase64 = _a[0], dataUrlBase64 = _a[1];
                var data = JSON.parse(urlBase64Decode(dataUrlBase64));
                var authDetails = {
                    token: token,
                    userId: data.player_id,
                    expires: data.issued_at + SN42_TOKEN_DURATION_SECONDS
                };
                return Promise.resolve(authDetails);
            });
        });
    }
    win.leon = getNewFBIGAuthDetails;
    // tslint:disable:max-classes-per-file
    var SocialNetworkAccount = (function () {
        function SocialNetworkAccount() {
            this.noCreate = false;
            this.forceRefresh = false;
            this.fireEvents = true;
            this.accountDetails = {
                socialNetwork: null,
                token: '',
                userId: '',
                zid: 0,
                playerId: 0,
                expires: 0
            };
        }
        /**
         * Try and restore accountDetails from cache
         * @param cacheString Optional cache data to save the lookup
         */
        SocialNetworkAccount.prototype.fromCache = function (cache) {
            return Promise.resolve();
        };
        /**
         * Renew account details if needed or create a new one
         */
        SocialNetworkAccount.prototype.renew = function () {
            return Promise.resolve();
        };
        /**
         * Perform any migrations needed
         */
        SocialNetworkAccount.prototype.migrate = function () {
            return Promise.resolve();
        };
        /**
         * Broadcast new ready token
         */
        SocialNetworkAccount.prototype.broadcast = function () {
            if (this.fireEvents !== false) {
                exports.Event.fire(exports.Events.ACCOUNT_DETAILS, cloneObject(this.accountDetails));
            }
            return Promise.resolve();
        };
        /**
         * Write to cache if needed
         */
        SocialNetworkAccount.prototype.writeCache = function () {
            return Promise.resolve();
        };
        SocialNetworkAccount.prototype.getDetails = function () {
            return ObjectAssign({}, this.accountDetails);
        };
        return SocialNetworkAccount;
    }());
    /**
     * Zynga Anonymous Network (SN 24) Account
     */
    var ZyngaAnonNetworkAccount = (function (_super) {
        __extends(ZyngaAnonNetworkAccount, _super);
        function ZyngaAnonNetworkAccount() {
            var _this = _super.call(this) || this;
            _this.accountDetails.socialNetwork = 24;
            return _this;
        }
        /**
         * Try and restore accountDetails from caches or create a new one
         * @param cacheString Optional cache data to save the lookup
         */
        ZyngaAnonNetworkAccount.prototype.fromCache = function (cache) {
            var _this = this;
            var nowTimestamp = Math.floor(new Date().getTime() / 1000);
            var origCacheKey = null;
            return ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_INITIALIZED) // Wait for SDK initialization
                .then(function () { return getStorageKeyAsync(ANON_INFO_KEY); }) // Wait for sorage key name
                .then(function (storageKey) {
                var oldCacheKey = storageKey;
                var newCacheKey = storageKey + '_' + ZyngaInstant.player.getID();
                var cacheValue = localCache.getItem(newCacheKey) || localCache.getItem(oldCacheKey);
                origCacheKey = oldCacheKey;
                var data = null;
                if (cacheValue) {
                    try {
                        data = JSON.parse(cacheValue);
                    }
                    catch (e) {
                        data = null;
                    }
                }
                return Promise.resolve(data);
            })
                .then(function (cachedAccountData) {
                if (cachedAccountData) {
                    // Already have details, skip the next network call
                    return Promise.resolve(cachedAccountData);
                }
                else {
                    return ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT).then(function () {
                        return ZyngaInstant.player.getDataAsync([origCacheKey]).then(function (fbData) {
                            if (typeof fbData === 'object' && fbData[origCacheKey]) {
                                return Promise.resolve(fbData[origCacheKey]);
                            }
                            else {
                                return Promise.resolve(null);
                            }
                        });
                    });
                }
            })
                .then(function (existingAccountData) {
                var ad = _this.accountDetails; // deref
                if (ad && existingAccountData) {
                    ad.expires = existingAccountData.expires || ad.expires;
                    ad.password = existingAccountData.password || ad.password;
                    ad.token = existingAccountData.token || ad.token;
                    ad.userId = existingAccountData.userId || ad.userId;
                    ad.zid = existingAccountData.zid || ad.zid;
                    ad.playerId = existingAccountData.playerId && parseInt(existingAccountData.playerId.toString(), 10) || ad.playerId;
                }
                return Promise.resolve();
            });
        };
        /**
         * Renew account details if needed or create a new account
         */
        ZyngaAnonNetworkAccount.prototype.renew = function () {
            var _this = this;
            var renewPromise;
            if (this.accountDetails.userId) {
                // Existing account
                var nowTimestamp = Math.floor(new Date().getTime() / 1000);
                if (((this.accountDetails.expires - nowTimestamp) < EARLY_RENEW_SECONDS) || this.forceRefresh === true) {
                    renewPromise = Zynga.Event.last(Zynga.Events.APP_ID)
                        .then(function (appId) {
                        return ZyngaNet.api('POST', 'auth/issueToken', {
                            body: {
                                userId: _this.accountDetails.userId,
                                password: _this.accountDetails.password,
                                appId: appId
                            },
                            noAuth: true
                        });
                    })
                        .then(function (response) {
                        var body = response.body;
                        var xhr = response.xhr;
                        if (typeof body === 'object' && xhr.status === 200) {
                            var ad = _this.accountDetails;
                            ad.expires = body.expires;
                            ad.zid = parseInt(body.zid, 10);
                            ad.token = body.token;
                            if (_this.fireEvents !== false) {
                                exports.Event.fire(exports.Events.ACCOUNT_LOGIN, cloneObject(ad));
                            }
                            return Promise.resolve();
                        }
                        else {
                            var errorCat = xhr.getResponseHeader('Error-Category');
                            var errorMsg = xhr.getResponseHeader('Error-Message');
                            var errorType = 'unknown';
                            if (xhr.status === 500 &&
                                errorCat && errorCat.toString().toLowerCase() === 'auth.generalerror' &&
                                errorMsg && errorMsg.toString().toLowerCase() === 'invalid userid or password') {
                                // We care about this particular 500 error so give it a known error string
                                errorType = 'badlogin';
                            }
                            return Promise.reject({
                                errorType: errorType,
                                xhr: xhr,
                                body: body
                            });
                        }
                    });
                }
                else {
                    // Existing but not need to renew
                    renewPromise = Promise.resolve();
                }
            }
            else {
                // No existing account, create new
                var password_1 = generatePassword();
                // Create a new account unless we were told not to
                renewPromise = this.noCreate === true ? Promise.resolve() : Zynga.Event.last(Zynga.Events.APP_ID)
                    .then(function (appId) {
                    return ZyngaNet.api('POST', 'auth/registerDevice', {
                        body: {
                            password: password_1,
                            appId: appId
                        },
                        noAuth: true
                    });
                })
                    .then(function (response) {
                    var body = response.body;
                    var xhr = response.xhr;
                    if (typeof body === 'object' && xhr.status === 200) {
                        // Save Social Network ID and passowrd for later as well
                        var ad = _this.accountDetails; // De-ref once
                        ad.expires = body.expires;
                        ad.password = password_1;
                        ad.playerId = parseInt(body.playerId.toString(), 10);
                        ad.token = body.token;
                        ad.userId = body.userId;
                        ad.zid = body.zid;
                        // fire an event.  Useful for install tracking
                        if (_this.fireEvents) {
                            exports.Event.fire(exports.Events.ACCOUNT_CREATE, cloneObject(ad));
                        }
                    }
                    else {
                        return Promise.reject({
                            error: 'Account create failed',
                            xhr: xhr,
                            body: body
                        });
                    }
                    return Promise.resolve();
                });
            }
            if (!renewPromise) {
                return Promise.reject('Unknown account error');
            }
            return renewPromise;
        };
        /**
         * Perform any migrations needed
         */
        ZyngaAnonNetworkAccount.prototype.migrate = function () {
            // no migrations needed for SN24
            return Promise.resolve();
        };
        /**
         * Broadcast new ready token
         */
        ZyngaAnonNetworkAccount.prototype.broadcast = function () {
            return _super.prototype.broadcast.call(this);
        };
        /**
         * Write to cache if needed
         */
        ZyngaAnonNetworkAccount.prototype.writeCache = function () {
            var _this = this;
            return getStorageKeyAsync(ANON_INFO_KEY)
                .then(function (storageKey) {
                // Create a FB Instant write object
                var obj = {};
                var ad = _this.accountDetails;
                obj[storageKey] = ad;
                // First, store in localStorage, this will have the fastes future access pattern
                localCache.setItem(storageKey + '_' + ZyngaInstant.player.getID(), JSON.stringify(ad));
                // TODO: Check if this.accountDetails has changed and only do writes if it has
                // Persist it (should be cross device) with the instant SDK
                return ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT).then(function () {
                    return ZyngaInstant.player.setDataAsync(obj) // Tell the SDK to set the data
                        .then(ZyngaInstant.player.flushDataAsync) // Also make sure FB actually persists it to the cloud
                        .then(function () {
                        exports.Event.fire(exports.Events.ACCOUNT_PERSISTED, {
                            success: true,
                            account_data: cloneObject(ad),
                            error: null
                        });
                    })
                        .catch(function (e) {
                        exports.Event.fire(exports.Events.ACCOUNT_PERSISTED, {
                            success: false,
                            account_data: cloneObject(ad),
                            error: e
                        });
                    });
                });
            })
                .then(function () { return Promise.resolve(); });
        };
        ZyngaAnonNetworkAccount.prototype.getDetails = function () {
            return cloneObject(this.accountDetails);
        };
        return ZyngaAnonNetworkAccount;
    }(SocialNetworkAccount));
    /**
     * FBIG Social Network (SN 42) Account
     */
    var FBIGNetworkAccount = (function (_super) {
        __extends(FBIGNetworkAccount, _super);
        function FBIGNetworkAccount(fireEvents) {
            var _this = _super.call(this) || this;
            _this.accountDetails.socialNetwork = 42;
            return _this;
        }
        /**
         * Try and restore accountDetails from caches or create a new one
         * @param cacheString Optional cache data to save the lookup
         */
        FBIGNetworkAccount.prototype.fromCache = function (cache) {
            var _this = this;
            var nowTimestamp = Math.floor(new Date().getTime() / 1000);
            var cacheKey;
            return ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_INITIALIZED) // Wait for SDK initialization
                .then(function () { return getStorageKeyAsync(FBIG_INFO_KEY); }) // Wait for sorage key name
                .then(function (storageKey) {
                var localStorageKey = storageKey + '_' + ZyngaInstant.player.getID();
                var cacheValue = localCache.getItem(localStorageKey);
                cacheKey = storageKey;
                var data = null;
                if (cacheValue) {
                    try {
                        data = JSON.parse(cacheValue);
                    }
                    catch (e) {
                        data = null;
                    }
                }
                return Promise.resolve(data);
            })
                .then(function (cachedAccountData) {
                if (cachedAccountData) {
                    // Already have details, skip the next network call
                    return Promise.resolve(cachedAccountData);
                }
                else {
                    return ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT).then(function () {
                        return ZyngaInstant.player.getDataAsync([cacheKey]).then(function (fbData) {
                            if (typeof fbData === 'object' && fbData[cacheKey]) {
                                return Promise.resolve(fbData[cacheKey]);
                            }
                            else {
                                return Promise.resolve(null);
                            }
                        });
                    });
                }
            })
                .then(function (existingAccountData) {
                var ad = _this.accountDetails; // deref
                if (ad && existingAccountData && typeof existingAccountData === 'object') {
                    ad.expires = existingAccountData.expires || ad.expires;
                    ad.password = existingAccountData.password || ad.password;
                    ad.token = existingAccountData.token || ad.token;
                    ad.userId = existingAccountData.userId || ad.userId;
                    ad.zid = existingAccountData.zid || ad.zid;
                    ad.playerId = existingAccountData.playerId && parseInt(existingAccountData.playerId.toString(), 10) || ad.playerId;
                }
                return Promise.resolve();
            });
        };
        /**
         * Renew account details if needed or create a new account
         */
        FBIGNetworkAccount.prototype.renew = function () {
            var nowTimestamp = Math.floor(new Date().getTime() / 1000);
            var ad = this.accountDetails; // Dereference once as we use it a few times below
            if ((ad.expires - nowTimestamp) < EARLY_RENEW_SECONDS || this.forceRefresh === true) {
                // New or nearly expired account OR we are forcing a frefresh
                return getNewFBIGAuthDetails('1').then(function (fbigAuthDetails) {
                    ad.expires = fbigAuthDetails.expires;
                    ad.userId = fbigAuthDetails.userId;
                    ad.token = fbigAuthDetails.token;
                });
            }
            else {
                // Existing and not expired
                return Promise.resolve();
            }
        };
        /**
         * Perform any migrations needed
         */
        FBIGNetworkAccount.prototype.migrate = function () {
            var _this = this;
            var ad = this.accountDetails; // Dereference once as we use it a few times below
            var returnPromise = Promise.resolve();
            /**
             * Flow (a-z represent concurrent/async tasks):
             * 1a) Fetch SN24 details, renew if expired
             * 1b) Fetch current playerID for SN42 token
             * 2.1) If playerID is already assigned note it and the SN42 zid and exit
             * 2.2) If playerID is not assigned and SN24 details don't exist note SN42 zid as playerId
             * 2.3) If playerID is not assigned and SN24 details do exist, make note of migration
             * 2.3a) Associate SN24 token to SN42 using SN42 token as primary to identities/associate, note SN24 zid as playerId
             * 3a) Call playerid/assign with noted playerId from 2.2 or 2.3a
             * 4a) If was a migration, fire migration event
             * 4b) If was not migration but playerId was assigned fire account create event
             */
            var sn42AccountState;
            if (ad.zid <= 0 || ad.playerId <= 0) {
                // New account, probably, attempt migration from SN24
                var existingZyngaAnon_1 = new ZyngaAnonNetworkAccount();
                existingZyngaAnon_1.noCreate = true; // Make sure we don't create a new anon.  We only want existing
                existingZyngaAnon_1.fireEvents = false; // This is not our primary SN do don't broadcast acct details.
                // Fetch existing cached sn24 account information if it exists
                var existingDetailsPromise = existingZyngaAnon_1.fromCache()
                    .then(existingZyngaAnon_1.renew.bind(existingZyngaAnon_1))
                    .then(function () { return existingZyngaAnon_1.getDetails(); });
                // Fetch exising playerID info for sn42 account
                var currentPlayerIdInfoPromise = ZyngaNet.api('POST', '/playerid/get', {
                    useToken: ad.token
                }).then(function (playerIdResults) {
                    var currentInfo = {
                        playerId: null,
                        zid: null,
                        appId: null
                    };
                    var xhr = playerIdResults.xhr;
                    var results = playerIdResults.body;
                    var playerIdInfoPromise;
                    if (xhr.status === 200 && results && results.list && results.list.length > 0) {
                        var result_1 = results.list[0];
                        currentInfo.zid = parseInt(result_1.networkId.zid.toString(), 10);
                        playerIdInfoPromise = Zynga.Event.last(Zynga.Events.APP_ID).then(function (appId) {
                            var appKey = appId.toString();
                            var playerIdAppRecord = result_1.playerIds[appKey] || {};
                            var playerIdRecord = playerIdAppRecord[currentInfo.zid.toString()];
                            currentInfo.playerId = playerIdRecord
                                && playerIdRecord.playerId
                                && parseInt(playerIdRecord.playerId.toString(), 10)
                                || null;
                            currentInfo.appId = appId;
                            return Promise.resolve(currentInfo);
                        });
                    }
                    else {
                        playerIdInfoPromise = Promise.reject({
                            message: 'PlayerId fetch failed',
                            xhr: xhr,
                            results: results
                        });
                    }
                    return playerIdInfoPromise;
                });
                returnPromise = Promise.all([existingDetailsPromise, currentPlayerIdInfoPromise])
                    .then(function (value) {
                    var sn24AccountDetails = value[0];
                    var sn42PlayerIdInfo = value[1];
                    var zid = sn42PlayerIdInfo.zid;
                    if (zid > 0) {
                        _this.accountDetails.zid = zid;
                    }
                    if (sn42PlayerIdInfo.playerId && sn42PlayerIdInfo.playerId.toString().length > 0) {
                        // We already have a playerID so we must have just not saved/cached it before
                        _this.accountDetails.playerId = parseInt(sn42PlayerIdInfo.playerId.toString(), 10);
                        sn42AccountState = 'recovery';
                    }
                    else {
                        var sn24PlayerId = (sn24AccountDetails && sn24AccountDetails.playerId || '').toString();
                        var sn24Token = (sn24AccountDetails && sn24AccountDetails.token || '').toString();
                        var identityAssoicatePromise = Promise.resolve(); // By default no accociation needed
                        // Assume install for now
                        sn42AccountState = 'install';
                        _this.accountDetails.playerId = parseInt(sn42PlayerIdInfo.zid.toString(), 10); // Install, playerID should be 42zid
                        if (sn24PlayerId.length > 0 && sn24Token.length > 0) {
                            // Oh, look, a 24 account.  Migrate instead.  We probably have a playerId
                            sn42AccountState = 'migration';
                            var associateBody = {
                                token: {
                                    appId: sn42PlayerIdInfo.appId.toString(),
                                    snId: '24',
                                    userId: sn24AccountDetails.zid.toString(),
                                    session: sn24Token
                                }
                            };
                            identityAssoicatePromise = ZyngaNet.api('POST', 'identities/associate', {
                                useToken: _this.accountDetails.token,
                                body: associateBody
                            }).then(function (result) {
                                var xhr = result.xhr;
                                var associateResult = result.body;
                                if (xhr.status === 200 &&
                                    associateResult &&
                                    associateResult.mappings &&
                                    associateResult.mappings[sn24AccountDetails.zid.toString()] === '24') {
                                    _this.accountDetails.playerId = parseInt(sn24AccountDetails.playerId.toString(), 10);
                                    return Promise.resolve();
                                }
                                else {
                                    return Promise.reject({
                                        message: 'SN24 identity association filed',
                                        xhr: xhr,
                                        results: associateResult
                                    });
                                }
                            });
                        }
                        // Short circuit as we need to set playerId
                        return identityAssoicatePromise.then(function () {
                            return ZyngaNet.api('POST', 'playerid/assign', {
                                useToken: _this.accountDetails.token,
                                body: {
                                    playerId: _this.accountDetails.playerId
                                }
                            }).then(function (results) {
                                var xhr = results.xhr;
                                var body = results.body;
                                if (xhr.status === 200) {
                                    if (sn42AccountState === 'install') {
                                        exports.Event.fire(exports.Events.ACCOUNT_CREATE, cloneObject(_this.accountDetails));
                                    }
                                    else if (sn42AccountState === 'migration') {
                                        var migrationAccounts = {
                                            from: cloneObject(sn24AccountDetails),
                                            to: cloneObject(_this.accountDetails)
                                        };
                                        exports.Event.fire(exports.Events.ACCOUNT_MIGRATED, migrationAccounts);
                                    }
                                    return Promise.resolve();
                                }
                                else {
                                    return Promise.reject({
                                        message: 'SN42 palyerID assign failed',
                                        xhr: xhr,
                                        results: body
                                    });
                                }
                            });
                        });
                    }
                    return Promise.resolve();
                });
            }
            return returnPromise;
        };
        /**
         * Broadcast new ready token
         */
        FBIGNetworkAccount.prototype.broadcast = function () {
            return _super.prototype.broadcast.call(this);
        };
        /**
         * Write to cache if needed
         */
        FBIGNetworkAccount.prototype.writeCache = function () {
            var _this = this;
            return getStorageKeyAsync(FBIG_INFO_KEY)
                .then(function (storageKey) {
                // Create a FB Instant write object
                var obj = {};
                var ad = _this.accountDetails;
                obj[storageKey] = ad;
                // First, store in localStorage, this will have the fastes future access pattern
                localCache.setItem(storageKey + '_' + ZyngaInstant.player.getID(), JSON.stringify(ad));
                // TODO: Check if this.accountDetails has changed and only do writes if it has
                // Persist it (should be cross device) with the instant SDK
                return ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT).then(function () {
                    return ZyngaInstant.player.setDataAsync(obj) // Tell the SDK to set the data
                        .then(ZyngaInstant.player.flushDataAsync) // Also make sure FB actually persists it to the cloud
                        .then(function () {
                        exports.Event.fire(exports.Events.ACCOUNT_PERSISTED, {
                            success: true,
                            account_data: cloneObject(ad),
                            error: null
                        });
                    })
                        .catch(function (e) {
                        exports.Event.fire(exports.Events.ACCOUNT_PERSISTED, {
                            success: false,
                            account_data: cloneObject(ad),
                            error: e
                        });
                    });
                });
            })
                .then(function () { return Promise.resolve(); });
        };
        FBIGNetworkAccount.prototype.getDetails = function () {
            return cloneObject(this.accountDetails);
        };
        return FBIGNetworkAccount;
    }(SocialNetworkAccount));
    /****************************************/
    /* Init user account for social network */
    /****************************************/
    Promise.all([
        ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_INITIALIZED),
        Zynga.Event.last(Zynga.Events.CONFIG)
    ]).then(function (results) {
        var config = results[1];
        var snAccount;
        switch (config.authSocialNetworkID) {
            case exports.SOCIAL_NETWORKS.ZYNGA_ANONYMOUS:
                snAccount = new ZyngaAnonNetworkAccount();
                break;
            case exports.SOCIAL_NETWORKS.FACEBOOK_INSTANT_GAMES:
                snAccount = new FBIGNetworkAccount();
                break;
            default:
                throw new Error('No "authSocialNetwork" specified in zynga config');
        }
        // Get/Create/Renew social network auth data
        // NOTE: We need to bind back to snAccount or the class loses
        //       it's 'this' given these promises will take on the
        //       current scope.  At least least that's how I understand it.
        // TODO: Test wrapping this in a closure bound to snAccount.  May be more mainatinable.
        Promise.resolve()
            .then(snAccount.fromCache.bind(snAccount)) // Pull exisitng account info from cache/cloud
            .then(snAccount.renew.bind(snAccount)) // Renew token if needed.  Side-Effect: Can create/broadcast new account
            .then(snAccount.migrate.bind(snAccount)) // Perform any needed migrations
            .then(snAccount.broadcast.bind(snAccount)) // Broadcast out the account information
            .then(snAccount.writeCache.bind(snAccount)) // Write account/token data back to cache/cloud
            .then(function () {
            exports.Event.fire(exports.Events.ACCOUNT_SN_ACCOUNT, snAccount);
        });
    });
    ZyngaNet.registerRefreshTokenHandler(function (oldToken, callback) {
        var newToken = tokenMap[oldToken];
        if (newToken) {
            callback(newToken);
        }
        else {
            if (newToken === undefined) {
                // First one, fetch a new one
                var snAccount = exports.Event.getLastFiredValue(exports.Events.ACCOUNT_SN_ACCOUNT); // Current account
                if (snAccount) {
                    tokenMap[oldToken] = false; // Mark this token as refreshing
                    exports.Event.clearLastFiredValue(exports.Events.ACCOUNT_DETAILS); // clear this so other don't use this bad token
                    snAccount.noCreate = true;
                    snAccount.renew()
                        .then(snAccount.broadcast.bind(snAccount))
                        .then(snAccount.writeCache.bind(snAccount))
                        .then(function () {
                        snAccount.noCreate = false;
                    });
                }
                else {
                    // not account details?  Just fail
                    callback(false);
                    return;
                }
            }
            // Wait for new Account Details event
            exports.Event.once(exports.Events.ACCOUNT_DETAILS, function (nextAccountDetails) {
                var token = nextAccountDetails && nextAccountDetails.token;
                if (token && token !== oldToken && !tokenMap.hasOwnProperty[token]) {
                    // We have a token, it's different and it's not a bad one
                    for (var t in tokenMap) {
                        // Mark this as the new token for all old tokens.  Both replaced and waiting
                        if (tokenMap.hasOwnProperty(t) && tokenMap[t] !== undefined) {
                            tokenMap[t] = token;
                        }
                    }
                    callback(token);
                }
                else {
                    callback(false);
                }
            }, true);
        }
    });
    function debugFullResetUser() {
        Promise.all([
            getStorageKeyAsync(ANON_INFO_KEY),
            getStorageKeyAsync(FBIG_INFO_KEY),
            getStorageKeyAsync(FBIG_INFO_KEY_DRAFT6)
        ]).then(function (keys) {
            var resetKeys = {};
            keys.forEach(function (key) { return resetKeys[key] = null; });
            ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT).then(function () {
                ZyngaInstant.player.setDataAsync(resetKeys)
                    .then(ZyngaInstant.player.flushDataAsync);
                win.localStorage.clear();
            });
        });
    }
    exports.debugFullResetUser = debugFullResetUser;
    // waits to send the request until the user is authed.
    // tslint:disable-next-line:max-line-length
    function userAuthCall(method, path, args) {
        return Promise.all([Zynga.Event.last(Zynga.Events.APP_ID), exports.Event.last(exports.Events.ACCOUNT_DETAILS), Zynga.Event.last(Zynga.Events.URL_BASE)]).then(function (results) {
            var appId = results[0];
            var accountDetails = results[1];
            var options = {};
            if (Zynga.getApiURLBase().indexOf('localhost') > 0) {
                var headers = options.headers = options.headers || {};
                headers['App-Id'] = appId;
                headers['Player-Id'] = accountDetails.playerId;
                headers['Zid'] = accountDetails.zid;
            }
            var queryString = '';
            if (args) {
                if (method.toLowerCase() !== 'get') {
                    options.body = args;
                }
                else {
                    // pass options as query string.
                    var queryParams = [];
                    for (var paramName in args) {
                        var paramValue = args[paramName];
                        // encode and optionally turn arrays into comma separated list
                        paramValue = Array.isArray(paramValue) ? paramValue.map(encodeURI).join(',') : encodeURI(paramValue);
                        queryParams.push(paramName + '=' + paramValue);
                    }
                    queryString = queryParams.length > 0 ? ('?' + queryParams.join('&')) : '';
                }
            }
            options.useToken = accountDetails.token;
            return ZyngaNet.api(method, Zynga.getApiURLBase(path) + queryString, options);
        });
    }
    exports.userAuthCall = userAuthCall;
    exports.Event = new ZyngaCore.EventMixin();
    exports.Events = {
        ACCOUNT_CREATE: 'Account.Create',
        ACCOUNT_LOGIN: 'Account.Login',
        ACCOUNT_DETAILS: 'Account.Details',
        ACCOUNT_MISMATCH: 'Account.Mismatch',
        ACCOUNT_PASSWORD_FAIL: 'Account.PasswordFail',
        ACCOUNT_PERSISTED: 'Account.Persisted',
        ACCOUNT_MIGRATED: 'Account.Migrated',
        ACCOUNT_SN_ACCOUNT: 'Account.SN.Account'
    };
    exports.SOCIAL_NETWORKS = {
        ZYNGA_ANONYMOUS: 24,
        FACEBOOK_INSTANT_GAMES: 42
    };
});
/*
function getCachedAccountData() {
    return new Promise(function (resolve) {
        ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_INITIALIZED, function () {
            // Need to be initialized for Instant.player.getID() below
            getStorageKeyAsync().then(function (storageKey) {
                var oldCacheKey = storageKey;
                var newCacheKey = storageKey + '_' + ZyngaInstant.player.getID();
                var cacheValue = localCache.getItem(newCacheKey) || localCache.getItem(oldCacheKey);
                var data = false;
                if (cacheValue) {
                    try {
                        data = JSON.parse(cacheValue);
                    } catch (e) {
                        data = false;
                    }
                }
                resolve(data);
            });
        });
    });
}
*/
// Set account data.  Internal function.
// accountData: object - that contains account details.  See migration section for format
// hasChanged: boolean - accountData is known to be different from last fetch
// noFire: boolean - set to surpress ACCOUNT_DETAIL event firing
/*
function setValidAccountData(accountData, hasChanged, noFire) {

    if (noFire !== true) {
        Event.fire(Events.ACCOUNT_DETAILS, cloneObject(accountData));
    }

    if (hasChanged === true) {
        // Create object in the format setDataAsync expects

        getStorageKeyAsync().then(function (storageKey: string) {
            var obj = {};

            obj[storageKey] = accountData;

            // Persist it (should be cross device) with the instant SDK
            ZyngaInstant.player.setDataAsync(obj)       // Tell the SDK to set the data
                .then(ZyngaInstant.player.flushDataAsync) // Also make sure FB actually persists it to the cloud
                .then(function () {
                    Event.fire(Events.ACCOUNT_PERSISTED, {
                        success: true,
                        account_data: cloneObject(accountData),
                        error: null
                    });
                })
                .catch(function (e) {
                    Event.fire(Events.ACCOUNT_PERSISTED, {
                        success: false,
                        account_data: cloneObject(accountData),
                        error: e
                    });
                });

            // To be safe, store in localStorage as well in case we need it from there in the future #futureproofing
            localCache.setItem(storageKey + '_' + ZyngaInstant.player.getID(), JSON.stringify(accountData));

        });
    }
}
*/
/*
function passwordFixInjectPossibleChars(passwords, position, character) {
    var passwordsCopy;
    var i;

    character = character.toLowerCase();

    // First the lowercase case
    for (i = 0; i < passwords.length; i++) {
        passwords[i][position] = character;
    }
    // Now the upper case case so long as the character is (a-f)
    if (character !== character.toUpperCase()) {
        // copy the whole array to apply the upper case character to
        passwordsCopy = JSON.parse(JSON.stringify(passwords)); // JSON stringify/parse to do a recursive deep copy
        character = character.toUpperCase();
        // Replace the lower case character with the new upper case one
        // for every item in the copy
        for (i = 0; i < passwordsCopy.length; i++) {
            passwordsCopy[i][position] = character;
        }
        // Combine (double in length) the lower and upper case arrays
        passwords = passwords.concat(passwordsCopy);
    }
    return passwords;
}

function passwordFixGetPossibles(password) {
    var newPasswordParts = [];
    var newPasswords;
    var inserts = [];
    var charCode;
    var i;
    var j = 0;
    var startPos;
    var hexStr;
    for (i = 0; i < password.length; i++) {
        charCode = password.charCodeAt(i);
        if (charCode >= RAND_CHAR_START && charCode <= RAND_CHAR_END) {
            // Valid char, just add it
            newPasswordParts[j++] = password[i];
        } else {
            // Invalid char (out of range).  Facebook must have replaced %xx with this char.
            // Add a % and two empty chars to be filled in later
            newPasswordParts[j++] = '%';
            inserts.push([j, charCode]);
            newPasswordParts[j++] = '';
            newPasswordParts[j++] = '';
        }
    }
    // Start off with an array of one
    newPasswords = [newPasswordParts];

    for (i = 0; i < inserts.length; i++) {
        hexStr = inserts[i][1].toString(16);
        startPos = inserts[i][0];
        if (hexStr.length === 1) {
            // zero pad chars < 16
            hexStr = '0' + hexStr;
        }
        // Generate all possible combination of hex chars (upper and lower case) that
        // could be correct
        newPasswords = passwordFixInjectPossibleChars(newPasswords, startPos, hexStr[0]);
        newPasswords = passwordFixInjectPossibleChars(newPasswords, startPos + 1, hexStr[1]);
    }
    // Convert from arrays of chars to an array of strings
    return newPasswords.map(function (passwordChars) {
        return passwordChars.join('');
    });
}

// New "install".  Creates a new account.
function createAccount() {
    Zynga.Event.last(Zynga.Events.APP_ID, function (appId) {
        var password = generatePassword();
        ZyngaNet.api('POST', 'auth/registerDevice', {
            body: {
                password: password,
                appId: appId
            },
            noAuth: true
        }).then(
            function (response: any) {
                var body: any = response.body;
                var xhr = response.xhr;
                if (typeof body === 'object' && xhr.status === 200) {
                    // Save Social Network ID and passowrd for later as well
                    body.socialNetwork = SOCIAL_NETWORKS.ZYNGA_ANONYMOUS;
                    body.password = password;

                    // set new valid auth data.
                    setValidAccountData(body, true, false);

                    // fire an event.  Useful for install tracking
                    Event.fire(Events.ACCOUNT_CREATE, cloneObject(body));
                } else {
                    // TODO: error flow
                    // tslint:disable-next-line:no-console
                    console.log('Account create failed');
                }
            },
            function (error) {
                // TODO: error flow
                // tslint:disable-next-line:no-console
                console.log('Error during auth/registerDevice', error);
            }
            );
    });
}

// Issue a new token/expiry.
function issueToken(userId, password, appId) {
    return new Promise(function (resolve, reject) {
        ZyngaNet.api('POST', 'auth/issueToken', {
            body: {
                userId: userId,
                password: password,
                appId: appId
            },
            noAuth: true
        }).then(
            function (response) {
                var body = response.body;
                var xhr = response.xhr;
                if (typeof body === 'object' && xhr.status === 200) {
                    resolve(body);
                } else {
                    var errorCat = xhr.getResponseHeader('Error-Category');
                    var errorMsg = xhr.getResponseHeader('Error-Message');
                    var errorType = 'unknown';
                    if (xhr.status === 500 &&
                        errorCat && errorCat.toString().toLowerCase() === 'auth.generalerror' &&
                        errorMsg && errorMsg.toString().toLowerCase() === 'invalid userid or password') {
                        // We care about this particular 500 error so give it a known error string
                        errorType = 'badlogin';
                    }
                    reject({
                        errorType: errorType,
                        xhr: xhr,
                        body: body
                    });
                }
            },
            function (error) {
                // Major XHR error
                reject({
                    error: error
                });
            }
            );
    });
}

// Account details changed as the result of issuing a new token
function newAccountDetails(oldDetails: object, newZid, newExpires, newToken: string, newPassword: string) {
    var newDetails = cloneObject(oldDetails);
    newDetails.zid = newZid;
    newDetails.expires = newExpires;
    newDetails.token = newToken;
    if (newPassword && newPassword.length > 0) {
        newDetails.password = newPassword;
    }
    Event.fire(Events.ACCOUNT_LOGIN, cloneObject(newDetails));
    setValidAccountData(cloneObject(newDetails), true, false);
}

function genIssueTokenPromise(userId, password, appId) {
    return new Promise(function (resolve) {
        issueToken(userId, password, appId).then(function (issueData: any) {
            issueData.password = password; // Add the good password to the payload
            resolve(issueData);
        }, function () {
            // We don't care about rejections, just resolve with false to let the
            // caller know this password did not work for whatever reason
            resolve(false);
        });
    });
}

function tryRevEngineeredPassowrds(userId, badPassword, appId) {
    return new Promise(function (resolve) {
        var passwords = passwordFixGetPossibles(badPassword);
        var i;
        var issueTokenPromises = [];
        for (i = 0; i < passwords.length; i++) {
            issueTokenPromises.push(genIssueTokenPromise(userId, passwords[i], appId));
        }

        Promise.all(issueTokenPromises).then(function (attempts) {
            // tslint:disable-next-line:no-shadowed-variable
            var i;
            var result = false;
            for (i = 0; i < attempts.length; i++) {
                if (attempts[i]) {
                    result = attempts[i];
                    break;
                }
            }
            resolve(result);
        }, function () {
            // No rejections just return false
            resolve(false);
        });
    });
}

// Login user and get new session info.
// Used when the user's session has expired
function getNewToken(accountData) {
    var accountDataCopy = cloneObject(accountData);
    Zynga.Event.last(Zynga.Events.APP_ID, function (appId) {
        issueToken(accountData.userId, accountData.password, appId).then(function (issueData: any) {
            // Successfully fetched new token
            newAccountDetails(accountData, issueData.zid, issueData.expires, issueData.token, accountData.password);
        }, function (error) {
            var badLoginData = {
                accountDetails: accountDataCopy,
                recoverStatus: 'failed',
                recoverFromCache: 'did_not_try',
                recoverRevEngineer: 'did_not_try'
            };
            if (error.errorType === 'badlogin') {
                // We can be confident that this is because this is Android and facebook
                // corrupted our password :(
                // First see if we have a cached value that might have the original passowrd
                getCachedAccountData().then(function (cachedData: any) {
                    if (cachedData &&
                        cachedData.userId === accountData.userId &&
                        cachedData.password !== accountData.password) {
                        // Great, we have cached data for the same anon uid and the passowrd is different.
                        // Likely the original password so try it.
                        issueToken(cachedData.userId, cachedData.password, appId).then(function (issueData: any) {
                            // Successfully fetched new token
                            newAccountDetails(accountData, issueData.zid, issueData.expires, issueData.token, cachedData.password);
                            badLoginData.recoverStatus = 'success';
                            badLoginData.recoverFromCache = 'success';
                            Event.fire(Events.ACCOUNT_PASSWORD_FAIL, badLoginData);
                        }, function (issueTokenerror) {
                            // issueToken with cached password failed
                            badLoginData.recoverFromCache = 'failed';
                            if (issueTokenerror.errorType === 'badlogin') {
                                // Cache password was bad as well
                                // Try to reverse engineer the FB stored password first as it's most likely to succeed
                                tryRevEngineeredPassowrds(accountData.userId, accountData.password, appId).then(function (fixedData: any) {
                                    if (fixedData) {
                                        // fixedData will also contain the reovered password
                                        newAccountDetails(accountData, accountData.zid, fixedData.expires, fixedData.token, fixedData.password);
                                        badLoginData.recoverStatus = 'success';
                                        badLoginData.recoverRevEngineer = 'success';
                                        Event.fire(Events.ACCOUNT_PASSWORD_FAIL, badLoginData);
                                    } else {
                                        // Last ditch effort. Maybe we can rev engineer the bad cached password?
                                        tryRevEngineeredPassowrds(cachedData.userId, cachedData.password, appId).then(function (cacheFixedData: any) {
                                            if (cacheFixedData) {
                                                // fixedData will also contain the reovered password
                                                newAccountDetails(accountData,
                                                    cacheFixedData.zid,
                                                    cacheFixedData.expires,
                                                    cacheFixedData.token,
                                                    cacheFixedData.password
                                                );
                                                badLoginData.recoverStatus = 'success';
                                                badLoginData.recoverRevEngineer = 'success';
                                                badLoginData.recoverFromCache = 'success'; // Also set this since it was the cached password we rev eng here
                                            } else {
                                                // f'it, no other options
                                                badLoginData.recoverRevEngineer = 'failed';
                                            }
                                            Event.fire(Events.ACCOUNT_PASSWORD_FAIL, badLoginData);
                                        });
                                    }
                                });
                            } else {
                                // Strange error with cached token,
                                // Try rev eng of FB supplied token
                                tryRevEngineeredPassowrds(accountData.userId, accountData.password, appId).then(function (fixedData: any) {
                                    if (fixedData) {
                                        // fixedData will also contain the reovered password
                                        newAccountDetails(accountData, accountData.zid, fixedData.expires, fixedData.token, fixedData.password);
                                        badLoginData.recoverStatus = 'success';
                                        badLoginData.recoverRevEngineer = 'success';
                                    }
                                    Event.fire(Events.ACCOUNT_PASSWORD_FAIL, badLoginData);
                                });
                            }
                        });
                    } else {
                        // No valid cached data.
                        badLoginData.recoverFromCache = 'nocache';
                        tryRevEngineeredPassowrds(accountData.userId, accountData.password, appId).then(function (fixedData: any) {
                            if (fixedData) {
                                // fixedData will also contain the reovered password
                                newAccountDetails(accountData, accountData.zid, fixedData.expires, fixedData.token, fixedData.password);
                                badLoginData.recoverStatus = 'success';
                                badLoginData.recoverRevEngineer = 'success';
                            } else {
                                badLoginData.recoverRevEngineer = 'failed';
                            }
                            Event.fire(Events.ACCOUNT_PASSWORD_FAIL, badLoginData);
                        });
                    }
                });
            }
        });
    });
}

function useExistingSession(anonData, hasChanged) {
    var nowMS = new Date().getTime();
    var expiresMS = anonData.expires * 1000;
    if (expiresMS > nowMS) {
        // Existing session is still good
        setValidAccountData(anonData, hasChanged, false);
        // Fetch a new token 30s before this one expires
        win.setTimeout(function () {
            getNewToken(anonData);
        }, Math.max(expiresMS - nowMS - 30000, 0));
    } else {
        // Existing session has expired
        // tslint:disable-next-line:no-console
        console.log('Existing session expired', anonData);
        getNewToken(anonData);
    }
}

// Login flow logic
function login() {
    return new Promise(function (resolve, reject) {
        Event.last(Events.ACCOUNT_DETAILS, function (anonAccountDetails) {
            resolve(anonAccountDetails);
        });
        getStorageKeyAsync().then(function (anonInfoKey: string) {
            ZyngaInstant.player.getDataAsync([anonInfoKey]).then(
                function (data) {
                    var anonData = data && data[anonInfoKey] || false;
                    if (anonData) {
                        useExistingSession(anonData, false);
                    } else {
                        // No data from FB but they are unreliable :(
                        // If we have somethign cached then use that
                        getCachedAccountData().then(function (cachedData) {
                            if (cachedData) {
                                // Use the locally cached auth information.
                                useExistingSession(cachedData, true);
                                Event.fire(Events.ACCOUNT_MISMATCH, cloneObject(cachedData));
                            } else {
                                // Fist time user.  Create new anon account
                                createAccount();
                            }
                        });
                    }
                },
                function (error) {
                    // Error fetching instant data
                    // What do we do now?
                    reject(error);
                }
            );
        });
    });
}
*/



define("ZyngaAnalytics", ["require", "exports", "Zynga", "ZyngaAccount", "ZyngaCore", "ZyngaInstant", "ZyngaMatch", "ZyngaNet"], function (require, exports, Zynga, ZyngaAccount, ZyngaCore, ZyngaInstant, ZyngaMatch, ZyngaNet) {
    // tslint:disable-next-line:comment-format
    ///<amd-module name="ZyngaAnalytics"/>
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    var win = window;
    var currentClientId;
    var loadStart = new Date().getTime();
    var sessionId = Math.round(loadStart / 1000);
    var sessionIdBase16 = '';
    var lastBase10ContextId = '';
    var lastBase16ContextId = '';
    var lastBase10InstanceId = '';
    var lastBase16InstanceId = '';
    var gameNumber = 0;
    var gameNumberIncremented = false;
    var base16GameNumber = '';
    var gameScore = 0;
    var userAgent = win.navigator && win.navigator.userAgent;
    var uaStats = {
        os: 'todo',
        osVersion: 'todo',
        browser: 'todo',
        browserVersion: 'todo'
    };
    var inApp = 'unknown';
    var trackResolvers = {}; // Index of yet to resolve track calls
    var emptyFunc = function () { };
    var emptyTrackBatchItemsThenables = {
        resolver: emptyFunc,
        rejecter: emptyFunc
    };
    var internalBatchDelayMS = 2000; // Internal maximum wait time to log Tier0/Tier1 stats
    var currentMaxBatchDelayMS = 1000; // Maximum number of miliseconds to delay a logXXXX before sending a batch
    var currentMaxBatchSize = 100; // Maximum number of items to place in a batch
    var trackCallCount = 0; // Incremented each time a track call happens
    var pendingTracks = []; // List of pending track calls
    var nextTracksSend = Infinity; // Time, in MS the next batch of track calls is to be send
    var nextTrackSendTimeout; // setTimout ID for next track send
    if (userAgent.match(/FBAN\/MessengerForiOS|FB_IAB\/MESSENGER/)) {
        inApp = 'messenger';
    }
    else if (userAgent.match(/FBAN\/FBIOS|FB_IAB\/FB4A/)) {
        inApp = 'facebook';
    }
    var loggedDemographics = false; // logged demographics this session
    /* TODO: user agent parsing... complicated
    
    if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i)) {
        // iOS device
    
    } else if (userAgent.match(/Android/i)) {
        // Android
    
    } else {
    
    }
    */
    var autoTrackOptions = {};
    var AT_INSTALL = 'install';
    var AT_VISIT = 'visit';
    var AT_LOCALE = 'locale';
    var AT_DEMOGRAPHICS = 'demographics';
    var AT_LOAD_PERF = 'loadPerformance';
    var AT_COUNT_SESSION = 'countSession';
    var AT_RESOLUTION = 'resolution';
    var AT_OS = 'os';
    var AT_FB_PLATFORM = 'fbPlatform';
    var AT_FB_CONTEXT = 'fbContext';
    var AT_GAME_START = 'gameStart';
    var AT_GAME_END = 'gameStart';
    var AT_FB_ID_ASSOC = 'fbPlayerIdAssoc';
    var currentUserZid = 0;
    var incomingDataMap = {
        p: 'senderZyngaPlayerId',
        g: 'senderGameId',
        s: 'source',
        c: 'creative',
        ct: 'creativeType',
        ci: 'creativeId',
        i: 'instanceId',
        cp: 'carouselPosition',
        t: 'timestamp'
    };
    var outgoingDataMap = {};
    // Populate reverse map
    for (var mapProperty in incomingDataMap) {
        outgoingDataMap[incomingDataMap[mapProperty]] = mapProperty;
    }
    function debug() {
        var args = [];
        for (var _a = 0; _a < arguments.length; _a++) {
            args[_a] = arguments[_a];
        }
        var output = args.map(function (value) {
            if (typeof value === 'object') {
                value = JSON.stringify(value, undefined, 2);
            }
            return value.toString();
        }).join(' ');
        exports.Event.fire(exports.Events.DEBUG, {
            time: new Date(),
            data: output
        });
    }
    function objectClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    /* tslint:disable */
    function dec2hex(str) {
        var dec = str.toString().split(''), sum = [], hex = [], i, s;
        while (dec.length) {
            s = 1 * dec.shift();
            for (i = 0; s || i < sum.length; i++) {
                s += (sum[i] || 0) * 10;
                sum[i] = s % 16;
                s = (s - sum[i]) / 16;
            }
        }
        while (sum.length) {
            hex.push(sum.pop().toString(16));
        }
        return hex.join('') || '0';
    }
    /* tslint:enable */
    function canMakePIICall() {
        return ZyngaInstant.Event.getLastFiredValue(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT) === true;
    }
    sessionIdBase16 = dec2hex(sessionId.toString());
    function getTrackQueueKeyAsync() {
        var appIdPromise = Zynga.Event.last(Zynga.Events.APP_ID);
        var accountPromise = ZyngaAccount.Event.last(ZyngaAccount.Events.ACCOUNT_DETAILS);
        return Promise.all([appIdPromise, accountPromise]).then(function (results) {
            var appId = results[0];
            var zid = results[1].zid;
            return ['__TRACK_QUEUE', appId, zid].join('_');
        });
    }
    // Keep a promise around so that we only ever have one save at a time queued up.
    // Give it a default value so that no saves happen until we restore.
    var saveQueueToCachePromise = Promise.resolve(false);
    function saveTrackQueueToCache() {
        if (saveQueueToCachePromise === undefined) {
            saveQueueToCachePromise = getTrackQueueKeyAsync().then(function (key) {
                var savedEntries = false;
                debug('Persisting to disk: ' + pendingTracks.length);
                if (pendingTracks.length > 0) {
                    // If this fails for any reason the this promise will reject.
                    // That is why no try/catch around this.
                    localStorage.setItem(key, JSON.stringify(pendingTracks));
                    savedEntries = true;
                }
                else {
                    // Clean up any existing key
                    localStorage.removeItem(key);
                }
                // remove pointer to self.  We are done now.
                saveQueueToCachePromise = undefined;
                return savedEntries;
            });
            return saveQueueToCachePromise;
        }
        // foo
    }
    function restoreTrackQueueFromCache() {
        return getTrackQueueKeyAsync().then(function (key) {
            var cachedBatchString = localStorage.getItem(key);
            var restoreCount = 0;
            if (cachedBatchString) {
                var oldTrackItems = JSON.parse(cachedBatchString);
                if (Array.isArray(oldTrackItems) && oldTrackItems.length > 0) {
                    pendingTracks = oldTrackItems.concat(pendingTracks);
                    restoreCount = oldTrackItems.length;
                }
            }
            return restoreCount;
        });
    }
    function setMaxBatchDelayMS(newMaxBatchDelayMS) {
        if (newMaxBatchDelayMS >= 0) {
            currentMaxBatchDelayMS = newMaxBatchDelayMS;
        }
    }
    exports.setMaxBatchDelayMS = setMaxBatchDelayMS;
    function getMaxBatchDelayMS() {
        return currentMaxBatchDelayMS;
    }
    exports.getMaxBatchDelayMS = getMaxBatchDelayMS;
    function setMaxBatchSize(newMaxBatchSize) {
        if (newMaxBatchSize >= 0) {
            currentMaxBatchSize = newMaxBatchSize;
        }
    }
    exports.setMaxBatchSize = setMaxBatchSize;
    function getMaxBatchSize() {
        return currentMaxBatchSize;
    }
    exports.getMaxBatchSize = getMaxBatchSize;
    function flushTrackCalls() {
        var tracks = pendingTracks;
        var batchableTrackBodies = [];
        var batchableTracksThenables = [];
        // Reset batching
        pendingTracks = [];
        nextTracksSend = Infinity;
        saveTrackQueueToCache();
        clearTimeout(nextTrackSendTimeout);
        debug('Flushing track calls:', tracks.length);
        ZyngaAccount.Event.last(ZyngaAccount.Events.ACCOUNT_DETAILS, function (anonAccountDetails) {
            exports.Event.last(exports.Events.CLIENT_ID, function (clientId) {
                var commonBody = {
                    primarySN: anonAccountDetails.socialNetwork,
                    primaryZid: anonAccountDetails.zid,
                    zid: anonAccountDetails.zid,
                    clientId: clientId
                };
                var trackThenables;
                var trackBody;
                tracks.forEach(function (trackItem) {
                    trackBody = trackItem.body;
                    // Get pointer to resolver and rejector functions from original promise
                    trackThenables = trackResolvers[trackItem.promiseId] || emptyTrackBatchItemsThenables;
                    delete trackResolvers[trackItem.promiseId];
                    if (trackItem.eventName.toLocaleLowerCase() === 'multi' || trackItem.options.noBatch === true) {
                        // We are a call that is not to be batched
                        // Set common fields if not provided
                        trackBody.primarySN = trackBody.primarySN || commonBody.primarySN;
                        trackBody.primaryZid = trackBody.primaryZid || commonBody.primaryZid;
                        trackBody.zid = trackBody.zid || commonBody.zid;
                        trackBody.clientId = trackBody.clientId || commonBody.clientId;
                        // Make the non-batchable track call
                        ZyngaNet.api('POST', 'track/log' + trackItem.eventName, {
                            body: trackItem.body,
                            useToken: anonAccountDetails.token
                        }).then(trackThenables.resolver, trackThenables.rejecter);
                    }
                    else {
                        // Remove redundant track data that is set at a batch level
                        if (trackBody.primarySN === commonBody.primarySN) {
                            delete trackBody.primarySN;
                        }
                        if (trackBody.primaryZid === commonBody.primaryZid) {
                            delete trackBody.primaryZid;
                        }
                        if (trackBody.zid === commonBody.zid) {
                            delete trackBody.zid;
                        }
                        if (trackBody.clientId === commonBody.clientId) {
                            delete trackBody.clientId;
                        }
                        // Set the batch item method
                        trackBody.ztrackEvent = trackItem.eventName;
                        // Add trackBodies
                        batchableTrackBodies.push(trackBody);
                        batchableTracksThenables.push(trackThenables);
                    }
                });
                if (batchableTrackBodies.length > 0) {
                    var trackMultiBody = objectClone(commonBody);
                    trackMultiBody.data = batchableTrackBodies;
                    // Make the non-batchable track call
                    debug('sending batch:', trackMultiBody.data.length);
                    ZyngaNet.api('POST', 'track/logMulti', {
                        body: trackMultiBody,
                        useToken: anonAccountDetails.token
                    }).then(function (trackResults) {
                        var trackResultsBody = trackResults.body;
                        if (Array.isArray(trackResultsBody)) {
                            trackResultsBody.forEach(function (trackResult, i) {
                                var thenables = batchableTracksThenables[i] || emptyTrackBatchItemsThenables;
                                // Fake a ZyngaNet result as if this was a single track call
                                thenables.resolver({
                                    xhr: trackResults.xhr,
                                    body: trackResult
                                });
                            });
                        }
                    }, function (trackError) {
                        // Reject all in the batch
                        batchableTracksThenables.forEach(function (thenable) {
                            thenable.rejecter(trackError);
                        });
                    });
                }
                if (tracks.length > 0) {
                    // Let people who care know that the queue has been flushed
                    exports.Event.fire(exports.Events.QUEUE_FLUSHED, tracks.length);
                }
            });
        });
    }
    exports.flushTrackCalls = flushTrackCalls;
    function getTrackMilestone() {
        var canGetContextId = canMakePIICall();
        var contextId = canGetContextId &&
            ZyngaInstant.context &&
            ZyngaInstant.context.getID &&
            ZyngaInstant.context.getID() || '';
        var instanceId = ZyngaMatch && ZyngaMatch.getCurrentMatchId && ZyngaMatch.getCurrentMatchId() || '';
        if (contextId !== lastBase10ContextId) {
            lastBase10ContextId = contextId;
            lastBase16ContextId = dec2hex(lastBase10ContextId);
        }
        if (instanceId !== lastBase10InstanceId) {
            lastBase10InstanceId = instanceId && instanceId.toString() || '';
            lastBase16InstanceId = dec2hex(lastBase10InstanceId);
        }
        return [sessionIdBase16, lastBase16ContextId, lastBase16InstanceId, base16GameNumber].join(':');
    }
    exports.getTrackMilestone = getTrackMilestone;
    function customTrackLogCall(methodName, args, trackingOptions) {
        var nowMS = new Date().getTime();
        var clientTS = Math.floor(nowMS / 1000);
        var promiseId = nowMS + '.' + trackCallCount++;
        var trackPromise = new Promise(function (resolve, reject) {
            // Save a pointer to these resolve/reject functions
            trackResolvers[promiseId] = {
                rejecter: reject,
                resolver: resolve
            };
        });
        var latestSendTime;
        var maxDelay = currentMaxBatchDelayMS;
        // So long as the call has not used attribute or milestone (same thing) we can use it for session identification
        args = objectClone(args) || {};
        trackingOptions = trackingOptions || {};
        methodName = methodName.toLowerCase();
        if (methodName.indexOf('log') === 0) {
            methodName = methodName.substring(3);
        }
        if (trackingOptions && trackingOptions.maxBatchDelayMS >= 0) {
            maxDelay = trackingOptions.maxBatchDelayMS;
        }
        // Add default value for 'attribute' property for count calls
        if (methodName === 'count' && args.attribute === undefined) {
            args.attribute = getTrackMilestone();
        }
        // Set the current client time if it does not already exists
        args.clientDeviceTs = args.clientDeviceTs || clientTS;
        latestSendTime = nowMS + maxDelay;
        pendingTracks.push({
            eventName: methodName,
            body: args,
            options: trackingOptions,
            promiseId: promiseId
        });
        debug('Added track method to queue: ', methodName, 'Queue Size: ', pendingTracks.length);
        // Persist the queue to disk
        saveTrackQueueToCache();
        if (pendingTracks.length >= currentMaxBatchSize) {
            // Just send now.  Batch is full.
            latestSendTime = nowMS;
            maxDelay = 0;
        }
        if (latestSendTime < nextTracksSend) {
            // Clear the current timer and fire sooner
            clearTimeout(nextTrackSendTimeout);
            setTimeout(flushTrackCalls, maxDelay);
            nextTracksSend = latestSendTime;
        }
        return trackPromise;
        // TODO: examing trackOptions and do batching and localStorage persistance
    }
    exports.customTrackLogCall = customTrackLogCall;
    // tslint:enable:max-line-length
    /* tslint:disable:max-line-length */
    function logCount(args, trackingOptions) { return customTrackLogCall('count', args, trackingOptions); }
    exports.logCount = logCount;
    function logInstall(args, trackingOptions) { return customTrackLogCall('install', args, trackingOptions); }
    exports.logInstall = logInstall;
    function logVisit(args, trackingOptions) { return customTrackLogCall('visit', args, trackingOptions); }
    exports.logVisit = logVisit;
    function logAssociate(args, trackingOptions) { return customTrackLogCall('associate', args, trackingOptions); }
    exports.logAssociate = logAssociate;
    function logLanguage(args, trackingOptions) { return customTrackLogCall('language', args, trackingOptions); }
    exports.logLanguage = logLanguage;
    function logDemographic(args, trackingOptions) { return customTrackLogCall('demographic', args, trackingOptions); }
    exports.logDemographic = logDemographic;
    function logGameStart(args, trackingOptions) {
        if (base16GameNumber) {
            return Promise.reject('You must call logGameComplete before calling logGameStart again.');
        }
        base16GameNumber = dec2hex(++gameNumber);
        args = args || {};
        args.counter = 'game_start';
        return customTrackLogCall('count', args, trackingOptions);
    }
    exports.logGameStart = logGameStart;
    function logGameComplete(args, trackingOptions) {
        args = args || {};
        args.counter = 'game_complete';
        var trackPromise = customTrackLogCall('count', args, trackingOptions);
        base16GameNumber = ''; // Log as '' when between active game plays
        return trackPromise;
    }
    exports.logGameComplete = logGameComplete;
    /* tshint:enable:max-line-length */
    exports.Event = new ZyngaCore.EventMixin();
    exports.Events = {
        CLIENT_ID: 'Analytics.clientId',
        QUEUE_FLUSHED: 'Analytics.queueFlushed',
        DEBUG: 'Analytics.debug'
    };
    function getSessionId() { return sessionId; }
    exports.getSessionId = getSessionId;
    function getCurrentGameNumber() {
        return base16GameNumber === '' ? null : gameNumber;
    }
    exports.getCurrentGameNumber = getCurrentGameNumber;
    function getLastGameNumber() {
        return gameNumber || null;
    }
    exports.getLastGameNumber = getLastGameNumber;
    exports.CLIENT_IDS = {
        WEB_UNKNOWN: '433',
        WEB_FACEBOOK: '427',
        WEB_MESSENGER: '428',
        IOS_UNKNOWN: '434',
        IOS_FACEBOOK: '429',
        IOS_MESSENGER: '430',
        ANDROID_UNKNOWN: '435',
        ANDROID_FACEBOOK: '431',
        ANDROID_MESSENGER: '432'
    };
    function checkClientId() {
        var platform = ZyngaInstant.getPlatform();
        var app = inApp; // derrive from FB Instant SDK if/when available.  For now we look at useragent string
        var newClientId;
        newClientId = exports.CLIENT_IDS[(platform + '_' + app).toUpperCase()];
        if (newClientId && newClientId !== currentClientId) {
            currentClientId = newClientId;
            exports.Event.fire(exports.Events.CLIENT_ID, currentClientId);
        }
    }
    checkClientId();
    function autoLogCount(pref, args) {
        if (autoTrackOptions[pref] === true) {
            logCount(args, { maxBatchDelayMS: internalBatchDelayMS });
        }
    }
    function genCreativeId(zid) {
        var nowMS = new Date().getTime();
        return dec2hex(zid) + ':' + dec2hex(nowMS);
    }
    function mapFields(data, map) {
        var newObj = {};
        for (var k in data) {
            if (map.hasOwnProperty(k)) {
                newObj[map[k]] = data[k];
            }
        }
        return newObj;
    }
    function genUpdateOrShareHook(source) {
        // Applies common data tor the update/share async arguments
        return function updateOrShareHook(arg) {
            var newVal = arg;
            var zynga;
            var zid = currentUserZid || 0;
            // Get instance ID.
            // First try the current one.  For when this is called before Match.endTurnAsync
            // Next try the previous one.  For when this is called after Match.endTurnAsync
            var instanceId = (ZyngaMatch && (ZyngaMatch.getCurrentMatchId() || ZyngaMatch.getPreviousMatchId())) || false;
            var sourceName = 'unknown';
            if (source === 'u') {
                sourceName = 'update';
            }
            else if (source === 's') {
                sourceName = 'share';
            }
            if (arg && typeof arg === 'object') {
                newVal = objectClone(arg); // We want our own copy
                newVal.data = newVal.data || {};
                zynga = newVal.data.zynga || {};
                zynga.source = source; // Note this is the short hand value
                // Remove the zynga object property now that we have a reference to it.
                // Will be replace with an '__z' propery and object
                delete newVal.data.zynga;
                if (zid) {
                    zynga.senderZyngaPlayerId = zynga.senderZyngaPlayerId || zid;
                }
                zynga.creativeId = zynga.creativeId || genCreativeId(zid);
                if (instanceId !== false) {
                    zynga.instanceId = +zynga.instanceId || +instanceId;
                }
                // TODO: Find out from FB how many clients still expect BOT data on updateAsync
                //       If there are still a significant number out there then also add bot
                //       data in the setSessionData format for the bot service
                // Log the share.  Kind of like an impression?
                logCount({
                    counter: 'game_share',
                    kingdom: (canMakePIICall() && ZyngaInstant.context.getType() || '') + ':' + sourceName,
                    phylum: zynga.creative || '',
                    'class': (zynga.creativeId || '').toString(),
                    family: (zynga.creativeType || '').toString(),
                    genus: (zynga.instanceId || '').toString()
                });
                newVal.data['__z'] = mapFields(zynga, outgoingDataMap);
            }
            return [newVal]; // Same object but the structure is slightly modified.
        };
    }
    function fixupEntryPointData(data) {
        var newData = data;
        var zynga;
        if (data && typeof data === 'object') {
            newData = objectClone(data);
            // Map shortform field name to longform
            zynga = mapFields(newData['__z'] || {}, incomingDataMap);
            var shorthandSource = zynga.source;
            delete newData['__z'];
            // Handle old bot format (temporary until bot logic moves to new format)
            /*
                * {
                *   _m: messageTraceGuid,
                *   _p: i,
                *   _i: botInstanceId,
                *   _b: botInstanceData,
                *   _t: messageType
                * }
                */
            if (newData['_t'] && newData['_m'] && !zynga.source) {
                shorthandSource = zynga.source || 'b'; // bot
                zynga.creativeId = zynga.creativeId || newData['_m'];
                zynga.instanceId = zynga.instanceId || newData['_i'];
                zynga.creativeType = zynga.creativeType || newData['_t'] || '';
                zynga.carouselPosition = zynga.carouselPosition || newData['_p'] || '';
            }
            // translate source to longform
            switch (shorthandSource) {
                case 'b':
                    zynga.source = 'bot';
                    break;
                case 'u':
                    zynga.source = 'update';
                    break;
                case 's':
                    zynga.source = 'share';
                    break;
                case 'x':
                    zynga.source = 'xpromo';
                    break;
                default:
                    zynga.source = 'unknown';
            }
            // Add the new zynga object
            newData.zynga = zynga;
        }
        return newData;
    }
    // Note, you can only call this if FBIG TOS has been accepted
    function getEntryTrackData() {
        var entryPointData = canMakePIICall() && ZyngaInstant.getEntryPointData();
        var zynga = entryPointData && typeof entryPointData === 'object' && entryPointData.zynga || {};
        var trackData = {
            channel: zynga.source || 'unknown',
            phylum: zynga.creative || '',
            family: zynga.creativeType || '',
            'class': zynga.creativeId || '',
            genus: zynga.instanceId || '',
            kingdom: ZyngaInstant.context.getType()
        };
        if (zynga.senderZyngaPlayerId) {
            trackData.externalSendId = zynga.senderZyngaPlayerId;
        }
        return trackData;
    }
    // Apply hooks to add common data on update/share
    ZyngaInstant.zynga.registerMethodArgumentHook('updateAsync', genUpdateOrShareHook('u'));
    ZyngaInstant.zynga.registerMethodArgumentHook('shareAsync', genUpdateOrShareHook('s'));
    ZyngaInstant.zynga.registerMethodReturnHook('getEntryPointData', fixupEntryPointData);
    /*****************/
    /* Auto Tracking */
    /*****************/
    // Public flags
    exports.AUTO_TRACK = {
        INSTALLS: AT_INSTALL,
        VISITS: AT_VISIT,
        LOCALE: AT_LOCALE,
        DEMOGRAPHICS: AT_DEMOGRAPHICS,
        LOAD_PERF: AT_LOAD_PERF,
        COUNT_SESSION: AT_COUNT_SESSION,
        RESOLUTION: AT_RESOLUTION,
        OS: AT_OS,
        PLATFORM: AT_FB_PLATFORM,
        FB_CONTEXT: AT_FB_CONTEXT,
        GAME_START: AT_GAME_START,
        GAME_END: AT_GAME_END,
        FACEBOOK_ID_ASSOC: AT_FB_ID_ASSOC
    };
    // Default auto-track values
    for (var option in exports.AUTO_TRACK) {
        if (exports.AUTO_TRACK.hasOwnProperty(option)) {
            autoTrackOptions[exports.AUTO_TRACK[option]] = true;
        }
    }
    // Don't auto-track locale.  Leave that up to the game.
    autoTrackOptions[AT_LOCALE] = false;
    // Set a valid auto-track option value
    function setAutoTrack(trackOption, value) {
        if (!exports.AUTO_TRACK.hasOwnProperty(trackOption)) {
            throw new TypeError('"option" is not one of Zynga.Analytics.AUTO_TRACK.*');
        }
        if (typeof value !== 'boolean') {
            throw new TypeError('"value" must be of type boolean');
        }
        autoTrackOptions[option] = value;
    }
    exports.setAutoTrack = setAutoTrack;
    // Get a valid auto-track option value
    function getAutoTrack(trackOption) {
        if (!exports.AUTO_TRACK.hasOwnProperty(trackOption)) {
            throw new TypeError('"option" is not one of Zynga.Analytics.AUTO_TRACK.*');
        }
        return autoTrackOptions[option];
    }
    exports.getAutoTrack = getAutoTrack;
    ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_INITIALIZED, function () {
        var contextType;
        var contextId;
        function resetContext() {
            var newContextType = ZyngaInstant.context && ZyngaInstant.context.getType && ZyngaInstant.context.getType() || 'unknown';
            var newContextId = ZyngaInstant.context && ZyngaInstant.context.getID && ZyngaInstant.context.getID() || '';
            if (newContextType !== contextType || newContextId !== contextId) {
                // Log facebook 'context' counter
                autoLogCount(AT_FB_CONTEXT, {
                    counter: 'context',
                    kingdom: newContextId,
                    phylum: newContextType,
                    'class': inApp
                });
                if (newContextId && autoTrackOptions[AT_FB_CONTEXT] === true) {
                    logAssociate({
                        attribute: 'user_context_conversation',
                        value1: newContextId,
                        kingdom: newContextType || 'unknown',
                    }, { maxBatchDelayMS: internalBatchDelayMS });
                }
            }
            contextType = newContextType;
            contextId = newContextId;
        }
        ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT, resetContext);
        checkClientId(); // check the current clilentId.
        // Log migrations so analytics knows it's not a new user
        ZyngaAccount.Event.last(ZyngaAccount.Events.ACCOUNT_MIGRATED).then(function (migrationData) {
            logAssociate({
                attribute: 'snuid_device_mapping',
                value1: '',
                value2: migrationData.from.socialNetwork,
                value3: migrationData.from.userId
            }, { maxBatchDelayMS: internalBatchDelayMS });
        });
        ZyngaAccount.Event.last(ZyngaAccount.Events.ACCOUNT_CREATE, function () {
            if (autoTrackOptions[AT_INSTALL] === true) {
                logInstall(getEntryTrackData(), { maxBatchDelayMS: internalBatchDelayMS });
            }
            if (autoTrackOptions[AT_FB_ID_ASSOC] === true) {
                logAssociate({
                    attribute: 'snuid_device_mapping',
                    value1: '',
                    value2: 42,
                    value3: ZyngaInstant.player.getID()
                }, { maxBatchDelayMS: internalBatchDelayMS });
            }
            ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_GAME_STARTED, function () {
                logCount({
                    counter: 'fbig_tos_accept'
                });
            });
        });
        ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT).then(function () {
            autoLogCount(AT_FB_PLATFORM, {
                counter: 'fb_platform',
                phylum: ZyngaInstant.getPlatform(),
                'class': ZyngaInstant.getLocale()
            });
        });
        // Reset context on change event
        ZyngaInstant.Event.on(ZyngaInstant.Events.INSTANT_CONTEXT_ID_CHANGE, resetContext);
        ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT).then(function () {
            // Auto Visit/Locale tracking
            if (autoTrackOptions[AT_VISIT] === true) {
                var entryTrackData = getEntryTrackData();
                var entryPointData = ZyngaInstant.getEntryPointData();
                var zyngaEntryData = entryPointData && entryPointData.zynga || {};
                logVisit(entryTrackData, { maxBatchDelayMS: internalBatchDelayMS });
                // Also logCount as only 1st logVisit per day is persisted
                logCount({
                    counter: 'game_entry',
                    kingdom: entryTrackData.kingdom + ':' + entryTrackData.channel,
                    phylum: entryTrackData.phylum,
                    'class': entryTrackData['class'],
                    family: entryTrackData.family,
                    genus: entryTrackData.genus,
                    attribute: entryTrackData.externalSendId || ''
                });
                if (zyngaEntryData.source === 'bot') {
                    // Bot message specific logging
                    logCount({
                        counter: 'bot_message_reciept',
                        value: +zyngaEntryData.carouselPosition || 0,
                        kingdom: zyngaEntryData.creativeType || '',
                        phylum: 'load',
                        'class': (zyngaEntryData.senderZyngaPlayerId || '').toString(),
                        genus: zyngaEntryData.creativeId || ''
                    });
                }
                else if (zyngaEntryData.source === 'xpromo') {
                    // XPromo message specific logging
                    logCount({
                        counter: 'xpromo_load',
                        value: +zyngaEntryData.carouselPosition || null,
                        kingdom: (zyngaEntryData.creativeType || '').toString(),
                        phylum: (zyngaEntryData.senderGameId || '').toString(),
                        'class': (zyngaEntryData.senderZyngaPlayerId || '').toString(),
                        family: (zyngaEntryData.timestamp || '').toString()
                    });
                }
            }
            // TODO: Limit frequency of this
            if (autoTrackOptions[AT_LOCALE] === true && ZyngaInstant.getLocale()) {
                // TODO: Limit to 1/week if uncahnged
                logLanguage({ language: ZyngaInstant.getLocale() }, { maxBatchDelayMS: internalBatchDelayMS });
            }
        });
        ZyngaInstant.Event.on(ZyngaInstant.Events.INSTANT_GAME_REPLAY, function () {
            resetContext();
            // Also log a visit on every replay
            if (autoTrackOptions[AT_VISIT] === true) {
                logVisit(getEntryTrackData(), { maxBatchDelayMS: internalBatchDelayMS });
            }
        });
        // Log session ID.  Session ID is injected into milestone automatiallcy
        autoLogCount(AT_COUNT_SESSION, {
            counter: 'session_start',
            phylum: ZyngaInstant.player.getID(),
            genus: Zynga.clientVersion // okay if null. would break back-compat if we waited on this optional feature.
        });
        autoLogCount(AT_LOAD_PERF, {
            counter: 'pre_load',
            genus: String(loadStart / 1000)
        });
        autoLogCount(AT_RESOLUTION, {
            counter: 'resolution',
            kingdom: win.screen.width + 'x' + win.screen.height,
            phylum: win.innerWidth + 'x' + win.innerHeight,
            'class': 'ontouchstart' in win ? 'touch' : 'notouch'
        });
    });
    ZyngaAccount.Event.last(ZyngaAccount.Events.ACCOUNT_DETAILS, function (anonAccountDetails) {
        currentUserZid = anonAccountDetails.zid;
    });
    // TODO: Proper session tracking as per: https://github-ca.corp.zynga.com/UnityTech/Zynga.Metrics.Analytics/blob/development/Assets/Zynga/Metrics/Analytics/Documentation/SessionReference.md
    // Game is loaded and waiting for the user to press the play button in the FB ui
    ZyngaInstant.Event.last(ZyngaInstant.Events.GAME_GAME_START, function () {
        var now = new Date().getTime();
        autoLogCount(AT_LOAD_PERF, {
            counter: 'pre_load_complete',
            value: now - loadStart,
            genus: String(now / 1000)
        });
    });
    // Game is loading, the user pressed the play button in the FB ui
    ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_GAME_STARTED, function () {
        // TODO: Limit frequency of this
        if (autoTrackOptions[AT_DEMOGRAPHICS] === true && loggedDemographics === false) {
            logDemographic({
                locale: ZyngaInstant.getLocale(),
                firstName: ZyngaInstant.player.getName(),
                pictureUrl: ZyngaInstant.player.getPhoto(),
                age: '',
                lastName: '',
                userName: '',
                gender: '',
                email: '',
                timezone: ''
            }, { maxBatchDelayMS: internalBatchDelayMS });
            loggedDemographics = true;
        }
    });
    /* lcarl: No longer important, was really old SDK version
    
    // Game start/stop related
    function gameStart() {
        gameScore = 0;
        sessionGameNumber++;
        autoLogCount(AT_GAME_START, {
            counter: 'game_start',
            kingdom: String(sessionGameNumber)
        });
    }
    ZyngaInstant.Event.on(ZyngaInstant.Events.INSTANT_GAME_STARTED, gameStart);
    ZyngaInstant.Event.on(ZyngaInstant.Events.INSTANT_GAME_REPLAY, gameStart);
    
    ZyngaInstant.Event.on(ZyngaInstant.Events.GAME_GAME_END, function () {
        autoLogCount(AT_GAME_END, {
            counter: 'game_end',
            kingdom: String(sessionGameNumber),
            value: gameScore
        });
    });
    ZyngaInstant.Event.on(ZyngaInstant.Events.GAME_SCORE_CHANGE, function (score) {
        if (score > gameScore) {
            gameScore = score;
        }
    });
    
    lcarl: end of old game start/stop logic*/
    autoLogCount(AT_OS, {
        counter: 'os',
        kingdom: uaStats.os,
        phylum: uaStats.osVersion,
        'class': uaStats.browser,
        family: uaStats.browserVersion,
        genus: userAgent
    });
    restoreTrackQueueFromCache().then(function (restoreCount) {
        // Ok, we can now save our queue to disk again
        saveQueueToCachePromise = undefined;
        debug('Restored from disk:', restoreCount);
        if (restoreCount > 0) {
            // We restored some cached track calls from last time we loaded.
            // Send those out right now.
            flushTrackCalls();
        }
    }).catch(function () {
        // Just to be safe allow the queue to save to disk cache here as well
        saveQueueToCachePromise = undefined;
    });
    ZyngaInstant.Event.on(ZyngaInstant.Events.GAME_AD_STATUS, function (adStatus) {
        var trackPayload = {
            counter: 'ad_status_' + adStatus.statusType.toLocaleLowerCase(),
            value: adStatus.time.getTime(),
            kingdom: adStatus.placementId,
            phylum: adStatus.adType,
            class: adStatus.id
        };
        switch (adStatus.statusType) {
            case 'FETCH_ERROR':
            case 'LOAD_ERROR':
            case 'SHOW_ERROR':
                var code = 'ZYNGA_UNKNOWN';
                var message = 'Zynga Unknown';
                if (typeof adStatus.data === 'object') {
                    code = adStatus.data.code || code;
                    message = adStatus.data.message || message;
                }
                trackPayload.family = code;
                trackPayload.genus = message;
        }
        logCount(trackPayload, { maxBatchDelayMS: internalBatchDelayMS });
    }, true);
});



define("ZyngaContextTracker", ["require", "exports", "ZyngaCore", "ZyngaInstant"], function (require, exports, ZyngaCore, ZyngaInstant) {
    // tslint:disable-next-line:comment-format
    ///<amd-module name="ZyngaContextTracker"/>
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    var CONTEXT_HISTORY_KEY = '_CTX_HIST';
    var CTX_SEP = ';';
    var CTX_ITEM_SEP = ':';
    var CTX_CHECK_SEP = ',';
    var CTX_PLAYER_SEP = ',';
    // Guess progression.
    // Initial numbers are based on known users playing per context
    // TODO: re-balance once we get actual size distribution
    var CTX_TYPE_SIZE_CHECKS = {
        THREAD: [
            { min: 2, max: 2, accuracy: 0 },
            { min: 3, max: 4, accuracy: 0 },
            { min: 5, max: 8, accuracy: 0 },
            { min: 9, max: 16, accuracy: 0 },
            { min: 17, max: 32, accuracy: 0 },
            { min: 33, max: 1056, accuracy: 4 },
            { min: 1057, max: null, accuracy: 0 } // 7 attempts
        ],
        GROUP: [
            { min: 2, max: 4, accuracy: 0 },
            { min: 5, max: 12, accuracy: 0 },
            { min: 13, max: 29, accuracy: 0 },
            { min: 30, max: 1053, accuracy: 4 },
            { min: 1054, max: 5050, accuracy: 32 },
            { min: 5050, max: null, accuracy: 0 } // 6 attempts
        ]
    };
    var lastContextId = null;
    exports.Event = new ZyngaCore.EventMixin();
    exports.Events = {
        CONTEXTS: 'ContextTracker.Contexts',
        CONTEXT_CHANGE: 'ContextTracker.ContextChange'
    };
    function getTS(time) {
        return Math.round(time.getTime() / 1000);
    }
    function minMaxSerialize(val) {
        var serializedVal = '';
        if (val >= 0 && val < Infinity) {
            serializedVal = val.toString();
        }
        return serializedVal;
    }
    function minMaxDeserialize(val) {
        var deserializedVal = null;
        if (val !== '') {
            deserializedVal = parseInt(val, 10);
            if (isNaN(deserializedVal)) {
                deserializedVal = null;
            }
        }
        return deserializedVal;
    }
    function historiesSerialize(histories) {
        var contexts = [];
        for (var contextId in histories) {
            var context = histories[contextId];
            var recentPlayersStr = context.recentPlayers.sort().join(CTX_PLAYER_SEP);
            var contextParts = [contextId, context.type, recentPlayersStr];
            for (var _i = 0, _a = [context.lastCheckSuccess, context.lastCheckFail]; _i < _a.length; _i++) {
                var contextSizeCheckItem = _a[_i];
                if (contextSizeCheckItem) {
                    var ts = getTS(contextSizeCheckItem.checkTime);
                    var min = minMaxSerialize(contextSizeCheckItem.min);
                    var max = minMaxSerialize(contextSizeCheckItem.max);
                    contextParts.push([ts, min, max].join(CTX_CHECK_SEP));
                }
                else {
                    contextParts.push('');
                }
            }
            contexts.push(contextParts.join(CTX_ITEM_SEP));
        }
        return contexts.join(CTX_SEP);
    }
    function sizeCheckDeserialize(str) {
        var sizeCheck = null;
        if (str.length > 0) {
            var _a = str.split(CTX_CHECK_SEP), ts = _a[0], minString = _a[1], maxString = _a[2];
            sizeCheck = {
                checkTime: new Date((parseInt(ts, 10)) * 1000),
                min: minMaxDeserialize(minString),
                max: minMaxDeserialize(maxString)
            };
        }
        return sizeCheck;
    }
    function historiesDeserialize(serializedData) {
        var histories = {};
        var contexts = serializedData.split(CTX_SEP);
        for (var _i = 0, contexts_1 = contexts; _i < contexts_1.length; _i++) {
            var context = contexts_1[_i];
            var contextParts = context.split(CTX_ITEM_SEP);
            var contextId = contextParts[0], contextType = contextParts[1], recentPlayersStr = contextParts[2], lastSuccessStr = contextParts[3], lastFailStr = contextParts[4];
            var contextHist = {
                contextId: contextId,
                type: contextType,
                recentPlayers: recentPlayersStr ? recentPlayersStr.split(CTX_PLAYER_SEP) : [],
                lastCheckSuccess: sizeCheckDeserialize(lastSuccessStr || ''),
                lastCheckFail: sizeCheckDeserialize(lastFailStr || '')
            };
            if (contextId) {
                histories[contextId] = contextHist;
            }
        }
        return histories;
    }
    function instantFunctionSupported(functionName) {
        var supportedFunctions = ZyngaInstant.getSupportedAPIs();
        return (supportedFunctions.indexOf(functionName) >= 0);
    }
    function generateChecksInRange(min, max, lastFailCheck, checks) {
        if (!checks) {
            checks = [];
        }
        if (lastFailCheck && lastFailCheck.max >= max) {
            return checks; // short circuit, dead path
        }
        if (min === max) {
            checks.push({
                min: min,
                max: max
            });
        }
        else {
            var half = (max - min + 1) / 2;
            if (Math.round(half) === half) {
                var firstHalf = {
                    min: min,
                    max: (min + half - 1)
                };
                var secondHalf = {
                    min: (min + half),
                    max: max
                };
                checks.push(firstHalf);
                if (firstHalf.min !== firstHalf.max) {
                    generateChecksInRange(firstHalf.min, firstHalf.max, lastFailCheck, checks);
                }
                checks.push(secondHalf);
                if (secondHalf.min !== secondHalf.max) {
                    generateChecksInRange(secondHalf.min, secondHalf.max, lastFailCheck, checks);
                }
            }
        }
        return checks;
    }
    function updateContextHistory(context) {
        return ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT).then(function () {
            return new Promise(function (resolve) {
                function checkSize() {
                    var schedule = CTX_TYPE_SIZE_CHECKS[context.type.toUpperCase()];
                    var nextCheck = null;
                    if (schedule) {
                        var lastCheckSuccess = context.lastCheckSuccess;
                        var lastCheckFail = context.lastCheckFail;
                        if (lastCheckSuccess === null) {
                            // No matches yet
                            if (lastCheckFail) {
                                // We've tried and failed so find next in the schedule
                                for (var i in schedule) {
                                    var scheduleCheck = schedule[i];
                                    if (scheduleCheck.max > lastCheckFail.max) {
                                        // Just check max to accomodate schedule changes.
                                        nextCheck = scheduleCheck;
                                        break;
                                    }
                                }
                            }
                            else {
                                // First check ever, try the first in the schedule
                                nextCheck = schedule[0];
                            }
                        }
                        else {
                            // We've had a success in the past
                            if (lastCheckSuccess.min === lastCheckSuccess.max) {
                                if (lastCheckFail) {
                                    // Narrowed it down to a single number but failed on re-check.
                                    // TODO:  Be smarter about backgracking since the size has likely not changed much
                                    context.lastCheckSuccess = null;
                                    context.lastCheckFail = null;
                                    nextCheck = schedule[0];
                                }
                                else {
                                    // Try again to make sure
                                    nextCheck = lastCheckSuccess;
                                }
                            }
                            else {
                                var scheduleBreakdown = generateChecksInRange(lastCheckSuccess.min, lastCheckSuccess.max, lastCheckFail);
                                if (scheduleBreakdown.length > 0) {
                                    nextCheck = scheduleBreakdown[0];
                                }
                                else {
                                    // Narrowed it down to a single number but failed on re-check.
                                    // TODO:  Be smarter about backgracking since the size has likely not changed much
                                    context.lastCheckSuccess = null;
                                    context.lastCheckFail = null;
                                    nextCheck = schedule[0];
                                }
                            }
                        }
                        if (nextCheck === null) {
                            // Oh oh, start again at the beginning
                            context.lastCheckFail = null;
                            nextCheck = schedule[0];
                        }
                        var sizeBetweenResult = ZyngaInstant.context.isSizeBetween(nextCheck.min, nextCheck.max);
                        if (sizeBetweenResult.minSize === nextCheck.min && sizeBetweenResult.maxSize === nextCheck.max) {
                            var sizeCheckResult = {
                                min: sizeBetweenResult.minSize,
                                max: sizeBetweenResult.maxSize,
                                checkTime: new Date()
                            };
                            if (sizeBetweenResult.answer === true) {
                                context.lastCheckFail = null;
                                context.lastCheckSuccess = sizeCheckResult;
                            }
                            else {
                                context.lastCheckFail = sizeCheckResult;
                            }
                            resolve();
                        }
                    }
                }
                // Check for context player changes.
                // Any players that have played the game in the last 90
                // days, friend or not, will be returned by this call
                ZyngaInstant.context.getPlayersAsync().then(function (players) {
                    var newPlayerIds = players.map(function (player) {
                        return player.getID();
                    }).sort();
                    var oldPlayerIds = context.recentPlayers.sort();
                    if (newPlayerIds.join(',') !== oldPlayerIds.join(',')) {
                        context.recentPlayers = newPlayerIds;
                    }
                    checkSize();
                }, checkSize);
            });
        });
    }
    function contextCheck() {
        exports.Event.last(exports.Events.CONTEXTS, function (contexts) {
            ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT).then(function () {
                var newContextId = ZyngaInstant.context.getID();
                var supportsSizeCheck = instantFunctionSupported('context.isSizeBetween');
                var contextChanges = false;
                var currentContextHistory = null;
                if (newContextId !== lastContextId) {
                    lastContextId = newContextId;
                    contexts[newContextId] = currentContextHistory = contexts[newContextId] || {
                        contextId: newContextId,
                        type: ZyngaInstant.context.getType(),
                        recentPlayers: [],
                        lastCheckSuccess: null,
                        lastCheckFail: null
                    };
                    updateContextHistory(currentContextHistory)
                        .then(function () {
                        return persistContexts(contexts);
                    })
                        .then(function () {
                        exports.Event.fire(exports.Events.CONTEXT_CHANGE, currentContextHistory);
                    });
                }
            });
        });
    }
    function persistContexts(contexts) {
        var serializedData = historiesSerialize(contexts);
        var writeData = {};
        writeData[CONTEXT_HISTORY_KEY] = serializedData;
        return ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT).then(function () {
            return ZyngaInstant.player.setDataAsync(writeData)
                .then(ZyngaInstant.player.flushDataAsync);
        });
    }
    ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT, function () {
        ZyngaInstant.player.getDataAsync([CONTEXT_HISTORY_KEY]).then(function (data) {
            var serializedData = data[CONTEXT_HISTORY_KEY] || '';
            var histories = historiesDeserialize(serializedData);
            exports.Event.fire(exports.Events.CONTEXTS, histories);
            contextCheck();
            ZyngaInstant.Event.on(ZyngaInstant.Events.INSTANT_CONTEXT_ID_CHANGE, contextCheck);
        });
    }, true);
});



define("ZyngaCore", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // tslint:disable-next-line:comment-format
    ///<amd-module name="ZyngaCore"/>
    function applyMixins(derivedCtor, baseCtors) {
        baseCtors.forEach(function (baseCtor) {
            Object.getOwnPropertyNames(baseCtor.prototype).forEach(function (name) {
                derivedCtor.prototype[name] = baseCtor.prototype[name];
            });
        });
    }
    exports.ZyngaPromise = Promise;
    /**
     * ES5 safe Object.assign.  Will fall back to polyfill if needed
     * @param target Target object
     * @param varArgs Any number of other objects
     *
     * Note: Taken from:
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
     */
    function ObjectAssign(target) {
        var varArgs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            varArgs[_i - 1] = arguments[_i];
        }
        if (typeof Object.assign === 'function') {
            return Object.assign.apply(this, arguments);
        }
        else {
            if (target == null) {
                throw new TypeError('Cannot convert undefined or null to object');
            }
            var to = Object(target);
            for (var index = 1; index < arguments.length; index++) {
                var nextSource = arguments[index];
                if (nextSource != null) {
                    for (var nextKey in nextSource) {
                        // Avoid bugs when hasOwnProperty is shadowed
                        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            }
            return to;
        }
    }
    exports.ObjectAssign = ObjectAssign;
    // https://tc39.github.io/ecma262/#sec-array.prototype.find
    function ArrayFind(target, predicate) {
        if (typeof Array.prototype.find === 'function') {
            // Get args minus first arg as an array
            var args = Array.prototype.slice.call(arguments, 1);
            return Array.prototype.find.apply(target, args);
        }
        else {
            // 1. Let O be ? ToObject(this value).
            if (target == null) {
                throw new TypeError('"target" is null or not defined');
            }
            var o = Object(target);
            // 2. Let len be ? ToLength(? Get(O, "length")).
            // tslint:disable-next-line:no-bitwise
            var len = o.length >>> 0;
            // 3. If IsCallable(predicate) is false, throw a TypeError exception.
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }
            // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
            var thisArg = arguments[2];
            // 5. Let k be 0.
            var k = 0;
            // 6. Repeat, while k < len
            while (k < len) {
                // a. Let Pk be ! ToString(k).
                // b. Let kValue be ? Get(O, Pk).
                // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                // d. If testResult is true, return kValue.
                var kValue = o[k];
                if (predicate.call(thisArg, kValue, k, o)) {
                    return kValue;
                }
                // e. Increase k by 1.
                k++;
            }
            // 7. Return undefined.
            return undefined;
        }
    }
    exports.ArrayFind = ArrayFind;
    function createEventObject() {
        return new EventMixin();
    }
    exports.createEventObject = createEventObject;
    /* Parses an javascript object CSS representation into a proper CSS string
        * Handled nested rules.  Like media query definitions
        * Allows for duplicate values for the same key via value arrays.
        * Example:
        *	{
        *		'.foo':  {                                 // Selectors are object property names
        *			position: 'absolute';                    // CSS properties are also object property names
        *			background: [                            // Multiple values for the same css property as an Array
        *				'rgba(164,179,87,1)',
        *				'-moz-linear-gradient(left, rgba(164,179,87,1) 0%, rgba(117,137,12,1) 100%)',
        *				'-webkit-gradient(left top, right top, color-stop(0%, rgba(164,179,87,1)), color-stop(100%, rgba(117,137,12,1)))',
        *				'-webkit-linear-gradient(left, rgba(164,179,87,1) 0%, rgba(117,137,12,1) 100%)',
        *				'-o-linear-gradient(left, rgba(164,179,87,1) 0%, rgba(117,137,12,1) 100%)',
        *				'-ms-linear-gradient(left, rgba(164,179,87,1) 0%, rgba(117,137,12,1) 100%)',
        *				'linear-gradient(to right, rgba(164,179,87,1) 0%, rgba(117,137,12,1) 100%)'
        *			],
        *		}
        *		'@media (max-width: 600px)': {            // Media query example
        *			'.foo': {                               // selectors can be children of other selectors
        *				'background-color': 'red'             // business as usual
        *			}
        *		}
        * }
        */
    function parseCSS(cssObj, indentation) {
        var items = [];
        var key;
        var val;
        var i;
        indentation = indentation || '';
        indentation = indentation + '\t';
        for (key in cssObj) {
            val = cssObj[key];
            if (typeof val === 'object' && !Array.isArray(val)) {
                items.push(indentation + key + ' {');
                items.push(parseCSS(val, indentation));
                items.push(indentation + '}');
            }
            else {
                if (!Array.isArray(val)) {
                    val = [val];
                }
                for (i = 0; i < val.length; i++) {
                    items.push(indentation + key + ': ' + val[i] + ';');
                }
            }
        }
        return items.join('\n');
    }
    exports.parseCSS = parseCSS;
    var EventMixin = (function () {
        function EventMixin() {
            var _this = this;
            this.handlers = {};
            this.lastArgs = {};
            // Turn on an event handler, optionally:  Isolate and/or only call once
            this.on = function (eventName, eventHandler, isolateHandler, once) {
                var handlers = _this.getEventHandlers(eventName);
                var handlerPosition = _this.getHandlerPosition(eventHandler, handlers);
                if (typeof eventHandler !== 'function') {
                    throw new TypeError('not a function');
                }
                // Only register the handler if it's not already registered
                if (handlerPosition === -1) {
                    handlers.push({
                        fn: eventHandler,
                        isolate: isolateHandler !== false,
                        once: once === true // Only call the handler once
                    });
                }
            };
            // Trun off an event handler
            this.off = function (eventName, eventHandler) {
                var handlers = _this.getEventHandlers(eventName);
                var handlerPosition = _this.getHandlerPosition(eventHandler, handlers);
                if (handlerPosition !== -1) {
                    // remove handler
                    handlers.splice(handlerPosition, 1);
                }
            };
            // Fire an event.
            // arguments[0]    - The event name
            // arguments[1..n] - Any arguments you want to pass to the handlers
            this.fire = function (eventName) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                var handlers = _this.getEventHandlers(eventName);
                var handlerCount = handlers.length;
                var handler;
                var handlerFn;
                var isolatedFn;
                var i;
                var removeHandlers = [];
                _this.lastArgs[eventName] = args;
                for (i = 0; i < handlerCount; i++) {
                    handler = handlers[i];
                    handlerFn = handler.fn;
                    isolatedFn = handler.isolate === true ? _this.isolate(handlerFn) : handlerFn;
                    isolatedFn.apply(handlerFn, args);
                    if (handler.once === true) {
                        removeHandlers.push(handlerFn);
                    }
                }
                // Now remove some handlers.  Do this outside the previous loop as it's destrcutive to the handler array
                handlerCount = removeHandlers.length;
                for (i = 0; i < handlerCount; i++) {
                    _this.off(eventName, removeHandlers[i]);
                }
            };
            // Register an event handler but make sure it only fires once
            // Can be called in "callback" mode:
            //   obj.once('foo', function(x) {console.log(x);}, doIsolation);
            // Or in "Promise" mode
            //   obj.once('foo', doIsolation).then(function (x) { console.log(x); });
            // Both are supported
            this.once = function (eventName, eventHandler, isolateHandler) {
                if (typeof eventHandler !== 'function') {
                    // We were called in Promise mode
                    // Shift isolateHander arg 1 left
                    isolateHandler = eventHandler;
                    return new Promise(function (resolve) {
                        _this.once(eventName, function () {
                            var args = [];
                            for (var _i = 0; _i < arguments.length; _i++) {
                                args[_i] = arguments[_i];
                            }
                            // resolve only takes one argument so make sure we pass an array of > 1 argument was provided
                            var arg = args.length > 1 ? Array.prototype.slice.call(args) : args[0];
                            resolve(arg);
                        }, isolateHandler);
                    });
                }
                else {
                    _this.on(eventName, eventHandler, isolateHandler, true);
                }
            };
            // Register an event handler to be called with the last event value.
            // If the event has not happened yet (ever) then treat as .once()
            // Can be called in "callback" mode:
            //   obj.once('foo', function(x) {console.log(x);}, doIsolation);
            // Or in "Promise" mode
            //   obj.once('foo', doIsolation).then(function (x) { console.log(x); });
            // Both are supported
            this.last = function (eventName, eventHandler, isolateHandler) {
                var lastArgs = _this.lastArgs[eventName];
                if (typeof eventHandler !== 'function') {
                    // We were called in Promise mode
                    // Shift isolateHander arg 1 left
                    isolateHandler = eventHandler;
                    return new Promise(function (resolve) {
                        _this.last(eventName, function () {
                            var args = [];
                            for (var _i = 0; _i < arguments.length; _i++) {
                                args[_i] = arguments[_i];
                            }
                            // resolve only takes one argument so make sure we pass an array of > 1 argument was provided
                            var arg = args.length > 1 ? Array.prototype.slice.call(args) : args[0];
                            resolve(arg);
                        }, isolateHandler);
                    });
                }
                else {
                    // We were called in callback mode
                    if (lastArgs !== undefined) {
                        // Event has fired before. Fire with those args
                        (isolateHandler === true ? _this.isolate(eventHandler) : eventHandler).apply(undefined, lastArgs);
                    }
                    else {
                        _this.once(eventName, eventHandler, isolateHandler);
                    }
                }
            };
            this.getLastFiredValue = function (eventName) {
                var args = _this.lastArgs[eventName];
                return args ? args[0] : args;
            };
            this.clearLastFiredValue = function (eventName) {
                delete _this.lastArgs[eventName];
            };
            // Register an event handler to be called with the last event value AND any after that.
            // If the event has not happened yet then this should be much like "on"
            this.all = function (eventName, eventHandler, isolateHandler) {
                var args = _this.lastArgs[eventName];
                if (typeof eventHandler === 'function') {
                    if (args !== undefined) {
                        // We've been called before
                        (isolateHandler === true ? _this.isolate(eventHandler) : eventHandler).apply(undefined, args);
                    }
                    // Also register for all upcoming events
                    _this.on(eventName, eventHandler, isolateHandler);
                }
            };
        }
        EventMixin.prototype.isolate = function (fn) {
            return function () {
                var args = Array.prototype.slice.call(arguments); // Convert into actual array
                setTimeout(function () {
                    fn.apply(fn, args);
                }, 0); // nico: todo: was setImmediate. consequence?
            };
        };
        // Get array of event handlers.
        // Side Effects:  Creates empty handler list if non exist.
        EventMixin.prototype.getEventHandlers = function (eventName) {
            var eventHandlers = this.handlers[eventName] = this.handlers[eventName] || [];
            return eventHandlers;
        };
        // Get the position of a specific handler function for an event
        EventMixin.prototype.getHandlerPosition = function (eventHandler, handlers) {
            var i;
            var len = handlers.length;
            for (i = 0; i < len; i++) {
                if (handlers[i].fn === eventHandler) {
                    return i;
                }
            }
            return -1;
        };
        return EventMixin;
    }());
    exports.EventMixin = EventMixin;
});



define("ZyngaDebug", ["require", "exports", "Zynga", "ZyngaAccount", "ZyngaAnalytics", "ZyngaNet"], function (require, exports, Zynga, ZyngaAccount, ZyngaAnalytics_1, ZyngaNet) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Debug = (function () {
        function Debug() {
        }
        Debug.init = function () {
            window.onerror = function (msg, url, line, col, error) {
                // may not be supported in all browsers
                var colString = !col ? '' : '\ncolumn: ' + col;
                var errorString = !error ? '' : '\nerror: ' + error;
                Debug.logError("Error: " + msg + "\nurl: " + url + "\nline: " + line + colString + errorString);
                // return true supresses alert dialogs
                return true;
            };
            console['save'] = function (data, filename) {
                if (!data) {
                    Debug.logError('Console.save: No data');
                    return;
                }
                if (!filename) {
                    filename = 'console.json';
                }
                if (typeof data === 'object') {
                    data = JSON.stringify(data, undefined, 4);
                }
                var blob = new Blob([data], { type: 'text/json' });
                var e = document.createEvent('MouseEvents');
                var a = document.createElement('a');
                a.download = filename;
                a.href = window.URL.createObjectURL(blob);
                a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
                e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                a.dispatchEvent(e);
            };
            if (Promise['_setUnhandledRejectionFn']) {
                Promise['_setUnhandledRejectionFn'](Debug.unhandledReject);
            }
            else {
                window.addEventListener('unhandledrejection', function (event) {
                    event.preventDefault();
                    Debug.unhandledReject(event.reason);
                });
            }
            // todo: I can't test this.
            if (window['ZyngaCore'] && window['ZyngaCore']['Promise']) {
                window['ZyngaCore']['Promise']['_setUnhandledRejectionFn'](Debug.unhandledReject);
            }
            Debug.system_console_error = console.error;
            // redirect console.error to our log func
            console.error = Debug.logError;
        };
        // for things you want to push to the log stream, but not see as nasty error text in the console.
        Debug.log = function (data) {
            if (Debug.enabled) {
                if (typeof data === 'object') {
                    // tslint:disable-next-line:no-console
                    console.log(JSON.stringify(data, undefined, 4));
                }
                else {
                    // tslint:disable-next-line:no-console
                    console.log(data);
                }
            }
            Debug.logStrings.push(data);
        };
        // this should be exactly like calling console.error;
        Debug.logError = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            Debug.system_console_error.apply(console, args);
            Debug.logStrings.push(args);
            var message = '';
            for (var i = 0; i < args.length; i++) {
                var data = args[i];
                message += (i > 0 ? ', [' + (i - 1) + '] ' : '');
                if (typeof data === 'object') {
                    try {
                        if (data instanceof Error) {
                            message += (data.stack || data.toString()); // this is hte best way to serialize error objects?
                        }
                        else {
                            message += JSON.stringify(data, undefined, 4);
                        }
                    }
                    catch (e) {
                        message += data;
                    }
                }
                else {
                    message += data;
                }
            }
            // Send to log service
            Debug.logCall('error', { message: message }, null);
            // Send to stats
            ZyngaAnalytics_1.logCount({
                counter: 'performance',
                kingdom: 'error',
                genus: message
            });
        };
        Debug.downloadLog = function (logName) {
            if (logName === undefined) {
                logName = 'consoleLog.txt';
            }
            else if (logName.indexOf('.txt') === -1) {
                logName += '.txt';
            }
            console['save'](Debug.logStrings, logName);
        };
        Debug.logCall = function (level, data, options) {
            options = options || {};
            Promise.all([
                Zynga.Event.last(Zynga.Events.APP_ID),
                ZyngaAccount.Event.last(ZyngaAccount.Events.ACCOUNT_DETAILS)
            ]).then(function (results) {
                var appId = results[0];
                var accountDetails = results[1];
                options.useToken = accountDetails.token;
                options.body = data;
                return ZyngaNet.api('POST', '/log/v1/app/' + appId + '/level/' + level, options);
            }).catch(function (e) {
                // just eat it.
            });
        };
        Debug.unhandledReject = function (error) {
            error = error || 'unknown_rejection';
            Debug.logError(error);
        };
        Debug.logStrings = [];
        Debug.enabled = true;
        return Debug;
    }());
    exports.default = Debug;
});



///<amd-module name="ZyngaHomeScreen"/>
define("ZyngaHomeScreen", ["require", "exports", "ZyngaWallet"], function (require, exports, ZyngaWallet) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.currencyConfig = {
        cashItemId: "cash",
        homepageDripId: "daily_drip"
    };
    // needs to be exposed to be customizable.
    var fadeOutRate = 2;
    var fadeInRate = 0.5;
    var maxBlack = 0.7;
    function indexPage() {
        return {
            root: document.getElementById("homescreen-container"),
            inner_root: document.getElementById("homescreen-inner"),
            cash: document.getElementById("cash-amt"),
            highscore: document.getElementById("score-amt-best"),
            score: document.getElementById("score-amt"),
            logo: document.getElementById("logo"),
            game_mode_btn: document.getElementById("game-mode"),
            play_btn: document.getElementById("play-btn"),
            daily_drip: document.getElementById("daily-drip"),
            daily_drip_icon: document.getElementById("daily-drip-icon"),
            daily_drip_countdown: document.getElementById("daily-drip-countdown"),
        };
    }
    exports.indexPage = indexPage;
    // todo: is this locale-appropriate?
    function secondsToString(timespan_s) {
        var date = new Date(null);
        date.setSeconds(timespan_s);
        return date.toISOString().substr(11, 8);
    }
    exports.secondsToString = secondsToString;
    function bindCallbacks() {
        exports.data.pageIndex.daily_drip.onclick = exports.callbacks.onDailyDripCollect;
        exports.data.pageIndex.play_btn.onclick = exports.callbacks.onPlay;
    }
    exports.bindCallbacks = bindCallbacks;
    function dailyDripCollect(ev) {
        // todo: indicate processing on the button.
        exports.data.pageIndex.daily_drip.onclick = null;
        exports.data.pageIndex.daily_drip_countdown.innerText = "--";
        ZyngaWallet.claimDrip({ drip_id: exports.currencyConfig.homepageDripId, try_get: true }).then(function (r) {
            exports.callbacks.onRefreshUI();
            exports.data.pageIndex.daily_drip.onclick = exports.callbacks.onDailyDripCollect;
        });
    }
    // extend: override me and set new instance on data.props.
    var DefaultProps = (function () {
        function DefaultProps() {
        }
        Object.defineProperty(DefaultProps.prototype, "wallet", {
            get: function () {
                return ZyngaWallet.cachedWallet;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DefaultProps.prototype, "score", {
            get: function () { return 0; },
            enumerable: true,
            configurable: true
        });
        ;
        Object.defineProperty(DefaultProps.prototype, "highscore", {
            get: function () { return 0; },
            enumerable: true,
            configurable: true
        });
        ;
        return DefaultProps;
    }());
    exports.DefaultProps = DefaultProps;
    // set with the right data, then call show()
    exports.data = {
        itemCatalog: null,
        dripCatalog: null,
        props: new DefaultProps(),
        pageIndex: indexPage()
    };
    // override these with your own implemenations if you need to change something.
    // if you change these, call "bindDefaultCallbacks()"
    exports.callbacks = {
        onRefreshUI: refreshUI,
        onDailyDripCollect: dailyDripCollect,
        onPlay: hide
    };
    bindCallbacks();
    var fadeInAmount = 1;
    function refreshUI() {
        if (exports.data.props.wallet && exports.data.itemCatalog && exports.data.dripCatalog) {
            var now_ts = new Date().getTime();
            var wallet = exports.data.props.wallet;
            var cash = wallet.items[exports.currencyConfig.cashItemId] || 0;
            exports.data.pageIndex.cash.innerText = "" + cash;
            var dripStatus = ZyngaWallet.calculateDripStatus(exports.data.dripCatalog, now_ts, exports.currencyConfig.homepageDripId, wallet);
            // do something to show the prize item! 
            // dripStatus.prize_item
            exports.data.pageIndex.daily_drip_countdown.innerText = secondsToString(dripStatus.time_remaining_s);
        }
        exports.data.pageIndex.highscore.innerText = "" + exports.data.props.highscore;
        exports.data.pageIndex.score.innerText = "" + exports.data.props.score;
    }
    exports.refreshUI = refreshUI;
    function isVisible() {
        return targetVisible;
    }
    exports.isVisible = isVisible;
    function isRootVisible() {
        return exports.data.pageIndex.root.style.display !== "none";
    }
    function isInnerRootVisible() {
        return exports.data.pageIndex.inner_root.style.display !== "none";
    }
    function fadeIn(dt) {
        fadeInAmount += fadeInRate * dt;
        fadeInAmount = Math.max(0, Math.min(maxBlack, fadeInAmount));
        if (fadeInAmount > 0 && !isRootVisible()) {
            exports.data.pageIndex.root.style.display = null; // default?
        }
        if (fadeInAmount >= maxBlack && !isInnerRootVisible()) {
            exports.data.pageIndex.inner_root.style.display = null; // default?
        }
        exports.data.pageIndex.root.style.backgroundColor = "rgba(0,0,0," + fadeInAmount + ")";
    }
    function fadeOut(dt) {
        fadeInAmount -= fadeOutRate * dt;
        fadeInAmount = Math.min(maxBlack, Math.max(0, fadeInAmount));
        if (fadeInAmount < maxBlack && isInnerRootVisible()) {
            // hide inner guts first
            exports.data.pageIndex.inner_root.style.display = "none";
        }
        if (fadeInAmount <= 0) {
            // then hide the whole thing.
            exports.data.pageIndex.root.style.display = "none";
        }
        exports.data.pageIndex.root.style.backgroundColor = "rgba(0,0,0," + fadeInAmount + ")";
    }
    var targetVisible = true;
    function hide() {
        targetVisible = false;
        prev_ts = new Date().getTime();
        animate();
    }
    exports.hide = hide;
    function show() {
        targetVisible = true;
        prev_ts = new Date().getTime();
        animate();
    }
    exports.show = show;
    // only pump animation loop while visible.
    var prev_ts = new Date().getTime();
    function animate() {
        var now_ts = new Date().getTime();
        var dt = (now_ts - prev_ts) / 1000; // seconds.
        prev_ts = now_ts;
        if (targetVisible) {
            fadeIn(dt);
        }
        else {
            fadeOut(dt);
        }
        if (isInnerRootVisible()) {
            // update data model here.
            refreshUI();
        }
        if (targetVisible ? fadeInAmount < maxBlack : fadeInAmount > 0) {
            // currently fading, need fast update.
            requestAnimationFrame(animate);
        }
        else {
            if (isInnerRootVisible()) {
                setTimeout(animate, 1000);
            }
        }
    }
    exports.animate = animate;
    function hideLogoAndTitle() {
        exports.data.pageIndex.logo.style.visibility = "hidden";
    }
    exports.hideLogoAndTitle = hideLogoAndTitle;
});



define("ZyngaInstant", ["require", "exports", "ZyngaCore"], function (require, exports, ZyngaCore) {
    // tslint:disable-next-line:comment-format
    ///<amd-module name="ZyngaInstant"/>
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    var FBInstant = window['FBInstant'];
    var iMsgInstant = window['iMsgInstant'];
    var instant = FBInstant || iMsgInstant;
    if (instant === undefined) {
        throw Error('No instant SDKs were found.  Either FBInstant or iMsgInstant SDK is required.');
    }
    if (FBInstant !== undefined && iMsgInstant !== undefined) {
        // tslint:disable-next-line:max-line-length
        throw Error('Too many instant SDKs were found.  Only one instant SDK (FBInstant or iMsgInstant) may be laoded at a time.');
    }
    var instantContextId;
    var G_INIT = 'Game.Initialize';
    var I_INIT = 'Instant.Initialized';
    var G_START = 'Game.StartGame';
    var I_START = 'Instant.StartGame';
    var I_FB_TOS_ACCEPT = 'Instant.TOSAccept';
    var G_END = 'Game.EndGame';
    var I_REPLAY = 'Instant.ReplayGame';
    var I_CTX_CHG = 'Instant.ContextIdChange';
    var G_SCORE = 'Game.ScoreChange';
    var G_LOAD_PROGRESS = 'Game.LoadProgress';
    var G_SWITCH_CONTEXT = 'Game.SwitchContext';
    var G_CHOOSE_CONTEXT = 'Game.ChooseContext';
    var G_CREATE_CONTEXT = 'Game.CreateContext';
    var G_QUIT = 'Game.Quit';
    var G_AD_STATUS = 'Game.AdStatus';
    var noop = function () { return; };
    var methodArgHooks = {};
    var methodReturnHooks = {};
    // Not sure if we want to move me.fire() out and into this closure.
    // This would ensure nobody calls it from outside this module.
    // Leaving it for now.
    exports.Event = new ZyngaCore.EventMixin();
    exports.Events = {
        GAME_INITIALIZE: G_INIT,
        INSTANT_INITIALIZED: I_INIT,
        GAME_GAME_START: G_START,
        INSTANT_GAME_STARTED: I_START,
        INSTANT_FB_TOS_ACCEPT: I_FB_TOS_ACCEPT,
        GAME_GAME_END: G_END,
        GAME_SCORE_CHANGE: G_SCORE,
        INSTANT_GAME_REPLAY: I_REPLAY,
        INSTANT_CONTEXT_ID_CHANGE: I_CTX_CHG,
        GAME_LOADING_PRGOGRESS: G_LOAD_PROGRESS,
        GAME_SWITCH_CONTEXT: G_SWITCH_CONTEXT,
        GAME_CHOOSE_CONTEXT: G_CHOOSE_CONTEXT,
        GAME_CREATE_CONTEXT: G_CHOOSE_CONTEXT,
        GAME_QUIT: G_QUIT,
        GAME_AD_STATUS: G_AD_STATUS // Game ad fetch/load/show status change
    };
    exports.zynga = {
        registerMethodArgumentHook: function (method, hook) {
            var hooks = methodArgHooks[method] = methodArgHooks[method] || [];
            hooks.push(hook);
        },
        registerMethodReturnHook: function (method, hook) {
            var hooks = methodReturnHooks[method] = methodReturnHooks[method] || [];
            hooks.push(hook);
        }
    };
    function getInstantMethodFromString(methodName, baseObj) {
        var path = methodName.split('.');
        var firstName = path.shift();
        if (path.length === 0) {
            // At the end, return the function
            return baseObj[firstName];
        }
        else {
            // Still need to recurse
            return getInstantMethodFromString(path.join('.'), baseObj[firstName]);
        }
    }
    // nico: don't want to export to whole world, want to export to sub-namespace.
    function wrapInstantMethod(methodName, needsFBTOSAccept, returnsPromise, eventCallback, eventResolveCallback) {
        var instantMethod = getInstantMethodFromString(methodName, instant);
        if (!instantMethod) {
            return undefined;
        }
        eventCallback = eventCallback || noop;
        eventResolveCallback = eventResolveCallback || noop;
        // Return a new wrapper function (closure)
        return function () {
            var methodArgs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                methodArgs[_i] = arguments[_i];
            }
            // Save the FBInstant arguments
            var argHooks = methodArgHooks[methodName] || [];
            var argHookCount = argHooks.length;
            var returnHooks = methodReturnHooks[methodName] || [];
            var returnHookCount = returnHooks.length;
            var i;
            var returnValue;
            var TOSAccepted = exports.Event.getLastFiredValue(I_FB_TOS_ACCEPT);
            if (needsFBTOSAccept === true && TOSAccepted !== true) {
                if (console.trace) {
                    // tslint:disable-next-line:no-console
                    console.trace("FBInstant." + methodName + "() called before FBInstant.startGameAsync()");
                }
                else {
                    // tslint:disable-next-line:no-console
                    console.error("FBInstant." + methodName + "() called before FBInstant.startGameAsync()", new Error().stack);
                }
            }
            for (i = 0; i < argHookCount; i++) {
                // methodArgs can be modified/replaced by hooks
                methodArgs = argHooks[i].apply(undefined, methodArgs);
            }
            // Game called FB method.  We might want to do something.
            eventCallback.apply(undefined, methodArgs);
            if (returnsPromise === false) {
                // Not expecting a promise.  Just call the SDK
                returnValue = instantMethod.apply(instant, methodArgs);
                // Apply any return value hooks
                for (i = 0; i < returnHookCount; i++) {
                    // methodArgs can be modified/replaced by hooks
                    returnValue = returnHooks[i].apply(undefined, [returnValue]);
                }
                return returnValue;
            }
            // Return our own Promise
            return new Promise(function (resolve, reject) {
                // Now call the original FB method
                instantMethod.apply(instant, methodArgs).then(function () {
                    // Wrap the resolve callback
                    var resolveArgs = arguments;
                    // There may be hooks to modify resolve arguments.
                    var thisMethodReturnHooks = methodReturnHooks[methodName] || [];
                    var thisMethodReturnHookCount = thisMethodReturnHooks.length;
                    // tslint:disable-next-line:no-shadowed-variable
                    var i;
                    for (i = 0; i < thisMethodReturnHookCount; i++) {
                        // methodArgs can be modified/replaced by hooks
                        resolveArgs = thisMethodReturnHooks[i].apply(undefined, methodArgs);
                    }
                    // Fire our resolve event
                    if (eventResolveCallback !== noop) {
                        eventResolveCallback.apply(undefined, resolveArgs);
                    }
                    // Now actually resolve
                    resolve.apply(undefined, resolveArgs);
                }, reject);
            });
        };
    }
    /**************************/
    /* Instant SDK wrappers */
    /**************************/
    // Helper fuction for firing specific events
    function genFireEventFunc(eventName) {
        return function () {
            var args = Array.prototype.slice.call(arguments); // Convert into actual array
            args.unshift(eventName);
            exports.Event.fire.apply(undefined, args);
        };
    }
    // Wrap methods that return Promises
    exports.initializeAsync = wrapInstantMethod('initializeAsync', false, true, genFireEventFunc(G_INIT), function () {
        // The folowing values should be set after Instant initialization is done but BEFORE we fire our I_INIT event
        if (!instant.getSDKVersion) {
            throw new Error('FBInstant.getSDKVersion does not exists.  Is this v1.x?  We don\'t support that any more.');
        }
        exports.Event.fire(I_INIT, arguments);
    });
    exports.startGameAsync = wrapInstantMethod('startGameAsync', false, true, genFireEventFunc(G_START), genFireEventFunc(I_START));
    // tslint:disable-next-line:no-namespace
    var player;
    (function (player) {
        // Wrap method that return Promises but we don't want to inject events
        player.getDataAsync = 
        // introduced in v1.1
        wrapInstantMethod('player.getDataAsync', true, true);
        player.setDataAsync = 
        // introduced in v1.1
        wrapInstantMethod('player.setDataAsync', true, true);
        player.flushDataAsync = 
        // introduced in v3.2
        wrapInstantMethod('player.flushDataAsync', true, true);
        player.getID = wrapInstantMethod('player.getID', false, false);
        player.getName = wrapInstantMethod('player.getName', true, false);
        player.getPhoto = wrapInstantMethod('player.getPhoto', true, false);
        // v3.0+, v4.0+ for connectedPlayer objects
        player.getConnectedPlayersAsync = wrapInstantMethod('player.getConnectedPlayersAsync', true, true);
        player.getSignedPlayerInfoAsync = wrapInstantMethod('player.getSignedPlayerInfoAsync', true, true);
    })(player = exports.player || (exports.player = {}));
    // tslint:disable-next-line:max-line-length
    exports.setLoadingProgress = wrapInstantMethod('setLoadingProgress', false, false, genFireEventFunc(G_LOAD_PROGRESS));
    // Wrap regular methods but we don't want to inject events
    // Old, it is now called quit
    exports.abort = wrapInstantMethod('abort', false, false);
    exports.getSupportedAPIs = wrapInstantMethod('getSupportedAPIs', false, false);
    exports.getSDKVersion = wrapInstantMethod('getSDKVersion', false, false);
    exports.getPlatform = wrapInstantMethod('getPlatform', false, false);
    exports.getLocale = wrapInstantMethod('getLocale', true, false);
    function wrapAdMethod(type) {
        var fullMethodName = 'get' + type + 'Async';
        return function (placementId) {
            var startTS = (new Date()).getTime();
            var adFetch = FBInstant[fullMethodName];
            var TOSAccepted = exports.Event.getLastFiredValue(I_FB_TOS_ACCEPT);
            if (TOSAccepted !== true) {
                if (console.trace) {
                    // tslint:disable-next-line:no-console
                    console.trace("FBInstant." + fullMethodName + "() called before FBInstant.startGameAsync()");
                }
                else {
                    // tslint:disable-next-line:no-console
                    console.error("FBInstant." + fullMethodName + "() called before FBInstant.startGameAsync()", new Error().stack);
                }
            }
            var getAdStatus = function (adStatusType, data) {
                var adStatus = {
                    id: startTS,
                    placementId: placementId,
                    adType: type,
                    statusType: adStatusType,
                    time: new Date()
                };
                if (data) {
                    adStatus.data = data;
                }
                return adStatus;
            };
            exports.Event.fire(exports.Events.GAME_AD_STATUS, getAdStatus('FETCH'));
            return adFetch(placementId).then(function (realAd) {
                // Success
                var adOnClick = null;
                if (typeof realAd.onClick === 'function') {
                    realAd.onClick(function () {
                        exports.Event.fire(exports.Events.GAME_AD_STATUS, getAdStatus('CLICK'));
                        if (adOnClick !== null) {
                            adOnClick();
                        }
                    });
                }
                var ourAd = {
                    getPlacementID: function () {
                        return placementId;
                    },
                    loadAsync: function () {
                        exports.Event.fire(exports.Events.GAME_AD_STATUS, getAdStatus('LOAD_START'));
                        return realAd.loadAsync().then(function () {
                            exports.Event.fire(exports.Events.GAME_AD_STATUS, getAdStatus('LOAD_END'));
                            return Promise.resolve();
                        }, function (err) {
                            exports.Event.fire(exports.Events.GAME_AD_STATUS, getAdStatus('LOAD_ERROR', err));
                            return Promise.reject(err);
                        });
                    },
                    showAsync: function () {
                        exports.Event.fire(exports.Events.GAME_AD_STATUS, getAdStatus('SHOW_START'));
                        return realAd.showAsync().then(function () {
                            exports.Event.fire(exports.Events.GAME_AD_STATUS, getAdStatus('SHOW_END'));
                            return Promise.resolve();
                        }, function (err) {
                            exports.Event.fire(exports.Events.GAME_AD_STATUS, getAdStatus('SHOW_ERROR', err));
                            return Promise.reject(err);
                        });
                    },
                    onClick: function (newOnClick) {
                        adOnClick = newOnClick;
                    }
                };
                // ToDo: log fetch success
                return Promise.resolve(ourAd);
            }, function (err) {
                exports.Event.fire(exports.Events.GAME_AD_STATUS, getAdStatus('FETCH_ERROR', err));
                return Promise.reject(err);
            });
        };
    }
    // ToDo: Override these with out own wrappers all the way through for tracking
    exports.getInterstitialAdAsync = wrapAdMethod('InterstitialAd');
    exports.getRewardedVideoAsync = wrapAdMethod('RewardedVideo');
    // tslint:disable-next-line:no-namespace
    var context;
    (function (context) {
        context.getID = wrapInstantMethod('context.getID', true, false);
        // introduced in v2.1
        context.getType = wrapInstantMethod('context.getType', true, false);
        // 3.0
        context.chooseAsync = wrapInstantMethod('context.chooseAsync', true, true, genFireEventFunc(G_CHOOSE_CONTEXT), checkContextIdChange);
        context.switchAsync = wrapInstantMethod('context.switchAsync', true, true, genFireEventFunc(G_SWITCH_CONTEXT), checkContextIdChange); // TODO: fire event
        // 3.2
        context.createAsync = wrapInstantMethod('context.createAsync', true, true, genFireEventFunc(G_CREATE_CONTEXT), checkContextIdChange);
        // 4.1
        context.getPlayersAsync = wrapInstantMethod('context.getPlayersAsync', true, true);
        context.isSizeBetween = wrapInstantMethod('context.isSizeBetween', true, false);
    })(context = exports.context || (exports.context = {}));
    // introduced in v2.1
    exports.logEvent = wrapInstantMethod('logEvent', true, false);
    exports.updateAsync = wrapInstantMethod('updateAsync', true, true, genFireEventFunc(G_CHOOSE_CONTEXT), checkContextIdChange);
    exports.shareAsync = wrapInstantMethod('shareAsync', true, true);
    exports.getEntryPointData = wrapInstantMethod('getEntryPointData', true, false);
    exports.onPause = wrapInstantMethod('onPause', false, false);
    exports.quit = wrapInstantMethod('quit', false, false);
    exports.setSessionData = wrapInstantMethod('setSessionData', true, false);
    // tslint:disable-next-line:max-line-length
    exports.switchGameAsync = wrapInstantMethod('switchGameAsync', true, true);
    /************************************/
    /* Internal Instant specific events */
    /************************************/
    // Check FBInstant SDK context ID value against last known value
    function checkContextIdChange() {
        var newContextId = instant.context.getID();
        if (newContextId && newContextId !== instantContextId) {
            // New or initial value
            instantContextId = newContextId;
            exports.Event.fire(I_CTX_CHG, instantContextId);
        }
    }
    exports.Event.last(I_START, function () {
        // If the game has started then the TOS has been accepted
        exports.Event.fire(exports.Events.INSTANT_FB_TOS_ACCEPT, true);
    });
    // Initial context ID is not known until after facebook tells the game to start
    exports.Event.on(I_START, checkContextIdChange);
    // Context id can change between rounds.
    exports.Event.on(I_REPLAY, checkContextIdChange);
});



define("ZyngaLeaderboard", ["require", "exports", "Zynga", "ZyngaAccount", "ZyngaContextTracker", "ZyngaInstant", "ZyngaNet", "ZyngaProfile"], function (require, exports, Zynga, ZyngaAccount, ZyngaContextTracker, ZyngaInstant, ZyngaNet, ZyngaProfile) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var leaderboardServiceVersion = 'v2';
    var DEFAULT_SET_SCORE_OPTIONS = {};
    function deepClone(obj) {
        var retVal;
        try {
            retVal = JSON.parse(JSON.stringify(obj));
        }
        catch (e) {
            // no-op
        }
        return retVal;
    }
    var playerInfoCache = {
        zyngaPlayerIdIndex: {},
        facebookPlayerIdIndex: {},
        players: []
    };
    function numberOrStringToString(obj) {
        var retVal = obj;
        if (typeof obj === 'string' || typeof obj === 'number') {
            retVal = obj.toString();
        }
        return retVal;
    }
    function getServiceCallPrereqs() {
        return new Promise(function (resolve) {
            var accountDetailsPromise = ZyngaAccount.Event.last(ZyngaAccount.Events.ACCOUNT_DETAILS);
            var appIdPromise = Zynga.Event.last(Zynga.Events.APP_ID);
            Promise.all([accountDetailsPromise, appIdPromise]).then(function (results) {
                var retVal = {
                    accountDetails: results[0],
                    appId: parseInt(results[1], 10)
                };
                resolve(retVal);
            });
        });
    }
    function getLeaderboardResponse(response) {
        return new Promise(function (resolve, reject) {
            var responseObj = response.body;
            if (typeof responseObj === 'object' && responseObj.hasOwnProperty('status_code')) {
                // A proper leaderboard response
                if (responseObj.status_code === 1) {
                    var err = responseObj.error_data;
                    err.xhr = response.xhr;
                    reject(err);
                }
                else {
                    resolve(responseObj);
                }
            }
            else {
                reject({
                    code: null,
                    category: 'Unknown error',
                    msg: 'Unknown reponse payload format',
                    xhr: response.xhr
                });
            }
        });
    }
    function customLeaderboardCall(method, path, body) {
        return new Promise(function (resolve, reject) {
            getServiceCallPrereqs().then(function (info) {
                var generatedPath = typeof path === 'function' ? path(info) : path;
                var generatedBody = typeof body === 'function' ? body(info) : body;
                var options = {
                    useToken: info.accountDetails.token
                };
                if (generatedBody !== null && generatedBody !== undefined) {
                    options.body = generatedBody;
                }
                // tslint:disable-next-line:max-line-length
                ZyngaNet.api(method, generatedPath, options).then(function (apiResult) {
                    resolve({
                        response: apiResult,
                        info: info
                    });
                }, reject);
            });
        });
    }
    exports.customLeaderboardCall = customLeaderboardCall;
    function setScore(leaderboardName, score, options) {
        return new Promise(function (resolve, reject) {
            ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT, function () {
                var extra = {
                    p: {
                        n: ZyngaInstant.player.getName(),
                        p: ZyngaInstant.player.getPhoto(),
                        i: ZyngaInstant.player.getID(),
                        t: Math.floor(new Date().getTime() / 1000)
                    },
                    e: null
                };
                var body = {
                    details: true,
                    rank: true,
                    score: score
                };
                var continuePromise = Promise.resolve(true);
                options = options || DEFAULT_SET_SCORE_OPTIONS;
                if (options.extra) {
                    extra.e = options.extra;
                }
                else {
                    delete extra.e;
                }
                if (options.tier !== undefined) {
                    body.tier = options.tier;
                }
                var onlyIfBetterDirection = options.onlyIfBetterDirection && options.onlyIfBetterDirection.toUpperCase();
                if (onlyIfBetterDirection &&
                    onlyIfBetterDirection === 'ASC' ||
                    onlyIfBetterDirection === 'DESC') {
                    continuePromise = ZyngaAccount.Event.last(ZyngaAccount.Events.ACCOUNT_DETAILS)
                        .then(function (accountDetails) {
                        var zid = accountDetails.zid.toString();
                        return getPlayerScoresByZyngaPlayerIds([zid], [leaderboardName]).then(function (responses) {
                            var response = responses[leaderboardName];
                            var myPlayer = response.players[zid];
                            var myScore = myPlayer && myPlayer.score;
                            var doSetScore = true;
                            if (score &&
                                (onlyIfBetterDirection === 'ASC' && score >= myScore) ||
                                (onlyIfBetterDirection === 'DESC' && score <= myScore)) {
                                doSetScore = false;
                            }
                            return doSetScore;
                        });
                    });
                }
                continuePromise.then(function (doContinue) {
                    if (doContinue) {
                        var extraString = '';
                        extraString = JSON.stringify(extra);
                        if (extraString.length > 2048) {
                            // TODO: reject with validation error
                        }
                        else {
                            if (extraString.length > 0) {
                                body.extra = extraString;
                            }
                            customLeaderboardCall('PUT', function (info) {
                                // tslint:disable-next-line:max-line-length
                                return "/leaderboards/" + leaderboardServiceVersion + "/app/" + info.appId + "/leaderboard/" + leaderboardName + "/id/" + info.accountDetails.playerId;
                            }, body).then(function (callResponse) {
                                var setScoreResult = callResponse.response;
                                var info = callResponse.info;
                                getLeaderboardResponse(setScoreResult).then(function (response) {
                                    var responseData = response && response.data || {};
                                    var leaderboardData = response.data[leaderboardName] || {};
                                    var userData = leaderboardData[numberOrStringToString(info.accountDetails.playerId)] || {};
                                    var metaData = responseData.metadata && responseData.metadata[leaderboardName] || {};
                                    var bucket = userData.bucket || null;
                                    var rank = userData.rank || null;
                                    var endTime = metaData.end_time ? new Date(metaData.end_time * 1000) : null;
                                    var retVal = {
                                        score: score
                                    };
                                    if (rank) {
                                        retVal.rank = rank;
                                    }
                                    if (bucket) {
                                        retVal.bucket = bucket;
                                    }
                                    if (endTime) {
                                        retVal.endTime = endTime;
                                    }
                                    resolve(retVal);
                                }, reject);
                            }).catch(function (e) {
                                // ToDo:  Error handling
                                reject(e);
                            });
                        }
                    }
                    else {
                        resolve(null);
                    }
                });
            }); // last ZyngaInsant.INSTANT_GAME_STARTED
        });
    }
    exports.setScore = setScore;
    function getPlayersInfoObject(zyngaPlayerIds, facebookPlayerIds) {
        zyngaPlayerIds = zyngaPlayerIds || [];
        facebookPlayerIds = facebookPlayerIds || [];
        var players = {
            players: [],
            zyngaPlayerIdIndex: {},
            facebookPlayerIdIndex: {}
        };
        for (var _i = 0, zyngaPlayerIds_1 = zyngaPlayerIds; _i < zyngaPlayerIds_1.length; _i++) {
            var zyngaPlayerId = zyngaPlayerIds_1[_i];
            var player = {
                zyngaPlayerId: zyngaPlayerId,
                facebookPlayerId: null,
                profileMeta: null
            };
            players.players.push(player);
            players.zyngaPlayerIdIndex[zyngaPlayerId] = player;
        }
        for (var _a = 0, facebookPlayerIds_1 = facebookPlayerIds; _a < facebookPlayerIds_1.length; _a++) {
            var facebookPlayerId = facebookPlayerIds_1[_a];
            var player = {
                zyngaPlayerId: null,
                facebookPlayerId: facebookPlayerId,
                profileMeta: null
            };
            players.players.push(player);
            players.facebookPlayerIdIndex[facebookPlayerId] = player;
        }
        return Promise.resolve(players);
    }
    function getPlayerScores(players, leaderboardNames, options) {
        return new Promise(function (resolve, reject) {
            var zyngaPlayerIds = Object.keys(players.zyngaPlayerIdIndex);
            leaderboardNames = Array.isArray(leaderboardNames) ? leaderboardNames : [leaderboardNames];
            var body = {
                details: true,
                include_tier: true,
                extra: true,
                leaderboards: leaderboardNames,
                ids: zyngaPlayerIds
            };
            customLeaderboardCall('POST', function (info) {
                return "/leaderboards/" + leaderboardServiceVersion + "/app/" + info.appId + "/leaderboards";
            }, body).then(function (getResult) {
                var info = getResult.info;
                var getResponse = getResult.response;
                getLeaderboardResponse(getResponse).then(function (response) {
                    var responseData = response && response.data || {};
                    var metaData = responseData.metadata || {};
                    var leaderboardPlayers;
                    var leaderboardMetadata;
                    var leaderboardEntry;
                    var leaderboardsData = {};
                    for (var _i = 0, leaderboardNames_1 = leaderboardNames; _i < leaderboardNames_1.length; _i++) {
                        var leaderboard = leaderboardNames_1[_i];
                        leaderboardPlayers = responseData[leaderboard] || {};
                        leaderboardMetadata = metaData[leaderboard];
                        leaderboardEntry = {
                            name: leaderboard,
                            players: {}
                        };
                        if (leaderboardMetadata && leaderboardMetadata.end_time) {
                            leaderboardEntry.endTime = new Date(leaderboardMetadata.end_time * 1000);
                        }
                        for (var playerId in leaderboardPlayers) {
                            var servicePlayer = leaderboardPlayers[playerId];
                            var cachePlayer = players.zyngaPlayerIdIndex[playerId];
                            var playerObj = {
                                score: parseInt(servicePlayer.score, 10)
                            };
                            if (typeof servicePlayer.extra === 'string') {
                                try {
                                    var infoCompressed = JSON.parse(servicePlayer.extra);
                                    // return user data to app
                                    playerObj.data = infoCompressed.e;
                                    if (typeof infoCompressed.p === 'object') {
                                        var updateTime = new Date(infoCompressed.p.t * 1000);
                                        if (cachePlayer.facebookPlayerId === null) {
                                            cachePlayer.facebookPlayerId = numberOrStringToString(infoCompressed.p.i);
                                            players.facebookPlayerIdIndex[cachePlayer.facebookPlayerId] = cachePlayer;
                                        }
                                        if (!cachePlayer.profileMeta ||
                                            (cachePlayer.profileMeta && cachePlayer.profileMeta.validTime < updateTime)) {
                                            cachePlayer.profileMeta = {
                                                pictureURL: infoCompressed.p.p ||
                                                    (cachePlayer.profileMeta ? cachePlayer.profileMeta.pictureURL : '') ||
                                                    '',
                                                name: infoCompressed.p.n ||
                                                    (cachePlayer.profileMeta ? cachePlayer.profileMeta.name : '') ||
                                                    '',
                                                validTime: updateTime,
                                                source: 'leaderboard'
                                            };
                                        }
                                        if (cachePlayer.profileMeta) {
                                            playerObj.info = {
                                                zyngaPlayerId: cachePlayer.zyngaPlayerId,
                                                facebookPlayerId: cachePlayer.facebookPlayerId,
                                                name: cachePlayer.profileMeta.name,
                                                photoURL: cachePlayer.profileMeta.pictureURL
                                            };
                                        }
                                        leaderboardEntry.players[playerId] = playerObj;
                                    }
                                }
                                catch (e) {
                                    // nothing
                                }
                            }
                        }
                        leaderboardsData[leaderboard] = leaderboardEntry;
                    }
                    updateZyngaPlayerInfoMemoryCache(players);
                    resolve(leaderboardsData);
                }, reject);
            }, reject);
        });
    }
    // populate player ID mappings
    function getZyngaPlayerInfoFromMemoryCache(players) {
        return new Promise(function (resolve) {
            players.players.forEach(function (player) {
                var cachedInfo = playerInfoCache.facebookPlayerIdIndex[player.facebookPlayerId] ||
                    playerInfoCache.zyngaPlayerIdIndex[player.zyngaPlayerId];
                if (cachedInfo) {
                    // copy over cached data
                    player.zyngaPlayerId = numberOrStringToString(player.zyngaPlayerId || cachedInfo.zyngaPlayerId);
                    player.facebookPlayerId = numberOrStringToString(player.facebookPlayerId || cachedInfo.facebookPlayerId);
                    if (cachedInfo.profileMeta &&
                        !player.profileMeta ||
                        (player.profileMeta && player.profileMeta.validTime < cachedInfo.profileMeta.validTime)) {
                        // Better meta
                        player.profileMeta = deepClone(cachedInfo.profileMeta);
                    }
                    // index them
                    players.facebookPlayerIdIndex[player.facebookPlayerId] = player;
                    players.zyngaPlayerIdIndex[player.zyngaPlayerId] = player;
                }
            });
            resolve(players);
        });
    }
    function updateZyngaPlayerInfoMemoryCache(players) {
        for (var _i = 0, _a = players.players; _i < _a.length; _i++) {
            var player = _a[_i];
            var cachedPlayer = playerInfoCache.zyngaPlayerIdIndex[player.zyngaPlayerId] ||
                playerInfoCache.facebookPlayerIdIndex[player.facebookPlayerId];
            if (!cachedPlayer
                || !cachedPlayer.profileMeta
                || (player.profileMeta && player.profileMeta.validTime > cachedPlayer.profileMeta.validTime)) {
                if (!cachedPlayer) {
                    cachedPlayer = deepClone(player);
                }
                else {
                    cachedPlayer.profileMeta = deepClone(player.profileMeta);
                    cachedPlayer.facebookPlayerId = numberOrStringToString(cachedPlayer.facebookPlayerId || player.facebookPlayerId);
                    cachedPlayer.zyngaPlayerId = numberOrStringToString(cachedPlayer.zyngaPlayerId || player.zyngaPlayerId);
                }
                if (cachedPlayer.facebookPlayerId) {
                    playerInfoCache.facebookPlayerIdIndex[cachedPlayer.facebookPlayerId] = cachedPlayer;
                }
                if (cachedPlayer.zyngaPlayerId) {
                    playerInfoCache.zyngaPlayerIdIndex[cachedPlayer.zyngaPlayerId] = cachedPlayer;
                }
            }
        }
    }
    function getZyngaCurrentPlayerInfo(players) {
        return Promise.all([
            ZyngaAccount.Event.last(ZyngaAccount.Events.ACCOUNT_DETAILS),
            ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_INITIALIZED),
            ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT) // Required to access player photo/name below
        ]).then(function (results) {
            var accountDetails = results[0];
            var zid = accountDetails.zid.toString();
            var fbPlayerId = ZyngaInstant.player.getID().toString();
            players.players.forEach(function (player) {
                if (player.facebookPlayerId === fbPlayerId || player.zyngaPlayerId === zid) {
                    player.profileMeta = {
                        name: ZyngaInstant.player.getName(),
                        pictureURL: ZyngaInstant.player.getPhoto(),
                        validTime: new Date(),
                        source: 'fbig_sdk'
                    };
                    player.facebookPlayerId = fbPlayerId;
                    player.zyngaPlayerId = zid;
                    players.facebookPlayerIdIndex[fbPlayerId] = player;
                    players.zyngaPlayerIdIndex[zid] = player;
                }
            });
            return players;
        });
    }
    function getZyngaPlayerInfoFromProfileService(players) {
        return new Promise(function (resolve, reject) {
            var facebookPlayerIds = players.players
                .filter(function (player) { return !player.zyngaPlayerId; })
                .map(function (player) { return player.facebookPlayerId; });
            var profileFields = [
                'fbig_player_id',
                'zynga_player_id',
                'display_name',
                'display_picture_url',
                'profile_updated_at'
            ];
            if (facebookPlayerIds.length === 0) {
                resolve(players);
            }
            else {
                ZyngaProfile.getProfilesByFacebookIdAsync(facebookPlayerIds, profileFields).then(function (profiles) {
                    var fbIdIndex = profiles.indexes.facebook;
                    for (var facebookPlayerId in fbIdIndex) {
                        var playerProfile = fbIdIndex[facebookPlayerId];
                        var player = players.facebookPlayerIdIndex[facebookPlayerId];
                        var updateTime = new Date(playerProfile.profile_updated_at);
                        player.zyngaPlayerId = numberOrStringToString(playerProfile.zynga_player_id);
                        if (!player.profileMeta ||
                            (player.profileMeta && player.profileMeta.validTime < updateTime)) {
                            // Better meta
                            player.profileMeta = {
                                name: playerProfile.display_name,
                                pictureURL: playerProfile.display_picture_url,
                                validTime: updateTime,
                                source: 'profile_service'
                            };
                        }
                        players.facebookPlayerIdIndex[player.facebookPlayerId] = player;
                        players.zyngaPlayerIdIndex[player.zyngaPlayerId] = player;
                    }
                    resolve(players);
                }, reject);
            }
        });
    }
    function getPlayerScoresByFacebookPlayerIds(facebookPlayerIds, leaderboardNames, options) {
        return getPlayersInfoObject([], facebookPlayerIds)
            .then(getZyngaPlayerInfoFromMemoryCache)
            .then(getZyngaCurrentPlayerInfo)
            .then(getZyngaPlayerInfoFromProfileService)
            .then(function (players) { return getPlayerScores(players, leaderboardNames, options); });
    }
    exports.getPlayerScoresByFacebookPlayerIds = getPlayerScoresByFacebookPlayerIds;
    function getPlayerScoresByZyngaPlayerIds(zyngaPlayerIds, leaderboardNames, options) {
        return getPlayersInfoObject(zyngaPlayerIds, [])
            .then(getZyngaPlayerInfoFromMemoryCache)
            .then(getZyngaCurrentPlayerInfo)
            .then(getZyngaPlayerInfoFromProfileService)
            .then(function (players) { return getPlayerScores(players, leaderboardNames, options); });
    }
    exports.getPlayerScoresByZyngaPlayerIds = getPlayerScoresByZyngaPlayerIds;
    function getPlayerScoresByMixedIds(zyngaPlayerIds, facebookPlayerIds, leaderboardNames, options) {
        return getPlayersInfoObject(zyngaPlayerIds, facebookPlayerIds)
            .then(getZyngaPlayerInfoFromMemoryCache)
            .then(getZyngaCurrentPlayerInfo)
            .then(getZyngaPlayerInfoFromProfileService)
            .then(function (players) { return getPlayerScores(players, leaderboardNames, options); });
    }
    exports.getPlayerScoresByMixedIds = getPlayerScoresByMixedIds;
    function getFriendsScores(leaderboardNames, playerListOptions, options) {
        var promises = [
            // have at least one promise resolving with an empty array
            Promise.resolve([])
        ];
        playerListOptions = playerListOptions || { includeConnectedFriends: true };
        if (playerListOptions.includeMe) {
            promises.push(ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_INITIALIZED).then(function () {
                return Promise.resolve([ZyngaInstant.player.getID()]);
            }));
        }
        if (playerListOptions.includeConnectedFriends) {
            promises.push(ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT)
                .then(ZyngaInstant.player.getConnectedPlayersAsync)
                .then(function (fbPlayersObjects) {
                var facebookPlayerIds = [];
                for (var _i = 0, fbPlayersObjects_1 = fbPlayersObjects; _i < fbPlayersObjects_1.length; _i++) {
                    var player = fbPlayersObjects_1[_i];
                    facebookPlayerIds.push(player.getID());
                }
                return Promise.resolve(facebookPlayerIds);
            }));
        }
        if (playerListOptions.includeThisContextPlayers || playerListOptions.includeAllContextsPlayers) {
            promises.push(Promise.all([
                ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT),
                ZyngaContextTracker.Event.last(ZyngaContextTracker.Events.CONTEXTS)
            ]).then(function (results) {
                var contextsPlayersData = results[1];
                var facebookPlayerIds = [];
                var includeAll = playerListOptions.includeAllContextsPlayers;
                var includeCurrent = playerListOptions.includeThisContextPlayers;
                var currentContext = ZyngaInstant.context.getID();
                for (var contextId in contextsPlayersData) {
                    var contextData = contextsPlayersData[contextId];
                    if ((includeCurrent && contextData && contextData.contextId === currentContext) || (contextData && includeAll)) {
                        facebookPlayerIds.push.apply(facebookPlayerIds, contextData.recentPlayers); // does an append
                    }
                }
                return Promise.resolve(facebookPlayerIds);
            }));
        }
        return Promise.all(promises).then(function (idArrays) {
            var idDict = {};
            for (var _i = 0, idArrays_1 = idArrays; _i < idArrays_1.length; _i++) {
                var idArray = idArrays_1[_i];
                for (var _a = 0, idArray_1 = idArray; _a < idArray_1.length; _a++) {
                    var facebookPlayerId = idArray_1[_a];
                    idDict[facebookPlayerId] = null;
                }
            }
            return getPlayerScoresByFacebookPlayerIds(Object.keys(idDict), leaderboardNames, options);
        });
    }
    exports.getFriendsScores = getFriendsScores;
});



var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
define("ZyngaLeaderboardUI", ["require", "exports", "preact", "ZyngaAnalytics", "ZyngaContextTracker", "ZyngaCore", "ZyngaInstant", "ZyngaLeaderboard", "ZyngaLeaderboardUICSS"], function (require, exports, preact, ZyngaAnalytics, ZyngaContextTracker, ZyngaCore, ZyngaInstant, ZyngaLeaderboard, ZyngaLeaderboardUICSS) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Preact uses the "h" function
    var h = preact.h;
    var InternalEvent = new ZyngaCore.EventMixin();
    var DOM_RDY = 'domReady';
    var doc = document;
    var DAY_SECONDS = 60 * 60 * 24;
    var HOUR_SECONDS = 60 * 60;
    var MINUTE_SECONDS = 60;
    // Dom operations should not happen until the DOM is actually ready.
    function checkDomRdy() {
        var readyState = doc.readyState;
        if (readyState === 'interactive' || readyState === 'complete') {
            // An image stuck loading, even a tracking pixel, can caue readyState 'complete'
            // to never fire.  This is why 'interactive' is good enough
            doc.removeEventListener('readystatechange', checkDomRdy);
            InternalEvent.fire(DOM_RDY, true);
        }
    }
    doc.addEventListener('readystatechange', checkDomRdy);
    checkDomRdy();
    function orderPlayers(players, order, meFBID) {
        return Object.keys(players)
            .map(function (pID) { return players[pID]; })
            .sort(function (a, b) {
            var left = a;
            var right = b;
            if (order === 'desc') {
                left = b;
                right = a;
            }
            if (a.score === b.score && a.info.facebookPlayerId === meFBID) {
                // Order current user below other tied users
                return 1;
            }
            return left.score - right.score;
        });
    }
    // tslint:disable-next-line:max-classes-per-file
    var Leaderboards = (function (_super) {
        __extends(Leaderboards, _super);
        function Leaderboards(props) {
            var _this = _super.call(this) || this;
            _this.Events = {
                CONFIG: 'LeaderboardUI.Config',
                BAD_CONFIG: 'LeaderboardUI.BoConfig',
                NO_CONFIG: 'LeaderbaordUI.NoConfig',
                CTA_CLICK: 'LeaderbaordUI.CTAClick',
                CLOSE: 'LeaderbaordUI.Close',
                OPEN: 'LeaderbaordUI.Open',
                MOUNTED: 'LeaderbaordUI.Mounted',
                TAB_CLICK: 'LeaderboardUI.TabClick',
                LB_DATA: 'LeaderboardUI.LBData',
                UI_DATA: 'LeaderboardUI.UIData',
                PLAY_NOW_CLICK: 'LeaderboardUI.PlayNowClick'
            };
            _this.pendingRefresh = false;
            _this.selectTab = function (lbIndex) {
                this.tabSelect(lbIndex);
            };
            var options = props && props.options || {};
            _this.state = {
                name: '',
                leaderboards: [],
                visible: false,
                refreshing: true
            };
            _this.tabsChanges = 0;
            _this.Event = new ZyngaCore.EventMixin();
            _this.Event.on(_this.Events.CONFIG, _this.refresh.bind(_this), false);
            _this.contextTrackingData = {};
            ZyngaContextTracker.Event.on(ZyngaContextTracker.Events.CONTEXTS, function (contextHistories) {
                _this.contextTrackingData = contextHistories;
            }, false);
            // Defaults
            _this.CTAHandler = _this.commonCTAHandler;
            _this.getUIString = _this.commonGetUIString;
            _this.playGame = function (data) { return undefined; };
            if (options.playGame) {
                _this.playGame = options.playGame;
            }
            if (props.options && props.options.testData) {
                _this.state = props.options.testData;
            }
            else if (props.configPromises) {
                _this.getFirstWorkingConfig(props.configPromises);
            }
            if (props.options && props.options.preLoad === true) {
                // Allow time to register handlers immediatly after instanciation
                setTimeout(_this.refresh, 0);
            }
            ZyngaInstant.Event.on(ZyngaInstant.Events.INSTANT_CONTEXT_ID_CHANGE, function () {
                if (_this.state.visible === true) {
                    // In the rare case where we are open AND context changes
                    // then we probably need to refresh
                    _this.refresh();
                }
            }, true);
            _this.setupTracking();
            _this.clockTick();
            return _this;
        }
        Leaderboards.prototype.show = function () {
            this.tabsChanges++;
            this.setState({ visible: true });
            this.clockTick();
            this.Event.fire(this.Events.OPEN);
        };
        Leaderboards.prototype.hide = function () {
            this.tabsChanges = 0;
            this.setState({ visible: false });
            this.Event.fire(this.Events.CLOSE);
        };
        Leaderboards.prototype.registerCTAHandler = function (gameCustomCTAHandler) {
            var _this = this;
            // Wrap the custom handler so we can call the common one if null is returned
            this.CTAHandler = function (data) {
                return gameCustomCTAHandler(data)
                    .then(function (handlerResult) {
                    if (handlerResult === null) {
                        // The custom game handler told us to use the common CTA Handler
                        return _this.commonCTAHandler(data);
                    }
                    return handlerResult;
                });
            };
        };
        Leaderboards.prototype.registerUIStringHandler = function (gameGetUIStringHandler) {
            // Wrap the custom handler so we can call the common one if null is returned
            var that = this;
            this.getUIString = function (labelName, data) {
                var gameResult = gameGetUIStringHandler(labelName, data);
                if (gameResult === null) {
                    // The custom game handler told us to use the common getUIString
                    return that.commonGetUIString(labelName, data);
                }
                return gameResult;
            };
        };
        Leaderboards.prototype.commonCTAHandler = function (data) {
            return new Promise(function (resolve, reject) {
                if (!data ||
                    data.ctaType === 'playNow' ||
                    (data.leaderboardType === 'currentContext' && data.ctaType !== 'invite') ||
                    (data.leaderboardType === 'global' && (data.ctaType === 'me' || data.ctaType === 'zeroState'))) {
                    resolve(true);
                }
                else if (data.leaderboardType === 'allContexts' ||
                    data.ctaType === 'invite' ||
                    data.ctaType === 'zeroState') {
                    switch (data.ctaType) {
                        case 'group':
                        case 'me':
                            ZyngaInstant.context.switchAsync(data.contextId).then(function () {
                                resolve(true);
                            }, reject);
                            break;
                        case 'invite': // Fall through
                        case 'zeroState':
                            ZyngaInstant.context.chooseAsync().then(function () {
                                resolve(true);
                            }, reject);
                            break;
                    }
                }
                else if (data.leaderboardType === 'global' && data.ctaType === 'player') {
                    ZyngaInstant.context.createAsync(data.userInfo.facebookPlayerId).then(function () {
                        resolve(true);
                    }, function (error) {
                        if (typeof error === 'object' &&
                            error.code &&
                            error.code === 'SAME_CONTEXT') {
                            // Same context (person).  We only know this once
                            // we try and fail
                            resolve(true);
                        }
                        else {
                            // Some other error.  Legit.
                            reject(error);
                        }
                    });
                }
            });
        };
        Leaderboards.prototype.render = function (props, state) {
            var _this = this;
            var mainVisibilityClass = state.visible ? '' : ' z_lb_hidden';
            var mainRefreshingClass = state.refreshing ? '' : ' z_lb_refreshing';
            var leaderboards = state.leaderboards;
            var that = this;
            var getUIString = this.getUIString;
            var playNowAttributes = this.touchOrClick(this.ctaClick.bind(this, {
                leaderboardConfigName: state.selectedLeaderboardConfigName,
                leaderboardId: state.selectedLeaderboardId,
                ctaType: 'playNow'
            }));
            playNowAttributes['class'] = 'z_lb_play_now';
            var mainAttributes = {
                class: 'z_lb_main' + mainVisibilityClass + mainRefreshingClass,
                style: 'font-size: ' + Math.round(window.innerWidth / 40) + 'px;'
            };
            var documentTouch = window.DocumentTouch;
            if (('ontouchstart' in window) || documentTouch && document instanceof documentTouch) {
                // Pulled from https://github.com/Modernizr/Modernizr/blob/master/feature-detects/touchevents.js#L40
                mainAttributes.class = mainAttributes.class + ' z_lb_touch_enabled';
            }
            return h("div", __assign({}, mainAttributes),
                h("div", { class: "z_lb_container" },
                    h("div", { class: "z_lb_top_spacer" }),
                    h("div", { class: "z_lb_box" },
                        h("div", { class: "z_lb_title" }, state.name),
                        h("div", { class: "z_lb_tabs" },
                            h("div", { class: "z_lb_tabs_row" }, leaderboards.map(function (lb, idx) {
                                var attributes = _this.touchOrClick(_this.tabSelect.bind(_this, idx));
                                var tabClasses = [
                                    'z_lb_tabs_tab',
                                    'z_lb_tab_tab_config_id_' + lb.configId
                                ];
                                if (lb.visible === true) {
                                    tabClasses.push('z_lb_tabs_tab_active');
                                }
                                // User's place in the LB.  0 means not placed yet.
                                if (lb.myPosition >= 0) {
                                    tabClasses.push('z_lb_my_place_' + lb.myPosition);
                                }
                                if (lb.myPosition === 0) {
                                    tabClasses.push('z_lb_new_to_me');
                                }
                                if (lb.endTime) {
                                    tabClasses.push('z_lb_has_time_remaining');
                                }
                                attributes['class'] = tabClasses.join(' ');
                                return h("div", __assign({}, attributes),
                                    h("div", { class: "z_lb_tabs_tab_name_container" },
                                        h("div", { class: "z_lb_tabs_tab_name" }, lb.name)),
                                    h("div", { class: "z_lb_tabs_tab_time_remaining_container" },
                                        h("div", { class: "z_lb_tabs_tab_time_remaining" }, getUIString('timeLeft', lb.secondsLeft))));
                            }))),
                        leaderboards.map(function (lb, idx) {
                            var lbClasses = ['z_lb_leaderbaord'];
                            // sets active LB
                            if (lb.visible) {
                                lbClasses.push('z_lb_active');
                            }
                            if (lb.endTime) {
                                lbClasses.push('z_lb_has_time_remaining');
                            }
                            return h("div", { class: lbClasses.join(' ') },
                                h("div", { class: "z_lb_time_remaining" },
                                    h("div", { class: "z_lb_time_remaining_label" }, getUIString('timeLeftLabel')),
                                    h("div", { class: "z_lb_time_remaining_remaining" }, getUIString('timeLeft', lb.secondsLeft))),
                                h("div", { class: "z_lb_lb_items" }, lb.leaderboardEntries.map(function (lbEntry, i) {
                                    var classList = [
                                        'z_lb_lb_item',
                                        'z_lb_lb_item_type_' + lbEntry.type,
                                        'z_lb_lb_item_pos_' + i
                                    ];
                                    var pictureAttributes = {
                                        class: 'z_lb_lb_item_photo',
                                        style: 'background-image: url(\'' + lbEntry.pictureURL + '\');'
                                    };
                                    var ctaAttributes = _this.touchOrClick(_this.ctaClick.bind(_this, lbEntry.ctaData));
                                    ctaAttributes['class'] = 'z_lb_lb_item_cta';
                                    if (lbEntry.isMe) {
                                        classList.push('z_lb_item_current_user');
                                    }
                                    if (lbEntry.ctaData.ctaType === 'zeroState') {
                                        classList.push('z_lb_item_zero_state');
                                    }
                                    if (lbEntry.ctaData.ctaType === 'invite') {
                                        classList.push('z_lb_item_invite');
                                    }
                                    return h("div", { class: classList.join(' ') },
                                        h("div", { class: "z_lb_lb_item_height_provider" }),
                                        h("div", { class: "z_lb_lb_item_section_rank" },
                                            h("div", { class: "z_lb_lb_item_section_rank_value" }, lbEntry.position)),
                                        h("div", { class: "z_lb_lb_item_section_picture" },
                                            h("div", { class: "z_lb_lb_item_photo_wrapper" },
                                                h("div", __assign({}, pictureAttributes)))),
                                        h("div", { class: "z_lb_lb_item_section_name" },
                                            h("div", { class: "z_lb_lb_item_wrapper" },
                                                h("div", { class: "z_lb_lb_item_name" }, lbEntry.name))),
                                        h("div", { class: "z_lb_lb_item_section_chat_name" },
                                            h("div", { class: "z_lb_lb_item_wrapper" },
                                                h("div", { class: "z_lb_lb_item_chat_name" }, lbEntry.chatName))),
                                        h("div", { class: "z_lb_lb_item_section_score" },
                                            h("div", { class: "z_lb_lb_item_wrapper" },
                                                h("div", { class: "z_lb_lb_item_score" }, lbEntry.score))),
                                        h("div", { class: "z_lb_lb_item_section_challenge" },
                                            h("div", { class: "z_lb_lb_item_wrapper" },
                                                h("div", { class: "z_lb_lb_item_challenge" }, lbEntry.scoreChallengeLabel))),
                                        h("div", { class: "z_lb_lb_item_section_cta" },
                                            h("div", __assign({}, ctaAttributes), lbEntry.ctaLabel)));
                                })));
                        })),
                    h("div", __assign({}, playNowAttributes), getUIString('playNow', { leaderboardConfigName: state.selectedLeaderboardConfigName })),
                    h("div", { class: "z_lb_bottom_spacer" })),
                h("div", __assign({}, playNowAttributes), getUIString('playNow', { leaderboardConfigName: state.selectedLeaderboardConfigName })));
        };
        Leaderboards.prototype.refresh = function () {
            var _this = this;
            var dataPromise;
            if (this.props && this.props.options && this.props.options.testData) {
                dataPromise = Promise.resolve(this.props.options.testData);
            }
            else {
                dataPromise = Promise.all([
                    this.Event.last(this.Events.CONFIG),
                    ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT)
                ]).then(function (allResults) {
                    var configs = allResults[0];
                    var currentContextId = ZyngaInstant.context.getID();
                    var currentContextType = ZyngaInstant.context.getType();
                    var leaderboardPromises = [];
                    var contextIdLookup = {};
                    var _loop_1 = function (i) {
                        var config = configs[i];
                        if (config.type === 'currentContext') {
                            if (currentContextType === 'THREAD' && currentContextId) {
                                var leaderboardName = config.leaderboardName.replace('{contextId}', currentContextId);
                                leaderboardPromises.push(ZyngaLeaderboard.getFriendsScores([leaderboardName], config.includePlayers));
                            }
                            else {
                                leaderboardPromises.push(Promise.resolve(null));
                            }
                        }
                        else if (config.type === 'allContexts') {
                            leaderboardPromises.push(ZyngaContextTracker.Event.last(ZyngaContextTracker.Events.CONTEXTS)
                                .then(function (contexts) {
                                var leaderboardNames = [];
                                for (var contextId in contexts) {
                                    var contextData = contexts[contextId];
                                    if (contextId !== currentContextId) {
                                        var leaderboardName = config.leaderboardName.replace('{contextId}', contextId);
                                        if (leaderboardName !== config.leaderboardName) {
                                            leaderboardNames.push(leaderboardName);
                                            contextIdLookup[leaderboardName] = contextId;
                                        }
                                    }
                                }
                                if (leaderboardNames.length > 0) {
                                    return ZyngaLeaderboard.getFriendsScores(leaderboardNames, config.includePlayers);
                                }
                                else {
                                    return Promise.resolve({});
                                }
                            }));
                        }
                        else if (config.type === 'global') {
                            leaderboardPromises.push(ZyngaLeaderboard.getFriendsScores([config.leaderboardName], config.includePlayers));
                        }
                    };
                    // Fetch appropriate leaderbaord data for each config
                    for (var i in configs) {
                        _loop_1(i);
                    }
                    return Promise.all(leaderboardPromises).then(function (results) {
                        var newData = {
                            name: _this.getUIString('leaderboardMainLabel'),
                            leaderboards: [],
                            visible: _this.state ? _this.state.visible : true,
                            refreshing: false,
                            selectedLeaderboardConfigName: '',
                            selectedLeaderboardId: ''
                        };
                        _this.Event.fire(_this.Events.LB_DATA, results);
                        // Get previously selected/visible leaderbaord name
                        _this.state.leaderboards.forEach(function (lb) {
                            if (lb.visible) {
                                newData.selectedLeaderboardConfigName = lb.configName;
                                newData.selectedLeaderboardId = lb.configId;
                            }
                        });
                        results.forEach(function (lbResponses, i) {
                            if (lbResponses !== null) {
                                var config_1 = configs[i];
                                var me_1 = ZyngaInstant.player.getID();
                                var mePosition_1 = 0; // My position is not on the board by default
                                var lbData_1 = {
                                    name: _this.getUIString('tabLabel', config_1.leaderboardId),
                                    configName: config_1.leaderboardName,
                                    configId: config_1.leaderboardId,
                                    leaderboardEntries: []
                                };
                                var inviteEntry = void 0;
                                var commonInviteEntry = {
                                    score: null,
                                    type: config_1.type,
                                    chatName: '',
                                    name: _this.getUIString('leaderboardInviteLabel'),
                                    pictureURL: '',
                                    isMe: false,
                                    scoreChallengeLabel: '',
                                    ctaData: {
                                        leaderboardName: config_1.leaderboardName,
                                        leaderboardId: config_1.leaderboardId,
                                        ctaType: 'invite',
                                        leaderboardType: config_1.type,
                                        contextId: currentContextId,
                                    },
                                    ctaLabel: _this.getUIString('leaderbaordInviteCTA'),
                                    position: null
                                };
                                if (config_1.type === 'currentContext' || config_1.type === 'global') {
                                    var result = lbResponses[config_1.leaderboardName.replace('{contextId}', currentContextId)];
                                    if (result) {
                                        var players = orderPlayers(result.players, config_1.order, me_1);
                                        var hasOthers_1 = false;
                                        if (result.endTime) {
                                            lbData_1.endTime = result.endTime;
                                        }
                                        players.forEach(function (player, playerPosition) {
                                            if (player.info.facebookPlayerId === me_1) {
                                                mePosition_1 = playerPosition + 1;
                                            }
                                            else {
                                                hasOthers_1 = true;
                                            }
                                        });
                                        lbData_1.myPosition = mePosition_1;
                                        for (var _i = 0, players_1 = players; _i < players_1.length; _i++) {
                                            var player = players_1[_i];
                                            if (player.info) {
                                                var ctaData = {
                                                    leaderboardName: config_1.leaderboardName,
                                                    leaderboardId: config_1.leaderboardId,
                                                    ctaType: player.info.facebookPlayerId === me_1 ? 'me' : 'player',
                                                    leaderboardType: config_1.type,
                                                    mePosition: mePosition_1,
                                                    contextId: currentContextId,
                                                    userInfo: player.info
                                                };
                                                var labelMakingData = {
                                                    config: config_1,
                                                    ctaData: ctaData,
                                                    position: lbData_1.leaderboardEntries.length + 1,
                                                    score: player.score
                                                };
                                                lbData_1.leaderboardEntries.push({
                                                    type: config_1.type,
                                                    score: _this.getUIString('leaderboardItemScore', labelMakingData),
                                                    chatName: _this.getUIString('leaderboardItemChatName', labelMakingData),
                                                    name: _this.getUIString('leaderboardItemName', labelMakingData),
                                                    pictureURL: player.info.photoURL,
                                                    isMe: player.info.facebookPlayerId === me_1,
                                                    position: labelMakingData.position,
                                                    scoreChallengeLabel: _this.getUIString('leaderbaordItemScoreChallenge', labelMakingData),
                                                    ctaLabel: _this.getUIString('ctaLabel', labelMakingData),
                                                    ctaData: ctaData
                                                });
                                            }
                                        }
                                        if (hasOthers_1 === false) {
                                            // Push a special invite entry
                                            inviteEntry = commonInviteEntry;
                                        }
                                    }
                                }
                                else if (config_1.type === 'allContexts') {
                                    inviteEntry = commonInviteEntry; // Always add this on allContexts type
                                    Object.keys(lbResponses).forEach(function (lbName) {
                                        var lbContextId = contextIdLookup[lbName];
                                        var lbResponse = lbResponses[lbName];
                                        var lbPlayers = orderPlayers(lbResponse.players, config_1.order, me_1);
                                        if (lbResponse.endTime) {
                                            lbData_1.endTime = lbResponse.endTime;
                                        }
                                        if (lbPlayers.length > 0) {
                                            var topPlayer = lbPlayers[0];
                                            if (topPlayer.info) {
                                                var ctaData = {
                                                    leaderboardName: config_1.leaderboardName,
                                                    leaderboardId: config_1.leaderboardId,
                                                    ctaType: topPlayer.info.facebookPlayerId === me_1 ? 'me' : 'group',
                                                    leaderboardType: config_1.type,
                                                    contextId: lbContextId,
                                                    userInfo: topPlayer.info
                                                };
                                                var labelMakingData = {
                                                    config: config_1,
                                                    ctaData: ctaData,
                                                    position: null,
                                                    score: topPlayer.score
                                                };
                                                lbData_1.leaderboardEntries.push({
                                                    type: config_1.type,
                                                    score: _this.getUIString('leaderboardItemScore', labelMakingData),
                                                    chatName: _this.getUIString('leaderboardItemChatName', labelMakingData),
                                                    name: _this.getUIString('leaderboardItemName', labelMakingData),
                                                    pictureURL: topPlayer.info.photoURL,
                                                    isMe: topPlayer.info.facebookPlayerId === me_1,
                                                    position: null,
                                                    scoreChallengeLabel: _this.getUIString('leaderbaordItemScoreChallenge', labelMakingData),
                                                    ctaLabel: _this.getUIString('ctaLabel', labelMakingData),
                                                    ctaData: ctaData
                                                });
                                            }
                                        }
                                    });
                                    // Sort by best score first
                                    lbData_1.leaderboardEntries = lbData_1.leaderboardEntries.sort(function (a, b) {
                                        var aScore = parseInt(a.score, 10) || 0;
                                        var bScore = parseInt(b.score, 10) || 0;
                                        if (config_1.order === 'asc') {
                                            return aScore - bScore;
                                        }
                                        return bScore - aScore;
                                    });
                                }
                                if (lbData_1.leaderboardEntries.length === 0 && config_1.type !== 'allContexts') {
                                    // Add a Zero-State entry
                                    var ctaData = {
                                        leaderboardName: config_1.leaderboardName,
                                        leaderboardId: config_1.leaderboardId,
                                        ctaType: 'zeroState',
                                        leaderboardType: config_1.type
                                    };
                                    var labelMakingData = {
                                        config: config_1,
                                        ctaData: ctaData,
                                        position: 1
                                    };
                                    lbData_1.leaderboardEntries.push({
                                        type: config_1.type,
                                        score: _this.getUIString('leaderboardItemScore', labelMakingData),
                                        chatName: _this.getUIString('leaderboardItemChatName', labelMakingData),
                                        name: _this.getUIString('leaderboardItemName', labelMakingData),
                                        pictureURL: _this.getUIString('leaderboardItemPictureURL', labelMakingData),
                                        isMe: false,
                                        position: labelMakingData.position,
                                        scoreChallengeLabel: _this.getUIString('leaderbaordItemScoreChallenge', labelMakingData),
                                        ctaLabel: _this.getUIString('ctaLabel', labelMakingData),
                                        ctaData: ctaData
                                    });
                                }
                                if (inviteEntry) {
                                    lbData_1.leaderboardEntries.push(inviteEntry);
                                }
                                newData.leaderboards.push(lbData_1);
                            }
                        }, _this);
                        // Ensure the new data also has the last selected tab selected/visible
                        var newSelectedPosition = 0;
                        newData.leaderboards.forEach(function (lb, i) {
                            if (lb.name === newData.selectedLeaderboardConfigName) {
                                newSelectedPosition = i;
                            }
                        });
                        newData.leaderboards[newSelectedPosition].visible = true;
                        return newData;
                    });
                });
            }
            dataPromise.then(function (newState) {
                _this.Event.fire(_this.Events.UI_DATA, newState);
                _this.setState(newState);
                _this.clockTick();
            });
        };
        Leaderboards.prototype.componentWillUnmount = function () {
            clearTimeout(this.clockTimeout);
        };
        Leaderboards.prototype.componentDidMount = function () {
            this.Event.fire(this.Events.MOUNTED);
        };
        Leaderboards.prototype.logLeaderboardView = function (leaderboard) {
            var lbName = leaderboard && leaderboard.configName || 'unknown';
            var itemCount = leaderboard && leaderboard.leaderboardEntries
                .filter(function (lbe) { return (lbe.ctaData.ctaType !== 'zeroState'); })
                .length;
            ZyngaAnalytics.logCount({
                counter: 'leaderboard',
                value: this.tabsChanges,
                kingdom: leaderboard.configId,
                phylum: itemCount.toString()
            });
        };
        Leaderboards.prototype.setupTracking = function () {
            var _this = this;
            this.Event.on(this.Events.OPEN, function () {
                _this.Event.last(_this.Events.UI_DATA, function () {
                    // Wait until we have data in case we are opened too early
                    _this.logLeaderboardView(_this.state.leaderboards[0]);
                });
            }, true);
            this.Event.on(this.Events.TAB_CLICK, function (leaderboard) { return _this.logLeaderboardView(leaderboard); }, true);
            this.Event.on(this.Events.CTA_CLICK, function (clickData) {
                var leaderboardId = clickData.leaderboardId || '';
                var ctaType = clickData.ctaType || '';
                var entries = ZyngaCore.ArrayFind(_this.state.leaderboards, function (lb) { return lb.configId === leaderboardId; }).leaderboardEntries
                    .filter(function (lbe) { return lbe.ctaData.ctaType !== 'zeroState'; })
                    .length; // Count lb entries that are friends or chats
                var trackData = {
                    counter: 'leaderboard_action',
                    kingdom: 'CTA_clicked',
                    phylum: entries.toString(),
                    class: leaderboardId,
                    family: ctaType
                };
                // tslint:disable-next-line:no-console
                console.log(JSON.stringify(trackData, null, 2));
                ZyngaAnalytics.logCount(trackData);
            }, true);
        };
        Leaderboards.prototype.commonGetUIString = function (stringName, data) {
            var retVal = '';
            var ctaData = typeof data === 'object' && data.ctaData;
            var lbType = ctaData && ctaData.leaderboardType || null;
            var isZeroState = ctaData && ctaData.ctaType && ctaData.ctaType === 'zeroState';
            var userInfo = ctaData && ctaData.userInfo;
            switch (stringName) {
                case 'leaderboardMainLabel':
                    retVal = 'Leaderboard';
                    break;
                case 'tabLabel':
                    if (data === 'thisChat') {
                        retVal = 'THIS CHAT';
                    }
                    else if (data === 'allChats') {
                        retVal = 'ALL CHATS';
                    }
                    else if (data === 'allFriends') {
                        retVal = 'ALL FRIENDS';
                    }
                    break;
                case 'timeLeftLabel':
                    retVal = 'Time Left:';
                    break;
                case 'timeLeft':
                    var secondsLeft = parseInt(data, 10) || 0;
                    var days = Math.floor(secondsLeft / DAY_SECONDS);
                    secondsLeft = secondsLeft - (days * DAY_SECONDS);
                    var hours = Math.floor(secondsLeft / HOUR_SECONDS);
                    secondsLeft = secondsLeft - (hours * HOUR_SECONDS);
                    var minutes = Math.floor(secondsLeft / MINUTE_SECONDS);
                    var seconds = secondsLeft - (minutes * MINUTE_SECONDS);
                    retVal = [
                        ('00' + days).slice(-2),
                        ('00' + hours).slice(-2),
                        ('00' + minutes).slice(-2),
                        ('00' + seconds).slice(-2),
                    ].join(':');
                    break;
                case 'leaderboardItemScore':
                    var ctaType = ctaData && ctaData.ctaType;
                    var score = data && data.score;
                    if (ctaType === 'player' ||
                        ctaType === 'me' ||
                        ctaType === 'group') {
                        retVal = score;
                    }
                    break;
                case 'leaderboardItemPictureURL':
                    if (isZeroState) {
                        // tslint:disable-next-line:max-line-length
                        retVal = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22512%22%20height%3D%22512%22%20viewBox%3D%220%200%20560.693%20560.693%22%3E%3Cg%20fill%3D%22%23D80027%22%3E%3Cpath%20d%3D%22M161.79%20107.234c6.514%204.96%2013.414%208.69%2020.8%2012.15%203.386%201.485%206.788%202.93%2010.203%204.34%208.6%203.602%2011.928%207.1%2018.883%2012.94-9.354-7.852-20.178%207.668-10.9%2015.456%208.057%206.766%2017.36%205.53%2025.117-1.034%203.696-3.13%205.217-7.154%205.343-11.383%2010.27%2014.058%2021.748%2024.854%2033.98%2029.896V203c0%201.79.368%203.485.937%205.08H242.52c-6.266%200-11.345%205.08-11.345%2011.346v18.213c0%206.266%205.08%2011.345%2011.346%2011.345h75.653c6.267%200%2011.347-5.08%2011.347-11.346v-18.214c0-6.267-5.08-11.346-11.347-11.346H294.54c.573-1.594.937-3.287.937-5.08v-33.4c12.237-5.043%2023.712-15.842%2033.98-29.896.127%204.232%201.647%208.256%205.344%2011.383%207.76%206.564%2017.06%207.797%2025.118%201.034%209.277-7.787-1.546-23.307-10.9-15.455%206.956-5.84%2010.285-9.34%2018.884-12.94%203.415-1.408%206.817-2.855%2010.202-4.34%207.39-3.46%2014.29-7.19%2020.802-12.15%2011.566-8.807%2017.117-22.546%2018.767-36.533%203.103-26.34-17.31-47.914-41.43-53.532.777-6.22%201.185-12%201.185-17.17h-194.16c0%205.17.407%2010.95%201.185%2017.17-24.12%205.618-44.532%2027.19-41.43%2053.532%201.648%2013.986%207.203%2027.73%2018.766%2036.532zM373.057%2035.94c25.9%207.478%2037.32%2042.436%2010.676%2059.103-10.894%206.815-26.285%2010.24-37.742%2017.488%2012.45-24.252%2021.91-52.202%2027.066-76.59zm-91.253-7.378h15.83v106.604h-17.932v-89.3h-.422L255.44%2058.73l-3.58-14.137%2029.945-16.03zm-94.153%207.377c5.156%2024.388%2014.618%2052.337%2027.07%2076.59-11.458-7.248-26.853-10.672-37.743-17.487-26.647-16.667-15.23-51.625%2010.672-59.104z%22/%3E%3Ccircle%20cx%3D%22280.355%22%20cy%3D%22328.953%22%20r%3D%2258.985%22/%3E%3Cpath%20d%3D%22M173.827%20172.452c-12.417%200-22.485%2010.064-22.485%2022.485v158.64c0%204.396%201.288%208.702%203.712%2012.374l60.637%2092.003s-.45%20101.207-.45%20102.74h130.234c0-1.536-.45-102.74-.45-102.74l60.637-92.002c2.425-3.67%203.713-7.977%203.713-12.373v-158.64c0-12.418-10.067-22.485-22.484-22.485-12.42%200-22.486%2010.064-22.486%2022.485v151.896l-34.94%2053.018H231.253l-34.94-53.017V194.938c0-12.42-10.067-22.486-22.485-22.486z%22/%3E%3C/g%3E%3C/svg%3E';
                    }
                    else {
                        retVal = userInfo && userInfo.photoURL || '';
                    }
                    break;
                case 'leaderboardItemName':
                    // ToDo: Zero State
                    if (isZeroState) {
                        retVal = 'No Leader';
                    }
                    else {
                        retVal = userInfo && userInfo.name || '';
                        if (ctaData && ctaData.leaderboardType === 'allContexts') {
                            var contextId = data.ctaData.contextId;
                            var contextHistory = this.contextTrackingData[contextId];
                            if (contextHistory) {
                                var lastSuccess = contextHistory.lastCheckSuccess;
                                if (lastSuccess) {
                                    if (lastSuccess.min === lastSuccess.max) {
                                        retVal = retVal + ' leads ' + (lastSuccess.min - 1) + ' other player';
                                        if ((lastSuccess.min - 1) > 1) {
                                            retVal = retVal + 's';
                                        }
                                    }
                                    else {
                                        retVal = retVal + ' leads ' + lastSuccess.min + '+ players';
                                    }
                                }
                                else if (contextHistory.recentPlayers.length > 1) {
                                    retVal = (contextHistory.recentPlayers.length - 1) + ' other friend';
                                    if ((contextHistory.recentPlayers.length - 1) > 1) {
                                        retVal = retVal + 's';
                                    }
                                }
                            }
                        }
                    }
                    break;
                case 'leaderboardItemChatName':
                    retVal = '';
                    break;
                case 'leaderbaordItemScoreChallenge':
                    var myPositionOffset = ctaData && ctaData.mePosition;
                    if (isZeroState) {
                        retVal = 'Play now to be the leader!';
                    }
                    else if (lbType === 'currentContext' || lbType === 'global') {
                        if (myPositionOffset <= 0) {
                            retVal = 'Challenge';
                        }
                        else if (myPositionOffset > 0) {
                            retVal = 'Beat Score';
                        }
                    }
                    else if (lbType === 'allContexts') {
                        if (ctaData.ctaType === 'me') {
                            retVal = 'Challenge Group';
                        }
                        else {
                            retVal = 'Beat my score';
                        }
                    }
                    break;
                case 'leaderbaordInviteCTA':
                    retVal = 'Invite';
                    break;
                case 'leaderboardInviteLabel':
                    retVal = 'Invite your friends to play!';
                    break;
                case 'ctaLabel':
                    retVal = 'Play';
                    break;
                case 'playNow':
                    retVal = 'Play Now';
                    break;
            }
            return retVal;
        };
        Leaderboards.prototype.ctaClick = function (data) {
            var _this = this;
            var handler = this.CTAHandler;
            this.Event.fire(this.Events.CTA_CLICK, data);
            handler(data).then(function (sucess) {
                if (sucess) {
                    _this.hide();
                    _this.playGame(data);
                }
            }, function (err) {
                // tslint:disable-next-line:no-console
                console.error(err);
            });
        };
        Leaderboards.prototype.clockTick = function () {
            var now = new Date();
            var nowMS = now.getTime();
            var nowSeconds = Math.floor(nowMS / 1000);
            var nextSecond = nowSeconds + 1;
            var waitForNextTick = (nextSecond * 1000) - nowMS + 10; // ms until 10ms after next second
            clearTimeout(this.clockTimeout);
            if (!this.state.visible) {
                return;
            }
            for (var _i = 0, _a = this.state.leaderboards; _i < _a.length; _i++) {
                var lb = _a[_i];
                var endTime = lb.endTime;
                if (endTime) {
                    var endTimeSeconds = Math.round(endTime.getTime() / 1000);
                    var secondsLeft = endTimeSeconds - nowSeconds;
                    if (secondsLeft < 0) {
                        secondsLeft = 0;
                    }
                    lb.secondsLeft = secondsLeft;
                }
            }
            this.setState({ leaderboards: this.state.leaderboards });
            setTimeout(this.clockTick.bind(this), waitForNextTick);
        };
        Leaderboards.prototype.tabSelect = function (lbIndex, e) {
            var lbs = this.state.leaderboards;
            var oldIndex = -1;
            lbs.forEach(function (lb, i) {
                if (lb.visible) {
                    oldIndex = i;
                }
                lb.visible = false;
            });
            if (lbIndex >= lbs.length) {
                lbIndex = 0;
            }
            lbs[lbIndex].visible = true;
            if (lbIndex !== oldIndex && e !== undefined) {
                // Only fire if there is a change AND it was user initiated.
                // User initiated will have an event as the second param
                this.tabsChanges++;
                this.Event.fire(this.Events.TAB_CLICK, lbs[lbIndex]);
            }
            this.setState({
                leaderboards: lbs,
                selectedLeaderboardConfigName: lbs[lbIndex].configName,
            });
        };
        Leaderboards.prototype.touchOrClick = function (callback) {
            return {
                onClick: callback
            };
        };
        // Go through an array of config promises until we get a valid config
        Leaderboards.prototype.getFirstWorkingConfig = function (configPromises) {
            var _this = this;
            if (Array.isArray(configPromises) && configPromises.length > 0) {
                var configPromise_1 = configPromises.shift();
                configPromise_1.then(function (config) {
                    _this.Event.fire(_this.Events.CONFIG, config);
                }, function (e) {
                    _this.Event.fire(_this.Events.BAD_CONFIG, configPromise_1);
                    _this.getFirstWorkingConfig(configPromises);
                });
            }
            else {
                this.Event.fire(this.Events.NO_CONFIG);
            }
        };
        return Leaderboards;
    }(preact.Component));
    exports.Leaderboards = Leaderboards;
    function initalizeLeaderboards(dataSources, parent, options, cssObj) {
        var props = {
            configPromises: dataSources,
            options: options
        };
        var leaderboards = preact.render(h(Leaderboards, __assign({}, props)), parent, parent['__lbvnode'] // Replace an old one if it exists
        );
        var lbComponent = leaderboards['_component'];
        var lbCssObj = cssObj || getDefaultCSSObj() || {};
        var newCSSStr = ZyngaCore.parseCSS(lbCssObj);
        // Add pointer to current element so we can replace it if called again for this parent
        parent['__lbvnode'] = leaderboards;
        // Bit of a hack. Only expose actual public data.  All would be available in ES5 otherwise.
        InternalEvent.last(DOM_RDY, function () {
            var styleNode = parent['__lbcssnode'];
            if (!styleNode) {
                // Create a new style node in head
                var head = doc.head || doc.getElementsByTagName('head')[0];
                styleNode = doc.createElement('style');
                styleNode.type = 'text/css';
                head.appendChild(styleNode);
                parent['__lbvnode'] = styleNode;
            }
            // write out CSS to style node
            if (styleNode.styleSheet) {
                // Older version of IE
                styleNode.styleSheett.cssText = newCSSStr;
            }
            else if (typeof styleNode.textContent !== 'undefined') {
                styleNode.textContent = newCSSStr;
            }
            else {
                styleNode.innerText = newCSSStr;
            }
        });
        return {
            Event: lbComponent.Event,
            Events: lbComponent.Events,
            refresh: lbComponent.refresh.bind(lbComponent),
            show: lbComponent.show.bind(lbComponent),
            hide: lbComponent.hide.bind(lbComponent),
            selectTab: lbComponent.selectTab.bind(lbComponent),
            registerCTAHandler: lbComponent.registerCTAHandler.bind(lbComponent),
            registerUIStringHandler: lbComponent.registerUIStringHandler.bind(lbComponent)
        };
    }
    exports.initalizeLeaderboards = initalizeLeaderboards;
    function getDefaultCSSObj() {
        return ZyngaLeaderboardUICSS;
    }
    exports.getDefaultCSSObj = getDefaultCSSObj;
    function getConfigPromiseFromExperiment(experimentName) {
        return new Promise(function (resolve, reject) {
            reject('Not Implemented');
        });
    }
    exports.getConfigPromiseFromExperiment = getConfigPromiseFromExperiment;
    function getDefaultConfigPromise() {
        var configs = [
            {
                leaderboardName: 'weekly---context{contextId}',
                leaderboardId: 'thisChat',
                type: 'currentContext',
                order: 'desc',
                includePlayers: {
                    includeThisContextPlayers: true,
                    includeMe: true
                }
            },
            {
                leaderboardName: 'weekly---context{contextId}',
                leaderboardId: 'allChats',
                type: 'allContexts',
                order: 'desc',
                includePlayers: {
                    includeAllContextsPlayers: true,
                    includeMe: true
                }
            },
            {
                leaderboardName: 'perm---global',
                leaderboardId: 'allFriends',
                type: 'global',
                order: 'desc',
                includePlayers: {
                    includeConnectedFriends: true,
                    includeMe: true
                }
            },
        ];
        return Promise.resolve(configs);
    }
    exports.getDefaultConfigPromise = getDefaultConfigPromise;
});



define("ZyngaLeaderboardUICSS", ["require", "exports"], function (require, exports) {
    "use strict";
    /// <amd-module name="ZyngaLeaderboardUICSS"/>
    // tslint:disable-next-line:max-line-length
    var clockBackgroundImage = 'url(\'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22250%22%20height%3D%22250%22%3E%3Cg%20fill%3D%22%23~~COLOR~~%22%3E%3Cpath%20d%3D%22M190.78%2073.33c2.56-3.3%205.22-6.62%207.77-10.02%204.34-5.79%203.91-9.66-1.54-14.17-2.82-2.33-5.65-4.67-8.61-6.82-4.77-3.46-9.44-2.86-13.16%201.62-2.65%203.2-5%206.68-7.87%209.67a5.73%205.73%200%200%201-4.74%201.29%20196.28%20196.28%200%200%201-17.04-5.46c-1.32-.48-3.18-2.27-3.08-3.29.27-2.8-2.3-6.72%202.03-8.27%204.94-1.78%206.2-5.29%206.23-10.1.04-6.04.56-12.07-6.19-15.28h-38c-4.29%201.76-7.46%204.32-7.12%209.56.39%206.02-1.87%2012.78%206.25%2016.25%201.58.67%201.82%205.3%201.94%208.13.04%201-1.99%202.71-3.35%203.06-33.9%208.78-57.15%2029.33-69.11%2062.33-17.06%2047.06%209.19%20102.73%2056.45%20119.23%208.67%203.03%2017.94%204.35%2026.94%206.46h13c9.46-2.29%2019.38-3.46%2028.29-7.08%2032.64-13.29%2052.56-37.62%2058.67-72.43%205.38-30.66-3.9-60.41-27.76-84.68m-52.97%20137.13c-39.4%207.21-74.12-19.13-80.98-55.66-2.99-15.92-.33-31.09%207.23-45.38.9-1.7%202.25-3.15%203.39-4.72l-.16.17c7.2-12.67%2018.1-21.12%2031.32-26.56%2042.35-17.44%2088.8%209.67%2095.2%2055.01%204.81%2034.02-17.94%2070.17-56%2077.14%22%2F%3E%3Cpath%20d%3D%22M127.23%20130.81a15.8%2015.8%200%200%201-6.69-1.62%201416.6%201416.6%200%200%201-31.06-16.44c-3.72-2.02-7.02-2.53-10.12.91l.14-.15c-.54%203.72%201.14%206.27%203.98%208.57%209.33%207.57%2018.55%2015.27%2027.71%2023.04a10.9%2010.9%200%200%201%202.93%204.31c2.74%207.28%209.75%2011.31%2016.94%209.53%207.33-1.81%2011.82-8.27%2010.86-15.62-1.01-7.73-6.66-12.4-14.69-12.53%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E\')';
    var leaderboardCSS = {
        '.z_lb_main': {
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: '0',
            left: '0',
            color: 'rgb(0, 141, 137)',
            'font-family': 'Helvetica Neue, Segoe UI, Helvetica, Arial, sans-serif'
        },
        '.z_lb_hidden': {
            display: 'none'
        },
        '.z_lb_refreshing': {},
        '.z_lb_container': {
            position: 'absolute',
            top: '8em',
            bottom: '0',
            left: '0',
            right: '0',
            'overflow-y': 'scroll'
        },
        '.z_lb_touch_enabled .z_lb_container': {
            // Enable touch scrolling for touch devices
            '-webkit-overflow-scrolling': 'touch'
        },
        '.z_lb_touch_enabled .z_lb_container::-webkit-scrollbar': {
            // Hide scrollbar on touch devices
            display: 'none'
        },
        '.z_lb_top_spacer': {
            height: '50%'
        },
        '.z_lb_box': {
            'background-color': 'white',
            'border-radius': '1.7em',
            'min-height': '50%',
            overflow: 'hidden'
        },
        '.z_lb_box, .z_lb_play_now': {
            position: 'relative',
            '-webkit-transform': 'translate3d(0, 0, 0)',
            left: '4%',
            right: '4%',
            'margin-bottom': '4%',
            width: '92%',
            'box-shadow': '0 2px 8px 2px rgba(0,0,0,.5)'
        },
        '.z_lb_title': {
            width: '100%',
            'line-height': '1.5em',
            'padding-top': '0.25em',
            'font-size': '2.2em',
            'font-weight': 'bold',
            color: '#5A5A5A',
            'text-align': 'center'
        },
        '.z_lb_tabs': {
            display: 'table',
            'table-layout': 'fixed',
            width: '92%',
            'border-spacing': '0.25em',
            'margin-left': '4%',
            'margin-right': '4%',
            'margin-top': 0,
            'margin-bottom': '0.5em',
            height: '4em',
            'box-sizing': 'border-box',
        },
        '.z_lb_tabs_row': {
            display: 'table-row'
        },
        '.z_lb_tabs_tab': {
            display: 'table-cell',
            position: 'relative',
            '-webkit-transform': 'translate3d(0, 0, 0)',
            height: '4em',
            'white-space': 'nowrap',
            'box-sizing': 'border-box',
            'text-align': 'center',
            'font-weight': 'bold',
            border: '0.15em solid rgb(0, 141, 137)'
        },
        '.z_lb_tabs_tab.z_lb_new_to_me:before': {
            content: '""',
            position: 'absolute',
            top: '-0.35em',
            left: '0.2em',
            height: '100%',
            width: '1.75em',
            'background-position': '0 0',
            'background-size': 'contain',
            'background-repeat': 'no-repeat',
            // tslint:disable-next-line:max-line-length
            'background-image': 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADcAAABBCAYAAAB1oDyaAAAFw0lEQVR4Ae2ZA5AjzxfHk8n+bNv22bZt27Zt27Zt275b28ns3sbG9/+qq1Izi5zvJrn/vKrPKklXPnnd/V73KjTjg/Cy8n8qJ8vJcrKcLCfLyXKynCxnvjQdbpMGbnOaCB6W64uhmfBqAMtNfAMufTxyCo81A/zU9wNYjjJjDTsFuF0QBfvdFnsN/MS3xM8lXgsguXFBiGrzLazRtyAOe2IYIlv/CPUY9jwmpdtcE/qdTVg2/V6On/Qm0mZ+ibgev8EcfB7isEbdRGz3P8DP+Ar85Heg21oH3rDcWEqv+9xP5SgL6XN/hPFoHzjizwBuJ3IMjxuOxPMwnRnDNhxxGE8O9T85ftpH0O9tA1d6OJ40XAYeGRtr+5dc2ozPYLk6H1nDbdLBnhxF6+42LGFXQN/p90i4jBnIKfi1oxHXkfMfOX7qB7DeWZNNynT9KFLmdEF059wIq/sRQqq9gbA6HyK6439Imdkexsv7qVSkQxy6oyuRPOQj/5EznR0HUbBMpczuhJDKrxIKhNVQIrw2UYd9B/3O/h5cgUPytNZs9xSH+fJsGvcV6eUyVhcH4IE3bHH3QJlhbz6igRLxXUhgsArqUUFQjyXoO/2O+G4cIhuRZBUFYroXhC0hFOLQbqgksRztjPbYE+LizKZa/OCSSOxPU2vsw+tgfHcOYTWViOlZmNahFt5wpFxl5UQyufvL80Mc2sMrYYu/B1BY766DdlN1VsceNk7yQBUTTNswHuLIWFNKOjnT6dFC0ixGhDf+Ekljy8CRcgeg8Nh0sN5eBe3GqqzPfJhgeKNPqBTcF9bepVnSydkijsIbphvHEN2cQ1gtJVtz5pv7BHFjCiy3VsB0chh02+r5HC+2HQfD+V3CxhR3UTo5Jx8Fb9zfNg2pI4KQ1F8FtjM2/AIZe+chS7Ajj353qxzHS6XNhl87At5wpsdJJ+fSqeGN9A1DhClGuyHbCau+DvXC3vDYrRCHI/my75q5vIvQreg0EmYuPUlY/LtGZc7CyCBEt+IQXF5BGVwIcZgur/a9SW3uLWQuI0U6OWv0TaHZPb8y6+OsrsV15hDR6HNoj6xipwHdiQ2I6fyjzzENJ+eIjkah0snpTggtl0MT4XNHjG7JsfYrqt2fCK//KaKaK32NSUKiD+ziLunkUme1EB9h2IEzx+fRFCUhttFENVUiZbgq525nbWl4REck9eJu0snFdqa6pOOFNaK+5St7rO1KGaIiUZ/jsfOdUDcNiO36jXRyCT1U4NeMhDgsN5Y88S0ZPB5h9902nfWlkslRXaI19B5sccHC7HTZ2bUdP/ntR+1PSWwmPE6hXDjUsVQnP6G6KfGpILY9x7p6mkaiSu1gU4y6kQfeTWo312CNt8dlEz4cpx1x/Uojpg0n/ZFHPToIYbU5xA+qwA6oomC9pTP1OujSh92p6Pe2heFIL8rsIirkV+CxarM834KEkbXovMexWSGxnND0hlSmDHYrAGvkdWQLt5MyYoHHYWbfKbPIEmxqx/YpgeDKKtbC+dUdSlJfEqyipCx+AM2KIXCmJ+NRwqnVsHsTqn8IqaREYm+VH95bjmMZZFcJwRXpe8PPkTSxKXTH11E2b8DBJzARR1oiu6TVn9yI5Ckt6Zj0FXs+nSZYxmgc/5MTr8HYDhxCqymor3w4oVUVbFMS6p/fyglZpDfL6mBUM9aZkCwTYd+9nUpCdxXYdj9O/v+cLCfLyXKynATIcrKcLHeHaEDkIvYEvpwgVY/gCIWIQsSxQJW7RdQhlEzGN2WJS4Eid5OoLUg9MtWJ2/4qd52oKUg9ERzRmIjwF7lrRA1B6pkQRLQn4qWSu0pUE6SeC68RPQnNi5K7TFQlFC+Qt4khhPZ5yV0iKhMKCXmfmEAYn5XcBaISofAjPiNmEbYnlTtPVCAUfsy3xFLC+ahyZ4nyhCKA+JXYQLh9yZ0hyhKKAOZfYo9Y7hRRmlC8RBQmjv0PrWQ7R+GV7o8AAAAASUVORK5CYII=)',
        },
        '.z_lb_no_new_to_me_badge .z_lb_tabs_tab.z_lb_new_to_me:before': {
            display: 'none'
        },
        '.z_lb_tabs_tab > .z_lb_tabs_tab_name_container, .z_lb_tabs_tab > .z_lb_tabs_tab_time_remaining_container': {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate3d(-50%, -50%, 0)'
        },
        '.z_lb_tabs_tab > .z_lb_tabs_tab_time_remaining_container': {
            top: '70%',
            display: 'none'
        },
        '.z_lb_tabs_tab_name': {
            'font-size': '1.2em'
        },
        '.z_lb_tabs_tab_time_remaining': {
            'font-weight': 'normal'
        },
        '.z_lb_tabs_tab.z_lb_has_time_remaining .z_lb_tabs_tab_time_remaining_container': {
            display: 'block',
        },
        '.z_lb_tabs_tab.z_lb_has_time_remaining .z_lb_tabs_tab_name_container': {
            top: '33%'
        },
        '.z_lb_tabs_tab_time_remaining:before': {
            content: '""',
            width: '1em',
            height: '1em',
            display: 'inline-block',
            position: 'relative',
            transform: 'translate3d(-0.2em,0.1em,0) scale3d(1.2, 1.2, 1.2)',
            // tslint:disable-next-line:max-line-length
            'background-image': clockBackgroundImage.replace('~~COLOR~~', '008d89'),
            'background-size': 'contain',
            'background-repeat': 'no-repeat'
        },
        '.z_lb_tabs_tab_active .z_lb_tabs_tab_time_remaining:before': {
            'background-image': clockBackgroundImage.replace('~~COLOR~~', 'FFFFFF'),
        },
        '.z_lb_tabs_tab_active': {
            'background-color': 'rgb(0, 141, 137)',
            color: 'white'
        },
        '.z_lb_leaderbaord': {
            width: '100%',
            display: 'none',
            'box-sizing': 'border-box',
            'border-top': 'none'
        },
        '.z_lb_leaderbaord.z_lb_active': {
            display: 'block'
        },
        '.z_lb_time_remaining': {
            position: 'relative',
            '-webkit-transform': 'translate3d(0,0,0)',
            display: 'none',
            height: '2em'
        },
        '.z_lb_show_time_remaining_below_tabs .z_lb_leaderbaord.z_lb_active.z_lb_has_time_remaining > .z_lb_time_remaining': {
            display: 'block'
        },
        '.z_lb_time_remaining_label, .z_lb_time_remaining_remaining': {
            position: 'absolute',
            top: 0,
            height: '100%',
            color: 'rgb(134,134,134)',
            'font-weight': 'bold',
            display: 'inline',
            'vertical-align': 'top'
        },
        '.z_lb_time_remaining_label': {
            right: '50%',
            'text-align': 'right',
            'padding-right': '0.5em'
        },
        '.z_lb_time_remaining_remaining': {
            left: '50%',
            'text-align': 'left',
            'padding-left': '0.5em'
        },
        '.z_lb_lb_items': {
            width: '100%'
        },
        '.z_lb_lb_item': {
            position: 'relative',
            '-webkit-transform': 'translate3d(0, 0, 0)',
            width: '100%',
            display: 'block',
            color: '#5A5A5A'
        },
        '.z_lb_lb_item.z_lb_item_current_user': {
            'background-color': 'rgba(0,0,0,0.05)'
        },
        '.z_lb_lb_item.z_lb_item_zero_state .z_lb_lb_item_section_rank': {
            display: 'none'
        },
        '.z_lb_lb_item_type_player': {},
        '.z_lb_lb_item_type_zero_state': {},
        // Special invite re-formatting
        '.z_lb_lb_item.z_lb_item_invite > .z_lb_lb_item_section_name': {
            left: '5%',
            width: '70%',
            height: '100%'
        },
        '.z_lb_lb_item.z_lb_item_invite > .z_lb_lb_item_section_name > .z_lb_lb_item_wrapper': {
            top: '50%',
            bottom: 'initial',
            transform: 'translate3d(0, -50%, 0)'
        },
        '.z_lb_lb_item.z_lb_item_zero_state > .z_lb_lb_item_section_challenge  .z_lb_lb_item_challenge': {
            display: 'block'
        },
        '.z_lb_lb_item_type_group_leader': {},
        '.z_lb_lb_item_pos_0': {},
        '.z_lb_lb_item_pos_1': {},
        '.z_lb_lb_item_pos_2': {},
        '.z_lb_item_current_user': {},
        // tslint:disable-next-line:max-line-length
        '.z_lb_lb_item_section_rank, .z_lb_lb_item_section_picture, .z_lb_lb_item_section_name, .z_lb_lb_item_section_score, .z_lb_lb_item_section_cta': {
            position: 'absolute',
            top: 0,
            height: '100%'
        },
        // tslint:disable-next-line:max-line-length
        '.z_lb_lb_item_section_name, .z_lb_lb_item_section_chat_name, .z_lb_lb_item_section_score, .z_lb_lb_item_section_challenge': {
            position: 'absolute',
            left: '23%',
            right: '80%',
            top: '0',
            height: '50%',
            width: '57%',
            overflow: 'hidden',
            'white-space': 'nowrap',
            'text-overflow': 'ellipsis'
        },
        '.z_lb_lb_item_section_score, .z_lb_lb_item_section_challenge': {
            top: '50%'
        },
        '.z_lb_lb_item_wrapper': {
            position: 'absolute',
            width: '100%'
        },
        '.z_lb_lb_item_section_name > .z_lb_lb_item_wrapper, .z_lb_lb_item_section_chat_name > .z_lb_lb_item_wrapper': {
            bottom: 0
        },
        '.z_lb_lb_item_section_score > .z_lb_lb_item_wrapper, .z_lb_lb_item_section_challenge > .z_lb_lb_item_wrapper': {
            top: 0
        },
        '.z_lb_lb_item_section_rank': {
            left: '0%',
            width: '8%',
            color: 'rgb(134,134,134)',
            'font-size': '1.2em'
        },
        '.z_lb_lb_item_section_rank_value': {
            position: 'absolute',
            top: '50%',
            left: 0,
            width: '100%',
            'text-align': 'center',
            transform: 'translate3d(0, -50%, 0)',
            overflow: 'hidden',
            'white-space': 'nowrap'
        },
        '.z_lb_lb_item_section_picture': {
            left: '6%'
        },
        '.z_lb_lb_item_photo_wrapper': {
            position: 'relative',
            '-webkit-transform': 'translate3d(0, 0, 0)',
            width: '100%'
        },
        '.z_lb_lb_item_height_provider': {
            position: 'relative',
            '-webkit-transform': 'translate3d(0, 0, 0)',
        },
        '.z_lb_lb_item_section_picture, .z_lb_lb_item_height_provider': {
            width: '15%',
        },
        '.z_lb_lb_item_photo_wrapper:before, .z_lb_lb_item_height_provider:before': {
            content: '""',
            display: 'block',
            'padding-top': '100%'
        },
        '.z_lb_lb_item_photo': {
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '80%',
            height: '80%',
            'background-size': 'contain',
            transform: 'translate3d(-50%, -50%, 0)',
            'border-radius': '50%',
            'box-sizing': 'border-box'
        },
        '.z_lb_lb_item_section_name': {
            'padding-bottom': '0.2em'
        },
        '.z_lb_lb_item_name, .z_lb_lb_item_chat_name, .z_lb_lb_item_challenge, .z_lb_lb_item_score': {},
        '.z_lb_lb_item_name': {
            'font-size': '1.5em',
            'font-weight': 'bold',
            'padding-bottom': '0.2em'
        },
        '.z_lb_lb_item_chat_name': {
            display: 'none',
            'font-size': '1.25em'
        },
        '.z_lb_lb_item_section_score': {},
        '.z_lb_lb_item_score': {
            'font-size': '1.5em',
            'font-weight': 'bold',
            'padding-top': '0.2em'
        },
        '.z_lb_lb_item_challenge': {
            display: 'none',
            'font-size': '1.1em',
            'padding-top': '0.2em'
        },
        '.z_lb_lb_item_section_cta': {
            width: '20%',
            right: 0
        },
        '.z_lb_lb_item_cta': {
            'font-weight': 'bold',
            'font-size': '1.2em',
            'line-height': '1.2em',
            position: 'absolute',
            top: '50%',
            right: '1em',
            cursor: 'hand',
            transform: 'translate3d(0, -50%, 0)',
            'border-radius': '0.1em',
            color: 'rgb(0, 141, 137)',
            padding: '0.3em 1em',
            border: '0.11em solid rgb(0, 141, 137)'
        },
        '.z_lb_play_now': {
            position: 'fixed',
            left: '5%',
            right: '5%',
            width: '90%',
            bottom: '0em',
            'font-size': '1.7em',
            height: '2.2em',
            'line-height': '2.2em',
            'text-align': 'center',
            'vertical-align': 'middle',
            'border-radius': '0.6em',
            'background-color': '#4080F7',
            cursor: 'pointer',
            color: 'white'
        },
        '.z_lb_container > .z_lb_play_now': {
            display: 'none',
            position: 'relative',
            '-webkit-transform': 'translate3d(0, 0, 0)',
        },
        '.z_lb_bottom_spacer': {
            height: '5.5em'
        },
        '.z_lb_play_now_no_pin .z_lb_bottom_spacer': {
            height: 0
        },
        '.z_lb_play_now_no_pin .z_lb_main > .z_lb_play_now': {
            display: 'none' // Hide fixed playnow
        },
        '.z_lb_play_now_no_pin .z_lb_container > .z_lb_play_now': {
            display: 'block'
        }
    };
    return leaderboardCSS;
});



var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
define("ZyngaMatch", ["require", "exports", "Zynga", "ZyngaAccount", "ZyngaCore", "ZyngaInstant", "ZyngaNet"], function (require, exports, Zynga, ZyngaAccount, ZyngaCore, ZyngaInstant, ZyngaNet) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ObjectAssign = ZyngaCore.ObjectAssign;
    var commonEntryData = null; // Common entry point data extracted from payload
    var currentInstanceId = false; // Current instance_id, from startTurnAsync();
    var lastInstanceId = false; // Last ended instance, from endTurnAsync();
    var playedInstanceData = {}; // Cached session played instance data for bots
    var lastSessionData = {}; // last data send by game to Instant.setSessionData()
    var now = new Date();
    var tzOffset = now.getTimezoneOffset();
    var locale = false;
    // wrapper keys for common  payload/session data sharing
    //  {"foo":"bar"}
    // will become:
    //  {"__c":{.. common stuff ...},"__d":{"foo":"bar"}}
    var commonKey = '__c';
    var dataKey = '__d';
    var playerId = 0;
    var sessionToken = null;
    var defaultInstanceFields = [
        'instance_state',
        'instance_summary_data',
        'instance_summary_data_cas',
        'instance_data',
        'instance_data_cas',
        'players.playertoinstance_state'
    ];
    var defaultInstancesFields = [
        'instance_state',
        'playertoinstance_state',
        'instance_summary_data'
    ];
    // find a way to import these instead of copy/pasta
    var defaultRoundFetchFields = [
        'instance_id',
        'instance_sig',
        'instance_state',
        'instance_data_cas',
        'instance_data',
        'instance_summary_data_cas',
        'instance_summary_data',
        'instance_created_at',
        'instance_last_move_played_at',
        'display_name',
        'display_picture_url',
        'zynga_player_id',
        'fbig_player_id'
    ];
    // for simplicity and code minification
    function isUndef(x) {
        return typeof x === 'undefined';
    }
    Promise.all([
        ZyngaAccount.Event.last(ZyngaAccount.Events.ACCOUNT_DETAILS),
        ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT)
    ]).then(function (allResults) {
        var details = allResults[0];
        playerId = details.playerId;
        sessionToken = details.token;
        locale = ZyngaInstant.getLocale && ZyngaInstant.getLocale() || false;
        ZyngaInstant.setSessionData(undefined); // Triggers our hook to merge game supplied data and our bot data
    });
    ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT).then(function () {
        locale = ZyngaInstant.getLocale && ZyngaInstant.getLocale() || false;
    });
    exports.devMode = false;
    function genMatchError(code, message, details) {
        return {
            code: code || exports.ERRORS.MATCH_UNKNOWN,
            message: message || 'Unknown',
            details: details || {}
        };
    }
    // Clear out setSessionData data when context changes
    ZyngaInstant.Event.on(ZyngaInstant.Events.INSTANT_CONTEXT_ID_CHANGE, function () {
        playedInstanceData = {};
        currentInstanceId = false;
        lastInstanceId = false;
        lastSessionData = {};
        Promise.all([
            ZyngaAccount.Event.last(ZyngaAccount.Events.ACCOUNT_DETAILS),
            ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT)
        ]).then(function () {
            ZyngaInstant.setSessionData(undefined); // Triggers our hook to merge game supplied data and our bot data
        });
    }, false /*isolate*/);
    // Apply hook to pull out common data
    ZyngaInstant.zynga.registerMethodReturnHook('getEntryPointData', function (data) {
        if (data && typeof data === 'object' && data.hasOwnProperty(commonKey) && data.hasOwnProperty(dataKey)) {
            // Data is in the HOOK'd format.  Extract what we need.
            if (!commonEntryData) {
                commonEntryData = data[commonKey];
                // fire event
            }
            return data[dataKey];
        }
        return data;
    });
    function genMergedSessionData() {
        var data = {};
        var instances = [];
        var instance;
        var i;
        data[dataKey] = lastSessionData;
        data[commonKey] = {
            b: [],
            p: playerId
        };
        // Send up our session token for future use
        if (typeof sessionToken === 'string' && sessionToken.length > 0) {
            data[commonKey].s = sessionToken;
        }
        // Send up locale if we have it
        if (locale !== false) {
            data[commonKey].l = locale;
        }
        // Send up locale if we have it
        if (tzOffset >= -1440 && tzOffset <= 1440) {
            data[commonKey].tz = tzOffset;
        }
        // Create an array of completed instances
        for (i in playedInstanceData) {
            instance = playedInstanceData[i];
            if (instance.start && instance.end) {
                instances.push(instance);
            }
        }
        // Sort oldest to newest
        instances = instances.sort(function (a, b) {
            return a.end.getTime() - b.end.getTime();
        });
        // Inject instance specific data for bot
        for (i = 0; i < instances.length; i++) {
            instance = instances[i];
            data[commonKey].b.push({
                i: instance.instanceId,
                d: instance.botData // Any bot data the game passed into stopMatchAsync()
            });
        }
        // Prune data until we are under the allowable size
        while (JSON.stringify(data).length > 1000) {
            if (data[commonKey].s) {
                // First thing to remove is the session token.
                delete data[commonKey].s;
            }
            else if (data[commonKey].b.length > 0) {
                // Next is to remove each instance specific chunk of data until
                // it fits.  Oldest first.
                data[commonKey].b.shift();
            }
            else {
                // Give up, there's just too much data
                // Allow it to go out and have the FB SDK reject it.
                break;
            }
        }
        return data;
    }
    // Apply hooks to add common data to setSessionData method
    ZyngaInstant.zynga.registerMethodArgumentHook('setSessionData', function (data) {
        if (!isUndef(data)) {
            // Game called setSessionData, save it
            lastSessionData = data;
        }
        // actually set our merged session data (common and game-provided)
        // Note: registerMethodArgumentHook expects an arguments array
        return [genMergedSessionData()];
    });
    function matchCall(method, path, params, options) {
        return new Promise(function (resolve, reject) {
            var queryParams = [];
            var paramName;
            var paramValue;
            options = options || {};
            params = params || {};
            for (paramName in params) {
                paramValue = params[paramName];
                // encode and optionally turn arrays into comma separated list
                paramValue = Array.isArray(paramValue) ? paramValue.map(encodeURI).join(',') : encodeURI(paramValue);
                queryParams.push(paramName + '=' + paramValue);
            }
            queryParams = queryParams.length > 0 ? ('?' + queryParams.join('&')) : '';
            var appIdPromise = Zynga.Event.last(Zynga.Events.APP_ID);
            var accountDetailsPromise = ZyngaAccount.Event.last(ZyngaAccount.Events.ACCOUNT_DETAILS);
            Promise.all([appIdPromise, accountDetailsPromise]).then(function (results) {
                var appId = results[0];
                var accountDetails = results[1];
                if (Zynga.getApiURLBase('match').indexOf('localhost') > 0) {
                    var headers = options.headers = options.headers || {};
                    headers['App-Id'] = appId;
                    headers['Player-Id'] = accountDetails.playerId;
                    headers['Zid'] = accountDetails.zid;
                }
                options.useToken = accountDetails.token;
                ZyngaNet.api(method, Zynga.getApiURLBase('match') + path + queryParams, options).then(resolve, reject);
            });
        });
    }
    exports.matchCall = matchCall;
    /*
    function addCurrentPlayer(players, currentPlayer) {
        currentPlayer = currentPlayer && (currentPlayer + '');
    
        if (players.hasOwnProperty(currentPlayer) === false) {
            players[currentPlayer] = {
                playertoinstance_state: 'unknown'
            };
        }
        return players;
    }
    */
    exports.getEntryInstanceIdAsync = function () {
        return new Promise(function (resolve, reject) {
            var timeoutTimer = window.setTimeout(function () {
                // tslint:disable-next-line:max-line-length
                reject(new Error('Timeout (5000ms) waiting for FBInstant to initialize before calling FBInstant.context.getEntryPointData()'));
            }, 5000);
            ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT, function () {
                var instanceId = false;
                window.clearTimeout(timeoutTimer);
                // Just fire this off, side effect will be to get instance data
                ZyngaInstant.getEntryPointData();
                if (commonEntryData !== false && typeof commonEntryData === 'object' && commonEntryData.i) {
                    instanceId = commonEntryData.i;
                }
                resolve(instanceId);
            });
        });
    };
    var writeFields = [
        'instance_state',
        'instance_summary_data',
        'instance_data',
        'players'
    ];
    function prepWriteData(
        // tslint:disable-next-line:max-line-length
        data, options, enforceCAS) {
        var i;
        var key;
        var value;
        var queryOptions = {};
        data = data || {};
        return new Promise(function (resolve, reject) {
            ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT).then(function () {
                var body = {};
                var contextId = ZyngaInstant.context.getID();
                if (!isUndef(data.players) && (typeof data.players !== 'object' || Array.isArray(data.players))) {
                    reject(genMatchError(exports.ERRORS.MATCH_INPUT_ERROR, '\'players\' must be of type \'undefined\' or \'object\''));
                    return;
                }
                // summary CAS requirements
                if (enforceCAS &&
                    (!isUndef(data.instance_summary_data) || !isUndef(data.instance_state)) &&
                    isUndef(data.instance_summary_data_cas)) {
                    reject(genMatchError(exports.ERRORS.MATCH_INPUT_ERROR, 'instance_summary_data_cas is required when updating instance_summary_data or instance_status'));
                    return;
                }
                // data CAS requirements
                if (enforceCAS && !isUndef(data.instance_data) && isUndef(data.instance_data_cas)) {
                    reject(genMatchError(exports.ERRORS.MATCH_INPUT_ERROR, 'instance_data_cas is required when updating instance_data'));
                    return;
                }
                for (i = 0; i < writeFields.length; i++) {
                    key = writeFields[i];
                    value = data[key];
                    if (!isUndef(value)) {
                        body[key] = value;
                    }
                }
                // Slap cas values on query string
                if (!isUndef(data.instance_summary_data_cas)) {
                    queryOptions.instance_summary_data_cas = data.instance_summary_data_cas;
                }
                if (!isUndef(data.instance_data_cas)) {
                    queryOptions.instance_data_cas = data.instance_data_cas;
                }
                // Add common query fbig_player_id and context_id values to query string
                queryOptions.fbig_player_id = options.fbig_player_id || ZyngaInstant.player.getID();
                if (!isUndef(options.context_id)) {
                    if (typeof (options.context_id) !== 'boolean') {
                        queryOptions.context_id = options.context_id;
                    }
                    else {
                        if (options.context_id) {
                            queryOptions.context_id = contextId;
                        }
                        else {
                            delete queryOptions.context_id;
                        }
                    }
                }
                if (options.zynga_player_id) {
                    queryOptions.zynga_player_id = playerId;
                    if (!playerId) {
                        reject(genMatchError(exports.ERRORS.MATCH_INPUT_ERROR, 'zynga_player_id asked to be sent, but is not available yet.'));
                    }
                }
                resolve({
                    body: body,
                    queryOptions: queryOptions
                });
            });
        });
    }
    exports.createMatchAsync = function (data, options) {
        options = options || {};
        return new Promise(function (resolve, reject) {
            prepWriteData(data, options, false).then(function (preparedData) {
                var body = preparedData.body;
                var queryOptions = preparedData.queryOptions;
                if (isUndef(body.instance_state)) {
                    body.instance_state = 'started'; // Needed or we get a DB NULL error
                }
                matchCall('POST', '/instance', queryOptions, { body: body }).then(function (results) {
                    var xhr = results.xhr;
                    var statusCode = xhr.status;
                    if ((statusCode >= 200 && statusCode < 300) || statusCode === 304) {
                        resolve(results); // Successful
                    }
                    else {
                        reject(genMatchError(exports.ERRORS.MATCH_SERVER_UNKNOWN, 'Server Error.', results));
                    }
                }, reject);
                // TODO: proper HTTP status code to rejection codes
            }, reject);
        });
    };
    exports.updateMatchDataAsync = function (instanceId, data, options) {
        options = options || {};
        return new Promise(function (resolve, reject) {
            prepWriteData(data, options, true).then(function (preparedData) {
                var body = preparedData.body;
                var queryOptions = preparedData.queryOptions;
                matchCall('PUT', '/instance/' + instanceId, queryOptions, { body: body })
                    .then(function (results) {
                    var xhr = results.xhr;
                    var statusCode = xhr.status;
                    if ((statusCode >= 200 && statusCode < 300) || statusCode === 304) {
                        resolve(results); // Successful
                    }
                    else if (statusCode === 404) {
                        reject(genMatchError(exports.ERRORS.MATCH_SERVER_NOT_FOUND, 'Match with instance_id \'' + instanceId + '\' not found.', results));
                    }
                    else if (statusCode === 409) {
                        reject(genMatchError(exports.ERRORS.MATCH_SERVER_CAS, 'CAS Mismatch.  Fetch again and re-apply changes', results));
                    }
                    else {
                        reject(genMatchError(exports.ERRORS.MATCH_SERVER_UNKNOWN, 'Server Error.', results));
                    }
                }, reject);
            }, reject);
        });
    };
    // tslint:disable-next-line:max-line-length
    exports.getMatchDataAsync = function (instanceId, options) {
        options = options || {};
        if (!options.fields) {
            options.fields = defaultInstanceFields;
        }
        if (options.fields === 'all') {
            delete options.fields;
        }
        return new Promise(function (resolve, reject) {
            matchCall('GET', '/instance/' + instanceId + '/', options).then(function (results) {
                var xhr = results.xhr;
                var statusCode = xhr.status;
                if ((statusCode >= 200 && statusCode < 300) || statusCode === 304) {
                    resolve(results); // Successful
                }
                else if (statusCode === 404) {
                    reject(genMatchError(exports.ERRORS.MATCH_SERVER_NOT_FOUND, 'Match with instance_id \'' + instanceId + '\' not found.', results));
                }
                else if (statusCode === 409) {
                    reject(genMatchError(exports.ERRORS.MATCH_SERVER_CAS, 'CAS Mismatch.  Fetch again and re-apply changes', results));
                }
                else {
                    reject(genMatchError(exports.ERRORS.MATCH_SERVER_UNKNOWN, 'Server Error.', results));
                }
            }, reject);
        });
    };
    exports.getMatchesAsync = function (options) {
        var queryOptions = {};
        if (isUndef(options.fields)) {
            queryOptions.fields = defaultInstancesFields;
        }
        else if (options.fields !== 'all') {
            queryOptions.fields = options.fields;
        }
        if (options.context_id) {
            if (typeof (options.context_id) === 'boolean') {
                Promise.reject(genMatchError(exports.ERRORS.MATCH_INPUT_ERROR, 'obsolete usage. please use "use_context_id". or specify the context_id you want as a string.'));
            }
            else {
                queryOptions.context_id = options.context_id;
            }
        }
        if (options.use_context_id) {
            var contextId = ZyngaInstant.context.getID();
            if (contextId) {
                queryOptions.context_id = contextId;
            }
            else {
                Promise.reject(genMatchError(exports.ERRORS.MATCH_INPUT_ERROR, 'context_id asked to be send, but it is not available. Are you in "SOLO" mode? '));
            }
        }
        if (options.use_zynga_player_id) {
            queryOptions.zynga_player_id = playerId;
            if (!playerId) {
                Promise.reject(genMatchError(exports.ERRORS.MATCH_INPUT_ERROR, 'zynga_player_id asked to be sent, but is not available yet.'));
            }
        }
        if (options.instance_state_in) {
            queryOptions.instance_state_in = options.instance_state_in;
        }
        if (!queryOptions.zynga_player_id && !queryOptions.context_id) {
            Promise.reject(genMatchError(exports.ERRORS.MATCH_INPUT_ERROR, 'zynga_player_id or context_id must be set. Do you want us to get you all the matches? For everyone?'));
        }
        return new Promise(function (resolve, reject) {
            matchCall('GET', '/instances/', queryOptions).then(function (results) {
                var xhr = results.xhr;
                var statusCode = xhr.status;
                if ((statusCode >= 200 && statusCode < 300) || statusCode === 304) {
                    resolve(results); // Successful
                }
                else if (statusCode === 404) {
                    reject(genMatchError(exports.ERRORS.MATCH_SERVER_NOT_FOUND, 'No matches found.', results));
                }
                else {
                    reject(genMatchError(exports.ERRORS.MATCH_SERVER_UNKNOWN, 'Server Error.', results));
                }
            }, reject);
        });
    };
    exports.sendMatchAction = function (instanceId, cmd, options) {
        return matchCall('PATCH', '/instance/' + instanceId, options, { body: cmd });
    };
    exports.customMatchCall = matchCall;
    exports.startTurnAsync = function (instanceId) {
        return new Promise(function (resolve, reject) {
            if (currentInstanceId !== false) {
                reject(new Error('Already have a started match.  End existing match first'));
            }
            else {
                currentInstanceId = instanceId;
                playedInstanceData[instanceId] = {
                    instanceId: instanceId,
                    start: new Date()
                };
                // TODO: ztrack start game session
                resolve();
            }
        });
    };
    exports.endTurnAsync = function (botData) {
        // TODO: Maybe pass in base64 encoded image data for different images
        //       and let this function upload them somewhere the bot can access.
        return new Promise(function (resolve, reject) {
            ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT).then(function () {
                var currentMatchData;
                if (currentInstanceId === false) {
                    reject(new Error('No match started'));
                }
                else {
                    currentMatchData = playedInstanceData[currentInstanceId];
                    if (currentMatchData) {
                        currentMatchData.end = new Date();
                        currentMatchData.instanceId = currentInstanceId;
                        if (botData) {
                            currentMatchData.botData = botData;
                        }
                        lastInstanceId = currentInstanceId; // Used by updateAsync to share details for just this instance
                        currentInstanceId = false;
                        ZyngaInstant.setSessionData(undefined); // Triggers our hook to merge game supplied data and our bot data
                        // TODO: Log session end to ztrack
                        resolve();
                    }
                }
            });
        });
    };
    function indexRoundsFetch(response) {
        // index members directly into the instance data for easy access.
        var linkedInstances = {};
        for (var _i = 0, _a = response.instancestoplayers; _i < _a.length; _i++) {
            var instanceToPlayer = _a[_i];
            // denormalize the friend data and the instance-to-friend data as a subrecord of the instance.
            var linkedFriend = response.members[instanceToPlayer.zynga_player_id];
            var zyngaPlayerId = instanceToPlayer.zynga_player_id;
            var linkedInstance = response.instances[instanceToPlayer.instance_id];
            if (linkedInstance) {
                linkedInstance.members = linkedInstance.members || {};
                var friendRecord = linkedInstance.members[zyngaPlayerId];
                linkedInstance.members[zyngaPlayerId] = ObjectAssign({}, friendRecord, instanceToPlayer, linkedFriend);
                linkedInstances[linkedInstance.instance_id] = linkedInstance;
            }
        }
        // todo: index contexts?
        for (var contextId in response.contexts) {
            for (var _b = 0, _c = response.contexts[contextId]; _b < _c.length; _b++) {
                var instanceId = _c[_b];
                var linkedInstance = linkedInstances[instanceId];
                var contextIds = linkedInstance.context_ids = linkedInstance.context_ids || [];
                contextIds.push(contextId);
                linkedInstance.context_id = contextId;
            }
        }
        return __assign({}, response, { instances: linkedInstances });
    }
    function getRoundsDataAsync(options) {
        return ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT).then(function () {
            var queryOptions = {};
            queryOptions.fields = options.fields || defaultRoundFetchFields;
            var contextId = ZyngaInstant.context.getID();
            if (contextId) {
                queryOptions.context_id = contextId;
            }
            queryOptions.zynga_player_id = playerId;
            if (options.instance_state_in) {
                queryOptions.instance_state_in = options.instance_state_in;
            }
            if (options.last_query_time) {
                queryOptions.changed_since = options.last_query_time;
            }
            if (!isUndef(options.search_context_history)) {
                queryOptions.search_context_history = options.search_context_history; // check default.
            }
            return matchCall('GET', '/rounds', queryOptions).then(function (results) {
                var xhr = results.xhr;
                var statusCode = xhr.status;
                if ((statusCode >= 200 && statusCode < 300) || statusCode === 304) {
                    return Promise.resolve(indexRoundsFetch(results.body)); // Successful
                }
                else {
                    return Promise.reject(genMatchError(exports.ERRORS.MATCH_SERVER_UNKNOWN, 'Server Error.', results));
                }
            });
        });
    }
    exports.getRoundsDataAsync = getRoundsDataAsync;
    exports.getCurrentMatchId = function () {
        return currentInstanceId;
    };
    exports.getPreviousMatchId = function () {
        return lastInstanceId;
    };
    exports.ERRORS = {
        MATCH_INPUT_ERROR: 'MATCH_INPUT_ERROR',
        MATCH_SERVER_NOT_FOUND: 'MATCH_NOT_FOUND',
        MATCH_SERVER_CAS: 'MATCH_SERVER_CAS',
        MATCH_SERVER_UNKNOWN: 'MATCH_SERVER_UNKNOWN',
        MATCH_UNKNOWN: 'MATCH_UNKNOWN' // Encountered a general error
        // TODO:  Add more known errors?
    };
    exports.MATCH_STATE = {
        STARTED: 'started',
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed',
        EXPIRED: 'expired',
        CAN_JOIN: 'can_join'
    };
    exports.PLAYER_STATE = {
        CAN_PLAY: 'can_play',
        WAITING: 'waiting',
        UNKNOWN: 'unknown'
    };
});



define("ZyngaMedia", ["require", "exports", "Zynga", "ZyngaAccount", "ZyngaCore", "ZyngaMd5", "ZyngaNet"], function (require, exports, Zynga, ZyngaAccount, ZyngaCore, ZyngaMd5, ZyngaNet) {
    // tslint:disable-next-line:comment-format
    ///<amd-module name="ZyngaMedia"/>
    /* global Uint8Array */
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    // for simplicity and code minification
    function isUndef(x) {
        return typeof x === 'undefined';
    }
    function mediaCall(method, path, params, options) {
        return new Promise(function (resolve, reject) {
            var queryParams = [];
            var queryParamsString = '';
            var paramName;
            var paramValue;
            options = options || {};
            params = params || {};
            for (paramName in params) {
                paramValue = params[paramName];
                // encode and optionally turn arrays into comma separated list
                paramValue = Array.isArray(paramValue) ? paramValue.map(encodeURI).join(',') : encodeURI(paramValue);
                queryParams.push(paramName + '=' + paramValue);
            }
            queryParamsString = queryParams.length > 0 ? ('?' + queryParams.join('&')) : '';
            Promise.all([
                Zynga.Event.last(Zynga.Events.APP_ID),
                ZyngaAccount.Event.last(ZyngaAccount.Events.ACCOUNT_DETAILS)
            ]).then(function (results) {
                var appId = results[0];
                var accountDetails = results[1];
                if (Zynga.getApiURLBase('media').indexOf('localhost') > 0) {
                    var headers = options.headers = options.headers || {};
                    headers['App-Id'] = appId;
                    headers['Player-Id'] = accountDetails.playerId;
                    headers['Zid'] = accountDetails.zid;
                }
                options.useToken = accountDetails.token;
                ZyngaNet.api(method, Zynga.getApiURLBase('media') + path + queryParamsString, options).then(resolve, reject);
            });
        });
    }
    function queueMediaUpload(imageDataURI, instanceId) {
        return new Promise(function (resolve) {
            Zynga.Event.last(Zynga.Events.APP_ID, function (gameId) {
                var parts;
                var imgData;
                var binaryData;
                var contentType;
                var md5Checksum;
                var uploadStartTime = new Date().getTime();
                var queryParams = {};
                if (instanceId) {
                    queryParams.instance_id = instanceId;
                }
                parts = imageDataURI.split(',');
                imgData = atob(parts[1]);
                contentType = parts[0].split(':')[1].split(';')[0];
                // Convert to binary data
                binaryData = new Uint8Array(imgData.length);
                for (var i = 0; i < imgData.length; i++) {
                    binaryData[i] = imgData.charCodeAt(i);
                }
                // NOTE: if you are going to override this with your own md5,
                // the zynga version will handling converting of Uint8Array.
                md5Checksum = ZyngaMd5(binaryData);
                mediaCall('POST', '/' + md5Checksum, queryParams, { body: binaryData, headers: { 'Content-Type': contentType } }).then(function (result) {
                    var data = {
                        url: result && result.body && result.body.url,
                        md5: md5Checksum,
                        contentType: contentType,
                        contentLength: binaryData.length,
                        uploadMS: new Date().getTime() - uploadStartTime
                    };
                    // Fire general upload event
                    exports.Event.fire(exports.Events.UPLOAD_COMPLETE, data);
                    // Fire specific upload event for THIS asset
                    exports.Event.fire(md5Checksum, data);
                }, function (error) {
                    exports.Event.fire(exports.Events.UPLOAD_ERROR, error);
                });
                // Resolve ASAP to give the caller the MD5 checksum and probably cdnURL
                resolve({
                    md5: md5Checksum,
                    contentType: contentType,
                    cdnUrl: '//gameservices.cdn.zynga.com/media/' + gameId + '/' + md5Checksum
                });
            });
        });
    }
    exports.queueMediaUpload = queueMediaUpload;
    exports.Event = new ZyngaCore.EventMixin();
    exports.Events = {
        UPLOAD_COMPLETE: 'Media.UploadComplete',
        UPLOAD_ERROR: 'Media.UploadError'
    };
});



define("ZyngaNet", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tokens = {};
    var defaultSocialNetworkId;
    var refreshTokenHandler = function (token, callback) {
        callback(false);
    };
    function normalizeHeaders(headersObject) {
        var headerName;
        var newName;
        var newHeaders = {};
        for (headerName in headersObject) {
            if (headersObject.hasOwnProperty(headerName)) {
                newName = headerName
                    .split('-')
                    .map(function (part) {
                    return part && part.length ? part[0].toUpperCase() + part.slice(1) : part;
                })
                    .join('-');
                newHeaders[newName] = headersObject[headerName];
            }
        }
        return newHeaders;
    }
    exports.setDefaultToken = function (socialNetworkId) {
        defaultSocialNetworkId = socialNetworkId;
    };
    exports.registerRefreshTokenHandler = function (handler) {
        if (typeof handler === 'function') {
            refreshTokenHandler = handler;
        }
    };
    exports.apiBaseURL = 'https://api.zynga.com';
    exports.setSocialNetworkToken = function (socialNetworkId, token, makeDefault) {
        tokens[socialNetworkId] = token;
        if (makeDefault || defaultSocialNetworkId === undefined) {
            defaultSocialNetworkId = socialNetworkId;
        }
    };
    function api(method, url, options) {
        return new Promise(function (resolve, reject) {
            var apiURL = exports.apiBaseURL.toLowerCase();
            var xhr = new XMLHttpRequest();
            var authToken = tokens[defaultSocialNetworkId] || false;
            var headerName;
            var headers;
            var body;
            var xhrPreSendCallback = null;
            options = typeof options === 'object' ? options : {};
            if (typeof options.beforeSend === 'function') {
                xhrPreSendCallback = options.beforeSend;
            }
            if (options.useToken) {
                // Explicitly told to use this token
                authToken = options.useToken;
            }
            body = options.body;
            headers = normalizeHeaders(options.headers || {});
            if (url.toLowerCase().indexOf('http') === 0 || url.indexOf('//') === 0 || options.noAPI === true) {
                // Caller has specified host as well or it's not an API call.  Use the supplied url as-si.
                apiURL = url;
            }
            else {
                // Relative URL.  Build up an absolute one.
                apiURL = apiURL + ('/' + url).replace(/\/\/+/g, '/');
            }
            // Add default authorization header if one was not provided
            if (!headers.Authorization && authToken && options.noAuth !== true) {
                headers.Authorization = 'token ' + authToken;
            }
            xhr.open(method, apiURL);
            // JSON stringify so long as we are dealing with a real object or array.
            // Skip if Typed Array like Uint8Array, etc... since that means send as binary
            if (typeof body === 'object' && (typeof ArrayBuffer === 'undefined' || (ArrayBuffer && !ArrayBuffer.isView(body)))) {
                try {
                    body = JSON.stringify(body);
                    if (!headers.hasOwnProperty('Content-Type')) {
                        headers['Content-Type'] = 'application/json';
                    }
                }
                catch (e) {
                    reject(new Error('Failed to JSON.stringigy() body'));
                    return;
                }
            }
            // Add request headers
            for (headerName in headers) {
                if (headers.hasOwnProperty(headerName)) {
                    xhr.setRequestHeader(headerName, headers[headerName]);
                }
            }
            // Allow caller to make XHR changes if they like
            if (xhrPreSendCallback) {
                xhrPreSendCallback(xhr);
            }
            xhr.addEventListener('load', function () {
                var parsedBody;
                var contentType = xhr.getResponseHeader('Content-Type');
                var errorCategory = (xhr.getResponseHeader('Error-Category') || '').toString().toLowerCase();
                var attempts = options.attempts || 0;
                if (xhr && xhr.status === 403 &&
                    typeof errorCategory === 'string' &&
                    errorCategory !== '' &&
                    authToken &&
                    attempts === 0) {
                    if (errorCategory === 'pbr.auth.signatureinvalid' ||
                        errorCategory === 'pbr.auth.malformedauth' ||
                        errorCategory === 'pbr.auth.Expired') {
                        // Try to re-auth
                        refreshTokenHandler(authToken, function (newToken) {
                            if (newToken) {
                                // w00t, got a new one
                                // Resend the request with the new token
                                options.useToken = newToken;
                                options.attempts = attempts + 1;
                                if (tokens[defaultSocialNetworkId] === authToken) {
                                    // Set the default token to the new one so long as the old one was set
                                    tokens[defaultSocialNetworkId] = newToken;
                                }
                                api(method, url, options).then(resolve, reject);
                            }
                            else {
                                resolve({ body: body, xhr: xhr });
                            }
                        });
                        return;
                    }
                }
                // Look for STARTING with application/json.  Some silly services add "; charset=utf-8" on the end.
                // I'm looking at YOU optimize service
                if (contentType && contentType.toLowerCase().indexOf('application/json') === 0) {
                    try {
                        parsedBody = JSON.parse(xhr.responseText);
                    }
                    catch (e) {
                        reject(new Error('Failed to JSON.parse() response body'));
                        return;
                    }
                    resolve({ body: parsedBody, xhr: xhr });
                }
                else {
                    // todo: fail here?
                    resolve({ body: xhr.responseText, xhr: xhr });
                }
            });
            xhr.addEventListener('error', reject);
            xhr.addEventListener('abort', reject);
            xhr.send(body);
        });
    }
    exports.api = api;
});



var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
define("ZyngaOptimize", ["require", "exports", "Zynga", "ZyngaAccount", "ZyngaAnalytics", "ZyngaCore", "ZyngaNet"], function (require, exports, Zynga, ZyngaAccount, ZyngaAnalytics, ZyngaCore, ZyngaNet) {
    // tslint:disable-next-line:comment-format
    ///<amd-module name="ZyngaOptimize"/>
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    var environment = 'production';
    exports.Experiments = new ZyngaCore.EventMixin();
    exports.ENVIRONMENTS = {
        PRODUCTION: 'production',
        STAGING: 'staging',
        DEVELOPMENT: 'development'
    };
    var experimentOverrides = {};
    function setEnvironment(env) {
        switch (env) {
            case exports.ENVIRONMENTS.PRODUCTION:
            case exports.ENVIRONMENTS.STAGING:
            case exports.ENVIRONMENTS.DEVELOPMENT:
                environment = env;
                break;
            default:
                throw Error('Invalid eos environment: ' + env);
        }
    }
    exports.setEnvironment = setEnvironment;
    function clearFakeExperimentData() {
        experimentOverrides = {};
    }
    exports.clearFakeExperimentData = clearFakeExperimentData;
    function setFakeExperimentData(overrideExperimentData) {
        experimentOverrides = overrideExperimentData;
    }
    exports.setFakeExperimentData = setFakeExperimentData;
    function readFileSync(filePath, ignored) {
        var xhr = new XMLHttpRequest();
        var result;
        var error;
        xhr.open('GET', filePath, false);
        xhr.onload = function (e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    result = xhr.responseText;
                }
                else {
                    error = new Error(xhr.statusText);
                }
            }
        };
        xhr.onerror = function (e) {
            error = new Error(xhr.statusText);
        };
        xhr.send(null);
        if (error) {
            throw error;
        }
        return result;
    }
    function fetchFile(filePath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var xhr = new XMLHttpRequest();
                        var result;
                        var error;
                        xhr.open('GET', filePath, true);
                        xhr.onload = function (e) {
                            if (xhr.readyState === 4) {
                                if (xhr.status === 200) {
                                    resolve(xhr.responseText);
                                }
                                else {
                                    reject(xhr.statusText);
                                }
                            }
                        };
                        xhr.onerror = function (e) {
                            reject(xhr.statusText);
                        };
                        xhr.send(null);
                    })];
            });
        });
    }
    // loads the experiment names as [name].json in rootPath.
    // optional: pass in name.variant to get a specific variant.
    function loadFakeExperimentData(rootPath, experimentNames) {
        if (experimentNames.length > 0) {
            for (var _i = 0, experimentNames_1 = experimentNames; _i < experimentNames_1.length; _i++) {
                var experimentNameAndVariant = experimentNames_1[_i];
                var _a = experimentNameAndVariant.split('.'), experimentName = _a[0], experimentVariant = _a[1];
                var filePath = rootPath + "/" + experimentNameAndVariant + ".json";
                var experimentStr = readFileSync(filePath, 'utf8');
                var experimentData = JSON.parse(experimentStr);
                if (!experimentOverrides) {
                    experimentOverrides = {};
                }
                // fix up all keys
                // experimentData = fix_up_experiment_data(experimentData);
                experimentOverrides[experimentName] = experimentData;
            }
        }
    }
    exports.loadFakeExperimentData = loadFakeExperimentData;
    // optional: pass in name.variant to get a specific variant.
    function asyncLoadFakeExperimentData(rootPath, experimentNames) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            return __generator(this, function (_a) {
                if (experimentNames.length > 0) {
                    promises = experimentNames.map(function (experimentNameAndVariant, idx, arr) {
                        var _a = experimentNameAndVariant.split('.'), experimentName = _a[0], experimentVariant = _a[1];
                        var filePath = rootPath + "/" + experimentNameAndVariant + ".json";
                        var response = fetchFile(filePath).then(function (experimentStr) {
                            var experimentData = JSON.parse(experimentStr);
                            if (!experimentOverrides) {
                                experimentOverrides = {};
                            }
                            // fix up all keys
                            // experimentData = fix_up_experiment_data(experimentData);
                            experimentOverrides[experimentName] = experimentData;
                        }).catch(function (fail) {
                            // tslint:disable-next-line:no-console
                            console.log('local experiment not found: ' + filePath);
                            return Promise.resolve(null);
                        });
                        return response;
                    });
                    return [2 /*return*/, Promise.all(promises)];
                }
                return [2 /*return*/];
            });
        });
    }
    exports.asyncLoadFakeExperimentData = asyncLoadFakeExperimentData;
    function fetchOptimizeAssignments(names, attributes) {
        var experiments;
        environment = environment || 'production';
        if (typeof names !== 'object' || !names.length) {
            names = [names];
        }
        // The real fetch list after we check our overrides.
        // If we have overrides for everything then we won't fetch anything from eos
        var realFetchList = [];
        for (var n = 0, nc = names.length; n < nc; n++) {
            var name = names[n];
            if (!experimentOverrides[name]) {
                realFetchList.push(name);
            }
        }
        if (!realFetchList.length) {
            // just resolve with local experiment overrides
            experiments = {};
            for (var n = 0, nc = names.length; n < nc; n++) {
                var name = names[n];
                experiments[name] = experimentOverrides[name];
                exports.Experiments.fire(name, experiments[name]);
            }
            return Promise.resolve(experiments);
        }
        else {
            // need to fetch from eos
            experiments = realFetchList.map(function (expName) {
                return {
                    experiment: expName
                };
            });
            attributes = attributes || {};
            return new Promise(function (resolve, reject) {
                var accountPromise = ZyngaAccount.Event.last(ZyngaAccount.Events.ACCOUNT_DETAILS);
                var appIdPromise = Zynga.Event.last(Zynga.Events.APP_ID);
                var clientIdPromise = ZyngaAnalytics.Event.last(ZyngaAnalytics.Events.CLIENT_ID);
                Promise.all([accountPromise, appIdPromise, clientIdPromise]).then(function (results) {
                    var anonAccountDetails = results[0] || {};
                    var appId = results[1];
                    var clientId = results[2];
                    ZyngaNet.api('POST', '/optimize/v3/assignments', {
                        useToken: anonAccountDetails.token,
                        body: {
                            appId: appId,
                            clientId: clientId,
                            zid: anonAccountDetails.zid,
                            environment: environment,
                            assignments: experiments,
                            attributes: attributes
                        }
                    }).then(function (response) {
                        var body = response.body || {};
                        var data = body && body.data;
                        var experiment;
                        var expName;
                        var varName;
                        var varValue;
                        var returnedExperiments = {};
                        var expCount = data && data.length || 0;
                        var i;
                        if (response.xhr.status === 200) {
                            // fill returned array with known overrides
                            for (var eo = 0, ec = names.length; eo < ec; eo++) {
                                expName = names[eo];
                                if (experimentOverrides[expName]) {
                                    returnedExperiments[expName] = experimentOverrides[expName];
                                }
                            }
                            for (i = 0; i < expCount; i++) {
                                experiment = data[i];
                                expName = experiment.experiment;
                                // do not fill with values that are already overriden
                                if (!experimentOverrides[expName]) {
                                    if (!experiment.error) {
                                        // So long as there were not errors add it to the list
                                        returnedExperiments[expName] = experiment;
                                    }
                                    if (experiment.variables) {
                                        for (varName in experiment.variables) {
                                            if (experiment.variables.hasOwnProperty(varName)) {
                                                varValue = experiment.variables[varName];
                                                // Optimize send sends JSON encoded as a string which is dumb.
                                                // Do some basic detection to see if it look like it might be an object or array
                                                if (typeof varValue === 'string' && (varValue.indexOf('{') === 0 || varValue.indexOf('[') === 0)) {
                                                    try {
                                                        experiment.variables[varName] = JSON.parse(varValue);
                                                        // tslint:disable-next-line:no-empty
                                                    }
                                                    catch (e) { }
                                                }
                                            }
                                        }
                                    }
                                }
                                // Fire experiment specific event
                                exports.Experiments.fire(expName, experiment);
                            }
                            resolve(returnedExperiments);
                        }
                        else {
                            reject({
                                error: new Error('Assignmen call failed'),
                                xhr: response.xhr
                            });
                        }
                    }, reject);
                });
            });
        }
    }
    exports.fetchOptimizeAssignments = fetchOptimizeAssignments;
});



define("ZyngaProfile", ["require", "exports", "Zynga", "ZyngaAccount", "ZyngaCore", "ZyngaInstant", "ZyngaNet"], function (require, exports, Zynga, ZyngaAccount, ZyngaCore, ZyngaInstant, ZyngaNet) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Event = new ZyngaCore.EventMixin();
    exports.Events = {
        PROFILE_AUTOUPLOAD: 'Profile.autoUpload' // Process for autouploading the profile has completed.
    };
    exports.ERRORS = {
        INPUT_ERROR: 'PROFILE_INPUT_ERROR',
        SERVER_NOT_FOUND: 'PROFILE_NOT_FOUND',
        SERVER_CAS: 'PROFILE_SERVER_CAS',
        SERVER_UNKNOWN: 'PROFILE_SERVER_UNKNOWN',
        UNKNOWN: 'PROFILE_UNKNOWN' // Encountered a general error
    };
    // cahced profile vars for managing profile data
    exports.lastProfileDataCache = {};
    exports.lastProfileDataCas = 0;
    // for simplicity and code minification
    function isUndef(x) {
        return typeof x === 'undefined';
    }
    function genProfileError(code, message, details) {
        return {
            code: code || exports.ERRORS.UNKNOWN,
            message: message || 'Unknown',
            details: details || {}
        };
    }
    function profileCall(method, path, params, options) {
        return new Promise(function (resolve, reject) {
            var queryParams = [];
            var paramName;
            var paramValue;
            options = options || {};
            params = params || {};
            Promise.all([
                Zynga.Event.last(Zynga.Events.APP_ID),
                ZyngaAccount.Event.last(ZyngaAccount.Events.ACCOUNT_DETAILS)
            ]).then(function (results) {
                var appId = results[0];
                var accountDetails = results[1];
                // as of v1.1, call requires this.
                if (params.use_zynga_player_id && !params.zynga_player_id) {
                    delete params.use_zynga_player_id;
                    params.zynga_player_id = accountDetails.playerId;
                }
                for (paramName in params) {
                    paramValue = params[paramName];
                    // encode and optionally turn arrays into comma separated list
                    paramValue = Array.isArray(paramValue) ? paramValue.map(encodeURI).join(',') : encodeURI(paramValue);
                    queryParams.push(paramName + '=' + paramValue);
                }
                var queryString = queryParams.length > 0 ? ('?' + queryParams.join('&')) : '';
                if (Zynga.getApiURLBase().indexOf('localhost') > 0) {
                    var headers = options.headers = options.headers || {};
                    headers['App-Id'] = appId;
                    headers['Player-Id'] = accountDetails.playerId;
                    headers['Zid'] = accountDetails.zid;
                }
                options.useToken = accountDetails.token;
                ZyngaNet.api(method, Zynga.getApiURLBase() + path + queryString, options).then(resolve, reject);
            });
        });
    }
    exports.profileCall = profileCall;
    function getProfileData(ids, isZyngaIds, fields, maxCacheAge) {
        var path = isZyngaIds ? '/fbig-mapping/zynga_player_ids' : '/fbig-mapping/fbig_player_ids';
        fields = fields || [
            'fbig_player_id',
            'zynga_player_id',
            'display_name',
            'display_picture_url',
            'profile_data',
            'profile_data_cas'
        ];
        // TODO: Cache mapping, name and pic.
        //       If profile_data is not asked for AND all users
        //       can be satisfied from cache then skip talking to the server
        //       #futureoptimization
        if (!Array.isArray(ids)) {
            return Promise.reject(genProfileError(exports.ERRORS.INPUT_ERROR, '\'ids\' must be an array'));
        }
        if (!Array.isArray(fields)) {
            return Promise.reject(genProfileError(exports.ERRORS.INPUT_ERROR, '\'fields\' must be an array'));
        }
        if (ids.length === 0) {
            // skip doing the request. this is a null op.
            return Promise.resolve({
                body: {
                    profiles: []
                },
                xhr: null,
                indexes: {
                    zynga: {},
                    facebook: {}
                },
            });
        }
        for (var k = 0; k < ids.length; ++k) {
            if (!ids[k]) {
                // tslint:disable-next-line:max-line-length
                Promise.reject(genProfileError(exports.ERRORS.INPUT_ERROR, "getProfileData: 'ids' index at " + k + " is invalid. " + JSON.stringify(ids)));
            }
        }
        return profileCall('GET', path, { ids: ids, fields: fields })
            .then(function (profileResponse) {
            var results = profileResponse;
            var i;
            var profile;
            var currentId;
            var xhr = results.xhr;
            var statusCode = xhr.status;
            var indexes = {
                zynga: {},
                facebook: {}
            };
            var currentIndex = isZyngaIds ? indexes.zynga : indexes.facebook;
            if ((statusCode >= 200 && statusCode < 300) || statusCode === 304) {
                for (i = 0; i < results.body.profiles.length; i++) {
                    profile = results.body.profiles[i];
                    if (profile.fbig_player_id) {
                        indexes.facebook[profile.fbig_player_id + ''] = profile;
                    }
                    if (profile.zynga_player_id) {
                        indexes.zynga[profile.zynga_player_id + ''] = profile;
                    }
                }
                results.indexes = indexes;
                for (i = 0; i < ids.length; i++) {
                    currentId = ids[i] + '';
                    currentIndex[currentId] = currentIndex[currentId] || false;
                }
                return results;
            }
            else {
                throw genProfileError(exports.ERRORS.SERVER_UNKNOWN, 'Server Error.', results);
            }
        });
    }
    function getProfilesByZyngaIdAsync(ids, fields, maxCacheAge) {
        return getProfileData(ids, true, fields, maxCacheAge);
    }
    exports.getProfilesByZyngaIdAsync = getProfilesByZyngaIdAsync;
    function getProfilesByFacebookIdAsync(ids, fields, maxCacheAge) {
        return getProfileData(ids, false, fields, maxCacheAge);
    }
    exports.getProfilesByFacebookIdAsync = getProfilesByFacebookIdAsync;
    function getConnectedPlayerProfilesAsync(fields, maxCacheAge) {
        return new Promise(function (resolve, reject) {
            ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT).then(function () {
                ZyngaInstant.player.getConnectedPlayersAsync().then(function (players) {
                    var fbigIds = [];
                    for (var _i = 0, players_1 = players; _i < players_1.length; _i++) {
                        var player = players_1[_i];
                        fbigIds.push(player.getID());
                    }
                    // Fetch profile data
                    getProfilesByFacebookIdAsync(fbigIds, fields, maxCacheAge).then(resolve, reject);
                }, reject);
            });
        });
    }
    exports.getConnectedPlayerProfilesAsync = getConnectedPlayerProfilesAsync;
    // tslint:disable-next-line:max-line-length
    function getProfileDataAsync(fields) {
        fields = fields || ['profile_data', 'profile_data_cas'];
        return new Promise(function (resolve, reject) {
            profileCall('GET', '/profile', { fields: fields, use_zynga_player_id: true })
                .then(function (results) {
                var xhr = results.xhr;
                var statusCode = xhr.status;
                if ((statusCode >= 200 && statusCode < 300) || statusCode === 304) {
                    exports.lastProfileDataCas = results.body.profile.profile_data_cas;
                    exports.lastProfileDataCache = results.body.profile.profile_data || {};
                    resolve(results); // Successful
                }
                else if (statusCode === 404) {
                    reject(genProfileError(exports.ERRORS.SERVER_NOT_FOUND, 'Profile data not found.  User may not have been created yet', results));
                }
                else {
                    reject(genProfileError(exports.ERRORS.SERVER_UNKNOWN, 'Server Error.', results));
                }
            }, reject);
        });
    }
    exports.getProfileDataAsync = getProfileDataAsync;
    // tslint:disable-next-line:max-line-length
    function updateProfileDataAsync(data, dataCAS, options) {
        return new Promise(function (resolve, reject) {
            var body = {
                profile_data: data,
                profile_data_cas: dataCAS
            };
            options = options || {};
            if (!dataCAS) {
                delete body.profile_data_cas;
            }
            options.body = body;
            profileCall('PUT', '/profile', { use_zynga_player_id: true }, options)
                .then(function (results) {
                var xhr = results.xhr;
                var statusCode = xhr.status;
                if ((statusCode >= 200 && statusCode < 300) || statusCode === 304) {
                    exports.lastProfileDataCache = data || {};
                    exports.lastProfileDataCas = results.body.profile_data_cas;
                    resolve(results); // Successful
                }
                else if (statusCode === 409) {
                    reject(genProfileError(exports.ERRORS.SERVER_CAS, 'CAS Mismatch.  Fetch again and re-apply changes', results));
                }
                else {
                    reject(genProfileError(exports.ERRORS.SERVER_UNKNOWN, 'Server Error.', results));
                }
            }, reject);
        });
    }
    exports.updateProfileDataAsync = updateProfileDataAsync;
    function updateMediaUrlAsync(url) {
        return new Promise(function (resolve, reject) {
            ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_INITIALIZED, function () {
                var queryParams = {
                    fbig_player_id: ZyngaInstant.player.getID(),
                    use_zynga_player_id: true,
                };
                profileCall('PUT', '/profile', queryParams, { body: { profile_media_url: url } })
                    .then(function (results) {
                    var xhr = results.xhr;
                    var statusCode = xhr.status;
                    if ((statusCode >= 200 && statusCode < 300) || statusCode === 304) {
                        resolve(results); // Successful
                    }
                    else {
                        reject(genProfileError(exports.ERRORS.SERVER_UNKNOWN, 'Server Error.', results));
                    }
                }, reject);
            });
        });
    }
    exports.updateMediaUrlAsync = updateMediaUrlAsync;
    ZyngaInstant.Event.last(ZyngaInstant.Events.INSTANT_FB_TOS_ACCEPT, function () {
        ZyngaInstant.player.getConnectedPlayersAsync().then(function (connectedPlayers) {
            var i;
            var cachedProfileKey = '__profileCache_' + ZyngaInstant.player.getID();
            var cachedProfileString = window.localStorage.getItem(cachedProfileKey);
            var cachedProfileData;
            var profileData = {
                display_name: ZyngaInstant.player.getName(),
                display_picture_url: ZyngaInstant.player.getPhoto(),
                profile_connected_fbig_player_ids: []
            };
            var queryParams = {
                fbig_player_id: ZyngaInstant.player.getID(),
                use_zynga_player_id: true,
            };
            var wasCached = false;
            // Get connected friend IDs into a sorted array
            if (Array.isArray(connectedPlayers)) {
                for (i = 0; i < connectedPlayers.length; i++) {
                    profileData.profile_connected_fbig_player_ids.push(connectedPlayers[i].getID() + '');
                }
            }
            profileData.profile_connected_fbig_player_ids.sort();
            // Try to un-serialize the cached (last written) friends list
            try {
                cachedProfileData = JSON.parse(cachedProfileString);
                wasCached = !!cachedProfileData;
            }
            catch (e) {
                // Something seriously wrong with the cache, use the default
            }
            // Set default value for cached profile data if we didn't find anything or failed to parse it
            cachedProfileData = cachedProfileData || {
                display_name: '',
                display_picture_url: '',
                profile_connected_fbig_player_ids: []
            };
            if (profileData.display_name !== cachedProfileData.display_name ||
                profileData.display_picture_url !== cachedProfileData.display_picture_url ||
                // tslint:disable-next-line:max-line-length
                JSON.stringify(profileData.profile_connected_fbig_player_ids) !== JSON.stringify(cachedProfileData.profile_connected_fbig_player_ids)) {
                profileCall('PUT', '/fbig-mapping', queryParams, { body: profileData }).then(function (results) {
                    if (results && results.xhr && (results.xhr.status === 200 || results.xhr.status === 201)) {
                        window.localStorage.setItem(cachedProfileKey, JSON.stringify(profileData));
                        // Successful write of changed data
                        exports.Event.fire(exports.Events.PROFILE_AUTOUPLOAD, { cachedData: profileData, hasChanged: true });
                    }
                    else {
                        // Unsuccessful write.  If there was cached data return it as It is better than
                        // nonthing and signifies data was written at some point
                        exports.Event.fire(exports.Events.PROFILE_AUTOUPLOAD, {
                            cachedData: wasCached && cachedProfileData,
                            hasChanged: true
                        });
                        // TODO: ztrack issue
                    }
                }, function () {
                    // Rejections
                    exports.Event.fire(exports.Events.PROFILE_AUTOUPLOAD, {
                        cachedData: wasCached && cachedProfileData,
                        hasChanged: true
                    });
                    // TODO: Also track problem
                });
            }
            else {
                exports.Event.fire(exports.Events.PROFILE_AUTOUPLOAD, { cachedData: profileData, hasChanged: false });
            }
        });
    });
});



define("ZyngaRoundsManager", ["require", "exports", "ZyngaCore", "ZyngaNet", "ZyngaProfile"], function (require, exports, ZyngaCore, ZyngaNet, ZyngaProfile) {
    // tslint:disable-next-line:comment-format
    ///<amd-module name="ZyngaRoundsManager"/>
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    var win = window;
    var doc = document;
    var eventDOMReady = '_RoundsManager.DOMRdy'; // Fired when the DOM is ready
    var eventCSSNode = '_RoundsManager.CSSNode'; // Fired when the CSS node is ready
    var eventRefreshHandler = '_RoundsManager.RefreshHandler'; // Fired when a refresh handler is registered
    var templatesNode; // Node that contains template information
    var parentNode; // Parent node for rounds manager
    var css = {}; // Current CSS object.  Parsed by ZyngaCore.parseCSS function into proper CSS.
    exports.Event = new ZyngaCore.EventMixin();
    exports.Events = {
        CSS_CHANGE: 'RoundsManager.CSSChange',
        TEMPLATES_CHANGE: 'RoundsManager.TemplatesChange',
        PARENT_NODE_CHANGE: 'RoundsManager.ParentNodeChange',
        CTA_SELECTED: 'RoundsManager.CTASelected',
        CONTENT_CHANGE: 'RoundsManager.ContentChange'
    };
    exports.TEMPLATE_TYPES = {
        DOM_NODE: 'domNode',
        DOM_NODE_ID: 'domNodeId',
        HTML_STRING: 'htmlString',
        HTML_URL: 'htmlUrl'
    };
    exports.ERRORS = {
        UNKNOWN: 'ROUNDS_MANAGER_UNKNOWN',
        INPUT: 'ROUNDS_MANAGER_INPUT',
        ALREADY_REFRESHING: 'ROUNDS_MANAGER_ALREADY_REFRESHING'
    };
    // Array specific forEach function
    function arrayForEach(arr, fn, scope) {
        var len = arr.length;
        var i;
        for (i = 0; i < len; i++) {
            fn.call(scope, arr[i], i);
        }
    }
    function genRoundsManagerError(code, message, details) {
        return {
            code: code || exports.ERRORS.UNKNOWN,
            message: message || 'Unknown',
            details: details || {}
        };
    }
    function genStructuredData(flatData) {
        return new Promise(function (resolve) {
            resolve(flatData);
        });
    }
    // Generate a classList polyfil-like (does not modify prototype) object for browser that do not support.
    function classListRegExp(name) {
        return new RegExp('(^| )' + name + '( |$)');
    }
    function genClassList(element) {
        return element.classList || {
            add: function () {
                arrayForEach(arguments, function (name) {
                    if (!this.contains(name)) {
                        element.className += element.className.length > 0 ? ' ' + name : name;
                    }
                }, this);
            },
            remove: function () {
                arrayForEach(arguments, function (name) {
                    element.className = element.className.replace(classListRegExp(name), '');
                }, this);
            },
            toggle: function (name, toggle) {
                if (toggle === true) {
                    return this.add(name);
                }
                if (toggle === false) {
                    return this.remove(name);
                }
                return this.contains(name) ? (this.remove(name), false) : (this.add(name), true);
            },
            contains: function (name) {
                return classListRegExp(name).test(element.className);
            }
        };
    }
    var splitOnWhitespace = /\S+/g;
    function cssClassesToArray(arrayOrString) {
        var retVal = [];
        if (Array.isArray(arrayOrString)) {
            retVal = arrayOrString;
        }
        else if (typeof arrayOrString === 'string') {
            retVal = arrayOrString.match(splitOnWhitespace) || [];
        }
        return retVal;
    }
    // Generates a function that allows the easy clone child nodes
    // of a specified parent.  Optionally removes the 'id' attribute
    // from the cloned node since it was only there so we could find
    // the original node.
    // tslint:disable-next-line:no-shadowed-variable
    function genCloneTemplateNode(templatesNode, removeId) {
        // Account for <template> nodes.  For these we need to referenct the #document-fragment accessable as .content
        templatesNode = templatesNode && templatesNode.content || templatesNode;
        return function cloneTemplateNodeById(id) {
            var origNode = templatesNode.querySelector('#' + id);
            var clonedNode = origNode && origNode.cloneNode(true);
            if (clonedNode && removeId) {
                clonedNode.removeAttribute('id');
            }
            return clonedNode;
        };
    }
    function createSequentialNodes(currentNode, innerHTMLs, applyFunc) {
        var lastNode;
        var classList;
        var origCopy = currentNode.cloneNode(true);
        // make sure second argumentn is an array
        if (innerHTMLs === false || innerHTMLs === undefined || (Array.isArray(innerHTMLs) && innerHTMLs.length === 0)) {
            // No actual elements
            currentNode.parentNode.removeChild(currentNode);
            return;
        }
        // Make sure second argument is an array
        innerHTMLs = Array.isArray(innerHTMLs) ? innerHTMLs : [innerHTMLs];
        arrayForEach(innerHTMLs, function (innerHTML, i) {
            classList = genClassList(currentNode);
            if (typeof applyFunc === 'function') {
                applyFunc(currentNode, innerHTML, classList);
            }
            else {
                currentNode.innerHTML = innerHTML;
            }
            classList.add('zrm_' + (i + 1));
            if (i > 0) {
                // Equiv to jQuery.insertAfter.  If lastNode.nextSibling is null
                // then this does the same as parentNode.appendChild  This is not
                // intuitive but it is how it works.
                lastNode.parentNode.insertBefore(currentNode, lastNode.nextSibling);
            }
            lastNode = currentNode;
            currentNode = origCopy.cloneNode(true);
        });
    }
    var cachedImages = {};
    function preLoadImage(url, callback) {
        var image;
        if (cachedImages[url]) {
            setTimeout(callback, 0);
        }
        else {
            image = new Image();
            image.crossOrigin = 'anonymous';
            image.onload = function () {
                cachedImages[url] = true; // So we only ever do this once
                callback();
            };
            image.src = url;
        }
    }
    // Object to hold information about the element where a touch/click started
    var ctas = [];
    var touchStartData = {
        target: false,
        top: false,
        left: false,
        x: -1,
        y: -1
    };
    // touchstart / mousedown handler
    function touchStartHandler(e) {
        var pos = e.type === 'touchstart' ? e.touches[0] : e;
        var target = e.target;
        var boundingRect = target.getBoundingClientRect();
        touchStartData.target = target;
        touchStartData.top = boundingRect.top;
        touchStartData.left = boundingRect.left;
        touchStartData.x = Math.round(pos.clientX);
        touchStartData.y = Math.round(pos.clientY);
    }
    // touchmove or mousemove handler
    function touchMoveHandler() {
        // Any move means not a click
        touchStartData.target = false;
        touchStartData.top = false;
        touchStartData.left = false;
        touchStartData.x = -1;
        touchStartData.y = -1;
    }
    function touchEndHandler(e) {
        var target = e.target;
        var boundingRect = e.target.getBoundingClientRect();
        var pos = e.type === 'touchend' ? e.changedTouches[0] : e;
        var newTop = boundingRect.top;
        var newLeft = boundingRect.left;
        var newX = Math.round(pos.clientX);
        var newY = Math.round(pos.clientY);
        var ctaIndex = parseInt(target.getAttribute('data-ctaIndex') || -1, 10);
        var cta = ctas[ctaIndex] || {};
        var retVal = true;
        if (touchStartData.top === newTop &&
            touchStartData.left === newLeft &&
            touchStartData.x === newX &&
            touchStartData.y === newY &&
            touchStartData.target === target &&
            ctaIndex >= 0) {
            // Had a start AND did not scroll X or Y AND did not move position since start.  Must be a valid click/touch
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            if (e.preventDefault && e.cancelable) {
                e.preventDefault();
            }
            exports.Event.fire(exports.Events.CTA_SELECTED, cta.data);
            if (cta.callback) {
                cta.callback(cta.data);
            }
            retVal = false;
        }
        return retVal;
    }
    /*
    function recursiveNodeRemove(node) {
        if (node) {
            while (node.hasChildNodes()) {
                recursiveNodeRemove(node.lastChild);
            }
            node.parentNode.removeChild(node);
        }
    }
    */
    var refreshing = false;
    var cachedFriendsData = false;
    function refreshUI(data) {
        return new Promise(function (resolve, reject) {
            var promiseParentNode = exports.Event.last(exports.Events.PARENT_NODE_CHANGE);
            var promiseTemplateNode = exports.Event.last(exports.Events.TEMPLATES_CHANGE);
            var promiseFormatData = genStructuredData(data);
            var promiseDomReady = exports.Event.last(eventDOMReady);
            var promiseFriendsPlaying = Promise.resolve({}); // By default don't add friends
            if (refreshing) {
                reject(genRoundsManagerError(exports.ERRORS.ALREADY_REFRESHING, 'Please wait until current refresh is complete'));
                return;
            }
            refreshing = true;
            ctas = [];
            if (data.addFriendsPlaying !== false) {
                // Caller didn't tell us not to add friends playing so actually get them
                // tslint:disable-next-line:no-shadowed-variable
                promiseFriendsPlaying = new Promise(function (resolve, reject) {
                    if (cachedFriendsData) {
                        resolve(cachedFriendsData);
                    }
                    else {
                        ZyngaProfile.getConnectedPlayerProfilesAsync([
                            'fbig_player_id',
                            'zynga_player_id',
                            'display_name',
                            'display_picture_url'
                        ]).then(function (profileData) {
                            var defaultResult = [];
                            cachedFriendsData = profileData && profileData.indexes && profileData.indexes.facebook || defaultResult;
                            resolve(cachedFriendsData);
                        }, reject);
                    }
                });
            }
            Promise.all([promiseParentNode,
                promiseTemplateNode,
                promiseFormatData,
                promiseFriendsPlaying,
                promiseDomReady
            ]).then(function (results) {
                // tslint:disable-next-line:no-shadowed-variable
                var parentNode = results[0]; // Rounds Manager parent node
                var templateNode = results[1]; // Template node
                // tslint:disable-next-line:no-shadowed-variable
                var data = results[2]; // Structured data
                var friendsData = results[3]; // Friends playing data
                var tClone = genCloneTemplateNode(templateNode, true); // Template node cloning function. Removes ID attribute.
                var nMain = tClone('zrm_main'); // Main node
                var nGroups = nMain.querySelector('#zrm_groups'); // Groups parent node
                var nGroup; // Reused for each Group node
                var nRounds;
                var nRound;
                var nPlayers;
                var groupIdx = {};
                var classListObj;
                var group;
                var rounds;
                var round;
                var groupId;
                var groupData;
                var fbigId;
                var friend;
                var friendData;
                // Add friend records if any were fetched
                for (fbigId in friendsData) {
                    friend = friendsData[fbigId];
                    if (friend && friend.display_name && friend.display_picture_url) {
                        friendData = {
                            groupId: 'friendsplaying',
                            players: [
                                {
                                    labels: [
                                        {
                                            label: friend.display_name,
                                            cssClasses: ''
                                        }
                                    ],
                                    imgURL: friend.display_picture_url
                                }
                            ],
                            CTAs: [
                                {
                                    label: false,
                                    cssClasses: 'zrm_clickableNoCTA',
                                    data: {
                                        FBIGPlayerId: fbigId
                                    }
                                }
                            ],
                            labels: []
                        };
                        if (friend.zynga_player_id) {
                            friendData.CTAs[0].data.ZyngaPlayerId = friend.zynga_player_id;
                        }
                        data.rounds.push(friendData);
                    }
                }
                for (groupId in data.groups) {
                    groupIdx[groupId] = {
                        group: data.groups[groupId],
                        rounds: []
                    };
                }
                // for instead of arrayForEach so we can break out on error
                // tslint:disable-next-line:prefer-for-of
                for (var i = 0; i < data.rounds.length; i++) {
                    round = data.rounds[i];
                    group = groupIdx[round.groupId];
                    if (group) {
                        group.rounds.push(round);
                    }
                    else {
                        reject(genRoundsManagerError(exports.ERRORS.INPUT, 'A round\'s groupId was not found in the groups object', {
                            groupId: round.groupId,
                            data: data
                        }));
                        return;
                    }
                }
                for (groupId in groupIdx) {
                    nGroup = tClone('zrm_group'); // New group node
                    groupData = groupIdx[groupId].group; // Group data
                    rounds = groupIdx[groupId].rounds; // Rounds data
                    // Set group name
                    (nGroup.querySelector('.zrm_group_name') || {}).innerHTML = groupData.label || '';
                    // Add any group CSS classes if provided.  TODO: this is ugly, refactor
                    classListObj = genClassList(nGroup);
                    classListObj.add.apply(classListObj, cssClassesToArray(groupData.cssClasses || []));
                    // Append to groups node but only if there are rounds
                    if (rounds.length > 0) {
                        nGroups.appendChild(nGroup);
                    }
                    nRounds = nGroup.querySelector('.zrm_group_items');
                    // Add each round
                    // tslint:disable-next-line:no-shadowed-variable
                    arrayForEach(rounds, function (round) {
                        nRound = tClone('zrm_group_item');
                        // Add player "cards"
                        nPlayers = nRound.querySelector('.zrm_group_item_cards');
                        arrayForEach(round.players, function (player) {
                            var nPlayer = tClone('zrm_group_item_card');
                            var nImage = nPlayer.querySelector('.zrm_group_item_card_picture');
                            var classList = genClassList(nImage);
                            classList.add('zrm_imageNone');
                            if (player.imgURL) {
                                preLoadImage(player.imgURL, function () {
                                    classList.remove('zrm_imageLoading');
                                    // Set the now loaded/cached background image
                                    nImage.style['background-image'] = 'url(\'' + player.imgURL + '\')';
                                });
                                classList.remove('zrm_imageNone');
                                classList.add('zrm_imageLoading');
                            }
                            // Create player labels
                            // tslint:disable-next-line:max-line-length
                            // tslint:disable-next-line:no-shadowed-variable
                            createSequentialNodes(nPlayer.querySelector('.zrm_group_item_card_label'), player.labels, function (node, label, classList) {
                                var cssClasses = label.cssClasses || [];
                                if (typeof cssClasses === 'string') {
                                    cssClasses = cssClasses.split(' ');
                                }
                                classList.add.apply(classList, cssClasses);
                                if (label.label) {
                                    node.innerHTML = label.label;
                                }
                            });
                            nPlayers.appendChild(nPlayer);
                        });
                        // Create round labels
                        createSequentialNodes(nRound.querySelector('.zrm_group_item_label'), round.labels);
                        // Create round CTAs
                        createSequentialNodes(nRound.querySelector('.zrm_group_item_cta'), round.CTAs, function (node, cta, classList) {
                            var cssClasses = cta.cssClasses || [];
                            var ctaData = {
                                data: cta.data
                            };
                            if (typeof cta.callback === 'function') {
                                ctaData.callback = cta.callback;
                            }
                            ctas.push(ctaData);
                            node.setAttribute('data-ctaIndex', (ctas.length - 1));
                            if (typeof cssClasses === 'string') {
                                cssClasses = cssClasses.split(' ');
                            }
                            if (cssClasses.length > 0) {
                                classList.add.apply(classList, cssClasses);
                            }
                            if (cta.label) {
                                node.innerHTML = cta.label;
                            }
                        });
                        nRounds.appendChild(nRound);
                    });
                }
                /*
                // Should not be needed, .innerHTML = '' below shold do it
                // This is just ANOTHER hack to try to decrease the likelyhood of the iOS OOM issue happening
                if (parentNode.hasChildNodes()) {
                    recursiveNodeRemove(parentNode.lastChild);
                }
                */
                parentNode.innerHTML = ''; // Wipe out existing content
                parentNode.appendChild(nMain); // Add new content
                exports.Event.fire(exports.Events.CONTENT_CHANGE, nMain);
                // Make sure CTA clicks only happen on clicks
                nMain.addEventListener('mousedown', touchStartHandler);
                nMain.addEventListener('touchstart', touchStartHandler);
                nMain.addEventListener('mousemove', touchMoveHandler, false);
                nMain.addEventListener('touchmove', touchMoveHandler, false);
                nMain.addEventListener('mouseup', touchEndHandler, false);
                nMain.addEventListener('touchend', touchEndHandler, false);
                // disable overscroll
                nMain.addEventListener('touchstart', function () {
                    var top = nMain.scrollTop;
                    var totalScroll = nMain.scrollHeight;
                    var currentScroll = top + nMain.offsetHeight;
                    if (top === 0) {
                        nMain.scrollTop = 1;
                    }
                    else if (currentScroll === totalScroll) {
                        nMain.scrollTop = top - 1;
                    }
                });
                refreshing = false;
                resolve();
            }, reject);
        });
    }
    function setTemplates(templateData, templateType) {
        var oldTemplatesNode = templatesNode;
        templateType = templateType || exports.TEMPLATE_TYPES.HTML_STRING;
        return new Promise(function (resolve, reject) {
            function checkForChanges() {
                if (templatesNode !== oldTemplatesNode) {
                    exports.Event.fire(exports.Events.TEMPLATES_CHANGE, templatesNode);
                }
            }
            function fromString(str) {
                var node = doc.createElement('template');
                node.innerHTML = str;
                // Note: for template elements you need the .content documentFragment
                if ((node.content || node).childElementCount > 0 === false) {
                    node = false;
                }
                return node;
            }
            switch (templateType) {
                case exports.TEMPLATE_TYPES.DOM_NODE:
                    templatesNode = templateData;
                    break;
                case exports.TEMPLATE_TYPES.DOM_NODE_ID:
                    templatesNode = doc.getElementById(templateData);
                    if (!templatesNode) {
                        // Not found, roll back
                        templatesNode = oldTemplatesNode;
                        reject();
                        return;
                    }
                    break;
                case exports.TEMPLATE_TYPES.HTML_STRING:
                    templatesNode = fromString(templateData);
                    if (!templatesNode) {
                        // Bad string, roll back
                        templatesNode = oldTemplatesNode;
                        reject();
                        return;
                    }
                    break;
                case exports.TEMPLATE_TYPES.HTML_URL:
                    ZyngaNet.api('GET', templateData, { noAuth: true, noAPI: true }).then(function (results) {
                        var xhr = results.xhr;
                        var body = results.body;
                        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
                            templatesNode = fromString(body);
                            if (!templatesNode) {
                                // Bad string, roll back
                                templatesNode = oldTemplatesNode;
                                reject();
                                return;
                            }
                            else {
                                // Success
                                checkForChanges();
                            }
                        }
                        else {
                            reject(results);
                            return;
                        }
                    }, reject);
                    return; // important
                default:
                    reject();
                    return;
            }
            checkForChanges();
        });
    }
    exports.setTemplates = setTemplates;
    function setParent(nodeOrId) {
        var oldParentNode = parentNode;
        if (typeof nodeOrId === 'object' && nodeOrId.nodeType > 0) {
            parentNode = nodeOrId;
        }
        else if (typeof nodeOrId === 'string') {
            parentNode = doc.getElementById(nodeOrId);
            if (!parentNode) {
                parentNode = oldParentNode;
                throw new Error('Could not find element with id "' + nodeOrId + '"');
            }
        }
        else {
            throw new TypeError('setParent argument must be of type "string" (element id) or an actual DOM node');
        }
        if (parentNode !== oldParentNode) {
            exports.Event.fire(exports.Events.PARENT_NODE_CHANGE, parentNode);
        }
    }
    exports.setParent = setParent;
    function setCSS(cssObject) {
        var cssStr = JSON.stringify(css);
        var newCssStr;
        if (typeof cssObject !== 'object') {
            throw new TypeError('setCSS requires an object');
        }
        newCssStr = JSON.stringify(cssObject);
        if (cssStr !== newCssStr) {
            css = JSON.parse(newCssStr); // stringify -> parse does a deep clone.  Now it's fully ours
            exports.Event.fire(exports.Events.CSS_CHANGE, css);
        }
    }
    exports.setCSS = setCSS;
    function setRefreshHandler(handler) {
        exports.Event.fire(eventRefreshHandler, handler);
    }
    exports.setRefreshHandler = setRefreshHandler;
    function refresh(userInitiated) {
        return new Promise(function (resolve, reject) {
            // TODO: add refresh class
            exports.Event.last(eventRefreshHandler) // Get the last registered refresh handler or wait for it to be registered
                .then(function (dataRefresh) {
                return dataRefresh(userInitiated); // Call the refresh data function
            })
                .then(refreshUI) // Send the data to th refreshUI function
                .then(function () {
                // TODO: remove refresh class
                resolve();
            })
                .catch(function (error) {
                // TODO: remove refresh class
                reject(error);
            });
        });
    }
    exports.refresh = refresh;
    // Create style element once the DOM is ready
    exports.Event.once(eventDOMReady, function () {
        var head = doc.head || doc.getElementsByTagName('head')[0];
        var styleNode = doc.createElement('style');
        styleNode.type = 'text/css';
        head.appendChild(styleNode);
        exports.Event.fire(eventCSSNode, styleNode);
    }, true);
    // replace CSS node contents each time new CSS JSON appears
    exports.Event.on(exports.Events.CSS_CHANGE, function (newCSSObj) {
        var newCSSStr = ZyngaCore.parseCSS(newCSSObj);
        exports.Event.last(eventCSSNode, function (cssNode) {
            if (cssNode.styleSheet) {
                // Older version of IE
                cssNode.styleSheett.cssText = newCSSStr;
            }
            else if (typeof cssNode.textContent !== 'undefined') {
                cssNode.textContent = newCSSStr;
            }
            else {
                cssNode.innerText = newCSSStr;
            }
        });
    });
    // Dom operations should not happen until the DOM is actually ready.
    function checkDomRdy() {
        var readyState = doc.readyState;
        if (readyState === 'interactive' || readyState === 'complete') {
            // An image stuck loading, even a tracking pixel, can caue readyState 'complete'
            // to never fire.  This is why 'interactive' is good enough
            doc.removeEventListener('readystatechange', checkDomRdy);
            exports.Event.fire(eventDOMReady, true);
        }
    }
    doc.addEventListener('readystatechange', checkDomRdy);
    checkDomRdy();
});



define("ZyngaRoundsManagerCSS", ["require", "exports"], function (require, exports) {
    "use strict";
    // tslint:disable-next-line:comment-format
    ///<amd-module name="ZyngaRoundsManagerCSS"/>
    var defaultCSS = {
        '.zrm_main': {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            'font-size': '10px',
            overflow: 'scroll',
            'overflow-x': 'hidden',
            'overflow-y': 'scroll',
            'background-color': '#FFF',
            '-webkit-overflow-scrolling': 'touch'
        },
        '.zrm_main ::-webkit-scrollbar, .zrm_main::-webkit-scrollbar': {
            display: 'none',
        },
        '#zrm_chooseOpponent': {
            position: 'fixed',
            top: '0.6em',
            left: '50%',
            height: '2.5em',
            width: '90%',
            'border-radius': '0.7em',
            transform: 'translate3d(-50%, 0, 0)',
            'background-color': 'rgb(0, 118, 255)',
            'font-size': '4em',
            'line-height': '2em',
            'text-align': 'center',
            'font-weight': 'bold',
            color: '#FFF',
            '-moz-box-shadow': '0.3em 0.3em 0.4em -0.1em rgba(0,0,0,0.75)',
            '-webkit-box-shadow': '0.3em 0.3em 0.4em -0.1em rgba(0,0,0,0.75)',
            'box-shadow': '0.3em 0.3em 0.4em -0.1em rgba(0,0,0,0.75)',
            'z-index': 2
        },
        '#zrm_chooseOpponent:after': {
            content: '""',
            position: 'absolute',
            'z-index': -1,
            height: '75%',
            top: '0',
            left: '0',
            right: '0',
            bottom: '1.5em',
            'border-radius': 'inherit',
            'background-color': 'rgb(0, 131, 255)'
        },
        '.zrm_group:first-of-type > .zrm_group_name': {
            'padding-top': '5em',
            background: '#e6e6e6'
        },
        '.zrm_group_name': {
            background: [
                '#e6e6e6',
                '-moz-linear-gradient(top, #c0c0c0 0%, #e6e6e6 8%, #e6e6e6 96%, #e9e9e9 100%)',
                '-webkit-linear-gradient(top, #c0c0c0 0%,#e6e6e6 8%,#e6e6e6 96%,#e9e9e9 100%)',
                'linear-gradient(to bottom, #c0c0c0 0%,#e6e6e6 8%,#e6e6e6 96%,#e9e9e9 100%)' //  W3C, IE10+, FF16+, Chrome26+, Opera12+, Safari7+ */
            ],
            width: '100%',
            'font-size': '3em',
            padding: '0.3em',
            'font-weight': 'bold'
        },
        '.zrm_group_items': {
            'background-color': '#FFF',
            width: '100%',
            overflow: 'scroll',
            //'overflow-x': 'scroll',
            //'overflow-y': 'hidden',
            'white-space': 'nowrap',
            '-webkit-overflow-scrolling': 'touch'
        },
        '.zrm_group_item': {
            position: 'relative',
            display: 'inline-block',
            width: '43%',
            'margin-top': '1.5%',
            'margin-bottom': '1.5%'
        },
        '.zrm_group_item:first-of-type': {
            'margin-left': '1.5%'
        },
        '.zrm_group_item:last-of-type': {
            'margin-right': '1.5%'
        },
        '.zrm_group_item:before': {
            content: '""',
            width: '100%',
            'padding-top': '100%',
            display: 'block'
        },
        '.zrm_group.zrm_2across  .zrm_group_item': {
            width: '43%'
        },
        '.zrm_group.zrm_3across  .zrm_group_item': {
            width: '28%',
            'font-size': '0.8em'
        },
        '.zrm_group.zrm_4across  .zrm_group_item': {
            width: '22%',
            'font-size': '0.6em'
        },
        '.zrm_group_item > .zrm_group_item_content': {
            position: 'absolute',
            top: '2%',
            left: '2%',
            right: '2%',
            bottom: '2%',
            'border-radius': '5%',
            overflow: 'hidden',
            border: '0.15em solid rgba(0,0,0,0.5)',
            'box-sizing': 'border-box',
            /* hack to fix Chrome */
            '-webkit-mask-image': 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA5JREFUeNpiYGBgAAgwAAAEAAGbA+oJAAAAAElFTkSuQmCC)'
        },
        '.zrm_group_item_label': {
            display: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            'font-size': '3.5em',
            color: '#FFF',
            'background-color': 'rgba(0,0,0,0.5)',
            height: '2em',
            'line-height': '2em',
            'text-align': 'right',
            'padding-right': '0.5em',
            'font-weight': 600,
            'text-overflow': 'ellipsis'
        },
        '.zrm_group_item_label.zrm_1': {
            display: 'block'
        },
        '.zrm_group_item_cta': {
            display: 'none',
            position: 'absolute',
            right: '3%',
            bottom: '3%',
            'font-size': '3em',
            color: '#FFF',
            'background-color': '#FFF',
            height: '2.5em',
            'line-height': '2.5em',
            'text-align': 'center',
            'font-weight': 600,
            'border-radius': '0.6em',
            'padding-right': '1em',
            'padding-left': '1em',
            'z-index': 0,
            'box-shadow': '0.2em 0.2em 0.3em -0.1em rgba(0,0,0,0.85)'
        },
        '.zrm_group_item_cta.zrm_1': {
            display: 'block'
        },
        '.zrm_group_item_cta.zrm_2': {
            display: 'block'
        },
        '.zrm_group_item_cta:before': {
            content: '""',
            position: 'absolute',
            top: '0.25em',
            left: '0.25em',
            right: '0.3em',
            bottom: '0.3em',
            'background-color': 'red',
            'border-radius': '0.4em',
            'z-index': '-1',
            'box-shadow': '0.2em 0.2em 0.3em -0.1em rgba(0,0,0,0.4)'
        },
        '.zrm_group_item_cta.zrm_greenCTA:before': {
            'background-color': 'rgb(130, 213, 79)'
        },
        '.zrm_group_item_cta.zrm_blueCTA:before': {
            'background-color': 'rgb(32, 89, 195)'
        },
        '.zrm_group_item_cta.zrm_orangeCTA': {
            'background-color': 'rgba(0,0,0,0.7)',
            height: '2em',
            'line-height': '2em',
            color: 'rgb(255, 175, 28)',
            'padding-left': '0.5em',
            'padding-right': '0.5em',
            right: '4%',
            bottom: '4%'
        },
        '.zrm_group_item_cta.zrm_orangeCTA:before, .zrm_group_item_cta.zrm_clickableNoCTA:before': {
            display: 'none'
        },
        '.zrm_group_item_cta.zrm_clickableNoCTA': {
            'background-color': 'rgba(0,0,0,0)',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            height: '100%',
            width: '100%',
            padding: 0,
            margin: 0,
            'box-shadow': 'none',
            display: 'block'
        },
        '.zrm_friendsPlaying .zrm_group_item_cta:before': {
            display: 'none',
        },
        '.zrm_friendsPlaying .zrm_group_item_content': {
            border: 'none',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
        },
        '.zrm_friendsPlaying .zrm_group_item_card_picture': {
            top: '5%',
            left: '15%',
            right: '15%',
            bottom: '25%',
            'border-radius': '50%'
        },
        '.zrm_friendsPlaying .zrm_group_item_card_label': {
            bottom: 0,
            left: 0,
            right: 0,
            width: '100%',
            padding: 0,
            margin: 0,
            'font-size': '5em',
            'height': '1.5em',
            'line-height': '1.5em',
            'text-align': 'center',
            color: '#000',
            'text-shadow': 'initial',
            'font-weight': 400
        },
        '.zrm_group_item_cards': {
            position: 'relative',
            width: '100%',
            height: '100%'
        },
        '.zrm_group_item_card': {
            position: 'relative',
            width: '100%',
            height: '100%'
        },
        '.zrm_group_item_card_label': {
            display: 'none',
            position: 'absolute',
            left: '3%',
            bottom: '3%',
            'font-size': '4em',
            color: '#FFF',
            height: '2em',
            width: '55%',
            'line-height': '2em',
            'text-align': 'left',
            'font-weight': 600,
            'padding-left': '0.5em',
            //'-webkit-text-stroke': '1px black',
            'text-shadow': '2px 2px 0 #000, -1px -1px 0 #000,  1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            overflow: 'hidden',
            'white-space': 'nowrap',
            'text-overflow': 'ellipsis'
        },
        '.zrm_group_item_card_label.zrm_1': {
            display: 'block'
        },
        '.zrm_group_item_card_picture': {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            'background-repeat': 'no-repeat',
            'background-size': 'cover'
        },
        '.zrm_imageNone': {
            'background-image': 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'632px\' height=\'632px\'%3E%3Cpath fill=\'%239DC3C6\' d=\'M0,0L632,0L632,632L0,632L0,0\'/%3E%3Cg fill=\'%23FFFFFF\'%3E%3Cpath d=\'M400.8,453.5H232.2c-71.3,0-129.7,58.4-129.7,129.7v48c0,0.3,0.3,0.6,0.6,0.6h426.8c0.3,0,0.6-0.3,0.6-0.6v-48C530.5,511.9,472.2,453.5,400.8,453.5\'/%3E%3Cpath d=\'M423.5,81.1l-107,15.3l-107-15.3c0,0-35.7,0-35.7,17.8c0,17.8,35.7,17.8,35.7,17.8l107-15.3l107,15.3 c0,0,35.7,0,35.7-17.8C459.2,81.1,423.5,81.1,423.5,81.1\'/%3E%3Cpath d=\'M325.4,164h-17.8V92.7c0-14.3,17.8-14.3,17.8,0V164z\'/%3E%3Cpath d=\'M464.7,382.3c0,34.5-27.9,62.4-62.4,62.4H230.7c-34.5,0-62.4-27.9-62.4-62.4V210.7c0-34.5,27.9-62.4,62.4-62.4h171.6c34.5,0,62.4,27.9,62.4,62.4V382.3z\'/%3E%3C/g%3E%3Cg fill=\'%239DC3C6\'%3E%3Cpath d=\'M392.4,288.2c0,11.5-9.3,20.9-20.9,20.9s-20.9-9.3-20.9-20.9c0-11.5,9.3-20.9,20.9-20.9S392.4,276.7,392.4,288.2\'/%3E%3Cpath d=\'M282.4,288.2c0,11.5-9.3,20.9-20.9,20.9c-11.5,0-20.9-9.3-20.9-20.9c0-11.5,9.3-20.9,20.9-20.9C273,267.3,282.4,276.7,282.4,288.2\'/%3E%3Cpath d=\'M263,344.8c0,0,0,35.7,53.5,35.7c53.5,0,53.5-35.7,53.5-35.7\'/%3E%3C/g%3E%3C/svg%3E")'
        }
    };
    var minWidth = 400;
    var maxWidth = 3000;
    var fontFactor = 105;
    var screenWidth;
    for (screenWidth = maxWidth; screenWidth >= minWidth; screenWidth -= 50) {
        defaultCSS['@media only screen and (max-width: ' + screenWidth + 'px)'] = {
            '.zrm_main': {
                'font-size': (Math.round(screenWidth / fontFactor * 100) / 100) + 'px'
            }
        };
    }
    // Handle giant screens
    defaultCSS['@media only screen and (min-width: ' + maxWidth + 'px)'] = {
        '.zrm_main': {
            'font-size': (Math.round(maxWidth / fontFactor * 100) / 100) + 'px'
        }
    };
    return defaultCSS;
});
/*
<div id="zrm_main">
    <div id="zrm_chooseOpponent"> CHOOSE AN OPPONENT </div>
    <div id="zrm_groups"></div>
</div>
<div id="zrm_group" class="zrm_group">
    <div class="zrm_group_name"></div>
    <div class="zrm_group_items"></div>
</div>
<div id="zrm_group_item" class="zrm_group_item">
    <div class="zrm_group_item_content">
        <div class="zrm_group_item_cards"></div>
        <div class="zrm_group_item_label"></div>
        <div class="zrm_group_item_cta"></div>
    </div>
</div>
<div id="zrm_group_item_card" class="zrm_group_item_card">
    <div class="zrm_group_item_card_picture"></div>
    <div class="zrm_group_item_card_label"></div>
</div>
 */



define("ZyngaStorage", ["require", "exports", "Zynga", "ZyngaAccount", "ZyngaCore", "ZyngaNet"], function (require, exports, Zynga, ZyngaAccount, ZyngaCore, ZyngaNet) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ObjectAssign = ZyngaCore.ObjectAssign;
    // todo: expose cas and cached blob data with methods.
    var cachedUserBlobs = {};
    // use with results of:
    // tslint:disable-next-line:max-line-length
    // Promise.all([Zynga.Event.last(Zynga.Events.APP_ID), Zynga.Event.last(ZyngaAccount.Events.ACCOUNT_DETAILS)]).then(function (results) {
    // tslint:disable-next-line:max-line-length
    function zyngaServiceCall(appId, accountDetails, method, path, args) {
        var options = {};
        var queryString = '';
        if (args) {
            if (method.toLowerCase() !== 'get') {
                options.body = args;
            }
            else {
                // pass options as query string.
                var queryParams = [];
                for (var paramName in args) {
                    var paramValue = args[paramName];
                    // encode and optionally turn arrays into comma separated list
                    paramValue = Array.isArray(paramValue) ? paramValue.map(encodeURI).join(',') : encodeURI(paramValue);
                    queryParams.push(paramName + '=' + paramValue);
                }
                queryString = queryParams.length > 0 ? ('?' + queryParams.join('&')) : '';
            }
        }
        options.useToken = accountDetails.token;
        return ZyngaNet.api(method, path + queryString, options);
    }
    exports.zyngaServiceCall = zyngaServiceCall;
    /**
     * @param forPlayerId specifiy for which player to load the blob. else it will take logged-in creds.
     */
    function getUserBlob(blobName, forPlayerId) {
        return Promise.all([
            Zynga.Event.last(Zynga.Events.APP_ID),
            ZyngaAccount.Event.last(ZyngaAccount.Events.ACCOUNT_DETAILS)
        ]).then(function (results) {
            var appId = results[0];
            var accountDetails = results[1];
            var playerId = forPlayerId || accountDetails.playerId;
            var endpoint = "https://api.zynga.com/storage/v1/app/" + appId + "/blob/" + blobName + "/user/" + playerId;
            return zyngaServiceCall(appId, accountDetails, 'GET', endpoint, {}).then(cacheResultPassthrough).then(function (result) {
                var blobData = result.body.data[blobName][playerId];
                return blobData.data;
            });
        });
    }
    exports.getUserBlob = getUserBlob;
    function cacheResultPassthrough(result) {
        // a bit lazy here, but this will cache the blob data and the cas in a natural format.
        ObjectAssign(cachedUserBlobs, result.body.data);
        /*for (var blobName in result.body.data) {
            for (var playerId in result.body.data[blobName]) {
                let blobData = result.body.data[blobName][playerId];
                //???
            }
        }*/
        return result;
    }
});



define("ZyngaWallet", ["require", "exports", "ATG-Turns/src/walletportable", "ZyngaAccount", "ZyngaCore"], function (require, exports, walletportable_1, ZyngaAccount, ZyngaCore) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ObjectAssign = ZyngaCore.ObjectAssign;
    // yes, we actually imported a function from the backend that will be run on the client.
    // Is this the begginging of the apocalypse?
    // import { canCollectDrip } from '../lib/ATG-Turns/src/wallet';
    exports.cachedWallet = null;
    exports.cachedStats = null;
    exports.lastCas = 0;
    function get(params) {
        // tslint:disable-next-line:max-line-length
        return ZyngaAccount.userAuthCall('GET', 'wallet', params).then(cacheResultPassthrough);
    }
    exports.get = get;
    /**
     * Use this to modify your wallet based on wallet deltas returned by the API
     * @param wallet_ref
     * @param delta
     */
    // tslint:disable-next-line:variable-name
    function applyWalletDelta(wallet_ref, delta) {
        for (var v in delta) {
            if (wallet_ref[v]) {
                wallet_ref[v] += delta[v];
            }
            else {
                wallet_ref[v] = delta[v];
            }
        }
    }
    exports.applyWalletDelta = applyWalletDelta;
    // tslint:disable-next-line:max-line-length
    function cacheResultPassthrough(result) {
        exports.lastCas = result.body.cas;
        exports.cachedStats = result.body.stats || exports.cachedStats;
        exports.cachedWallet = result.body.wallet || exports.cachedWallet;
        var deltaBody = result.body;
        if (!result.body.wallet && deltaBody.delta_items) {
            // api call returned delta but no wallet body.
            // currently not an existing case.
        }
        return result;
    }
    function claimDrip(params) {
        // tslint:disable-next-line:max-line-length
        return ZyngaAccount.userAuthCall('PUT', 'wallet/claimDrip', params).then(cacheResultPassthrough);
    }
    exports.claimDrip = claimDrip;
    function endGameGrant(params) {
        // tslint:disable-next-line:max-line-length
        return ZyngaAccount.userAuthCall('PUT', 'wallet/endGameGrant', params).then(cacheResultPassthrough);
    }
    exports.endGameGrant = endGameGrant;
    function purchase(params) {
        // tslint:disable-next-line:max-line-length
        return ZyngaAccount.userAuthCall('PUT', 'wallet/purchase', params).then(cacheResultPassthrough);
    }
    exports.purchase = purchase;
    function openGatcha(params) {
        // tslint:disable-next-line:max-line-length
        return ZyngaAccount.userAuthCall('PUT', 'wallet/openGatcha', params).then(cacheResultPassthrough);
    }
    exports.openGatcha = openGatcha;
    // poor-mans object.values
    function Object_values(o) {
        return Object.keys(o).map(function (k) { return o[k]; });
    }
    exports.Object_values = Object_values;
    // pass in your eos experiments (you've loaded them already, right?) and we return the catalog
    // tslint:disable-next-line:max-line-length
    function parseItemCatalog(catalogNames, allExperiments) {
        // merge all the catalogs and return.
        var allValues = {};
        // filter just itemcatalog experiments.
        var assignments = {};
        catalogNames.forEach(function (e) {
            assignments[e] = allExperiments[e];
        });
        var allVariables = Object_values(assignments).forEach(function (v) {
            return Object_values(v.variables).forEach(function (val) {
                return ObjectAssign(allValues, val);
            });
        });
        return allValues;
    }
    exports.parseItemCatalog = parseItemCatalog;
    // pass in your eos experiments (you've loaded them already, right?) and we return the catalog
    // tslint:disable-next-line:max-line-length
    function parseDripCatalog(dripExperimentName, allExperiments) {
        // merge all the catalogs and return.
        var allValues = {};
        // filter just dropcatalog experiments.
        var assignments = {};
        assignments[dripExperimentName] = allExperiments[dripExperimentName];
        var allVariables = Object_values(assignments).forEach(function (v) {
            return Object_values(v.variables).forEach(function (val) {
                return ObjectAssign(allValues, val);
            });
        });
        return allValues;
    }
    exports.parseDripCatalog = parseDripCatalog;
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    function calculateDripStatus(dripCatalog, now_ts, drip_id, userWallet) {
        var itemDef = dripCatalog[drip_id];
        if (!itemDef) {
            throw new Error('Unable to find drip by id. ' + JSON.stringify({ drip_id: drip_id, dripCatalog: dripCatalog }));
        }
        var dripStaticStatus = userWallet.drips[drip_id];
        var canClaim = walletportable_1.canCollectDrip(itemDef, userWallet.drips[drip_id], now_ts);
        return {
            time_remaining_s: canClaim.time_remaining_s,
            prize_item: itemDef.grants
        };
    }
    exports.calculateDripStatus = calculateDripStatus;
});



// Set up global Zynga namespace
// Mostly for backwards compat
(function (win) {
	var z = win.Zynga = require('./Zynga');
	z.Account = require('./ZyngaAccount');
	z.Analytics = require('./ZyngaAnalytics');
	z.Core = require('./ZyngaCore');
	z.ContextTracker = require('./ZyngaContextTracker');
	z.Instant = require('./ZyngaInstant');
	z.Leaderboard = require('./ZyngaLeaderboard');
	z.LeaderboardUI = require('./ZyngaLeaderboardUI');
	z.LeaderboardUICSS = require('./ZyngaLeaderboardUICSS');
	z.Match = require('./ZyngaMatch');
	z.Media = require('./ZyngaMedia');
	z.Net = require('./ZyngaNet');
	z.Optimize = require('./ZyngaOptimize');
	z.Profile = require('./ZyngaProfile');
	z.RoundsManager = require('./ZyngaRoundsManager');
	z.RoundsManagerCSS = require('./ZyngaRoundsManagerCSS');
})(window);
