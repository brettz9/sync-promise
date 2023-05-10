export default SyncPromise;
export type ArbitraryValue = any;
export type Resolve = (val: ArbitraryValue) => void;
export type Reject = (reason: ArbitraryValue) => void;
export type Settle = () => void;
export type ResolveReject = (resolve: Resolve, reject: Reject) => void;
export type OnFulfilled = (resolve: ArbitraryValue) => void;
export type Callbacks = [(Settle | Resolve)[], (Settle | Reject)[]];
/**
 * @class
 * @param {(
 *   resolve: (value: ArbitraryValue | PromiseLike<ArbitraryValue>) => void,
 *   reject: (reason?: any) => void
 * ) => void} fn
 */
declare function SyncPromise(fn: (resolve: (value: ArbitraryValue | PromiseLike<ArbitraryValue>) => void, reject: (reason?: any) => void) => void): void;
declare class SyncPromise {
    /**
     * @class
     * @param {(
     *   resolve: (value: ArbitraryValue | PromiseLike<ArbitraryValue>) => void,
     *   reject: (reason?: any) => void
     * ) => void} fn
     */
    constructor(fn: (resolve: (value: ArbitraryValue | PromiseLike<ArbitraryValue>) => void, reject: (reason?: any) => void) => void);
    v: number;
    s: number;
    /** @type {Callbacks|null} */
    c: Callbacks | null;
    /**
     * @param {((value: ArbitraryValue) => ArbitraryValue)|null|undefined} [cb]
     * @param {(reason: any) => PromiseLike<never>} [errBack]
     * @returns {SyncPromise}
     */
    then(cb?: ((value: ArbitraryValue) => ArbitraryValue) | null | undefined, errBack?: ((reason: any) => PromiseLike<never>) | undefined): SyncPromise;
    /**
     * @param {(reason: any) => PromiseLike<never>|null|undefined} cb
     * @returns {SyncPromise}
     */
    catch(cb: (reason: any) => PromiseLike<never> | null | undefined): SyncPromise;
}
declare namespace SyncPromise {
    /**
     * @param {unknown[]|[]} promises
     * @returns {SyncPromise}
     */
    function all(promises: unknown[] | []): SyncPromise;
    /**
     * @param {unknown[]|[]} promises
     * @returns {SyncPromise}
     */
    function race(promises: unknown[] | []): SyncPromise;
    /**
     * @param {ArbitraryValue} val
     * @returns {SyncPromise}
     */
    function resolve(val: any): SyncPromise;
    /**
     * @param {ArbitraryValue} val
     * @returns {SyncPromise}
     */
    function reject(val: any): SyncPromise;
}
//# sourceMappingURL=index.d.ts.map