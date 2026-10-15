import { createHmac, timingSafeEqual } from "node:crypto";

export const ANALYTICS_COOKIE = "udn_analytics";
export const validAnalyticsId = (value: unknown): value is string => typeof value === "string" && /^[a-zA-Z0-9_-]{8,80}$/.test(value);

export function signAnalyticsSession(id: string) {
  if (!process.env.AUTH_SECRET) return null;
  const expires = Date.now() + 30 * 60 * 1000;
  const value = `${id}.${expires}`;
  return `${value}.${createHmac("sha256", process.env.AUTH_SECRET).update(value).digest("hex")}`;
}

export function readAnalyticsSession(request: Request): string | null {
  const raw = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${ANALYTICS_COOKIE}=`))?.slice(ANALYTICS_COOKIE.length + 1);
  if (!raw || !process.env.AUTH_SECRET) return null;
  const [id, expires, signature] = raw.split(".");
  if (!validAnalyticsId(id) || !/^\d+$/.test(expires ?? "") || Number(expires) <= Date.now() || !/^[a-f0-9]{64}$/.test(signature ?? "")) return null;
  const expected = createHmac("sha256", process.env.AUTH_SECRET).update(`${id}.${expires}`).digest("hex");
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) ? id : null;
}

export function campaignValue(value: unknown) {
  // Campaign labels only: never collect arbitrary query strings or search terms.
  return typeof value === "string" ? value.replace(/[^\p{L}\p{N} _./-]/gu, "").trim().slice(0, 100) || null : null;
}

export function referrerInfo(raw: unknown, requestUrl: string) {
  try {
    const url = new URL(String(raw));
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("scheme");
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const own = new URL(requestUrl).hostname.replace(/^www\./, "");
    if (host === own || ["studioundesignated.com", "udn.kr", "localhost"].includes(host)) return { referrer: null, referrerDomain: "Direct" };
    const match = (domain: string) => host === domain || host.endsWith(`.${domain}`);
    const google = ["google.com", "google.co.kr", "google.co.jp", "google.co.uk", "google.de", "google.fr"].some(match);
    const domain = match("naver.com") ? "Naver" : google ? "Google" : match("instagram.com") ? "Instagram" : match("kakao.com") || match("daum.net") ? "Daum / Kakao" : match("youtube.com") ? "YouTube" : match("facebook.com") ? "Facebook" : match("threads.net") || match("threads.com") ? "Threads" : match("chatgpt.com") ? "ChatGPT" : host;
    return { referrer: url.origin, referrerDomain: domain };
  } catch { return { referrer: null, referrerDomain: "Direct" }; }
}
