'use strict';

/* eslint-disable promise/prefer-await-to-callbacks -- Needed for API */
/* eslint-disable promise/catch-or-return, n/callback-return,
    promise/always-return -- Not needed */
// Since [immediate](https://github.com/calvinmetcalf/immediate) is
//   not doing the trick for our WebSQL transactions (at least in Node),
//   we are forced to make the promises run fully synchronously.

/* eslint-disable jsdoc/reject-any-type -- Truly arbitrary */
/**
 * @typedef {any} ArbitraryValue
 */
/* eslint-enable jsdoc/reject-any-type -- Truly arbitrary */

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
 *
 */
class SyncPromise {
  /**
   * @param {unknown[]|[]} promises
   * @returns {SyncPromise}
   */
  static all (promises) {
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
          if (isPromise(/** @type {PromiseLike<ArbitraryValue>} */ (p))) {
            addReject(/** @type {PromiseLike<ArbitraryValue>} */ (p).then(
              /** @type {OnFulfilled} */
              (res) => {
                newPromises[i] = res;
                --l;
                if (!l) {
                  resolve(newPromises);
                }
              }
            ), reject);
          } else {
            newPromises[i] = p;
            --l;
            if (!l) {
              resolve(promises);
            }
          }
        });
      }
    );
  }

  /**
   * @param {unknown[]|[]} promises
   * @returns {SyncPromise}
   */
  static race (promises) {
    let resolved = false;
    return new SyncPromise(
      /** @type {ResolveReject} */
      (resolve, reject) => {
        // eslint-disable-next-line @stylistic/max-len -- Long
        // eslint-disable-next-line unicorn/no-unused-array-method-return -- Shortcuts
        promises.some((p) => {
          if (isPromise(/** @type {PromiseLike<ArbitraryValue>} */ (p))) {
            addReject(/** @type {PromiseLike<ArbitraryValue>} */ (p).then(
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
  }

  /**
   * @param {ArbitraryValue} val
   * @returns {SyncPromise}
   */
  static resolve (val) {
    return new SyncPromise(
      /** @type {ResolveReject} */
      (resolve) => {
        resolve(val);
      }
    );
  }

  /**
   * @param {ArbitraryValue} val
   * @returns {SyncPromise}
   */
  static reject (val) {
    return new SyncPromise(
      /** @type {ResolveReject} */
      (resolve, reject) => {
        reject(val);
      }
    );
  }

  // Value, this will be set to either a resolved value or rejected reason
  v = 0;

  /**
   * @param {(
   *   resolve: (value: ArbitraryValue | PromiseLike<ArbitraryValue>) => void,
   *   reject: (reason?: ArbitraryValue) => void
   * ) => void} fn
   */
  constructor (fn) {
    // State of the promise
    this.s = PENDING;
    // Callbacks c[0] is fulfillment and c[1] contains rejection callbacks
    /** @type {Callbacks|null} */
    this.c = [[], []];
    /**
     *
     * @param {ArbitraryValue} val
     * @param {0|1} state
     * @returns {void}
     */
    const transist = (val, state) => {
      this.v = val;
      this.s = state;

      // console.log('state', state);
      /** @type {Callbacks} */ (
        this.c
      )[state].forEach((func) => {
        func(val);
      });
      // Release memory, but if no handlers have been added, as we
      //   assume that we will resolve/reject (truly) synchronously
      //   and thus we avoid flagging checks about whether we've
      //   already resolved/rejected.
      if (/** @type {Callbacks} */(this.c)[state].length) {
        this.c = null;
      }
    };

    /** @type {Resolve} */
    const resolve = (val) => {
      if (!this.c) ; else if (isPromise(val)) {
        addReject(val.then(resolve), reject);
      } else {
        transist(val, FULFILLED);
      }
    };

    /** @type {Reject} */
    const reject = (reason) => {
      if (!this.c) ; else if (isPromise(reason)) {
        addReject(reason.then(reject), reject);
      } else {
        transist(reason, REJECTED);
      }
    };

    try {
      fn(resolve, reject);
    } catch (err) {
      reject(err);
    }
  }

  /* eslint-disable unicorn/no-thenable -- Promise API */
  /**
   * @param {((value: ArbitraryValue) => ArbitraryValue)|null|undefined} [cb]
   * @param {(reason: ArbitraryValue) => PromiseLike<never>} [errBack]
   * @returns {SyncPromise}
   */
  then (cb, errBack) {
    /* eslint-enable unicorn/no-thenable -- Promise API */
    return new SyncPromise(
      /** @type {ResolveReject} */
      (resolve, reject) => {
        const rej = typeof errBack === 'function' ? errBack : reject;

        /** @type {Settle} */
        const settle = () => {
          try {
            resolve(cb ? cb(this.v) : this.v);
          } catch (e) {
            rej(e);
          }
        };
        if (this.s === FULFILLED) {
          settle();
        } else if (this.s === REJECTED) {
          rej(this.v);
        } else {
          /** @type {Callbacks} */ (this.c)[FULFILLED].push(settle);
          /** @type {Callbacks} */ (this.c)[REJECTED].push(rej);
        }
      }
    );
  }

  /**
   * @param {(reason: ArbitraryValue) => PromiseLike<never>|null|undefined} cb
   * @returns {SyncPromise}
   */
  catch (cb) {
    return new SyncPromise(
      /** @type {ResolveReject} */
      (resolve, reject) => {
        /**
         * @returns {void}
         */
        const settle = () => {
          try {
            resolve(cb(this.v));
          } catch (e) {
            reject(e);
          }
        };

        if (this.s === REJECTED) {
          settle();
        } else if (this.s === FULFILLED) {
          resolve(this.v);
        } else {
          /** @type {Callbacks} */ (this.c)[REJECTED].push(settle);
          /** @type {Callbacks} */ (this.c)[FULFILLED].push(resolve);
        }
      }
    );
  }
}

module.exports = SyncPromise;
