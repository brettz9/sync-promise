/* eslint-disable promise/prefer-await-to-callbacks -- Needed for API */
/* eslint-disable promise/catch-or-return, n/callback-return,
    promise/always-return -- Not needed */
/* eslint-disable unicorn/no-this-assignment -- Clarity */
// Since [immediate](https://github.com/calvinmetcalf/immediate) is
//   not doing the trick for our WebSQL transactions (at least in Node),
//   we are forced to make the promises run fully synchronously.

// Todo: Use ES6 classes

/**
 * @typedef {any} ArbitraryValue
 */

/**
 * @callback Resolve
 * @param {ArbitraryValue} val
 * @returns {void}
 */
/**
 * @callback Reject
 * @param {ArbitraryValue} reason
 * @returns {void}
 */
/**
 * @callback Settle
 * @returns {void}
 */

/**
 * @callback ResolveReject
 * @param {Resolve} resolve
 * @param {Reject} reject
 * @returns {void}
 */

/**
 * @callback OnFulfilled
 * @param {ArbitraryValue} resolve
 * @returns {void}
 */

/**
 * @typedef {[(Settle|Resolve)[], (Settle|Reject)[]]} Callbacks
 */

/**
 *
 * @param {PromiseLike<ArbitraryValue>} p
 * @returns {boolean}
 */
function isPromise (p) {
  return p && typeof p.then === 'function';
}
/**
 *
 * @param {PromiseLike<ArbitraryValue>} prom
 * @param {(err: Error) => void} reject
 * @returns {void}
 */
function addReject (prom, reject) {
  // Use this style for sake of non-Promise thenables (e.g., jQuery Deferred)
  prom.then(null, reject);
}

// States
const PENDING = 2,
  FULFILLED = 0, // We later abuse these as array indices
  REJECTED = 1;

/**
 * @class
 * @param {(
 *   resolve: (value: ArbitraryValue | PromiseLike<ArbitraryValue>) => void,
 *   reject: (reason?: any) => void
 * ) => void} fn
 */
function SyncPromise (fn) {
  const that = this;
  // Value, this will be set to either a resolved value or rejected reason
  that.v = 0;
  // State of the promise
  that.s = PENDING;
  // Callbacks c[0] is fulfillment and c[1] contains rejection callbacks
  /** @type {Callbacks|null} */
  that.c = [[], []];
  /**
   *
   * @param {ArbitraryValue} val
   * @param {0|1} state
   * @returns {void}
   */
  function transist (val, state) {
    that.v = val;
    that.s = state;

    // console.log('state', state);
    /** @type {Callbacks} */ (
      that.c
    )[state].forEach(function (func) { func(val); });
    // Release memory, but if no handlers have been added, as we
    //   assume that we will resolve/reject (truly) synchronously
    //   and thus we avoid flagging checks about whether we've
    //   already resolved/rejected.
    if (/** @type {Callbacks} */(that.c)[state].length) {
      that.c = null;
    }
  }

  /** @type {Resolve} */
  function resolve (val) {
    if (!that.c) {
      // Already resolved (or will be resolved), do nothing.
    } else if (isPromise(val)) {
      addReject(val.then(resolve), reject);
    } else {
      transist(val, FULFILLED);
    }
  }

  /** @type {Reject} */
  function reject (reason) {
    if (!that.c) {
      // Already resolved (or will be resolved), do nothing.
    } else if (isPromise(reason)) {
      addReject(reason.then(reject), reject);
    } else {
      transist(reason, REJECTED);
    }
  }
  try {
    fn(resolve, reject);
  } catch (err) {
    reject(err);
  }
}

/* eslint-disable unicorn/no-thenable -- Promise API */
/**
 * @param {((value: ArbitraryValue) => ArbitraryValue)|null|undefined} [cb]
 * @param {(reason: any) => PromiseLike<never>} [errBack]
 * @returns {SyncPromise}
 */
SyncPromise.prototype.then = function (cb, errBack) {
  /* eslint-enable unicorn/no-thenable -- Promise API */
  const that = this;
  return new SyncPromise(
    /** @type {ResolveReject} */
    function (resolve, reject) {
      const rej = typeof errBack === 'function' ? errBack : reject;

      /** @type {Settle} */
      function settle () {
        try {
          resolve(cb ? cb(that.v) : that.v);
        } catch (e) {
          rej(e);
        }
      }
      if (that.s === FULFILLED) {
        settle();
      } else if (that.s === REJECTED) {
        rej(that.v);
      } else {
        /** @type {Callbacks} */ (that.c)[FULFILLED].push(settle);
        /** @type {Callbacks} */ (that.c)[REJECTED].push(rej);
      }
    }
  );
};

/**
 * @param {(reason: any) => PromiseLike<never>|null|undefined} cb
 * @returns {SyncPromise}
 */
SyncPromise.prototype.catch = function (cb) {
  const that = this;
  return new SyncPromise(
    /** @type {ResolveReject} */
    function (resolve, reject) {
      /**
       * @returns {void}
       */
      function settle () {
        try {
          resolve(cb(that.v));
        } catch (e) {
          reject(e);
        }
      }

      if (that.s === REJECTED) {
        settle();
      } else if (that.s === FULFILLED) {
        resolve(that.v);
      } else {
        /** @type {Callbacks} */ (that.c)[REJECTED].push(settle);
        /** @type {Callbacks} */ (that.c)[FULFILLED].push(resolve);
      }
    }
  );
};

/**
 * @param {unknown[]|[]} promises
 * @returns {SyncPromise}
 */
SyncPromise.all = function (promises) {
  return new SyncPromise(
    /** @type {ResolveReject} */
    (resolve, reject) => {
      let l = promises.length;
      /** @type {ArbitraryValue[]} */
      const newPromises = [];
      if (!l) {
        resolve(newPromises);
        return;
      }
      promises.forEach((p, i) => {
        if (isPromise(/** @type {PromiseLike<any>} */ (p))) {
          addReject(/** @type {PromiseLike<any>} */ (p).then(
            /** @type {OnFulfilled} */
            (res) => {
              newPromises[i] = res;
              --l || resolve(newPromises);
            }
          ), reject);
        } else {
          newPromises[i] = p;
          --l || resolve(promises);
        }
      });
    }
  );
};

/**
 * @param {unknown[]|[]} promises
 * @returns {SyncPromise}
 */
SyncPromise.race = function (promises) {
  let resolved = false;
  return new SyncPromise(
    /** @type {ResolveReject} */
    (resolve, reject) => {
      promises.some((p, i) => {
        if (isPromise(/** @type {PromiseLike<any>} */ (p))) {
          addReject(/** @type {PromiseLike<any>} */ (p).then(
            /** @type {OnFulfilled} */
            (res) => {
              if (resolved) {
                return;
              }
              resolve(res);
              resolved = true;
            }
          ), reject);
          return false;
        }
        resolve(p);
        resolved = true;
        return true;
      });
    }
  );
};

/**
 * @param {ArbitraryValue} val
 * @returns {SyncPromise}
 */
SyncPromise.resolve = function (val) {
  return new SyncPromise(
    /** @type {ResolveReject} */
    (resolve, reject) => {
      resolve(val);
    }
  );
};

/**
 * @param {ArbitraryValue} val
 * @returns {SyncPromise}
 */
SyncPromise.reject = function (val) {
  return new SyncPromise(
    /** @type {ResolveReject} */
    (resolve, reject) => {
      reject(val);
    }
  );
};

export default SyncPromise;
