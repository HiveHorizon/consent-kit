/** Consent categories. "necessary" is implicit and never asked about. */
export type Category = "analytics" | "marketing";
export interface Vendor {
    /** Stable id, e.g. "ga4". Used for logs and de-duplication. */
    id: string;
    category: Category;
    /**
     * Injects the vendor. Called at most once, only after its category is
     * granted. Must be safe to call on any page.
     */
    load: (ctx: VendorContext) => void;
    /**
     * Path prefixes where this vendor must never load, e.g. ["/search"].
     * Matched against location.pathname on a full page load.
     */
    exclude?: string[];
}
export interface VendorContext {
    /** Current consent choices at load time. */
    choices: ConsentChoices;
    /** ISO-3166 alpha-2 country, or null when it could not be determined. */
    region: string | null;
    debug: boolean;
}
export interface ConsentChoices {
    analytics: boolean;
    marketing: boolean;
}
export interface ConsentRecord {
    /** Policy version this record was given under. */
    v: string;
    /** Epoch ms when the choice was made. */
    ts: number;
    choices: ConsentChoices;
    /** Country at decision time, for audit purposes. */
    region: string | null;
    /**
     * true when granted automatically outside a consent region (the visitor was
     * never asked). Never true for a record produced by the banner.
     */
    implicit: boolean;
}
export interface StorageAdapter {
    load(): ConsentRecord | null | Promise<ConsentRecord | null>;
    save(record: ConsentRecord): void | Promise<void>;
    clear?(): void | Promise<void>;
}
export interface BannerText {
    title: string;
    body: string;
    acceptAll: string;
    refuseAll: string;
    customise: string;
    /** Used instead of `customise` when there is nothing to arbitrate. */
    details: string;
    save: string;
    privacyLink: string;
    analyticsTitle: string;
    analyticsBody: string;
    marketingTitle: string;
    marketingBody: string;
    necessaryTitle: string;
    necessaryBody: string;
    alwaysOn: string;
}
export interface BannerOptions {
    /** Overrides for any string in the default copy. */
    text?: Partial<BannerText>;
    /** URL of the privacy policy. The link is hidden when omitted. */
    privacyUrl?: string;
    /** Extra class on the root element, for site-specific CSS. */
    className?: string;
    /** Set false to skip the bundled stylesheet and style it entirely yourself. */
    styles?: boolean;
}
export interface ConsentConfig {
    /** Everything that may be loaded. Order is preserved. */
    vendors: Vendor[];
    /**
     * Where consent is required.
     * "eu"  → EU + EEA + UK + Switzerland (default)
     * "all" → everyone is asked
     * string[] → explicit ISO-3166 alpha-2 list
     */
    regions?: "eu" | "all" | string[];
    /**
     * Bump this to invalidate every stored choice and ask again — do it whenever
     * you add a vendor or change what you collect.
     */
    policyVersion?: string;
    /** How long a choice is remembered. CNIL recommends 6 months or less. */
    expiryDays?: number;
    /** Set to ".example.com" to share the choice across subdomains. */
    cookieDomain?: string;
    cookieName?: string;
    /** Defaults to a first-party cookie. Apps can store per account instead. */
    storage?: StorageAdapter;
    /** Country lookup. Defaults to Cloudflare's /cdn-cgi/trace. */
    geo?: () => Promise<string | null>;
    /**
     * "site" → nothing extra.
     * "app"  → masks the app root from session replay and tracks SPA route
     *          changes. Use for anything behind a login.
     */
    profile?: "site" | "app";
    /** Fire analytics page views on client-side navigation. Default: profile === "app". */
    spa?: boolean;
    /** Selector masked from session replay under profile "app". Default "#app". */
    appRoot?: string;
    /** false renders no UI — you drive it with accept()/refuse()/openSettings(). */
    ui?: BannerOptions | false;
    /** Defaults to the browser language, falling back to English. */
    locale?: "fr" | "en";
    /** Called on every resolved consent state, including restored ones. */
    onChange?: (record: ConsentRecord) => void;
    /** Logs decisions to the console. */
    debug?: boolean;
}
export interface ConsentApi {
    /** Grant everything. */
    acceptAll(): void;
    /** Deny everything. */
    refuseAll(): void;
    /** Apply an explicit set of choices. */
    set(choices: Partial<ConsentChoices>): void;
    /** Re-open the preferences panel — wire this to your footer link. */
    openSettings(): void;
    /** Current record, or null when the visitor has not decided yet. */
    get(): ConsentRecord | null;
    /** Forget the choice and start over (mainly for testing). */
    reset(): void;
}
