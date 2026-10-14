// Real SQLite + route handlers; all SENS HTTP calls are intercepted in memory.
// No .env files are loaded and no messages, emails, or payments can be sent.
const { test, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const { execFileSync } = require("node:child_process");
const { createHmac } = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

const webRoot = path.resolve(__dirname, "..");
const webRequire = createRequire(path.join(webRoot, "package.json"));
const ts = webRequire("typescript");
const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "udn-alimtalk-test-"));
process.env.DATABASE_URL = `file:${path.join(fixtureDir, "test.db").replaceAll("\\", "/")}`;
process.env.AUTH_SECRET = "isolated-test-secret-never-used-in-production";
process.env.AUTH_URL = "http://localhost:3100";
process.env.SENS_ALIMTALK_SERVICE_ID = "ncp:kkobizmsg:kr:test:fixture";
process.env.SENS_ALIMTALK_CHANNEL_ID = "@studioudn";
process.env.SENS_ACCESS_KEY = "fake-key";
process.env.SENS_SECRET_KEY = "fake-secret";
process.env.EPOST_SERVICE_KEY = "fake-epost-key";
process.env.EPOST_POLLING_TOKEN = "test-epost-polling-token";
process.env.NODE_ENV = "test";
let isAdmin = true;
let signedInUserId = null;
let postMode = "accepted";
let resultMode = "processing";
let epostMode = "found";
let epostStatus = "발송";
let epostCalls = 0;
let calls = [];
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  if (String(url).startsWith("http://openapi.epost.go.kr/trace/retrieveLongitudinalService/")) {
    epostCalls++;
    if (epostMode === "unavailable") throw new Error("simulated carrier outage");
    const number = new URL(url).searchParams.get("rgist");
    if (epostMode === "missing") return new Response(`<LongitudinalDomesticListResponse><cmmMsgHeader><successYN>N</successYN><returnCode>03</returnCode><errMsg>조회결과가 없습니다.</errMsg></cmmMsgHeader></LongitudinalDomesticListResponse>`);
    return new Response(`<LongitudinalDomesticListResponse><cmmMsgHeader><successYN>Y</successYN><returnCode>00</returnCode></cmmMsgHeader><rgist>${number}</rgist><dlvySttus>${epostStatus}</dlvySttus><longitudinalDomesticList><dlvyDate>2026-10-14</dlvyDate><dlvyTime>21:29</dlvyTime><nowLc>안양우편물류센터</nowLc><processSttus>${epostStatus}</processSttus></longitudinalDomesticList></LongitudinalDomesticListResponse>`);
  }
  assert.match(String(url), /^https:\/\/sens\.apigw\.ntruss\.com\/alimtalk\/v2\//);
  if (options.method === "GET") {
    return Response.json({ requestStatusCode: "A000", messageStatusName: resultMode,
      ...(resultMode === "success" ? { messageStatusCode: "0000" } : resultMode === "fail" ? { messageStatusCode: "3006" } : {}) });
  }
  const body = JSON.parse(options.body);
  calls.push({ url: String(url), body, headers: options.headers });
  if (postMode === "unknown") throw new Error("simulated timeout after acceptance");
  if (postMode === "rejected") return Response.json({}, { status: 400 });
  if (postMode === "message-rejected") return Response.json({ statusCode: "202", requestId: "rejected", messages: [{ messageId: "rejected", requestStatusCode: "A001" }] }, { status: 202 });
  return Response.json({ statusCode: "202", requestId: `request-${calls.length}`, messages: [{ messageId: `message-${calls.length}`, requestStatusCode: "A000" }] }, { status: 202 });
};

