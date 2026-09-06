import type { ConsentApi, ConsentConfig, ConsentRecord } from "./types.js";
export * from "./types.js";
export { EU_EEA_UK_CH } from "./regions.js";
export { cookieStorage, accountStorage, memoryStorage } from "./storage.js";
export { cloudflareTrace, staticGeo, noGeo } from "./geo.js";
export { ga4, gtm, clarity, custom, cookieless } from "./vendors/index.js";
/** Reopens the preferences panel. Wire this to your "Cookie settings" link. */
export declare function openConsentSettings(): void;
/** The active consent record, or null before a decision. */
export declare function getConsent(): ConsentRecord | null;
export declare function initConsent(config: ConsentConfig): ConsentApi;
