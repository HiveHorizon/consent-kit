/**
 * Countries where a consent banner is shown by default.
 *
 * This is an operational list, not a legal definition. It covers the EU, the
 * rest of the EEA, the UK and Switzerland — the jurisdictions whose rules are
 * close enough to be handled identically. Adjust it deliberately.
 */
export declare const EU_EEA_UK_CH: readonly string[];
export declare function resolveRegions(regions: "eu" | "all" | string[] | undefined): "all" | Set<string>;
/**
 * Fail closed: an unknown country is treated as requiring consent, so a blocked
 * geo lookup or an unexpected value can never silently disable the banner.
 */
export declare function requiresConsent(country: string | null, regions: "all" | Set<string>): boolean;