// Transpile the actual TS modules without installing a test-only dependency.
// Stub only auth/session context and unrelated email/payment side effects.
const cache = new Map();
function load(relative) {
  const filename = path.resolve(webRoot, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: filename,
  }).outputText;
  function localRequire(name) {
    if (name === "@/src/lib/admin") return { ADMIN_EMAIL: "studioudn@naver.com", requireAdmin: async () => { if (!isAdmin) throw new Error("ADMIN_AUTH_REQUIRED"); } };
    if (name === "@/src/lib/session-user") return { getAuthenticatedUserId: async () => signedInUserId };
    if (name === "@/src/lib/mailer") return { sendOrderCancelledAdminEmail: async () => {} };
    if (name === "@/src/lib/nicepay-server") return { cancelNicePayment: async () => { throw new Error("Payment forbidden in test"); } };
    if (name === "next-auth/jwt") return { encode: async () => "test-session" };
    if (name.startsWith("@/")) return load(`${name.slice(2)}.ts`);
    return webRequire(name);
  }
  vm.runInThisContext(`(function(require,module,exports){${output}\n})`, { filename })(localRequire, module, module.exports);
  return module.exports;
}
const { prisma } = load("src/lib/prisma.ts");
const transport = load("src/lib/sens-alimtalk.ts");
const carriers = load("src/lib/delivery-carriers.ts");
const epost = load("src/lib/epost-verification.ts");
const notify = load("src/lib/shipment-notification.ts");
const phoneSend = load("app/api/register/phone/send/route.ts");
const phoneVerify = load("app/api/register/phone/verify/route.ts");
const register = load("app/api/register/route.ts");
const oauth = load("app/api/register/oauth/route.ts");
const orders = load("app/api/admin/orders/route.ts");
const account = load("app/api/account/route.ts");
const epostStatusRoute = load("app/api/admin/orders/epost-status/route.ts");
const epostCron = load("app/api/cron/epost-tracking/route.ts");

const phone = "01012345678";
const invoice = "123456789012";
const request = (body) => new Request("http://localhost/api/test", { method: "POST", headers: { "Content-Type": "application/json", "x-real-ip": "127.0.0.1" }, body: JSON.stringify(body) });
const signup = (token, overrides = {}) => ({ email: "fixture@example.test", name: "Fixture", password: "test-password", phone, phoneVerificationToken: token, recipientName: "Fixture", zonecode: "12345", address: "Test address", termsAccepted: true, privacyAccepted: true, ...overrides });
async function seedOrder(overrides = {}) {
  return prisma.order.create({ data: { status: "PREPARING", paymentStatus: "PAID", totalAmount: 100, recipientName: "Fixture", phone, address: "Test address", ...overrides } });
}
async function otpProof() {
  const response = await phoneSend.POST(request({ phone }));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.code, undefined);
  const code = calls.at(-1).body.messages[0].content.match(/인증번호: (\d{6})/)[1];
  return { ...result, code };
}
async function verifiedProof() {
  const challenge = await otpProof();
  const response = await phoneVerify.POST(request({ phone, challengeId: challenge.challengeId, code: challenge.code }));
  assert.equal(response.status, 200);
  return { ...await response.json(), challengeId: challenge.challengeId };
}

before(() => {
  new DatabaseSync(path.join(fixtureDir, "test.db")).close();
  execFileSync(process.execPath, [webRequire.resolve("prisma/build/index.js"), "db", "push", "--skip-generate", "--schema", path.join(webRoot, "prisma/schema.prisma")], { cwd: webRoot, env: process.env, stdio: "pipe" });
});
beforeEach(async () => {
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();
  await prisma.pendingOAuthSignup.deleteMany();
  await prisma.phoneVerificationChallenge.deleteMany();
  await prisma.requestRateLimit.deleteMany();
  calls = []; isAdmin = true; signedInUserId = null; postMode = "accepted"; resultMode = "processing"; epostMode = "found"; epostStatus = "발송"; epostCalls = 0;
});
after(async () => {
  await prisma.$disconnect();
  global.fetch = originalFetch;
  // Only remove this test's newly created temporary fixture directory.
  if (path.dirname(fixtureDir) === os.tmpdir() && path.basename(fixtureDir).startsWith("udn-alimtalk-test-")) fs.rmSync(fixtureDir, { recursive: true, force: true });
});

