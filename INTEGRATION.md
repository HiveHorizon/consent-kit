# Integrating consent-kit

How to wire consent-kit into a site or an app.

Repo: `github:HiveHorizon/consent-kit`

---

## 1. Install

```sh
pnpm add github:HiveHorizon/consent-kit#v1.2.2
```

Pin a tag (`#v1.0.0`) so an update to the kit can never change a site's behaviour
without someone deciding it. To upgrade: bump the tag, `pnpm install`, verify,
commit.

No runtime dependencies, and no build step at install time.

---

## 2. Remove the existing scripts

**This is the most important step and the easiest one to get wrong.** As long as a
GA4 / GTM / Clarity `<script>` sits in `<head>`, it loads before any consent and
the kit achieves nothing.

Find and delete, in layouts and `index.html`:

- `googletagmanager.com/gtm.js` and its `<noscript>` twin in `<body>`
- `googletagmanager.com/gtag/js`
- the `window.dataLayer = ... gtag('config', ...)` block
- `clarity.ms/tag/`
- any other pixel (Meta, LinkedIn, Hotjar…)

Write the ids down as you go — they move into the config.

**Keep** self-hosted, cookieless analytics (Umami, Plausible). Declare them with
`cookieless()` and they keep running for everyone.

---

## 3. Write the config

One file per project, so everything lives in one place.

If the site has accounts, say so in the "strictly necessary" copy — people
hesitate to refuse when they fear it will log them out:

```ts
ui: {
  text: {
    necessaryBody:
      "Required for the site to work: keeping you signed in, and remembering " +
      "the choice you make here. Refusing analytics affects neither.",
  },
}
```

Refusing never touches sign-in: the kit only decides which analytics scripts are
injected, and never reads or writes the session.

### Marketing site

`src/lib/consent.ts`

```ts
import { initConsent, ga4, clarity } from "@hivehorizon/consent-kit";

export function setupConsent() {
  return initConsent({
    profile: "site",
    policyVersion: "2026-09",
    cookieDomain: ".example.com", // when the site and the app share a root domain
    ui: { privacyUrl: "/privacy" },
    vendors: [
      ga4("G-XXXXXXXXXX"),
      clarity("xxxxxxxxxx", { exclude: ["/search", "/admin"] }),
    ],
  });
}
```

### Web app (behind a login)

```ts
import { initConsent, ga4, clarity, accountStorage } from "@hivehorizon/consent-kit";
import { api } from "./api";

export function setupConsent() {
  return initConsent({
    profile: "app",       // masks the app for replay + tracks client-side routes
    appRoot: "#app",
    policyVersion: "2026-09",
    cookieDomain: ".example.com",
    ui: { privacyUrl: "https://example.com/privacy" },

    // The choice follows the person across devices
    storage: accountStorage({
      load: () => api.get("/me/consent"),
      save: (record) => api.put("/me/consent", record),
      cookie: { domain: ".example.com" },
    }),

    vendors: [
      ga4("G-XXXXXXXXXX"),
      clarity("xxxxxxxxxx", { maskRoot: "#app" }),
    ],
  });
}
```

For `accountStorage`, the server side is a JSON column on the user row
(`consent`) plus a `GET` and a `PUT`. No dedicated table, no dedicated service.
When both copies exist the newer one wins — without that, signing in on a second
device would overwrite a more recent choice.

---

## 4. Call it on startup

**Astro** — in `BaseLayout.astro`, before `</body>`:

```astro
<script>
  import { setupConsent } from "../lib/consent";
  setupConsent();
</script>
```

**Vue / React SPA** — in `main.ts`, after mounting:

```ts
app.mount("#app");
setupConsent();
```

Order matters for an app: `maskRoot` needs `#app` to exist already.

---

## 5. Footer "Cookies" link

Required: people must be able to change their mind at any time.

```html
<button type="button" id="cookie-settings">Cookies</button>
<script>
  import { openConsentSettings } from "@hivehorizon/consent-kit";
  document.getElementById("cookie-settings")
    ?.addEventListener("click", openConsentSettings);
</script>
```

Bind it once in the layout every page passes through, rather than inside the
footer component — otherwise each new placement needs its own script, and any
layout without a footer silently ends up with no control at all:

```ts
document.querySelectorAll("[data-cookie-settings]").forEach((el) => {
  el.addEventListener("click", openConsentSettings);
});
```

---

## 6. Check the pages the banner promises

The banner links to a privacy policy and claims nothing loads without consent.
Both have to be true and visible, or the banner is worse than none.

- **Privacy policy** — must exist and name every vendor declared in the config.
- **Legal notice** — required for any French professional site, and separate
  from the privacy policy.
