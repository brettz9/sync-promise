# SyncPromise

A fast, small, _safe_ promise implementation with synchronous promise resolution
and an API which resembles ECMAScript promises.

SyncPromise is incompliant with the Promises/A+ spec. Specifically part
[2.2.4](https://promisesaplus.com/#point-34).

Why
===

Promises make handling asynchronous operations easier. IndexedDB exposes a lot of
asynchronous operations. That sounds like a great match? Well, [unfortunately things
are not so simple](http://stackoverflow.com/questions/28388129/inconsistent-interplay-between-indexeddb-transactions-and-promises/)
It is not possible to use Promises/A+ promises inside IndexedDB transactions in
a cross browser way.

SyncPromise was created because it's author wanted to use promises in
IndexedDB transaction for the library [SyncedDB](https://github.com/paldepind/synceddb)
– both internally and in the user facing API. It was released in the hope that
it would be of use to others who work directly with IndexedDB.

Features
========

* Weighs less than 1KB when minified (not gzipped).
* Familiar API that is very similar to the native ECMAScript promises API.
* Provides a safety mechanism to prevent [releasing Zalgo](http://blog.izs.me/post/59142742143/designing-apis-for-asynchrony)
* Distributed both as a CommonJS pacakge, AMD module, global export and as a
  version suitable for including directly in other source code.

Safety
======

It is for good reason that the Promises/A+ specification requires asynchronous
resolution! Without care taken one can end up creating promises that are
sometimes synchronous and sometimes asynchronous. That is a _very_ bad idea
that leads to unpredictable non-deterministic behaviour ([see this post for a
detailed explanation](http://blog.ometer.com/2011/07/24/callbacks-synchronous-and-asynchronous/)).

### Restrictions

Fortunately SyncPromise imposes a two restrictions on usage. The first prevents
ensures that promises are never resolved immediately. And the second makes sure
that no errors gets swallowed. Together these restrictions ensure that a
promise chain will _always_ be run asynchronously or an explicit error will be
thrown.

### Promises that are synchronously resolved can't be chained

Throwing an exception in the promise body counts as a synchronous resolution.
The error will not be caught.

```javascript
new SyncPromise(function(resolve, reject) {
  resolve('foo'); // <- Sync resolve
}).then(function() {
  // Bad! This is disallowed, error will be thrown
});

new SyncPromise(function(resolve, reject) {
  setTimeout(resolve, 10); // <- Asynchronous resolve
}).then(function() {
  return 1; // Fine!
}).then(function(n) {
  n === 1; // true
});
```

### If a promise rejects at least one `onRejected` callback must have been attached

This ensures that all rejected promises are handled. Other promise libraries (Bluebird
for instance) uses async mechanisms to ensure this.

```javascript
var p = new SyncPromise(function(resolve, reject) {
  setTimeout(reject, 10); // Error is thrown – no rejection handlers attached yet
})
setTimeout(function() {
  p.catch(function() { });
}), 20;
```

Installation
============

### Node.js/Browserify
```
npm install sync-promise
```
Then:
```javascript
var SyncPromise = require('sync-promise');
```

### Browser
```
bower install sync-promise
```
Then include the global export or the AMD module.


Example
=======

```javascript
// This is a wrapper around IDBStore#get.
// Had it been written using native promises it would have closed the
// transaction when calling `resolve` or `reject`
function getRecord(IDBStore, key) {
  return new SyncPromise(function(resolve, reject) {
    var req = IDBStore.get(key);
    req.onsuccess = function() {
      if (req.result !== undefined) {
        resolve(req.result);
      } else {
        reject('KeyNotFoundError');
      }
    };
    req.onerror = reject;
  });
}

// Usage
var tx = db.transaction('books', 'readonly');
var bookStore = tx.objectStore('books');

getRecord(bookStore, 'Bedrock Nights').then(function(book) {
  // We got the book, and the transaction is still open so we
  // can make another request. Had `getRecord` used native promises
  // the transaction whould have been closed by now.
});
```

Differences from ECMAScript promises
====================================

* Synchronized resolution and rejection, of course.
* No `race` function. How that function ended up in the specification is beyond
  me. Especially considering the amount of way more useful promise utility function.
* `.then` does not take a rejection handler. Only a fulfilled handler. Use `.catch`
  instead. This is a departure from Promises/A+. But we're not compatible anyway
  so we get away with not supporting [this anti-pattern](https://github.com/petkaantonov/bluebird/wiki/Promise-anti-patterns#the-thensuccess-fail-anti-pattern).
* `Promise.resolve` and `Promise.reject` are not implemented – they don't make sense
  given the above restrictions

API
===

### new SyncPromise(function)

Creates a new promise. The passed function is passed callbacks to both resolve and reject the promise.

__Example:__

```javascript
var p = new SyncPromise(function(resolve, reject) {
  var req = IDBStore.get(key);
  req.onsuccess = function() {
    if (req.result !== undefined) {
      resolve(req.result);
    } else {
      reject('KeyNotFoundError');
    }
  };
  req.onerror = reject;
});
```

### SyncPromise#then(function)

The passed function will be called if the promise is fulfilled. A new promise
chained from the original promise is returned. The new promise is resolved with
the value that the function return. The new promise is rejected if the function
throws an error.

__Example:__

```javascript
getSomething.then(function(v) {
  return doSomething(v);
}).then(function(v) {
  doSomethingElse(v);
});

```

### SyncPromise#catch(function)

The passed function will be called if the promise is rejected. A new promise
chained from the original promise is returned. The new promise is resolved with
the value that the function return. The new promise is rejected if the function
throws an error.

__Example:__

```javascript
getSomething.then(function(v) {
  return doSomething(v);
}).then(function(v) {
  doSomethingElse(v);
});
```

### SyncPromise.all(array)

Return a promise that is resolved when all promises in the array has fulfilled.
If one rejects the promise is rejected for the same reason.

__Example:__

```javascript
var ps = [
  new SyncPromise(function(resolve) {
    resolve(1);
  }),
  2,
  new SyncPromise(function(resolve) {
    setTimeout(function() {
      resolve(3);
    }, 9);
  }),
];
SyncPromise.all(ps).then(function(ns) {
  assert.deepEqual(ns, [1, 2, 3]);
});
```