test("approved signup text, channel, signed request, and no SMS fallback", async () => {
  await transport.sendAlimtalk(transport.SIGNUP_TEMPLATE_CODE, transport.signupMessage(phone, "123456"));
  const sent = calls[0];
  assert.equal(sent.body.templateCode, "UDNSIGNUPVERIFY");
  assert.equal(sent.body.plusFriendId, "@studioudn");
  assert.equal(sent.body.messages[0].content, "[studioUDN]\n회원가입을 위한 휴대폰 인증번호를 안내드립니다.\n\n인증번호: 123456\n\n인증번호를 3분 이내에 회원가입 화면에 입력해 주세요.\n본인이 요청하지 않았다면 이 메시지를 무시해 주세요.");
  assert.equal(sent.body.messages[0].useSmsFailover, false);
  const timestamp = sent.headers["x-ncp-apigw-timestamp"];
  const signature = createHmac("sha256", "fake-secret").update(`POST ${new URL(sent.url).pathname}\n${timestamp}\nfake-key`).digest("base64");
  assert.equal(sent.headers["x-ncp-apigw-signature-v2"], signature);
});

test("carrier allowlist validates formats and never builds arbitrary links", () => {
  const numbers = [invoice, "1234567890123", "1234567890", invoice, "12345678901", invoice, "1234567890"];
  carriers.DELIVERY_CARRIERS.forEach((carrier, index) => assert.match(carriers.validateShipment(carrier.name, numbers[index]).trackingUrl, /^https:\/\//));
  for (const [carrier, number] of [["", invoice], ["evil.example", invoice], ["CJ대한통운", ""], ["CJ대한통운", "123"], ["CJ대한통운", "123456789012<script>"], ["CJ대한통운", "000000000000"]]) assert.throws(() => carriers.validateShipment(carrier, number));
  assert.equal(carriers.validateShipment("CJ대한통운", "1234-5678-9012").trackingNumber, invoice);
});

test("epost uses the official lookup form action and passes the normalized invoice to both Kakao buttons", () => {
  const shipment = carriers.validateShipment("우체국택배", "12345-67890-123");
  const expected = "https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=1234567890123";
  assert.equal(shipment.trackingUrl, expected);
  assert.equal(carriers.getTrackingUrl(shipment.carrier, shipment.trackingNumber), expected);
  const message = transport.shipmentMessage(phone, shipment.carrier, shipment.trackingNumber, shipment.trackingUrl);
  assert.equal(message.buttons[0].linkMobile, expected);
  assert.equal(message.buttons[0].linkPc, expected);
});

test("signup APIs reject phone verification bypass for email and OAuth", async () => {
  assert.equal((await register.POST(request(signup(undefined)))).status, 400);
  assert.equal((await oauth.POST(request({ pendingToken: "fake", ...signup(undefined) }))).status, 400);
  assert.equal(await prisma.user.count(), 0);
  assert.equal(calls.length, 0);
});

test("epost rejects unregistered numbers and outages before saving or sending", async () => {
  for (const mode of ["missing", "unavailable"]) {
    epostMode = mode;
    const order = await seedOrder({ status: "PREPARING", paymentStatus: "PAID" });
    const response = await orders.PATCH(request({ orderId: order.id, status: "SHIPPED", carrier: "우체국택배", trackingNumber: "1111111111111" }));
    assert.equal(response.status, mode === "missing" ? 422 : 503);
    assert.equal((await prisma.order.findUnique({ where: { id: order.id } })).status, "PREPARING");
    assert.equal(await prisma.shipmentNotification.count(), 0);
    assert.equal(calls.length, 0);
  }
});

test("epost verified shipment saves then sends once; preparing needs no carrier lookup", async () => {
  const order = await seedOrder({ status: "PAID", paymentStatus: "PAID" });
  assert.equal((await orders.PATCH(request({ orderId: order.id, status: "PREPARING" }))).status, 200);
  assert.equal(epostCalls, 0);
  assert.equal((await orders.PATCH(request({ orderId: order.id, status: "SHIPPED", carrier: "우체국택배", trackingNumber: "1111111111111" }))).status, 200);
  assert.equal(epostCalls, 1);
  assert.equal(calls.length, 1);
});

test("epost verifies shipment using the official tracking API", async () => {
  epostMode = "cloud-found";
  await epost.verifyEpostShipment("1111111111111");
  assert.equal(epostCalls, 1);
});

test("hourly EPOST polling persists intermediate tracking stages for customer and admin views", async () => {
  epostStatus = "배달준비";
  const order = await seedOrder({ status: "SHIPPED", carrier: "우체국택배", trackingNumber: "1234567890123" });
  const response = await epostCron.POST(new Request("http://localhost/api/cron/epost-tracking", { method: "POST", headers: { authorization: `Bearer ${process.env.EPOST_POLLING_TOKEN}` } }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).updated, 1);
  const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  assert.equal(updated.status, "SHIPPED");
  assert.equal(updated.epostDeliveryStatus, "배달준비");
  assert.equal(updated.epostLatestEventStatus, "배달준비");
  assert.equal(updated.epostLatestEventLocation, "안양우편물류센터");
  assert.equal(updated.epostLatestEventDate, "2026-10-14");
});

test("manual EPOST status check persists intermediate stages and marks delivery only on completion", async () => {
  epostStatus = "도착";
  const order = await seedOrder({ status: "SHIPPED", carrier: "우체국택배", trackingNumber: "1234567890123" });
  const response = await epostStatusRoute.POST(request({ orderId: order.id }));
  assert.equal(response.status, 200);
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).epostLatestEventStatus, "도착");
  epostStatus = "배달완료";
  const completion = await epostStatusRoute.POST(request({ orderId: order.id }));
  assert.equal(completion.status, 200);
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status, "DELIVERED");
});

