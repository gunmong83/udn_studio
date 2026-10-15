// Actual route handlers + isolated SQLite. No live payment/email/AlimTalk calls.
const { test, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const { execFileSync } = require("node:child_process");
const { createHash } = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");
const web = path.resolve(__dirname, "..");
const req = createRequire(path.join(web, "package.json"));
const ts = req("typescript");
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "udn-analytics-test-"));
process.env.DATABASE_URL = `file:${path.join(fixture, "test.db").replaceAll("\\", "/")}`;
process.env.AUTH_SECRET = "analytics-isolated-fixture-secret";
process.env.AUTH_URL = "https://shop.example.test";
let signedUser = null;
let mailCount = 0;
const cache = new Map();
const digest = (value) => createHash("sha256").update(value).digest("hex");
const niceConfig = { clientId: "fixture-client", secretKey: "fixture-secret", apiBaseUrl: "https://payments.invalid" };
function load(file) {
  const filename = path.join(web, file);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} }; cache.set(filename, module);
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX }, fileName: filename }).outputText;
  const localRequire = (name) => {
    if (name === "@/src/auth") return { auth: async () => signedUser ? { user: { id: signedUser } } : null };
    if (name === "@/src/lib/session-user") return { getAuthenticatedUserId: async () => signedUser };
    if (name === "@/src/lib/mailer") return { sendPaymentAdminEmail: async () => { mailCount++; } };
    if (name === "@/src/lib/nicepay-server") return { niceConfig: () => niceConfig, niceDigest: digest, niceAuthorization: () => "fake" };
    if (name.startsWith("@/")) return load(`${name.slice(2)}.ts`);
    if (name.startsWith(".")) return load(`${path.relative(web, path.resolve(path.dirname(filename), name))}.ts`);
    return req(name);
  };
  vm.runInThisContext(`(function(require,module,exports){${output}\n})`, { filename })(localRequire, module, module.exports);
  return module.exports;
}
const { prisma } = load("src/lib/prisma.ts");
const collect = load("app/api/analytics/collect/route.ts");
const orders = load("app/api/orders/route.ts");
const payment = load("app/api/payments/nicepay/return/route.ts");
const attribution = load("src/lib/analytics-attribution.ts");
const { buildCommerceReport } = load("src/lib/commerce-report.ts");
const { loadCommerceAnalytics } = load("src/lib/commerce-analytics.ts");
const { products } = load("src/data/products.ts");
const product = products.find((p) => p.slug === "buhm-postcard-2026");
const originalFetch = global.fetch;
global.fetch = async () => { throw new Error("Unexpected external request"); };
function request(body, headers = {}) {
  return new Request("http://internal:3000/api/analytics/collect", { method: "POST", headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0 Chrome/120", origin: process.env.AUTH_URL, ...headers }, body: JSON.stringify(body) });
}
const page = (extra = {}) => ({ type: "pageview", sessionId: "session_fixture", visitorId: "visitor_fixture", pageViewId: "page_fixture", path: `/products/${product.slug}`, ...extra });
const cookie = (sid) => `udn_analytics=${attribution.signAnalyticsSession(sid)}`;
const orderPayload = { recipientName: "Fixture", phone: "00000000000", address: "Fixture address", items: [{ productId: product.slug, quantity: 1 }] };
before(() => {
  new DatabaseSync(path.join(fixture, "test.db")).close();
  execFileSync(process.execPath, [req.resolve("prisma/build/index.js"), "db", "push", "--skip-generate", "--schema", path.join(web, "prisma/schema.prisma")], { cwd: web, env: process.env, stdio: "pipe" });
});
beforeEach(async () => {
  await prisma.order.deleteMany(); await prisma.analyticsSession.deleteMany(); await prisma.user.deleteMany();
  signedUser = null; mailCount = 0;
});
after(async () => {
  await prisma.$disconnect(); global.fetch = originalFetch;
  if (path.dirname(fixture) === os.tmpdir() && path.basename(fixture).startsWith("udn-analytics-test-")) fs.rmSync(fixture, { recursive: true, force: true });
});

test("page retries deduplicate; first campaign remains fixed; client user ID is ignored", async () => {
  const first = await collect.POST(request(page({ userId: "forged-user", utmSource: "instagram", utmCampaign: "launch", referrer: "https://instagram.com/profile?phone=private" })));
  assert.equal(first.status, 200); assert.match(first.headers.get("set-cookie"), /HttpOnly/); assert.match(first.headers.get("set-cookie"), /Secure/);
  await collect.POST(request(page({ utmSource: "google" })));
  await collect.POST(request(page({ pageViewId: "page_second", path: "/checkout", utmSource: "nicepay" })));
  const s = await prisma.analyticsSession.findUnique({ where: { id: "session_fixture" } });
  assert.equal(s.pageCount, 2); assert.equal(s.userId, null); assert.equal(s.utmSource, "instagram"); assert.equal(s.utmCampaign, "launch");
  assert.equal(s.referrer, "https://instagram.com"); assert.equal(s.measurementVersion, 1);
});

test("admin and bots excluded; only allowed commerce events accepted and deduplicated", async () => {
  await prisma.user.create({ data: { id: "admin_fixture", role: "ADMIN" } }); signedUser = "admin_fixture";
  assert.equal((await (await collect.POST(request(page()))).json()).ignored, "admin");
  signedUser = null;
  assert.equal((await (await collect.POST(request(page(), { "user-agent": "Googlebot" }))).json()).ignored, "bot");
  assert.equal(await prisma.analyticsSession.count(), 0);
  assert.equal((await collect.POST(request(page({ type: "event", eventId: "event_fixture", name: "purchase" })))).status, 400);
  const event = page({ type: "event", eventId: "event_fixture", name: "add_to_cart", productId: product.slug, quantity: 2 });
  assert.equal((await collect.POST(request(event))).status, 200); await collect.POST(request(event));
  assert.equal(await prisma.analyticsEvent.count(), 1);
  assert.equal((await collect.POST(request(page(), { origin: "https://untrusted.test" }))).status, 403);
});

test("heartbeat cannot change a page belonging to another session", async () => {
  await collect.POST(request(page()));
  await collect.POST(request({ type: "heartbeat", sessionId: "session_other", pageViewId: "page_fixture", delta: 120 }));
  assert.equal((await prisma.analyticsPageView.findUnique({ where: { id: "page_fixture" } })).duration, 0);
  await collect.POST(request({ type: "heartbeat", sessionId: "session_fixture", pageViewId: "page_fixture", delta: 30, scrollDepth: 70 }));
  assert.equal((await prisma.analyticsSession.findUnique({ where: { id: "session_fixture" } })).duration, 30);
});

test("order attribution requires signed cookie and matching session; purchases are server confirmed once", async () => {
  await prisma.user.create({ data: { id: "customer_fixture" } }); signedUser = "customer_fixture";
  await collect.POST(request(page()));
  let result = await orders.POST(request({ ...orderPayload, analyticsSessionId: "session_fixture" }, { cookie: cookie("session_fixture") }));
  const { order } = await result.json(); assert.equal(result.status, 201); assert.equal(order.analyticsSessionId, "session_fixture"); assert.equal(order.paidAt, null);
  const forged = await (await orders.POST(request({ ...orderPayload, analyticsSessionId: "session_fixture" }, { cookie: `${cookie("session_fixture")}bad` }))).json();
  assert.equal(forged.order.analyticsSessionId, null);
  const form = new FormData();
  const amount = String(order.totalAmount), authToken = "fixture-token";
  for (const [key, val] of Object.entries({ orderId: order.id, authResultCode: "0000", clientId: niceConfig.clientId, amount, authToken, signature: digest(`${authToken}${niceConfig.clientId}${amount}${niceConfig.secretKey}`), tid: "fixture-tid" })) form.set(key, val);
  global.fetch = async () => Response.json({ resultCode: "0000", amount: order.totalAmount, orderId: order.id, tid: "fixture-tid" });
  await payment.POST(new Request("https://shop.example.test/api/payments/nicepay/return", { method: "POST", body: form }));
  const first = await prisma.order.findUnique({ where: { id: order.id } });
  assert.equal(first.paymentStatus, "PAID"); assert.ok(first.paidAt);
  await payment.POST(new Request("https://shop.example.test/api/payments/nicepay/return", { method: "POST", body: form }));
  assert.equal((await prisma.order.findUnique({ where: { id: order.id } })).paidAt.getTime(), first.paidAt.getTime()); assert.equal(mailCount, 1);
  const report = await loadCommerceAnalytics(new Date(0)); assert.equal(report.summary.orders, 1); assert.equal(report.summary.buyers, 1);
  await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "REFUNDED", status: "REFUNDED" } });
  assert.equal((await loadCommerceAnalytics(new Date(0))).summary.orders, 0);
  global.fetch = async () => { throw new Error("Unexpected external request"); };
});

