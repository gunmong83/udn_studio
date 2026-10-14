import { createHmac } from "node:crypto";

export const SIGNUP_TEMPLATE_CODE = "UDNSIGNUPVERIFY";
export const SHIPMENT_TEMPLATE_CODE = "UDNSHIPSTART";

export type AlimtalkMessage = {
  to: string;
  content: string;
  buttons?: { type: "WL"; name: string; linkMobile: string; linkPc: string }[];
};

// A timeout/5xx may occur after SENS accepts the request. Never blindly retry it.
export class AlimtalkError extends Error {
  constructor(public code: string, public uncertain = false) {
    super(code);
  }
}

function config() {
  const serviceId = process.env.SENS_ALIMTALK_SERVICE_ID;
  const accessKey = process.env.SENS_ACCESS_KEY;
  const secretKey = process.env.SENS_SECRET_KEY;
  const plusFriendId = process.env.SENS_ALIMTALK_CHANNEL_ID;
  if (!serviceId?.startsWith("ncp:kkobizmsg:") || !accessKey || !secretKey || !plusFriendId?.startsWith("@")) {
    throw new AlimtalkError("CONFIG_MISSING");
  }
  return { serviceId, accessKey, secretKey, plusFriendId };
}

export function assertAlimtalkConfigured() { config(); }

async function sensRequest(method: "POST" | "GET", suffix: string, body?: unknown) {
  const { serviceId, accessKey, secretKey } = config();
  const uri = `/alimtalk/v2/services/${serviceId}/messages${suffix}`;
  const timestamp = String(Date.now());
  const signature = createHmac("sha256", secretKey).update(`${method} ${uri}\n${timestamp}\n${accessKey}`).digest("base64");
  let response: Response;
  try {
    response = await fetch(`https://sens.apigw.ntruss.com${uri}`, {
      method,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "x-ncp-apigw-timestamp": timestamp,
        "x-ncp-iam-access-key": accessKey,
        "x-ncp-apigw-signature-v2": signature,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch {
    throw new AlimtalkError("NETWORK_UNKNOWN", method === "POST");
  }
  if (!response.ok) throw new AlimtalkError(`HTTP_${response.status}`, method === "POST" && response.status >= 500);
  try {
    return await response.json();
  } catch {
    throw new AlimtalkError("RESPONSE_UNKNOWN", method === "POST");
  }
}

export function signupMessage(to: string, code: string): AlimtalkMessage {
  if (!/^\d{6}$/.test(code)) throw new Error("INVALID_OTP");
  return {
    to,
    content: `[studioUDN]\n회원가입을 위한 휴대폰 인증번호를 안내드립니다.\n\n인증번호: ${code}\n\n인증번호를 3분 이내에 회원가입 화면에 입력해 주세요.\n본인이 요청하지 않았다면 이 메시지를 무시해 주세요.`,
  };
}

export function shipmentMessage(to: string, carrier: string, trackingNumber: string, trackingUrl: string): AlimtalkMessage {
  const url = new URL(trackingUrl);
  if (url.protocol !== "https:") throw new Error("INVALID_TRACKING_URL");
  return {
    to,
    content: `[studioUDN]\n주문하신 상품의 배송이 시작되었습니다.\n\n택배사: ${carrier}\n송장번호: ${trackingNumber}\n\n아래 배송 조회 버튼을 눌러 배송 현황을 확인해 주세요.`,
    buttons: [{ type: "WL", name: "배송 조회", linkMobile: url.href, linkPc: url.href }],
  };
}

export async function sendAlimtalk(templateCode: string, message: AlimtalkMessage) {
  if (!/^01[016789]\d{7,8}$/.test(message.to)) throw new AlimtalkError("INVALID_RECIPIENT");
  const { plusFriendId } = config();
  const result = await sensRequest("POST", "", {
    plusFriendId, templateCode,
    messages: [{ countryCode: "82", ...message, useSmsFailover: false }],
  });
  const sent = result.messages?.[0];
  if (String(result.statusCode) !== "202" || (sent?.requestStatusCode && sent.requestStatusCode !== "A000")) {
    throw new AlimtalkError("REQUEST_REJECTED");
  }
  if (!result.requestId || !sent?.messageId || sent.requestStatusCode !== "A000") {
    throw new AlimtalkError("RESPONSE_UNKNOWN", true);
  }
  return { requestId: String(result.requestId), messageId: String(sent.messageId) };
}

export async function getAlimtalkResult(messageId: string): Promise<{ status: "ACCEPTED" | "SENT" | "FAILED"; code: string | null }> {
  const result = await sensRequest("GET", `/${encodeURIComponent(messageId)}`);
  if (result.messageStatusCode === "0000") return { status: "SENT", code: null };
  if (result.messageStatusName === "fail" || (result.requestStatusCode && result.requestStatusCode !== "A000")) {
    return { status: "FAILED", code: String(result.messageStatusCode ?? result.requestStatusCode).slice(0, 40) };
  }
  return { status: "ACCEPTED", code: null };
}
