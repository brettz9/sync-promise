define(function () {
// Since [immediate](https://github.com/calvinmetcalf/immediate) is
//   not doing the trick for our WebSQL transactions (at least in Node),
//   we are forced to make the promises run fully synchronously.

function isPromise(p) {
  return p && typeof p.then === 'function';
}
function addReject(prom, reject) {
  prom.then(null, reject) // Use this style for sake of non-Promise thenables (e.g., jQuery Deferred)
}

// States
var PENDING = 2,
    FULFILLED = 0, // We later abuse these as array indices
    REJECTED = 1;

function SyncPromise(fn) {
  var self = this;
  self.v = 0; // Value, this will be set to either a resolved value or rejected reason
  self.s = PENDING; // State of the promise
  self.c = [[],[]]; // Callbacks c[0] is fulfillment and c[1] contains rejection callbacks
  function transist(val, state) {
    self.v = val;
    self.s = state;
    self.c[state].forEach(function(fn) { fn(val); });
    // Release memory, but if no handlers have been added, as we
    //   assume that we will resolve/reject (truly) synchronously
    //   and thus we avoid flagging checks about whether we've
    //   already resolved/rejected.
    if (self.c[state].length) self.c = null;
  }
  function resolve(val) {
    if (!self.c) {
      // Already resolved (or will be resolved), do nothing.
    } else if (isPromise(val)) {
      addReject(val.then(resolve), reject);
    } else {
      transist(val, FULFILLED);
    }
  }
  function reject(reason) {
    if (!self.c) {
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

var prot = SyncPromise.prototype;

prot.then = function(cb, errBack) {
  var self = this;
  return new SyncPromise(function(resolve, reject) {
    var rej = typeof errBack === 'function' ? errBack : reject;
    function settle() {
      try {
        resolve(cb ? cb(self.v) : self.v);
      } catch(e) {
        rej(e);
      }
    }
    if (self.s === FULFILLED) {
      settle();
    } else if (self.s === REJECTED) {
      rej(self.v);
    } else {
      self.c[FULFILLED].push(settle);
      self.c[REJECTED].push(rej);
    }
  });
};

prot.catch = function(cb) {
  var self = this;
  return new SyncPromise(function(resolve, reject) {
    function settle() {
      try {
        resolve(cb(self.v));
      } catch(e) {
        reject(e);
      }
    }
    if (self.s === REJECTED) {
      settle();
    } else if (self.s === FULFILLED) {
      resolve(self.v);
    } else {
      self.c[REJECTED].push(settle);
      self.c[FULFILLED].push(resolve);
    }
  });
};

SyncPromise.all = function(promises) {
  return new SyncPromise(function(resolve, reject, l) {
    l = promises.length;
    var hasPromises = false;
    var newPromises = [];
    if (!l) {
        resolve(newPromises);
        return;
    }
    promises.forEach(function(p, i) {
      if (isPromise(p)) {
        addReject(p.then(function(res) {
          newPromises[i] = res;
          --l || resolve(newPromises);
        }), reject);
      } else {
        newPromises[i] = p;
        --l || resolve(promises);
      }
    });
  });
};

SyncPromise.race = function(promises) {
  var resolved = false;
  return new SyncPromise(function(resolve, reject) {
    promises.some(function(p, i) {
      if (isPromise(p)) {
        addReject(p.then(function(res) {
          if (resolved) {
            return;
          }
          resolve(res);
          resolved = true;
        }), reject);
      } else {
        resolve(p);
        resolved = true;
        return true;
      }
    });
  });
};

SyncPromise.resolve = function(val) {
  return new SyncPromise(function(resolve, reject) {
    resolve(val);
  });
};

SyncPromise.reject = function(val) {
  return new SyncPromise(function(resolve, reject) {
    reject(val);
  });
};

  return SyncPromise;
});
