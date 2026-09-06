/**
 * Countries where a consent banner is shown by default.
 *
 * This is an operational list, not a legal definition. It covers the EU, the
 * rest of the EEA, the UK and Switzerland — the jurisdictions whose rules are
 * close enough to be handled identically. Adjust it deliberately.
 */
export const EU_EEA_UK_CH: readonly string[] = [
  // European Union
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI",
  "FR", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT",
  "NL", "PL", "PT", "RO", "SE", "SI", "SK",
  // Rest of the EEA
  "IS", "LI", "NO",
  // Comparable regimes
  "GB", "CH",
];

export function resolveRegions(
  regions: "eu" | "all" | string[] | undefined,
): "all" | Set<string> {
  if (regions === "all") return "all";
  if (Array.isArray(regions)) {
    return new Set(regions.map((c) => c.toUpperCase()));
  }
  return new Set(EU_EEA_UK_CH);
}

/**
 * Fail closed: an unknown country is treated as requiring consent, so a blocked
 * geo lookup or an unexpected value can never silently disable the banner.
 */
export function requiresConsent(
  country: string | null,
  regions: "all" | Set<string>,
): boolean {
  if (regions === "all") return true;
  if (!country) return true;
  return regions.has(country.toUpperCase());
}
