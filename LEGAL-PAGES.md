# The pages the banner promises

A banner is a claim about what the site does. If the pages behind it are
missing, or describe something else, the banner is worse than nothing — it
states a commitment the site cannot show.

This is the checklist for the pages, and the copy blocks that match what the kit
actually does. Not legal advice: it is the engineering half, written so the legal
half has something accurate to start from.

---

## What must exist

| Page | Needed when | Why |
| --- | --- | --- |
| **Privacy policy** | Always | `ui.privacyUrl` points at it. It must name every vendor and say what is collected, for how long, and how to object. |
| **Legal notice** (mentions légales) | Any French professional site | Law n° 2004-575: publisher, address, company number, contact, hosting provider. Separate from the privacy policy. |
| **Terms of service** | Accounts, payments or an API | Not required by the consent rules, but the page people look for from a banner, and it must be reachable before a purchase. |

Under `debug: true` the kit checks the first of these at runtime: it warns when
`ui.privacyUrl` is unset, when it returns a non-200, and when the current page
carries no control to reopen the preferences.

---

## Where the control must be reachable

Consent has to be withdrawable **at any time, and as easily as it was given**.
In practice this fails in one specific way: layouts without a footer.

Check every layout, not every page. The usual gaps:

- the checkout or upgrade page — the worst one, because terms must be reachable
  before payment
- the sign-in page
- any full-screen or embedded layout

Bind once, globally, rather than per component:

```ts
// in the single layout every page passes through
document.querySelectorAll("[data-cookie-settings]").forEach((el) => {
  el.addEventListener("click", openConsentSettings);
});
```

Then any `<button data-cookie-settings>` works anywhere, with no extra script.
Binding it inside one footer component is what causes the gaps above: each new
placement silently needs its own handler.

For a site with accounts, also put it in the account area. A signed-in person
looks for this in their settings, not in the footer.

---

## What the privacy policy must say

The paragraphs below match the kit's real behaviour. Adjust the vendor rows to
what the site actually declares.

### The vendor table

> | Tool | Provider | What it does | Consent |
> | --- | --- | --- | --- |
> | Umami | Self-hosted by us | Counts page views. Sets no cookie, does not track you across sites, and the data never leaves our own server. | Not required |
> | Google Analytics 4 | Google Ireland Ltd | Audience measurement: pages viewed, journeys, approximate location. | Required |
> | Microsoft Clarity | Microsoft Corp. | Aggregated heatmaps and session replays. | Required |

Name the legal entity, not the product. Say plainly which ones require consent.

### The sentence that describes this kit

> Google Analytics and Clarity are **not loaded at all until you accept them**.
> They are not merely paused: the scripts are absent from the page.

This is worth stating because it is unusual, it is true here, and it is the
strongest thing the site can say. Do not write it if the site also loads a tag
manager that fires before consent — check first.

Add the transfer note where a vendor is outside the EU:

> Both providers may transfer data outside the European Union, under the
> safeguards their own terms describe.

### The cookie table

> | Name | Purpose | Kept for |
> | --- | --- | --- |
> | `consent_prefs` | Remembers your analytics choice, so you are not asked again. Strictly necessary. | 6 months |

Match the retention to `expiryDays`. If `cookieDomain` is set, say the choice is
shared across subdomains. Add the site's own session entries, and say where they
live — a token in browser storage is not a cookie, and claiming otherwise is
inaccurate.

### If session replay runs

Say what it is prevented from recording, and be specific:

> Session replay films the page, so we deliberately keep your data out of it.
> The following are masked before anything is sent: […]

List the masked surfaces and any path where replay is disabled outright. A vague
"we protect your data" is unverifiable; a list can be checked against the code.

### Withdrawal

> Use the **Cookies** link in the footer, at any time. Refusing analytics never
> affects your ability to sign in or use the site.

That second sentence matters. People accept out of fear that refusing breaks
their account, and consent given to avoid a feared consequence is not freely
given.

---

## Keeping the pages from drifting

Put the entity details in one module and have every legal page read from it:

```ts
// src/data/legal.ts
export const COMPANY = {
  name: "…",
  address: "…",
  siren: "…",
  email: "…",
} as const;

export const LAST_UPDATED = "…";
```

Three hand-maintained copies is how a site ends up naming a company it no longer
trades as. One module, three pages, one edit.

---

## When a policy needs updating

Bump `policyVersion` and revise the pages whenever any of these change — the
first two are the ones that get forgotten:

- a vendor is added, removed, or swapped for another
- a vendor starts collecting something new (session replay added to plain analytics)
- retention changes, or `expiryDays` changes
- the operating entity, its address or its contact changes
- a new surface starts handling personal data (an audit tool, an import, an upload)

Bumping `policyVersion` re-asks everyone. That is the point: consent was given
against a description, and the description changed.

---

## Quick audit of an existing site

```sh
# 1. do the pages exist at all?
ls src/pages/{privacy,legal,terms}.astro 2>/dev/null

# 2. does anything still name a former entity, address or jurisdiction?
grep -rniE "previous company|old address|former city" src/pages

# 3. is a control present in every layout?
grep -rl "data-cookie-settings" src/layouts src/components

# 4. does the policy name every vendor the config declares?
grep -oE '(ga4|gtm|clarity|cookieless)\(' src/lib/consent.ts
grep -ciE "google analytics|clarity|umami" src/pages/privacy.astro
```

Then load a page with `debug: true` and read the console: the kit reports a
missing policy link, a policy URL that 404s, and a page with no way to reopen
the preferences.
