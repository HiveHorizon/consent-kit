/**
 * Behavioural tests for the consent flow.
 *
 * Runs on plain Node against a minimal DOM stub — enough for cookies, vendor
 * injection and the geo lookup. The banner UI is switched off (ui:false) so the
 * tests assert on decisions, not markup.
 *
 *   node test/run.mjs
 */
import assert from "node:assert/strict";

const results = [];
let currentName = "";

async function test(name, fn) {
  currentName = name;
  try {
    await fn();
    results.push(["pass", name]);
  } catch (err) {
    results.push(["FAIL", name, err]);
  }
}

// ---------------------------------------------------------------- DOM stub --

function installDom({ country = "FR", traceOk = true, path = "/" } = {}) {
  const cookies = new Map();

  const makeEl = () => ({
    id: "",
    async: false,
    defer: false,
    src: "",
    textContent: "",
    _attrs: {},
    setAttribute(k, v) {
      this._attrs[k] = v;
    },
    getAttribute(k) {
      return this._attrs[k] ?? null;
    },
    appendChild() {},
    append() {},
    remove() {},
    focus() {},
    querySelector: () => null,
  });

  const head = { children: [], appendChild(el) { this.children.push(el); } };
  const body = { appendChild() {} };

  globalThis.document = {
    head,
    body,
    activeElement: null,
    createElement: makeEl,
    getElementById(id) {
      return head.children.find((c) => c.id === id) ?? null;
    },
    querySelector: () => null,
    get cookie() {
      return [...cookies].map(([k, v]) => `${k}=${v}`).join("; ");
    },
    set cookie(str) {
      const [pair, ...attrs] = str.split("; ");
      const eq = pair.indexOf("=");
      const name = pair.slice(0, eq);
      const value = pair.slice(eq + 1);
      if (attrs.some((a) => a.toLowerCase() === "max-age=0")) cookies.delete(name);
      else cookies.set(name, value);
    },
  };

  globalThis.location = { pathname: path, search: "", href: `https://x.test${path}`, protocol: "https:" };
  globalThis.window = { document: globalThis.document, location: globalThis.location };
  // Node exposes navigator as a getter-only global, so redefine it.
  Object.defineProperty(globalThis, "navigator", {
    value: { language: "en-GB" },
    configurable: true,
    writable: true,
  });

  let traceCalls = 0;
  globalThis.fetch = async (url) => {
    if (String(url).includes("/cdn-cgi/trace")) {
      traceCalls++;
      if (!traceOk) throw new Error("blocked");
      return { ok: true, text: async () => `fl=abc\nloc=${country}\nvisit_scheme=https` };
    }
    throw new Error(`unexpected fetch: ${url}`);
  };

  return {
    cookies,
    head,
    traceCalls: () => traceCalls,
  };
}

const settle = () => new Promise((r) => setTimeout(r, 5));

function spyVendor(id, extra = {}) {
  const v = {
    id,
    category: "analytics",
    loaded: 0,
    load() {
      v.loaded++;
    },
    ...extra,
  };
  return v;
}

// ------------------------------------------------------------------ tests --

const { initConsent, cookieless } = await import("../dist/index.js");

await test("outside a consent region: vendors load, nothing is asked", async () => {
  const dom = installDom({ country: "US" });
  const ga = spyVendor("ga4");
  const api = initConsent({ vendors: [ga], ui: false, policyVersion: "1" });
  await settle();
  assert.equal(ga.loaded, 1, "vendor should load");
  const rec = api.get();
  assert.ok(rec, "a record should be stored");
  assert.equal(rec.implicit, true, "granted without being asked");
  assert.equal(rec.choices.analytics, true);
  assert.equal(rec.region, "US");
  assert.ok(dom.cookies.has("consent_prefs"), "choice is remembered");
});

await test("inside a consent region: nothing loads until a choice is made", async () => {
  installDom({ country: "FR" });
  const ga = spyVendor("ga4");
  const api = initConsent({ vendors: [ga], ui: false });
  await settle();
  assert.equal(ga.loaded, 0, "vendor must not load before consent");
  assert.equal(api.get(), null, "no record yet");
});

await test("accepting in a consent region loads the vendor", async () => {
  installDom({ country: "DE" });
  const ga = spyVendor("ga4");
  const api = initConsent({ vendors: [ga], ui: false });
  await settle();
  assert.equal(ga.loaded, 0);
  api.acceptAll();
  assert.equal(ga.loaded, 1);
  const rec = api.get();
  assert.equal(rec.implicit, false, "an explicit choice is never implicit");
  assert.equal(rec.choices.analytics, true);
});

await test("refusing keeps everything off and is remembered", async () => {
  const dom = installDom({ country: "FR" });
  const ga = spyVendor("ga4");
  const api = initConsent({ vendors: [ga], ui: false });
  await settle();
  api.refuseAll();
  assert.equal(ga.loaded, 0, "refusal must load nothing");
  assert.ok(dom.cookies.has("consent_prefs"), "refusal is remembered too");
  assert.equal(api.get().choices.analytics, false);
});

await test("unknown country fails closed (consent required)", async () => {
  installDom({ traceOk: false });
  const ga = spyVendor("ga4");
  const api = initConsent({ vendors: [ga], ui: false });
  await settle();
  assert.equal(ga.loaded, 0, "a blocked geo lookup must not grant consent");
  assert.equal(api.get(), null);
});

