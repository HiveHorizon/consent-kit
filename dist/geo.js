/**
 * Country lookup.
 *
 * Every Cloudflare-proxied zone serves /cdn-cgi/trace, which reports the
 * visitor's country as `loc=FR`. It is same-origin, needs no account or key,
 * sets no cookie, and sends nothing to a third party.
 *
 * Any failure resolves to null, which the caller treats as "consent required".
 */
export function cloudflareTrace(timeoutMs = 1500) {
    return async () => {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            const res = await fetch("/cdn-cgi/trace", {
                signal: controller.signal,
                credentials: "omit",
                cache: "no-store",
            });
            clearTimeout(timer);
            if (!res.ok)
                return null;
            const match = /^loc=([A-Z]{2})$/m.exec(await res.text());
            return match ? match[1] : null;
        }
        catch {
            return null;
        }
    };
}
/** Always require consent, without any lookup. Pair with regions: "all". */
export const noGeo = () => Promise.resolve(null);
/** Fixed country, for tests and local development. */
export function staticGeo(country) {
    return () => Promise.resolve(country);
}
//# sourceMappingURL=geo.js.map