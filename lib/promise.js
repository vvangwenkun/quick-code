'use strict';

const STATE = {
  FULFILLED: Symbol('Fulfilled'),
  REJECTED: Symbol('Rejected'),
  PENDING: Symbol('Pending'),
};

const STATE_KEY  = Symbol('state');
const FULFILLED_HANDLERS_KEY  = Symbol('fulfilledHandlers');
const REJECTED_HANDLERS_KEY = Symbol('rejectedHandlers');

const VALUE_KEY = Symbol('value');
const REASON_KEY = Symbol('reason');

function Promise(callback) {
  this[STATE_KEY] = STATE.PENDING;
  this[FULFILLED_HANDLERS_KEY] = [];
  this[REJECTED_HANDLERS_KEY] = [];

  if (typeof callback !== 'function') {``
    throw new Error('"callback" must be a function object');
  }

  const resolve = (value) => {
    if (this[STATE_KEY] === STATE.PENDING) {
      this[STATE_KEY] = STATE.FULFILLED;
      this[VALUE_KEY] = value;
      this[FULFILLED_HANDLERS_KEY].forEach((fn) => fn());
    }
  }

  const reject = (reason) => {
    if (this[STATE_KEY] === STATE.PENDING) {
      this[STATE_KEY] = STATE.REJECTED;
      this[REASON_KEY] = reason;
      this[REJECTED_HANDLERS_KEY].forEach((fn) => fn());
    }
  }

  try {
    callback(resolve, reject);
  } catch (err) {
    reject(err);
  }
}

Promise.prototype.then = function (onFulfilled, onRejected) {
  if (typeof onFulfilled !== 'function') {
    onFulfilled = (value) => value;
  }

  if (typeof onRejected !== 'function') {
    onRejected = (reason) => { throw reason };
  }

  return new Promise((resolve, reject) => {
    if (this[STATE_KEY] === STATE.FULFILLED) {
      process.nextTick(() => {
        try {
          wrap(onFulfilled(this[VALUE_KEY]), resolve, reject);
        } catch (err) {
          reject(err);
        }
      });
    } else if (this[STATE_KEY] === STATE.REJECTED) {
      process.nextTick(() => {
        try {
          wrap(onRejected(this[REASON_KEY]), resolve, reject);
        } catch (err) {
          reject(err);
        }
      });
    } else {
      this[FULFILLED_HANDLERS_KEY].push(() => {
        process.nextTick(() => {
          try {
            wrap(onFulfilled(this[VALUE_KEY]), resolve, reject);
          } catch (err) {
            reject(err);
          }
        });
      });

      this[REJECTED_HANDLERS_KEY].push(() => {
        process.nextTick(() => {
          try {
            wrap(onRejected(this[REASON_KEY]), resolve, reject);
          } catch (err) {
            reject(err);
          }
        });
      });
    }
  });
}

Promise.prototype.catch = function (onRejected) {  
  if (typeof onRejected !== 'function') {
    onRejected = (reason) => { throw reason };
  }

  return new Promise((resolve, reject) => {
    if (this[STATE_KEY] === STATE.REJECTED) {
      process.nextTick(() => {
        try {
          wrap(onRejected(this[REASON_KEY]), resolve, reject);
        } catch (err) {
          reject(err);
        }
      });
    } else if (this[STATE_KEY] === STATE.PENDING) {
      this[REJECTED_HANDLERS_KEY].push(() => {
        process.nextTick(() => {
          try {
            wrap(onRejected(this[REASON_KEY]), resolve, reject);
          } catch (err) {
            reject(err);
          }
        });
      });
    }
  });
}

Promise.resolve = function (value) {
  return new Promise(((resolve) => resolve(value)));
}

Promise.reject = function (reason) {
  return new Promise(((unused, reject) => reject(reason)));
}

function wrap(value, resolve, reject) {
  // thenable object
  if (value && typeof value.then === 'function') {
    try {
      value.then.call(value, (value2) => {
        wrap(value2, resolve, reject);
      }, (reason) => {
        reject(reason);
      });
    } catch(err) {
      reject(err);
    }
  } else {
    resolve(value);
  }
}

module.exports = Promise;
