// Execute the actual page effect with mocked hooks/GET. Never contact a payment provider.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function harness(fetchImpl) {
  const state = [];
  let effect;
  let clears = 0;
  let timer;
  const params = new URLSearchParams({ orderId: "fixture-order", paymentKey: "fixture-payment" });
  const react = {
    Suspense: () => null,
    useState(initial) {
      const index = state.length;
      state.push(initial);
      return [initial, (value) => { state[index] = value; }];
    },
    useEffect(fn) { effect = fn; },
    useRef(value) { return { current: value }; },
  };
  const source = fs.readFileSync(path.join(__dirname, "../app/checkout/success/page.tsx"), "utf8")
    .replace("function SuccessContent()", "export function SuccessContent()");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: "page.tsx",
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, {
    module, exports: module.exports, AbortController,
    fetch: fetchImpl,
    setTimeout(fn) { timer = fn; return 1; },
    clearTimeout() {},
    require(name) {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return { jsx: () => null, jsxs: () => null };
      if (name === "next/navigation") return { useSearchParams: () => params };
      if (name === "@/src/lib/store") return { clearCart: () => { clears++; } };
      return () => null;
    },
  });
  module.exports.SuccessContent();
  return { state, setup: () => effect(), timeout: () => timer(), clears: () => clears };
}
const paid = { id: "fixture-order", paymentStatus: "PAID", paymentKey: "fixture-payment" };
const flush = () => new Promise((resolve) => setImmediate(resolve));

test("Strict Mode cleanup + setup still resolves the paid order (GET only)", async () => {
  const requests = [];
  const h = harness((url, options) => new Promise((resolve) => requests.push({ url, options, resolve })));
  const cleanupFirst = h.setup();
  cleanupFirst();
  const cleanupSecond = h.setup();
  assert.equal(requests.length, 2);
  assert.equal(requests[0].options.signal.aborted, true);
  assert.equal(requests[1].options.cache, "no-store");
  requests[0].resolve(Response.json({ order: paid }));
  await flush();
  assert.equal(h.state[0], true);
  assert.equal(h.clears(), 0);
  requests[1].resolve(Response.json({ order: paid }));
  await flush();
  assert.equal(h.state[0], false);
  assert.equal(h.state[1], null);
  assert.equal(h.state[2].id, paid.id);
  assert.equal(h.clears(), 1);
  cleanupSecond();
});

for (const order of [null, { ...paid, paymentStatus: "UNPAID" }, { ...paid, paymentKey: "wrong" }, { ...paid, id: "wrong" }]) {
  test(`Unconfirmed order cannot show success or clear cart: ${JSON.stringify(order)}`, async () => {
    const h = harness(async () => Response.json({ order }));
    const cleanup = h.setup();
    await flush();
    assert.equal(h.state[0], false);
    assert.match(h.state[1], /결제 완료 상태/);
    assert.equal(h.clears(), 0);
    cleanup();
  });
}

test("API error leaves loading and preserves the cart", async () => {
  const h = harness(async () => Response.json({ error: "로그인이 필요합니다." }, { status: 401 }));
  h.setup();
  await flush();
  assert.equal(h.state[0], false);
  assert.match(h.state[1], /로그인/);
  assert.equal(h.clears(), 0);
});

test("Timeout leaves loading without asking for another payment", async () => {
  const h = harness((url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener("abort", () => reject(new Error("aborted")));
  }));
  h.setup();
  h.timeout();
  await flush();
  assert.equal(h.state[0], false);
  assert.match(h.state[1], /조회 시간이 초과/);
  assert.equal(h.clears(), 0);
});
