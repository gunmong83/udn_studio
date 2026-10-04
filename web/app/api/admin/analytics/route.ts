import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/admin";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "7d";

    const now = new Date();
    let startDate: Date;

    if (range === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (range === "30d") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === "all") {
      startDate = new Date(0);
    } else {
      // 기본: 7d
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const [sessions, pageviews] = await Promise.all([
      prisma.analyticsSession.findMany({
        where: { createdAt: { gte: startDate } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.analyticsPageView.findMany({
        where: { createdAt: { gte: startDate } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // 1. 핵심 요약 KPI
    const totalSessions = sessions.length;
    const uniqueVisitors = new Set(sessions.map((s) => s.visitorId)).size;
    const totalPageviews = pageviews.length;
    const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
    const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;
    const singlePageSessions = sessions.filter((s) => s.pageCount <= 1).length;
    const bounceRate = totalSessions > 0 ? Math.round((singlePageSessions / totalSessions) * 100) : 0;

    // 2. 일별 추이 (Daily Trends)
    const dailyMap = new Map<string, { date: string; sessions: number; pageviews: number; visitors: Set<string> }>();
    
    // 날짜별 키 생성 함수 (YYYY-MM-DD KST)
    const formatDateKey = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // 최근 7일 또는 지정 기간의 빈 날짜 슬롯 채우기 (정렬된 차트용)
    const daysCount = range === "today" ? 1 : range === "30d" ? 30 : 7;
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = formatDateKey(d);
      dailyMap.set(key, { date: key, sessions: 0, pageviews: 0, visitors: new Set() });
    }

    sessions.forEach((s) => {
      const key = formatDateKey(new Date(s.createdAt));
      const entry = dailyMap.get(key) || { date: key, sessions: 0, pageviews: 0, visitors: new Set() };
      entry.sessions += 1;
      entry.visitors.add(s.visitorId);
      dailyMap.set(key, entry);
    });

    pageviews.forEach((pv) => {
      const key = formatDateKey(new Date(pv.createdAt));
      const entry = dailyMap.get(key);
      if (entry) {
        entry.pageviews += 1;
      }
    });

    const dailyTrends = Array.from(dailyMap.values())
      .map((item) => ({
        date: item.date,
        sessions: item.sessions,
        pageviews: item.pageviews,
        visitors: item.visitors.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 3. 인기 페이지 Top 10 (Popular Pages)
    const pageMap = new Map<string, { path: string; count: number; totalDuration: number }>();
    pageviews.forEach((pv) => {
      const entry = pageMap.get(pv.path) || { path: pv.path, count: 0, totalDuration: 0 };
      entry.count += 1;
      entry.totalDuration += pv.duration;
      pageMap.set(pv.path, entry);
    });

    const topPages = Array.from(pageMap.values())
      .map((p) => ({
        path: p.path,
        views: p.count,
        avgDuration: p.count > 0 ? Math.round(p.totalDuration / p.count) : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // 4. 유입 도메인 순위 (Referrer Domains)
    const referrerMap = new Map<string, number>();
    sessions.forEach((s) => {
      const domain = s.referrerDomain || "Direct";
      referrerMap.set(domain, (referrerMap.get(domain) || 0) + 1);
    });

    const topReferrers = Array.from(referrerMap.entries())
      .map(([domain, count]) => ({
        domain,
        count,
        percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 5. 기기 / 브라우저 / OS 분포
    const deviceMap = new Map<string, number>();
    const browserMap = new Map<string, number>();
    const osMap = new Map<string, number>();

    sessions.forEach((s) => {
      const dev = s.device || "Unknown";
      deviceMap.set(dev, (deviceMap.get(dev) || 0) + 1);

      const br = s.browser || "Unknown";
      browserMap.set(br, (browserMap.get(br) || 0) + 1);

      const os = s.os || "Unknown";
      osMap.set(os, (osMap.get(os) || 0) + 1);
    });

    const mapToSortedList = (map: Map<string, number>) =>
      Array.from(map.entries())
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);

    const devices = mapToSortedList(deviceMap);
    const browsers = mapToSortedList(browserMap);
    const osList = mapToSortedList(osMap);

    // 6. 최근 세션 로그 (Recent Sessions) 20개
    const recentSessions = sessions.slice(0, 20).map((s) => ({
      id: s.id,
      visitorId: s.visitorId.length > 12 ? `${s.visitorId.slice(0, 8)}...` : s.visitorId,
      createdAt: s.createdAt.toISOString(),
      referrerDomain: s.referrerDomain || "Direct",
      entryPath: s.entryPath,
      duration: s.duration,
      pageCount: s.pageCount,
      device: s.device || "Desktop",
      browser: s.browser || "Unknown",
      os: s.os || "Unknown",
    }));

    return NextResponse.json({
      summary: {
        totalVisitors: uniqueVisitors,
        totalSessions,
        totalPageviews,
        avgDuration, // in seconds
        bounceRate, // in percentage
      },
      dailyTrends,
      topPages,
      topReferrers,
      devices,
      browsers,
      osList,
      recentSessions,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_AUTH_REQUIRED") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[admin-analytics] Error:", error);
    return NextResponse.json({ error: "Unable to load analytics data" }, { status: 500 });
  }
}
