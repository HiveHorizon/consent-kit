/**
 * Country lookup.
 *
 * Every Cloudflare-proxied zone serves /cdn-cgi/trace, which reports the
 * visitor's country as `loc=FR`. It is same-origin, needs no account or key,
 * sets no cookie, and sends nothing to a third party.
 *
 * Any failure resolves to null, which the caller treats as "consent required".
 */
export declare function cloudflareTrace(timeoutMs?: number): () => Promise<string | null>;
/** Always require consent, without any lookup. Pair with regions: "all". */
export declare const noGeo: () => Promise<string | null>;
/** Fixed country, for tests and local development. */
export declare function staticGeo(country: string | null): () => Promise<string | null>;