test("OTP is hashed, wrong code fails, proof is bound to the phone and consumed once", async () => {
  const challenge = await otpProof();
  const stored = await prisma.phoneVerificationChallenge.findUniqueOrThrow({ where: { id: challenge.challengeId } });
  assert.notEqual(stored.codeHash, challenge.code);
  const wrong = challenge.code === "000000" ? "111111" : "000000";
  assert.equal((await phoneVerify.POST(request({ phone, challengeId: challenge.challengeId, code: wrong }))).status, 400);
  const verified = await phoneVerify.POST(request({ phone, challengeId: challenge.challengeId, code: challenge.code }));
  const proof = await verified.json();
  assert.equal(verified.status, 200);
  assert.equal(proof.expiresIn, 900);
  assert.equal((await register.POST(request(signup(proof.verificationToken, { phone: "01087654321" })))).status, 400);
  assert.equal((await register.POST(request(signup(proof.verificationToken)))).status, 201);
  assert.ok((await prisma.user.findFirstOrThrow()).phoneVerifiedAt);
  assert.ok((await prisma.phoneVerificationChallenge.findUniqueOrThrow({ where: { id: challenge.challengeId } })).consumedAt);
  assert.equal((await register.POST(request(signup(proof.verificationToken, { email: "second@example.test" })))).status, 400);
});

test("OAuth signup consumes the same verified phone proof", async () => {
  const proof = await verifiedProof();
  await prisma.pendingOAuthSignup.create({ data: { token: "fixture-oauth", provider: "naver", providerAccountId: "fixture-provider", type: "oauth", email: "oauth@example.test", expiresAt: new Date(Date.now() + 60000) } });
  const response = await oauth.POST(request({ pendingToken: "fixture-oauth", ...signup(proof.verificationToken) }));
  assert.equal(response.status, 200);
  assert.ok((await prisma.user.findFirstOrThrow()).phoneVerifiedAt);
  assert.equal(await prisma.pendingOAuthSignup.count(), 0);
});

