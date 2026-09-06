import type { Category, Vendor } from "../types.js";

export { ga4, gtm, ga4PageView } from "./ga4.js";
export type { Ga4Options } from "./ga4.js";
export { clarity } from "./clarity.js";
export type { ClarityOptions } from "./clarity.js";

export interface CustomVendorOptions {
  id: string;
  category?: Category;
  load: () => void;
  exclude?: string[];
}

/** Escape hatch for anything without a built-in helper. */
export function custom(opts: CustomVendorOptions): Vendor {
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
export function cookieless(opts: {
  id: string;
  src: string;
  attrs?: Record<string, string>;
  requiresConsent?: boolean;
}): Vendor & { exempt: boolean } {
  return {
    id: opts.id,
    category: "analytics",
    exempt: !opts.requiresConsent,
    load: () => {
      const domId = `consent-kit-${opts.id}`;
      if (document.getElementById(domId)) return;
      const s = document.createElement("script");
      s.id = domId;
      s.defer = true;
      s.src = opts.src;
      for (const [k, v] of Object.entries(opts.attrs ?? {})) s.setAttribute(k, v);
      document.head.appendChild(s);
    },
  };
}
