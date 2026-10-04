import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

function parseUserAgent(ua: string) {
  let device = "Desktop";
  if (/tablet|ipad/i.test(ua)) {
    device = "Tablet";
  } else if (/mobile|iphone|ipod|android/i.test(ua)) {
    device = "Mobile";
  }

  let browser = "Other";
  if (/whale/i.test(ua)) {
    browser = "Whale";
  } else if (/edg/i.test(ua)) {
    browser = "Edge";
  } else if (/samsungbrowser/i.test(ua)) {
    browser = "Samsung Internet";
  } else if (/chrome|crios/i.test(ua)) {
    browser = "Chrome";
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = "Safari";
  } else if (/firefox|fxios/i.test(ua)) {
    browser = "Firefox";
  }

  let os = "Other";
  if (/iphone|ipad|ipod/i.test(ua)) {
    os = "iOS";
  } else if (/android/i.test(ua)) {
    os = "Android";
  } else if (/windows/i.test(ua)) {
    os = "Windows";
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = "macOS";
  } else if (/linux/i.test(ua)) {
    os = "Linux";
  }

  return { device, browser, os };
}

function parseReferrer(rawReferrer?: string | null, host?: string | null) {
  if (!rawReferrer) return { referrer: null, referrerDomain: "Direct" };
  try {
    const url = new URL(rawReferrer);
    const refHost = url.hostname.toLowerCase();
    if (host && (refHost === host.toLowerCase() || refHost.includes("udn.kr") || refHost.includes("localhost"))) {
      return { referrer: rawReferrer, referrerDomain: "Direct" };
    }
    if (refHost.includes("naver.com")) return { referrer: rawReferrer, referrerDomain: "Naver" };
    if (refHost.includes("google.")) return { referrer: rawReferrer, referrerDomain: "Google" };
    if (refHost.includes("daum.net") || refHost.includes("kakao.com")) return { referrer: rawReferrer, referrerDomain: "Daum / Kakao" };
    if (refHost.includes("instagram.com")) return { referrer: rawReferrer, referrerDomain: "Instagram" };
    if (refHost.includes("youtube.com")) return { referrer: rawReferrer, referrerDomain: "YouTube" };
    if (refHost.includes("facebook.com")) return { referrer: rawReferrer, referrerDomain: "Facebook" };
    if (refHost.includes("twitter.com") || refHost.includes("x.com")) return { referrer: rawReferrer, referrerDomain: "X (Twitter)" };
    return { referrer: rawReferrer, referrerDomain: refHost.replace(/^www\./, "") };
  } catch {
    return { referrer: rawReferrer, referrerDomain: "Direct" };
  }
}

export async function POST(request: Request) {
  try {
    const ua = request.headers.get("user-agent") || "";
    // 봇 및 크롤러 감지 시 수집 무시
    if (/bot|googlebot|bingbot|yandex|baiduspider|petalbot|crawler|spider|robot|crawling|lighthouse|headless/i.test(ua)) {
      return NextResponse.json({ ok: true, ignored: "bot" });
    }

    const host = request.headers.get("host") || "";
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { type, sessionId, visitorId, path, title, referrer, pageViewId, delta } = body as {
      type?: string;
      sessionId?: string;
      visitorId?: string;
      path?: string;
      title?: string;
      referrer?: string;
      pageViewId?: string;
      delta?: number;
    };

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    // 관리자 페이지 또는 내부 API 트래킹 제외
    if (path && (path.startsWith("/admin") || path.startsWith("/api"))) {
      return NextResponse.json({ ok: true, ignored: "admin/api" });
    }

    if (type === "pageview") {
      if (!path) {
        return NextResponse.json({ error: "path is required" }, { status: 400 });
      }

      const existingSession = await prisma.analyticsSession.findUnique({
        where: { id: sessionId },
        select: { id: true },
      });

      if (!existingSession) {
        const uaInfo = parseUserAgent(ua);
        const refInfo = parseReferrer(referrer, host);

        await prisma.analyticsSession.create({
          data: {
            id: sessionId,
            visitorId: visitorId || sessionId,
            referrer: refInfo.referrer,
            referrerDomain: refInfo.referrerDomain,
            entryPath: path,
            device: uaInfo.device,
            browser: uaInfo.browser,
            os: uaInfo.os,
            duration: 0,
            pageCount: 1,
          },
        });
      } else {
        await prisma.analyticsSession.update({
          where: { id: sessionId },
          data: {
            pageCount: { increment: 1 },
          },
        });
      }

      const pv = await prisma.analyticsPageView.create({
        data: {
          sessionId,
          path,
          title: title || path,
          duration: 0,
        },
      });

      return NextResponse.json({ success: true, pageViewId: pv.id });
    }

    if (type === "heartbeat" || type === "leave") {
      const parsedDelta = Math.min(Math.max(Math.round(Number(delta) || 0), 1), 120);

      try {
        await prisma.analyticsSession.update({
          where: { id: sessionId },
          data: {
            duration: { increment: parsedDelta },
          },
        });
      } catch {
        // 세션이 삭제되었거나 존재하지 않는 경우 무시
      }

      if (pageViewId) {
        try {
          await prisma.analyticsPageView.update({
            where: { id: pageViewId },
            data: {
              duration: { increment: parsedDelta },
            },
          });
        } catch {
          // 페이지뷰가 없는 경우 무시
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown event type" }, { status: 400 });
  } catch (error) {
    console.error("[analytics-collect] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
