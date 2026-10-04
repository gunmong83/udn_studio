import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { parseUserAgent } from "@/src/lib/user-agent";
import { clientIp } from "@/src/lib/request-rate-limit";

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
    // 봇 및 크롤러 감지 시 가볍게 200 반환 후 무시
    if (/bot|googlebot|bingbot|yandex|baiduspider|petalbot|crawler|spider|robot|crawling|lighthouse|headless/i.test(ua)) {
      return NextResponse.json({ ok: true, ignored: "bot" });
    }

    const host = request.headers.get("host") || "";
    const ip = clientIp(request.headers);
    const country = request.headers.get("cf-ipcountry") || undefined;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const {
      type,
      sessionId,
      visitorId,
      userId,
      path,
      title,
      referrer,
      pageViewId,
      delta,
      networkType,
      rtt,
      screenWidth,
      screenHeight,
      language,
      scrollDepth,
    } = body as {
      type?: string;
      sessionId?: string;
      visitorId?: string;
      userId?: string;
      path?: string;
      title?: string;
      referrer?: string;
      pageViewId?: string;
      delta?: number;
      networkType?: string;
      rtt?: number;
      screenWidth?: number;
      screenHeight?: number;
      language?: string;
      scrollDepth?: number;
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
        select: { id: true, userId: true },
      });

      if (!existingSession) {
        const uaInfo = parseUserAgent(ua);
        const refInfo = parseReferrer(referrer, host);

        await prisma.analyticsSession.create({
          data: {
            id: sessionId,
            visitorId: visitorId || sessionId,
            userId: userId || undefined,
            ip,
            country,
            networkType,
            rtt: typeof rtt === "number" ? Math.round(rtt) : undefined,
            screenWidth: typeof screenWidth === "number" ? Math.round(screenWidth) : undefined,
            screenHeight: typeof screenHeight === "number" ? Math.round(screenHeight) : undefined,
            language: language?.slice(0, 32),
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
            ...(userId && !existingSession.userId ? { userId } : {}),
            ...(networkType ? { networkType } : {}),
            ...(typeof rtt === "number" ? { rtt: Math.round(rtt) } : {}),
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

      // 세션 체류 시간 갱신
      try {
        await prisma.analyticsSession.update({
          where: { id: sessionId },
          data: {
            duration: { increment: parsedDelta },
          },
        });
      } catch {
        // 세션 없을 시 무시
      }

      // 페이지뷰 체류 시간 및 스크롤 깊이 갱신
      if (pageViewId) {
        try {
          const parsedScroll = typeof scrollDepth === "number" ? Math.min(Math.max(Math.round(scrollDepth), 0), 100) : undefined;
          await prisma.analyticsPageView.update({
            where: { id: pageViewId },
            data: {
              duration: { increment: parsedDelta },
              ...(parsedScroll !== undefined ? { scrollDepth: parsedScroll } : {}),
            },
          });
        } catch {
          // 페이지뷰 없을 시 무시
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
