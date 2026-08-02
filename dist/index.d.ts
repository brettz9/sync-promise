export default SyncPromise;
export type ArbitraryValue = any;
export type Resolve = (val: ArbitraryValue) => void;
export type Reject = (reason: ArbitraryValue) => void;
export type Settle = () => void;
export type ResolveReject = (resolve: Resolve, reject: Reject) => void;
export type OnFulfilled = (resolve: ArbitraryValue) => void;
export type Callbacks = [(Settle | Resolve)[], (Settle | Reject)[]];
/**
 *
 */
declare class SyncPromise {
    /**
     * @param {unknown[]|[]} promises
     * @returns {SyncPromise}
     */
    static all(promises: unknown[] | []): SyncPromise;
    /**
     * @param {unknown[]|[]} promises
     * @returns {SyncPromise}
     */
    static race(promises: unknown[] | []): SyncPromise;
    /**
     * @param {ArbitraryValue} val
     * @returns {SyncPromise}
     */
    static resolve(val: ArbitraryValue): SyncPromise;
    /**
     * @param {ArbitraryValue} val
     * @returns {SyncPromise}
     */
    static reject(val: ArbitraryValue): SyncPromise;
    /**
     * @param {(
     *   resolve: (value: ArbitraryValue | PromiseLike<ArbitraryValue>) => void,
     *   reject: (reason?: ArbitraryValue) => void
     * ) => void} fn
     */
    constructor(fn: (resolve: (value: ArbitraryValue | PromiseLike<ArbitraryValue>) => void, reject: (reason?: ArbitraryValue) => void) => void);
    v: number;
    s: number;
    /** @type {Callbacks|null} */
    c: Callbacks | null;
    /**
     * @param {((value: ArbitraryValue) => ArbitraryValue)|null|undefined} [cb]
     * @param {(reason: ArbitraryValue) => PromiseLike<never>} [errBack]
     * @returns {SyncPromise}
     */
    then(cb?: ((value: ArbitraryValue) => ArbitraryValue) | null | undefined, errBack?: (reason: ArbitraryValue) => PromiseLike<never>): SyncPromise;
    /**
     * @param {(reason: ArbitraryValue) => PromiseLike<never>|null|undefined} cb
     * @returns {SyncPromise}
     */
    catch(cb: (reason: ArbitraryValue) => PromiseLike<never> | null | undefined): SyncPromise;
}
//# sourceMappingURL=index.d.ts.map