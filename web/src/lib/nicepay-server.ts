import { createHash } from "node:crypto";

export const NICEPAY_PRODUCTION_API_BASE_URL = "https://api.nicepay.co.kr/v1";
export const NICEPAY_SANDBOX_API_BASE_URL = "https://sandbox-api.nicepay.co.kr/v1";

export function niceConfig() {
  // Keep the old variable name as a compatibility fallback for deployments
  // that already contain the new Server-approval client key in it.
  const clientId = (process.env.NICEPAY_CLIENT_ID || process.env.NICEPAY_MERCHANT_KEY)?.trim();
  const secretKey = process.env.NICEPAY_SECRET_KEY?.trim();
  if (!clientId || !secretKey) throw new Error("NICEPAY_CONFIG_MISSING");
  const apiBaseUrl = (process.env.NICEPAY_API_BASE_URL?.trim() ||
    (clientId.startsWith("S2_") ? NICEPAY_SANDBOX_API_BASE_URL : NICEPAY_PRODUCTION_API_BASE_URL)).replace(/\/$/, "");
  return { clientId, secretKey, apiBaseUrl };
}

export function niceDigest(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function niceDate(date = new Date()) {
  return date.toISOString();
}

export function niceAuthorization(clientId: string, secretKey: string) {
  return `Basic ${Buffer.from(`${clientId}:${secretKey}`).toString("base64")}`;
}

export async function cancelNicePayment(args: { tid: string; orderId: string; reason: string }) {
  const config = niceConfig();
  const response = await fetch(`${config.apiBaseUrl}/payments/${encodeURIComponent(args.tid)}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: niceAuthorization(config.clientId, config.secretKey) },
    // NICE v1 취소 API의 필수 값은 reason과 가맹점 주문번호(orderId)입니다.
    // 전액 취소는 cancelAmt를 생략해야 하며, amount라는 필드는 사용하지 않습니다.
    body: JSON.stringify({ orderId: args.orderId, reason: args.reason.slice(0, 100) }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || String(result?.resultCode ?? "") !== "0000") {
    throw new Error(result?.resultMsg || "나이스페이 결제 취소에 실패했습니다.");
  }
  return result;
}