test("cohort funnel respects ordering; direct checkout still counts as conversion; cart rates cannot exceed 100%", () => {
  const at = (n) => new Date(1700000000000 + n * 1000);
  const purchase = (id, sid) => ({ id, analyticsSessionId: sid, paidAt: at(10), totalAmount: 6000, items: [{ productId: product.slug, title: product.title, quantity: 1, unitPrice: 2000 }] });
  const base = { visitorId: "v", createdAt: at(0), entryPath: "/products", device: "Mobile", referrerDomain: "Instagram", utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null };
  const sessions = [
    { ...base, id: "full", pageviews: [{ path: `/products/${product.slug}`, createdAt: at(1) }, { path: "/checkout", createdAt: at(3) }], events: [{ name: "add_to_cart", productId: product.slug, reason: null, createdAt: at(2) }, { name: "payment_attempt", productId: null, reason: null, createdAt: at(4) }], orders: [purchase("p1", "full")] },
    { ...base, id: "direct", pageviews: [{ path: "/checkout", createdAt: at(2) }], events: [{ name: "add_to_cart", productId: product.slug, reason: null, createdAt: at(1) }], orders: [purchase("p2", "direct")] },
  ];
  const report = buildCommerceReport(sessions, [purchase("p1", "full"), purchase("unlinked", null)], products);
  assert.equal(report.summary.conversionRate, 100); assert.equal(report.summary.attributionRate, 50);
  assert.deepEqual(report.funnel.map((step) => step.sessions), [2, 1, 1, 1, 1, 1]);
  assert.equal(report.channels[0].orders, 2); assert.equal(report.channels[0].revenue, 12000);
  const p = report.products.find((p) => p.productId === product.slug); assert.equal(p.cartRate, 100); assert.equal(p.revenue, 4000);
});

