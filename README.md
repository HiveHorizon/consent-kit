# consent-kit

Self-hosted cookie consent, shared across sites and apps. No third-party CMP, no
service to run, no runtime dependencies.

**→ [INTEGRATION.md](./INTEGRATION.md) to wire it into a project.**

## What it does

```
                          Visitor
                             │
              ┌──────────────┴──────────────┐
              │   choice already stored?    │
              └──────────────┬──────────────┘
                    yes │           │ no
                        │           │
                    apply it   country via /cdn-cgi/trace
                                     │
                      ┌──────────────┴──────────────┐
                 Europe / unknown             rest of world
                        │                            │
                     banner                 everything starts,
                nothing is loaded                no banner
                        │
              ┌─────────┴─────────┐
           Accept              Refuse
              │                   │
        GA4 + Clarity        nothing, ever
```

The country comes from `/cdn-cgi/trace`, served by any Cloudflare-proxied zone:
same-origin, no key, no cookie, nothing sent to a third party. If the lookup fails
— ad blocker, network, zone not proxied — the banner is shown. **When in doubt,
protect.**

Inside a consent region, no vendor `<script>` is inserted into the page until the
visitor accepts. Not "loaded but paused": absent.

## Usage

```sh
pnpm add github:HiveHorizon/consent-kit#v1.1.0
```

```ts
import { initConsent, ga4, clarity } from "@hivehorizon/consent-kit";

initConsent({
  policyVersion: "2026-09",
  ui: { privacyUrl: "/privacy" },
  vendors: [
    ga4("G-XXXXXXXXXX"),
    clarity("xxxxxxxxxx", { exclude: ["/search", "/admin"] }),
  ],
});
```

For an app behind a login, `profile: "app"` masks the screen from session replay
and stores the choice on the user's account rather than in the browser. See
[INTEGRATION.md](./INTEGRATION.md).

## Design decisions

**No Cloudflare Worker.** A same-origin request to `/cdn-cgi/trace` is enough, and
it avoids having to vary the cache by country or put code between every visitor
and every page.

**No Google "advanced consent mode".** Advanced mode still loads gtag.js and sends
pings before any agreement. Here the script does not exist until consent is given:
simpler to explain, simpler to defend.

**No consent server.** A first-party cookie is enough for a site. For an app the
choice goes in the user's own row of the app's existing database — not in yet
another service to maintain.

**Fail closed.** Any uncertainty about the country leads to the banner.

## Compliance

The kit implements the rules regulators actually fine for:

- "Refuse all" the same size and visual weight as "Accept all"
- no dismiss cross — closing is not consenting
- nothing pre-ticked
- refusals remembered as long as acceptances (180 days by default)
- `openConsentSettings()` so anyone can change their mind at any time

These are engineering choices, not legal advice. Still yours: the privacy policy,
and the judgement call on which tools you run.

## Localisation

The banner ships with English and French copy. It follows the page's own
`<html lang>` first and only falls back to the browser language, so a
French-speaking visitor on an English-only site still reads English. Override it
with `locale`, or replace any string through `ui.text`.

## Development

```sh
pnpm install
pnpm test        # 16 behavioural tests, no browser needed
pnpm build
pnpm typecheck
```

Any change to the decision logic must be covered by a test in `test/run.mjs`.

## Licence

MIT — see [LICENSE](./LICENSE).

## Disclaimer

This software is provided "as is", without warranty of any kind, express or
implied. The authors and copyright holders accept no liability for any claim,
damage, loss, penalty or other liability arising from the use of this software,
whether in contract, tort or otherwise.

**This is an engineering tool, not legal advice, and it does not make a site
compliant on its own.** Whether your use of analytics is lawful depends on how
you configure the kit, which tools you actually run, what your privacy policy
says, and the rules that apply where your visitors are — none of which this
software can determine for you.

Anyone deploying it is solely responsible for their own compliance, and for
verifying that the behaviour matches what their site tells visitors. Verify it in
the Network tab before relying on it (see
[INTEGRATION.md](./INTEGRATION.md#6-verify)). If compliance matters to your
business, get it reviewed by a qualified professional.