test("expired OTP and five wrong attempts cannot be verified", async () => {
  const challenge = await otpProof();
  const wrong = challenge.code === "000000" ? "111111" : "000000";
  for (let i = 0; i < 5; i++) assert.equal((await phoneVerify.POST(request({ phone, challengeId: challenge.challengeId, code: wrong }))).status, 400);
  assert.equal((await phoneVerify.POST(request({ phone, challengeId: challenge.challengeId, code: challenge.code }))).status, 400);
  await prisma.phoneVerificationChallenge.update({ where: { id: challenge.challengeId }, data: { attempts: 0, expiresAt: new Date(Date.now() - 1000) } });
  assert.equal((await phoneVerify.POST(request({ phone, challengeId: challenge.challengeId, code: challenge.code }))).status, 400);
});

test("resend cooldown survives successful signup and concurrent send requests", async () => {
  const proof = await verifiedProof();
  assert.equal((await register.POST(request(signup(proof.verificationToken)))).status, 201);
  assert.equal((await phoneSend.POST(request({ phone }))).status, 429);
  const parallel = await Promise.all([phoneSend.POST(request({ phone: "01087654321" })), phoneSend.POST(request({ phone: "01087654321" }))]);
  assert.equal(parallel.filter((response) => response.status === 200).length, 1);
  assert.equal(calls.length, 2);
});

test("SENS rejection invalidates OTP and does not expose the code", async () => {
  postMode = "message-rejected";
  const response = await phoneSend.POST(request({ phone }));
  assert.equal(response.status, 502);
  assert.equal((await response.json()).challengeId, undefined);
  assert.ok((await prisma.phoneVerificationChallenge.findFirstOrThrow()).expiresAt <= new Date());
});

test("admin auth, paid status, carrier, and invoice are required before shipment", async () => {
  const order = await seedOrder();
  isAdmin = false;
  assert.equal((await orders.PATCH(request({ orderId: order.id, status: "SHIPPED", carrier: "CJ대한통운", trackingNumber: invoice }))).status, 403);
  isAdmin = true;
  for (const fields of [{}, { carrier: "CJ대한통운" }, { trackingNumber: invoice }, { carrier: "CJ대한통운", trackingNumber: "123" }]) {
    assert.equal((await orders.PATCH(request({ orderId: order.id, status: "SHIPPED", ...fields }))).status, 400);
  }
  await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "UNPAID" } });
  assert.equal((await orders.PATCH(request({ orderId: order.id, status: "SHIPPED", carrier: "CJ대한통운", trackingNumber: invoice }))).status, 409);
  assert.equal(calls.length, 0);
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status, "PREPARING");
});

test("partial saves do not send; complete shipment sends once with the approved WL button", async () => {
  const order = await seedOrder();
  assert.equal((await orders.PATCH(request({ orderId: order.id, carrier: "CJ대한통운" }))).status, 200);
  assert.equal(calls.length, 0);
  const payload = { orderId: order.id, status: "SHIPPED", carrier: "CJ대한통운", trackingNumber: invoice };
  assert.equal((await orders.PATCH(request(payload))).status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body.templateCode, "UDNSHIPSTART");
  const button = calls[0].body.messages[0].buttons[0];
  assert.equal(button.name, "배송 조회"); assert.equal(button.type, "WL");
  assert.equal(button.linkMobile, `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${invoice}`);
  assert.equal(button.linkMobile, button.linkPc);
  assert.equal((await orders.PATCH(request(payload))).status, 200);
  await Promise.all([notify.dispatchShipmentNotification(order.id), notify.dispatchShipmentNotification(order.id)]);
  assert.equal(calls.length, 1);
  assert.equal((await orders.PATCH(request({ ...payload, trackingNumber: "123456789013" }))).status, 409);
  resultMode = "success";
  assert.equal((await orders.GET()).status, 200);
  assert.equal((await prisma.shipmentNotification.findFirstOrThrow()).status, "SENT");
});

