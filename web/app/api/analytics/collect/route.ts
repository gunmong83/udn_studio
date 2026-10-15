import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { auth } from "@/src/auth";
import { parseUserAgent } from "@/src/lib/user-agent";
import { clientIp } from "@/src/lib/request-rate-limit";
import { products } from "@/src/data/products";
import { ANALYTICS_COOKIE, campaignValue, referrerInfo, signAnalyticsSession, validAnalyticsId } from "@/src/lib/analytics-attribution";

const events = new Set(["add_to_cart", "payment_attempt", "payment_error", "checkout_login_required", "checkout_empty"]);
const reasons = new Set(["required_name", "invalid_phone", "required_address", "order_or_payment", "payment_timeout", "provider_return"]);
const windows = new Map<string, { count: number; until: number }>();
const text = (v: unknown, max: number) => typeof v === "string" ? v.slice(0, max) : undefined;
const integer = (v: unknown, max: number) => typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(0, Math.round(v))) : undefined;
function acknowledge(sessionId: string, secure: boolean, pageViewId?: string) {
  const response = NextResponse.json({ ok: true, ...(pageViewId ? { pageViewId } : {}) });
  const signed = signAnalyticsSession(sessionId);
  if (signed) response.cookies.set(ANALYTICS_COOKIE, signed, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 1800 });
  return response;
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    const siteOrigin = process.env.AUTH_URL ? new URL(process.env.AUTH_URL).origin : new URL(request.url).origin;
    if (origin && origin !== new URL(request.url).origin && origin !== siteOrigin) return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
    const ua = request.headers.get("user-agent") || "";
    if (/bot|crawler|spider|robot|crawling|lighthouse|headless/i.test(ua)) return NextResponse.json({ ok: true, ignored: "bot" });
    const ip = clientIp(request.headers);
    const now = Date.now();
    if (windows.size > 5000) for (const [key, value] of windows) if (value.until <= now) windows.delete(key);
    const rate = windows.get(ip);
    if (rate && rate.until > now && rate.count >= 240) return NextResponse.json({ error: "Too many events" }, { status: 429 });
    windows.set(ip, rate && rate.until > now ? { ...rate, count: rate.count + 1 } : { count: 1, until: now + 60000 });
    const raw = await request.text();
    if (raw.length > 6000) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    let body;
    try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
    if (!body || !validAnalyticsId(body.sessionId)) return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    const { sessionId, type, pageViewId } = body;
    const occurredAt = typeof body.occurredAt === "number" && Math.abs(now - body.occurredAt) < 300000 ? new Date(body.occurredAt) : new Date(now);

    if (type === "heartbeat" || type === "leave") {
      const delta = integer(body.delta, 120);
      if (!delta || !validAnalyticsId(pageViewId)) return NextResponse.json({ ok: true });
      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.analyticsPageView.updateMany({
          where: { id: pageViewId, sessionId },
          data: { duration: { increment: delta }, scrollDepth: integer(body.scrollDepth, 100) },
        });
        if (result.count) await tx.analyticsSession.update({ where: { id: sessionId }, data: { duration: { increment: delta } } });
        return result.count > 0;
      });
      return updated ? acknowledge(sessionId, siteOrigin.startsWith("https:")) : NextResponse.json({ ok: true });
    }
    const path = text(body.path, 300);
    if (!path?.startsWith("/") || path.startsWith("//") || /[?#]/.test(path)) return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    if (/^\/(admin|api)(\/|$)/.test(path)) return NextResponse.json({ ok: true, ignored: "internal" });
    if (type !== "pageview" && type !== "event") return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    if (type === "pageview" && !validAnalyticsId(pageViewId)) return NextResponse.json({ error: "Invalid page ID" }, { status: 400 });
    if (type === "event" && (!events.has(body.name) || !validAnalyticsId(body.eventId))) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    const product = products.find((p) => p.kind === "product" && p.slug === body.productId && !p.adminOnly);
    if (type === "event" && body.name === "add_to_cart" && (!product || !Number.isInteger(body.quantity) || body.quantity < 1 || body.quantity > 99)) return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    const session = await auth();
    const user = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true } }) : null;
    if (user?.role === "ADMIN") return NextResponse.json({ ok: true, ignored: "admin" });
    const uaInfo = parseUserAgent(ua);
    const ref = referrerInfo(body.referrer, request.url);
    await prisma.$transaction(async (tx) => {
      const previous = await tx.analyticsSession.findUnique({ where: { id: sessionId }, select: { userId: true } });
      if (previous?.userId && user?.id && previous.userId !== user.id) throw new Error("SESSION_USER_MISMATCH");
      await tx.analyticsSession.upsert({
        where: { id: sessionId },
        create: {
          id: sessionId, visitorId: validAnalyticsId(body.visitorId) ? body.visitorId : sessionId,
          userId: user?.id, ...ref, entryPath: path, ...uaInfo, ip,
          country: text(request.headers.get("cf-ipcountry"), 2),
          networkType: text(body.networkType, 20), rtt: integer(body.rtt, 60000),
          screenWidth: integer(body.screenWidth, 20000), screenHeight: integer(body.screenHeight, 20000), language: text(body.language, 32),
          utmSource: campaignValue(body.utmSource), utmMedium: campaignValue(body.utmMedium),
          utmCampaign: campaignValue(body.utmCampaign), utmContent: campaignValue(body.utmContent),
          measurementVersion: 1, pageCount: 0, createdAt: occurredAt,
        },
        update: user ? { userId: user.id } : {},
      });
      if (type === "pageview") {
        const existing = await tx.analyticsPageView.findUnique({ where: { id: pageViewId } });
        if (existing && existing.sessionId !== sessionId) throw new Error("PAGE_SESSION_MISMATCH");
        await tx.analyticsPageView.upsert({ where: { id: pageViewId }, create: { id: pageViewId, sessionId, path, title: text(body.title, 200), createdAt: occurredAt }, update: {} });
        const count = await tx.analyticsPageView.count({ where: { sessionId } });
        await tx.analyticsSession.update({ where: { id: sessionId }, data: { pageCount: count } });
      } else {
        await tx.analyticsEvent.upsert({ where: { id: body.eventId }, update: {}, create: {
          id: body.eventId, sessionId, name: body.name, path, createdAt: occurredAt,
          productId: body.name === "add_to_cart" ? product?.slug : undefined, quantity: body.name === "add_to_cart" ? body.quantity : undefined,
          reason: reasons.has(body.reason) ? body.reason : undefined,
        } });
      }
    });
    return acknowledge(sessionId, siteOrigin.startsWith("https:"), type === "pageview" ? pageViewId : undefined);
  } catch {
    console.error("[analytics-collect] Unable to store measurement");
    return NextResponse.json({ error: "Unable to store event" }, { status: 500 });
  }
}
