import type { ConsentRecord, StorageAdapter } from "./types.js";

export const DEFAULT_COOKIE_NAME = "consent_prefs";

function isRecord(value: unknown): value is ConsentRecord {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<ConsentRecord>;
  return (
    typeof r.v === "string" &&
    typeof r.ts === "number" &&
    !!r.choices &&
    typeof r.choices.analytics === "boolean" &&
    typeof r.choices.marketing === "boolean"
  );
}

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
export function cookieStorage(opts: CookieStorageOptions = {}): StorageAdapter {
  const name = opts.name ?? DEFAULT_COOKIE_NAME;
  const days = opts.expiryDays ?? 180;

  return {
    load() {
      if (typeof document === "undefined") return null;
      const raw = document.cookie
        .split("; ")
        .find((c) => c.startsWith(`${name}=`))
        ?.slice(name.length + 1);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(decodeURIComponent(raw));
        return isRecord(parsed) ? parsed : null;
      } catch {
        return null;
      }
    },
    save(record) {
      if (typeof document === "undefined") return;
      const value = encodeURIComponent(JSON.stringify(record));
      const parts = [
        `${name}=${value}`,
        "path=/",
        `max-age=${days * 24 * 60 * 60}`,
        "SameSite=Lax",
      ];
      if (opts.domain) parts.push(`domain=${opts.domain}`);
      if (location.protocol === "https:") parts.push("Secure");
      document.cookie = parts.join("; ");
    },
    clear() {
      if (typeof document === "undefined") return;
      const parts = [`${name}=`, "path=/", "max-age=0", "SameSite=Lax"];
      if (opts.domain) parts.push(`domain=${opts.domain}`);
      document.cookie = parts.join("; ");
    },
  };
}

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
export function accountStorage(opts: AccountStorageOptions): StorageAdapter {
  const cache = cookieStorage(opts.cookie);

  return {
    async load() {
      const local = cache.load() as ConsentRecord | null;
      let remote: ConsentRecord | null = null;
      try {
        remote = await opts.load();
      } catch {
        return local; // offline or logged out: fall back to the cache
      }
      if (!remote) return local;
      if (!local) {
        cache.save(remote);
        return remote;
      }
      if (remote.ts > local.ts) {
        cache.save(remote);
        return remote;
      }
      if (local.ts > remote.ts) {
        void opts.save(local).catch(() => {});
      }
      return local;
    },
    async save(record) {
      cache.save(record);
      try {
        await opts.save(record);
      } catch {
        /* the cookie already holds it; a later load will reconcile */
      }
    },
    clear() {
      cache.clear?.();
    },
  };
}

/** Never remembers anything. Useful in tests. */
export function memoryStorage(): StorageAdapter {
  let held: ConsentRecord | null = null;
  return {
    load: () => held,
    save: (r) => {
      held = r;
    },
    clear: () => {
      held = null;
    },
  };
}