test("concurrent dispatch claims one pending notice", async () => {
  const order = await seedOrder({ status: "SHIPPED", carrier: "CJ대한통운", trackingNumber: invoice });
  await prisma.shipmentNotification.create({ data: { orderId: order.id, carrier: "CJ대한통운", trackingNumber: invoice } });
  await Promise.all([notify.dispatchShipmentNotification(order.id), notify.dispatchShipmentNotification(order.id)]);
  assert.equal(calls.length, 1);
});

test("concurrent admin shipment saves create one notification", async () => {
  const order = await seedOrder();
  const payload = { orderId: order.id, status: "SHIPPED", carrier: "CJ대한통운", trackingNumber: invoice };
  const responses = await Promise.all([orders.PATCH(request(payload)), orders.PATCH(request(payload))]);
  assert.ok(responses.some((response) => response.status === 200));
  assert.ok(responses.every((response) => [200, 409].includes(response.status)));
  assert.equal(await prisma.shipmentNotification.count(), 1);
  assert.equal(calls.length, 1);
});

test("confirmed failure permits an explicit retry; ordinary saving never resends", async () => {
  const order = await seedOrder();
  const payload = { orderId: order.id, status: "SHIPPED", carrier: "CJ대한통운", trackingNumber: invoice };
  postMode = "rejected";
  assert.equal((await orders.PATCH(request(payload))).status, 200);
  assert.equal((await prisma.shipmentNotification.findFirstOrThrow()).status, "FAILED");
  postMode = "accepted";
  await orders.PATCH(request(payload)); assert.equal(calls.length, 1);
  await orders.PATCH(request({ orderId: order.id, retryAlimtalk: true })); assert.equal(calls.length, 2);
  assert.equal((await orders.PATCH(request({ orderId: order.id, retryAlimtalk: true }))).status, 409);
  resultMode = "fail";
  await orders.GET();
  assert.equal((await prisma.shipmentNotification.findFirstOrThrow()).status, "FAILED");
});

test("uncertain acceptance blocks retries and historical shipments are not automatically messaged", async () => {
  const order = await seedOrder();
  postMode = "unknown";
  await orders.PATCH(request({ orderId: order.id, status: "SHIPPED", carrier: "CJ대한통운", trackingNumber: invoice }));
  assert.equal((await prisma.shipmentNotification.findFirstOrThrow()).status, "UNKNOWN");
  assert.equal((await orders.PATCH(request({ orderId: order.id, retryAlimtalk: true }))).status, 409);
  const historic = await seedOrder({ status: "SHIPPED", carrier: "CJ대한통운", trackingNumber: invoice });
  await orders.PATCH(request({ orderId: historic.id, status: "SHIPPED" }));
  assert.equal(calls.length, 1);
  assert.equal(await prisma.shipmentNotification.count(), 1);
});

test("account closure removes associated shipment notices while preserving the order ledger", async () => {
  const user = await prisma.user.create({ data: { email: "closed@example.test", phone } });
  signedInUserId = user.id;
  const order = await seedOrder({ userId: user.id, status: "DELIVERED", carrier: "CJ대한통운", trackingNumber: invoice });
  await prisma.shipmentNotification.create({ data: { orderId: order.id, carrier: "CJ대한통운", trackingNumber: invoice, status: "SENT" } });
  assert.equal((await account.DELETE(request({ confirmation: "탈퇴", acknowledged: true }))).status, 200);
  assert.equal(await prisma.shipmentNotification.count(), 0);
  const retained = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  assert.equal(retained.userId, null);
  assert.equal(retained.trackingNumber, null);
  assert.equal(calls.length, 0);
});