test("signature expires/tampering rejected and referrer domain matching is exact", () => {
  assert.equal(attribution.readAnalyticsSession(request({}, { cookie: cookie("session_fixture") })), "session_fixture");
  assert.equal(attribution.readAnalyticsSession(request({}, { cookie: `${cookie("session_fixture")}0` })), null);
  assert.equal(attribution.referrerInfo("https://naver.com.evil.test/?q=private", "https://shop.example.test").referrerDomain, "naver.com.evil.test");
});

test("query excludes historical, unpaid, refunded, admin, test-product orders; unattributed sales stay visible", async () => {
  await prisma.user.create({ data: { id: "admin_query", role: "ADMIN" } });
  await collect.POST(request(page()));
  const testProduct = products.find((p) => p.adminOnly);
  const create = (extra = {}, productId = product.slug) => prisma.order.create({ data: {
    totalAmount: 6000, recipientName: "Fixture", phone: "00000000000", address: "Fixture address",
    paymentStatus: "PAID", status: "PAID", paidAt: new Date(), analyticsSessionId: "session_fixture",
    items: { create: { productId, title: "Fixture", quantity: 1, unitPrice: 2000 } }, ...extra,
  } });
  await create(); await create({ analyticsSessionId: null });
  await create({ paidAt: null }); await create({ paymentStatus: "UNPAID" });
  await create({ paymentStatus: "REFUNDED" }); await create({ userId: "admin_query" });
  assert.ok(testProduct); await create({}, testProduct.slug);
  const report = await loadCommerceAnalytics(new Date(0));
  assert.equal(report.summary.orders, 1); assert.equal(report.summary.periodOrders, 2);
  assert.equal(report.summary.unattributedOrders, 1); assert.equal(report.summary.periodRevenue, 12000);
});

