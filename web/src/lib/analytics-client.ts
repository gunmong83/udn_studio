"use client";

const IDLE_MS = 30 * 60 * 1000;
let fallbackVisitor = "";
let fallbackSession = "";
let fallbackActive = 0;

export function analyticsIdentity() {
  if (typeof window === "undefined") return null;
  const now = Date.now();
  try {
    let visitorId = localStorage.getItem("_udn_vid");
    if (!visitorId) {
      visitorId = `v_${crypto.randomUUID()}`;
      localStorage.setItem("_udn_vid", visitorId);
    }
    let sessionId = sessionStorage.getItem("_udn_sid");
    const active = Number(sessionStorage.getItem("_udn_active"));
    if (!sessionId || !active || now - active > IDLE_MS) {
      sessionId = `s_${crypto.randomUUID()}`;
      sessionStorage.setItem("_udn_sid", sessionId);
    }
    sessionStorage.setItem("_udn_active", String(now));
    return { visitorId, sessionId };
  } catch {
    fallbackVisitor ||= `v_${crypto.randomUUID()}`;
    if (!fallbackSession || now - fallbackActive > IDLE_MS) fallbackSession = `s_${crypto.randomUUID()}`;
    fallbackActive = now;
    return { visitorId: fallbackVisitor, sessionId: fallbackSession };
  }
}

export function analyticsContext() {
  const identity = analyticsIdentity();
  if (!identity) return null;
  const params = new URLSearchParams(window.location.search);
  return {
    ...identity,
    path: window.location.pathname,
    referrer: document.referrer,
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    utmContent: params.get("utm_content"),
  };
}

export function sendAnalytics(payload: Record<string, unknown>) {
  try {
    const json = JSON.stringify({ occurredAt: Date.now(), ...payload });
    if (navigator.sendBeacon?.("/api/analytics/collect", new Blob([json], { type: "application/json" }))) return;
    void fetch("/api/analytics/collect", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: json, keepalive: true,
    }).catch(() => {});
  } catch { /* Measurement must never interrupt shopping. */ }
}

export function trackCommerce(name: "add_to_cart" | "payment_attempt" | "payment_error" | "checkout_login_required" | "checkout_empty", detail: { productId?: string; quantity?: number; reason?: string } = {}) {
  try {
    if (window.location.pathname.startsWith("/admin")) return;
    const context = analyticsContext();
    if (context) sendAnalytics({ ...context, type: "event", eventId: `e_${crypto.randomUUID()}`, name, ...detail });
  } catch { /* Analytics is best effort. */ }
}
