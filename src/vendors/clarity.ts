import type { Vendor } from "../types.js";

export interface ClarityOptions {
  exclude?: string[];
  /**
   * Selector masked from replay before Clarity starts. Everything inside it is
   * recorded as blocks instead of text.
   *
   * Under profile "app" this defaults to the app root, because in a logged-in
   * app the screen is full of customer data and masking node by node does not
   * scale. Unmask your chrome (nav, buttons, empty states) with
   * data-clarity-unmask="true" to get the interaction detail back.
   */
  maskRoot?: string | null;
}

/**
 * Microsoft Clarity (session replay + heatmaps).
 *
 * Notes that matter:
 * - Clarity records the page URL verbatim and its URL-parameter masking is not
 *   self-serve, so keep sensitive values out of URLs — or list the path in
 *   `exclude`.
 * - Once loaded it keeps recording across client-side navigation. `exclude`
 *   therefore only protects full page loads.
 * - Never call clarity("identify", …) with an email. Use an opaque id.
 */
export function clarity(projectId: string, opts: ClarityOptions = {}): Vendor {
  return {
    id: "clarity",
    category: "analytics",
    exclude: opts.exclude,
    load: ({ debug }) => {
      if (opts.maskRoot) {
        const root = document.querySelector(opts.maskRoot);
        if (root) {
          root.setAttribute("data-clarity-mask", "true");
        } else if (debug) {
          console.warn(
            `[consent-kit] clarity maskRoot "${opts.maskRoot}" not found; ` +
              "replay may capture unmasked content.",
          );
        }
      }
      if (document.getElementById("consent-kit-clarity")) return;
      const w = window as unknown as Record<string, any>;
      w.clarity =
        w.clarity ||
        function () {
          (w.clarity.q = w.clarity.q || []).push(arguments);
        };
      const s = document.createElement("script");
      s.id = "consent-kit-clarity";
      s.async = true;
      s.src = `https://www.clarity.ms/tag/${encodeURIComponent(projectId)}`;
      document.head.appendChild(s);
    },
  };
}
