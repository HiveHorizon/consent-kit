import { cloudflareTrace } from "./geo.js";
import { requiresConsent, resolveRegions } from "./regions.js";
import { cookieStorage } from "./storage.js";
import { trackRouteChanges } from "./spa.js";
import { createBanner } from "./ui/banner.js";
import { ga4PageView } from "./vendors/ga4.js";
export * from "./types.js";
export { EU_EEA_UK_CH } from "./regions.js";
export { cookieStorage, accountStorage, memoryStorage } from "./storage.js";
export { cloudflareTrace, staticGeo, noGeo } from "./geo.js";
export { ga4, gtm, clarity, custom, cookieless } from "./vendors/index.js";
const NONE = { analytics: false, marketing: false };
const ALL = { analytics: true, marketing: true };
/** Set by initConsent so a footer link can reopen the panel from anywhere. */
let current = null;
/** Reopens the preferences panel. Wire this to your "Cookie settings" link. */
export function openConsentSettings() {
    current?.openSettings();
}
/** The active consent record, or null before a decision. */
export function getConsent() {
    return current?.get() ?? null;
}
export function initConsent(config) {
    if (typeof window === "undefined") {
        // SSR / build time: hand back an inert API rather than throwing.
        const inert = {
            acceptAll() { },
            refuseAll() { },
            set() { },
            openSettings() { },
            get: () => null,
            reset() { },
        };
        return inert;
    }
    const profile = config.profile ?? "site";
    const policyVersion = config.policyVersion ?? "1";
    const expiryDays = config.expiryDays ?? 180;
    const debug = !!config.debug;
    const regions = resolveRegions(config.regions);
    const geo = config.geo ?? cloudflareTrace();
    const storage = config.storage ??
        cookieStorage({
            name: config.cookieName,
            domain: config.cookieDomain,
            expiryDays,
        });
    const log = (...args) => {
        if (debug)
            console.info("[consent-kit]", ...args);
    };
    // Exempt vendors (self-hosted, cookieless) load immediately and are never
    // part of a consent decision.
    const exempt = config.vendors.filter((v) => v.exempt);
    const gated = config.vendors.filter((v) => !v.exempt);
    const categories = new Set(gated.map((v) => v.category));
    let record = null;
    let region = null;
    let banner = null;
    const loaded = new Set();
    function allowedHere(vendor) {
        if (!vendor.exclude?.length)
            return true;
        const path = location.pathname;
        return !vendor.exclude.some((p) => path === p || path.startsWith(`${p}/`));
    }
    function loadVendors(choices, list) {
        for (const vendor of list) {
            if (loaded.has(vendor.id))
                continue;
            if (!choices[vendor.category])
                continue;
            if (!allowedHere(vendor)) {
                log(`skipped "${vendor.id}" — excluded on ${location.pathname}`);
                continue;
            }
            try {
                vendor.load({ choices, region, debug });
                loaded.add(vendor.id);
                log(`loaded "${vendor.id}"`);
            }
            catch (err) {
                console.error(`[consent-kit] vendor "${vendor.id}" failed to load`, err);
            }
        }
    }
    function apply(next, persist) {
        record = next;
        if (persist)
            void storage.save(next);
        loadVendors(next.choices, gated);
        config.onChange?.(next);
    }
    function decide(choices, implicit) {
        banner?.close();
        apply({ v: policyVersion, ts: Date.now(), choices, region, implicit }, true);
    }
    function isUsable(r) {
        if (!r)
            return false;
        if (r.v !== policyVersion) {
            log("stored choice is for an older policy version — asking again");
            return false;
        }
        if (Date.now() - r.ts > expiryDays * 86400000) {
            log("stored choice has expired — asking again");
            return false;
        }
        return true;
    }
    function ensureBanner() {
        if (config.ui === false)
            return null;
        if (!banner) {
            banner = createBanner({ ...(config.ui ?? {}), privacyUrl: config.ui?.privacyUrl ?? undefined }, {
                onAcceptAll: () => decide({ ...ALL }, false),
                onRefuseAll: () => decide({ ...NONE }, false),
                onSave: (choices) => decide(choices, false),
            }, config.locale, categories);
        }
        return banner;
    }
    const api = {
        acceptAll: () => decide({ ...ALL }, false),
        refuseAll: () => decide({ ...NONE }, false),
        set: (choices) => decide({ ...NONE, ...choices }, false),
        openSettings: () => {
            ensureBanner()?.openSettings();
        },
        get: () => record,
        reset: () => {
            void storage.clear?.();
            record = null;
            loaded.clear();
            ensureBanner()?.open();
        },
    };
    current = api;
    // Exempt vendors start straight away — no consent, no geo lookup, no wait.
    loadVendors({ analytics: true, marketing: true }, exempt);
    if (profile === "app" && (config.spa ?? true)) {
        trackRouteChanges((path) => {
            if (record?.choices.analytics)
                ga4PageView(path);
        });
    }
    void (async () => {
        const stored = await storage.load();
        if (isUsable(stored)) {
            region = stored.region;
            log(`restored choice (${stored.implicit ? "implicit" : "explicit"})`, stored.choices);
            apply(stored, false);
            return;
        }
        region = await geo();
        const needed = requiresConsent(region, regions);
        log(`country=${region ?? "unknown"} consent=${needed ? "required" : "not required"}`);
        if (!needed) {
            // Outside a consent region: grant, remember it so the next page skips the
            // lookup, and never show anything.
            decide({ ...ALL }, true);
            return;
        }
        ensureBanner()?.open();
    })();
    return api;
}
//# sourceMappingURL=index.js.map