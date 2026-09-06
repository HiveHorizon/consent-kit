import type { Vendor } from "../types.js";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function ensureGtag(): (...args: unknown[]) => void {
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      // Must push `arguments` itself, not an array copy — gtag relies on it.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }
  return window.gtag;
}

function injectScript(src: string, id: string): void {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
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
export function ga4(measurementId: string, opts: Ga4Options = {}): Vendor {
  return {
    id: "ga4",
    category: "analytics",
    exclude: opts.exclude,
    load: ({ choices }) => {
      const gtag = ensureGtag();
      gtag("consent", "default", {
        ad_storage: choices.marketing ? "granted" : "denied",
        ad_user_data: choices.marketing ? "granted" : "denied",
        ad_personalization: choices.marketing ? "granted" : "denied",
        analytics_storage: "granted",
      });
      injectScript(
        `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`,
        "consent-kit-ga4",
      );
      gtag("js", new Date());
      gtag("config", measurementId, {
        send_page_view: opts.autoPageView !== false,
        ...opts.config,
      });
    },
  };
}

/** Google Tag Manager. Prefer this OR ga4(), not both. */
export function gtm(containerId: string, opts: { exclude?: string[] } = {}): Vendor {
  return {
    id: "gtm",
    category: "analytics",
    exclude: opts.exclude,
    load: ({ choices }) => {
      const gtag = ensureGtag();
      gtag("consent", "default", {
        ad_storage: choices.marketing ? "granted" : "denied",
        ad_user_data: choices.marketing ? "granted" : "denied",
        ad_personalization: choices.marketing ? "granted" : "denied",
        analytics_storage: choices.analytics ? "granted" : "denied",
      });
      window.dataLayer!.push({
        "gtm.start": Date.now(),
        event: "gtm.js",
      });
      injectScript(
        `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`,
        "consent-kit-gtm",
      );
    },
  };
}

/** Fires a GA4 page_view. Used by the SPA route tracker. */
export function ga4PageView(path: string): void {
  window.gtag?.("event", "page_view", {
    page_path: path,
    page_location: location.href,
    page_title: document.title,
  });
}
