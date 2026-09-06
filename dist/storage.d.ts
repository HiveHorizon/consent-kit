import type { ConsentRecord, StorageAdapter } from "./types.js";
export declare const DEFAULT_COOKIE_NAME = "consent_prefs";
export interface CookieStorageOptions {
    name?: string;
    /** ".example.com" shares the choice with every subdomain. */
    domain?: string;
    expiryDays?: number;
}
/**
 * Default storage: one first-party cookie, readable by JS, no server involved.
 * This is the "strictly necessary" cookie that records the choice — it is
 * exempt from consent itself, and is the evidence that consent was given.
 */
export declare function cookieStorage(opts?: CookieStorageOptions): StorageAdapter;
export interface AccountStorageOptions {
    /** Reads the record stored on the user's account. Return null when absent. */
    load: () => Promise<ConsentRecord | null>;
    /** Persists the record on the user's account. */
    save: (record: ConsentRecord) => Promise<void>;
    cookie?: CookieStorageOptions;
}
/**
 * Storage for apps with accounts: the choice lives on the account so it follows
 * the person across devices, with the cookie kept as a local cache so the first
 * paint never waits on the network.
 *
 * Whichever copy is newer wins, and is written back to the other.
 */
export declare function accountStorage(opts: AccountStorageOptions): StorageAdapter;
/** Never remembers anything. Useful in tests. */
export declare function memoryStorage(): StorageAdapter;