- **Terms** — reachable before a purchase.
- **The Cookies control** — present in *every layout*, not every page. Checkout
  and sign-in layouts are the ones that lack a footer.

**[LEGAL-PAGES.md](./LEGAL-PAGES.md)** has the checklist, the copy blocks that
match what the kit actually does, and a shell audit for an existing site.

With `debug: true` the kit checks part of this out loud, and warns when the
policy link is missing, returns a non-200, or when the page has no control to
reopen the preferences.

---

## 7. Verify

The test that counts is network behaviour, not whether the banner looks right.
Open devtools, Network tab:

| Situation | Expected |
| --- | --- |
| From France, no choice made | Banner visible. **Zero** requests to `googletagmanager.com` or `clarity.ms`. |
| Click "Refuse all" | Banner goes. Still zero requests. Reload: no banner, no requests. |
| Click "Accept all" | GA4 / Clarity requests fire. Reload: they fire again, no banner. |
| From the US (VPN) | No banner. Requests fire immediately. |
| On an `exclude`d path | The listed vendor does not load, the others do. |

Force a country without a VPN, in development:

```ts
import { staticGeo } from "@hivehorizon/consent-kit";
initConsent({ geo: staticGeo("FR"), debug: true, /* … */ });
```

`debug: true` explains every decision in the console.

Start over. A stored choice suppresses the banner on purpose, so after one click
it will not come back until you clear it:

```js
// in the browser console
document.cookie = "consent_prefs=; path=/; max-age=0"; location.reload();
```

With `debug: true` the API is also on `window`, so `__consent.reset()` reopens the
banner without a reload.

---

## 8. Keep it current

Bump `policyVersion` and revise the policy pages whenever a vendor is added or
removed, a vendor starts collecting something new, retention changes, or the
operating entity changes. Bumping re-asks everyone — which is the point, since
consent was given against a description that has now changed.

---

## Options reference

| Option | Default | Purpose |
| --- | --- | --- |
| `vendors` | — | Everything that may be loaded. |
| `regions` | `"eu"` | `"eu"`, `"all"`, or an explicit country list. |
| `policyVersion` | `"1"` | Bump it and everyone is asked again. |
| `expiryDays` | `180` | How long a choice is remembered. Regulators suggest 6 months or less. |
| `cookieDomain` | — | `".example.com"` to share across subdomains. |
| `storage` | cookie | `accountStorage()` for apps with accounts. |
| `geo` | Cloudflare | `staticGeo("FR")` in development. |
| `profile` | `"site"` | `"app"` = replay masking + route tracking. |
| `appRoot` | `"#app"` | Element masked under profile `"app"`. |
| `ui` | banner | `false` to drive the UI yourself. |

The banner adapts to what you declare: with a single consent category the
"customise" link is hidden, because refusing and accepting already express the
whole choice. Declare a `marketing` vendor and it appears.
| `locale` | `<html lang>`, then browser | `"fr"` or `"en"`. |
| `onChange` | — | Called on every resolved consent state. |
| `debug` | `false` | Logs decisions to the console. |

### Vendors

| Function | Use |
| --- | --- |
| `ga4(id, { exclude, config })` | Google Analytics 4. |
| `gtm(id, { exclude })` | Google Tag Manager. Either `gtm` or `ga4`, not both. |
| `clarity(id, { exclude, maskRoot })` | Microsoft Clarity. |
| `cookieless({ id, src, attrs })` | Umami / Plausible. Loads for everyone. |
| `custom({ id, category, load })` | Anything else. |

---

## Pitfalls

**Clarity and URLs.** Clarity records the page URL verbatim, and masking a URL
parameter is not self-serve at Microsoft. If a sensitive value ends up in
`?param=` (a searched domain, an email), put the path in `exclude`.

**`exclude` does not work in a SPA.** Once Clarity is loaded it keeps recording
across client-side navigation. In an app: never put a sensitive value in the URL,
and rely on `maskRoot` rather than `exclude`.

**Do not restyle the banner into something unfair.** "Refuse all" must stay as
prominent as "Accept all" — this is the single most fined mistake. The CSS
variables let you reskin without touching that balance.

**Never identify anyone by email.** `clarity("identify", …)` or
`gtag('set', {user_id})`: pass an opaque id, never an address.

---

## Disclaimer

This kit is an engineering tool, not legal advice, and installing it does not by
itself make a site compliant. Whether your setup is lawful depends on your
configuration, the tools you run, your privacy policy and the rules that apply
where your visitors are.

Always confirm the actual behaviour in the Network tab (step 6) before relying on
it. The software is provided "as is", with no warranty and no liability — see
[LICENSE](./LICENSE).
