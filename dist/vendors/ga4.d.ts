import type { Vendor } from "../types.js";
declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
    }
}
export interface Ga4Options {
    exclude?: string[];
    /** Extra config passed to gtag('config', id, …). */
    config?: Record<string, unknown>;
    /** Set false to send the initial page_view yourself. */
    autoPageView?: boolean;
}
/**
 * Google Analytics 4.
 *
 * The tag is only injected once analytics consent is granted, so there is no
 * pre-consent network call. Consent Mode signals are still set, because GA4
 * behaves differently (and correctly) when it sees them.
 */
export declare function ga4(measurementId: string, opts?: Ga4Options): Vendor;
/** Google Tag Manager. Prefer this OR ga4(), not both. */
export declare function gtm(containerId: string, opts?: {
    exclude?: string[];
}): Vendor;
/** Fires a GA4 page_view. Used by the SPA route tracker. */
export declare function ga4PageView(path: string): void;