test("concurrent page retries and cart actions preserve one session and one page", async () => {
  const responses = await Promise.all([collect.POST(request(page())), collect.POST(request(page())), collect.POST(request(page({ type: "event", eventId: "event_concurrent", name: "add_to_cart", productId: product.slug, quantity: 1 })))]);
  for (const response of responses) assert.equal(response.status, 200);
  assert.equal(await prisma.analyticsSession.count(), 1); assert.equal(await prisma.analyticsPageView.count(), 1);
  assert.equal((await prisma.analyticsSession.findUnique({ where: { id: "session_fixture" } })).pageCount, 1);
});

test("conversion panel renders an empty report without invalid progress widths", () => {
  const React = req("react");
  const { renderToStaticMarkup } = req("react-dom/server");
  const Panel = load("src/components/admin/CommerceAnalyticsPanel.tsx").default;
  const html = renderToStaticMarkup(React.createElement(Panel, { data: buildCommerceReport([], [], products) }));
  assert.match(html, /구매 단계와 이탈/); assert.match(html, /유입 경로·캠페인별/); assert.doesNotMatch(html, /NaN|Infinity/);
});

test("tracker excludes hidden time, rotates after idle, and keeps an active session", async () => {
  let clock = 1700000000000, serial = 0, setup, tick;
  const payloads = [], documentListeners = new Map(), windowListeners = new Map();
  const storage = () => { const map = new Map(); return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }; };
  class FakeDate extends Date { static now() { return clock; } }
  const window = { location: { pathname: `/products/${product.slug}`, search: "?utm_source=instagram" },
    screen: { width: 1200, height: 900 }, innerHeight: 900, scrollY: 0,
    setInterval: (fn) => { tick = fn; return 1; }, clearInterval() {},
    addEventListener: (n, fn) => windowListeners.set(n, fn), removeEventListener: (n) => windowListeners.delete(n) };
  const document = { title: "Fixture", referrer: "", visibilityState: "visible", documentElement: { scrollHeight: 1800 },
    addEventListener: (n, fn) => documentListeners.set(n, fn), removeEventListener: (n) => documentListeners.delete(n) };
  const localStorage = storage(), sessionStorage = storage();
  const context = { window, document, localStorage, sessionStorage, navigator: { sendBeacon: (_url, blob) => { payloads.push(blob.text().then(JSON.parse)); return true; } },
    crypto: { randomUUID: () => `uuid-fixture-${++serial}` }, URLSearchParams, Blob, Date: FakeDate, console };
  const compile = (filename, imports) => {
    const module = { exports: {} };
    const output = ts.transpileModule(fs.readFileSync(path.join(web, filename), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }, fileName: filename }).outputText;
    vm.runInNewContext(output, { ...context, module, exports: module.exports, require: (name) => imports[name] }); return module.exports;
  };
  const client = compile("src/lib/analytics-client.ts", {});
  const tracker = compile("src/components/analytics/AnalyticsTracker.tsx", {
    react: { useRef: (value) => ({ current: value }), useEffect: (fn) => { setup = fn; } },
    "next/navigation": { usePathname: () => window.location.pathname },
    "next-auth/react": { useSession: () => ({ status: "unauthenticated", data: null }) }, "@/src/lib/analytics-client": client,
  });
  tracker.default(); const cleanup = setup();
  clock += 10000; document.visibilityState = "hidden"; documentListeners.get("visibilitychange")();
  clock += 31 * 60000; tick();
  document.visibilityState = "visible"; documentListeners.get("visibilitychange")();
  for (let i = 0; i < 62; i++) { clock += 30000; tick(); }
  cleanup();
  const sent = await Promise.all(payloads), pages = sent.filter((p) => p.type === "pageview"), beats = sent.filter((p) => p.type === "heartbeat");
  assert.equal(pages.length, 2); assert.notEqual(pages[0].sessionId, pages[1].sessionId);
  assert.equal(beats.reduce((sum, p) => sum + p.delta, 0), 10 + 62 * 30);
  assert.ok(beats.slice(1).every((p) => p.sessionId === pages[1].sessionId));
});