await test("a stored choice is reused without a geo lookup", async () => {
  const dom = installDom({ country: "FR" });
  const first = initConsent({ vendors: [spyVendor("ga4")], ui: false, policyVersion: "1" });
  await settle();
  first.acceptAll();
  const callsAfterFirst = dom.traceCalls();

  const ga2 = spyVendor("ga4");
  const second = initConsent({ vendors: [ga2], ui: false, policyVersion: "1" });
  await settle();
  assert.equal(ga2.loaded, 1, "stored acceptance should load the vendor");
  assert.equal(dom.traceCalls(), callsAfterFirst, "no second geo lookup");
  assert.equal(second.get().choices.analytics, true);
});

await test("bumping policyVersion asks again", async () => {
  installDom({ country: "FR" });
  const a = initConsent({ vendors: [spyVendor("ga4")], ui: false, policyVersion: "1" });
  await settle();
  a.acceptAll();

  const ga2 = spyVendor("ga4");
  const b = initConsent({ vendors: [ga2], ui: false, policyVersion: "2" });
  await settle();
  assert.equal(ga2.loaded, 0, "old consent must not carry over");
  assert.equal(b.get(), null);
});

await test("an expired choice asks again", async () => {
  const dom = installDom({ country: "FR" });
  const stale = {
    v: "1",
    ts: Date.now() - 400 * 86400000,
    choices: { analytics: true, marketing: true },
    region: "FR",
    implicit: false,
  };
  dom.cookies.set("consent_prefs", encodeURIComponent(JSON.stringify(stale)));
  const ga = spyVendor("ga4");
  const api = initConsent({ vendors: [ga], ui: false, policyVersion: "1", expiryDays: 180 });
  await settle();
  assert.equal(ga.loaded, 0);
  assert.equal(api.get(), null);
});

await test("excluded paths never load the vendor", async () => {
  installDom({ country: "US", path: "/search" });
  const ga = spyVendor("ga4");
  const clarity = spyVendor("clarity", { exclude: ["/search", "/admin"] });
  initConsent({ vendors: [ga, clarity], ui: false });
  await settle();
  assert.equal(ga.loaded, 1, "unrestricted vendor still loads");
  assert.equal(clarity.loaded, 0, "excluded vendor must be skipped");
});

await test("exclusion matches sub-paths but not lookalikes", async () => {
  installDom({ country: "US", path: "/admin/users" });
  const v = spyVendor("clarity", { exclude: ["/admin"] });
  initConsent({ vendors: [v], ui: false });
  await settle();
  assert.equal(v.loaded, 0, "/admin/users is under /admin");

  installDom({ country: "US", path: "/administration" });
  const v2 = spyVendor("clarity", { exclude: ["/admin"] });
  initConsent({ vendors: [v2], ui: false });
  await settle();
  assert.equal(v2.loaded, 1, "/administration is a different page");
});

await test("cookieless vendors load before any consent, even in the EU", async () => {
  installDom({ country: "FR" });
  let loaded = 0;
  const umami = cookieless({ id: "umami", src: "https://u.test/script.js" });
  umami.load = () => loaded++;
  const ga = spyVendor("ga4");
  initConsent({ vendors: [umami, ga], ui: false });
  await settle();
  assert.equal(loaded, 1, "exempt vendor loads immediately");
  assert.equal(ga.loaded, 0, "gated vendor still waits");
});

await test("regions:'all' asks everyone", async () => {
  installDom({ country: "US" });
  const ga = spyVendor("ga4");
  const api = initConsent({ vendors: [ga], ui: false, regions: "all" });
  await settle();
  assert.equal(ga.loaded, 0);
  assert.equal(api.get(), null);
});

await test("a custom region list is honoured", async () => {
  installDom({ country: "BR" });
  const ga = spyVendor("ga4");
  const api = initConsent({ vendors: [ga], ui: false, regions: ["BR", "FR"] });
  await settle();
  assert.equal(ga.loaded, 0, "BR is in the list, so consent is required");

  installDom({ country: "US" });
  const ga2 = spyVendor("ga4");
  initConsent({ vendors: [ga2], ui: false, regions: ["BR", "FR"] });
  await settle();
  assert.equal(ga2.loaded, 1, "US is not in the list");
  assert.ok(api);
});

await test("partial choices load only the granted category", async () => {
  installDom({ country: "FR" });
  const analytics = spyVendor("ga4", { category: "analytics" });
  const ads = spyVendor("pixel", { category: "marketing" });
  const api = initConsent({ vendors: [analytics, ads], ui: false });
  await settle();
  api.set({ analytics: true });
  assert.equal(analytics.loaded, 1);
  assert.equal(ads.loaded, 0, "marketing was not granted");
});

await test("a vendor is never loaded twice", async () => {
  installDom({ country: "FR" });
  const ga = spyVendor("ga4");
  const api = initConsent({ vendors: [ga], ui: false });
  await settle();
  api.acceptAll();
  api.acceptAll();
  api.set({ analytics: true });
  assert.equal(ga.loaded, 1, "load must be idempotent");
});

await test("a throwing vendor does not break the others", async () => {
  installDom({ country: "US" });
  const bad = { id: "bad", category: "analytics", load() { throw new Error("boom"); } };
  const good = spyVendor("good");
  const origError = console.error;
  console.error = () => {};
  initConsent({ vendors: [bad, good], ui: false });
  await settle();
  console.error = origError;
  assert.equal(good.loaded, 1, "a failing vendor must not stop the rest");
});

// ----------------------------------------------------------------- report --

let failed = 0;
for (const [status, name, err] of results) {
  if (status === "pass") {
    console.log(`  ok   ${name}`);
  } else {
    failed++;
    console.log(`  FAIL ${name}`);
    console.log(`       ${err.message}`);
  }
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
