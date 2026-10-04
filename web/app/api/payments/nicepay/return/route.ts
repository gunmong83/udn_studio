import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { sendPaymentAdminEmail } from "@/src/lib/mailer";
import { niceAuthorization, niceConfig, niceDigest } from "@/src/lib/nicepay-server";

const redirectTo = (request: Request, path: string, params: Record<string, string>) => {
  const configuredOrigin = process.env.AUTH_URL?.trim();
  const origin = configuredOrigin ? new URL(configuredOrigin).origin : new URL(request.url).origin;
  const url = new URL(path, origin);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return NextResponse.redirect(url, 303);
};

function value(form: FormData, key: string) {
  const entry = form.get(key);
  return typeof entry === "string" ? entry : "";
}

export async function POST(request: Request) {
  const form = await request.formData();
  const orderId = value(form, "orderId");
  let config: ReturnType<typeof niceConfig>;
  try { config = niceConfig(); } catch { return redirectTo(request, "/checkout/fail", { orderId, message: "나이스페이 설정이 완료되지 않았습니다." }); }

  // NICE의 외부 POST 콜백은 SameSite 정책상 로그인 쿠키가 전달되지 않을 수
  // 있으므로, 세션 대신 opaque orderId + NICE 서명/금액 검증으로 주문을 묶습니다.
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return redirectTo(request, "/checkout/fail", { orderId, message: "주문을 찾을 수 없습니다." });

  const authCode = value(form, "authResultCode");
  const clientId = value(form, "clientId");
  const amount = value(form, "amount");
  const authToken = value(form, "authToken");
  const signature = value(form, "signature");
  const tid = value(form, "tid");
  const numericAmount = Number(amount);
  const expectedSignature = niceDigest(`${authToken}${clientId}${amount}${config.secretKey}`);
  console.info("[nicepay] auth callback", { orderId, authCode, tid, clientIdPrefix: clientId.slice(0, 3), amount, hasAuthToken: Boolean(authToken) });
  if (authCode !== "0000" || clientId !== config.clientId || !tid || !Number.isSafeInteger(numericAmount) || numericAmount !== order.totalAmount || !authToken || signature !== expectedSignature) {
    return redirectTo(request, "/checkout/fail", { orderId, message: value(form, "authResultMsg") || "결제 인증에 실패했습니다." });
  }

  const approvalResponse = await fetch(`${config.apiBaseUrl}/payments/${encodeURIComponent(tid)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: niceAuthorization(config.clientId, config.secretKey),
    },
    // NICE 공식 Server 승인 Node.js 샘플과 동일하게 승인에는 금액만 전달합니다.
    // 위변조 검증은 직전 단계의 auth callback signature로 이미 수행했습니다.
    body: JSON.stringify({ amount: order.totalAmount }),
  });
  const approval = await approvalResponse.json().catch(() => null);
  console.info("[nicepay] approval response", { orderId, httpStatus: approvalResponse.status, resultCode: String(approval?.resultCode ?? ""), resultMsg: String(approval?.resultMsg ?? "") });
  if (!approvalResponse.ok || String(approval?.resultCode ?? "") !== "0000" || Number(approval?.amount) !== order.totalAmount || String(approval?.orderId) !== order.id) {
    return redirectTo(request, "/checkout/fail", { orderId, message: approval?.resultMsg || "결제 승인에 실패했습니다." });
  }

  const paymentKey = String(approval?.tid || tid);
  const updatedResult = await prisma.order.updateMany({ where: { id: order.id, paymentStatus: "UNPAID", status: "PENDING" }, data: { paymentKey, paymentStatus: "PAID", status: "PAID" } });
  const updated = await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } });
  if (updatedResult.count === 1 && updated) void sendPaymentAdminEmail(updated);
  return redirectTo(request, "/checkout/success", { provider: "nicepay", paymentKey, orderId: order.id, amount });
}
