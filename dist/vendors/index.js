export { ga4, gtm, ga4PageView } from "./ga4.js";
export { clarity } from "./clarity.js";
/** Escape hatch for anything without a built-in helper. */
export function custom(opts) {
    return {
        id: opts.id,
        category: opts.category ?? "analytics",
        exclude: opts.exclude,
        load: opts.load,
    };
}
/**
 * Self-hosted, cookieless analytics such as Umami or Plausible.
 *
 * These generally qualify as exempt audience measurement (no cookie, no
 * cross-site tracking, data stays with the publisher), so by default this
 * vendor loads for everyone, before and regardless of any consent choice.
 * Pass requiresConsent: true if you would rather gate it anyway.
 */
export function cookieless(opts) {
    return {
        id: opts.id,
        category: "analytics",
        exempt: !opts.requiresConsent,
        load: () => {
            const domId = `consent-kit-${opts.id}`;
            if (document.getElementById(domId))
                return;
            const s = document.createElement("script");
            s.id = domId;
            s.defer = true;
            s.src = opts.src;
            for (const [k, v] of Object.entries(opts.attrs ?? {}))
                s.setAttribute(k, v);
            document.head.appendChild(s);
        },
    };
}
//# sourceMappingURL=index.js.map