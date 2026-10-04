"use client";

import { useEffect, useState, useCallback } from "react";

interface AnalyticsSummary {
  totalVisitors: number;
  totalSessions: number;
  totalPageviews: number;
  avgDuration: number;
  bounceRate: number;
}

interface DailyTrend {
  date: string;
  sessions: number;
  pageviews: number;
  visitors: number;
}

interface TopPage {
  path: string;
  views: number;
  avgDuration: number;
}

interface TopReferrer {
  domain: string;
  count: number;
  percentage: number;
}

interface DistributionItem {
  name: string;
  count: number;
  percentage: number;
}

interface RecentSession {
  id: string;
  visitorId: string;
  createdAt: string;
  referrerDomain: string;
  entryPath: string;
  duration: number;
  pageCount: number;
  device: string;
  browser: string;
  os: string;
}

interface AnalyticsData {
  summary: AnalyticsSummary;
  dailyTrends: DailyTrend[];
  topPages: TopPage[];
  topReferrers: TopReferrer[];
  devices: DistributionItem[];
  browsers: DistributionItem[];
  osList: DistributionItem[];
  recentSessions: RecentSession[];
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}분 ${s}초` : `${m}분`;
}

function formatShortDate(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[1]}/${parts[2]}`;
  }
  return dateStr;
}

export default function TrafficAnalyticsTab() {
  const [range, setRange] = useState<"today" | "7d" | "30d" | "all">("7d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredTrend, setHoveredTrend] = useState<DailyTrend | null>(null);

  const fetchAnalytics = useCallback(async (currentRange: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?range=${currentRange}`);
      if (!res.ok) {
        throw new Error("트래픽 분석 데이터를 불러오지 못했습니다.");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(range);
  }, [range, fetchAnalytics]);

  const maxViews = data?.dailyTrends?.length
    ? Math.max(...data.dailyTrends.map((t) => Math.max(t.pageviews, t.sessions)), 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* 기간 필터 컨트롤바 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-line bg-soft p-3">
        <div className="flex items-center gap-1.5">
          <span className="mr-2 text-util font-semibold text-text">분석 기간:</span>
          {(
            [
              { key: "today", label: "오늘" },
              { key: "7d", label: "최근 7일" },
              { key: "30d", label: "최근 30일" },
              { key: "all", label: "전체" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setRange(item.key)}
              className={`h-8 px-3 text-util font-medium transition-colors ${
                range === item.key
                  ? "bg-text font-bold text-bg"
                  : "border border-line bg-bg text-muted hover:text-text"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => fetchAnalytics(range)}
          disabled={loading}
          className="inline-flex h-8 items-center justify-center border border-line bg-bg px-3 text-util font-medium text-text hover:bg-line/20 disabled:opacity-50"
        >
          {loading ? "조회 중..." : "↻ 새로고침"}
        </button>
      </div>

      {error && (
        <div className="rounded-sm border border-red-300 bg-red-50 p-4 text-util text-red-700">
          {error}
        </div>
      )}

      {/* KPI 카드 5개 */}
      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-sm border border-line bg-bg p-4">
            <p className="text-util text-muted">순 방문자 (UV)</p>
            <p className="mt-1 text-heading font-bold text-text">
              {data.summary.totalVisitors.toLocaleString()}명
            </p>
            <p className="mt-1 text-[11px] text-muted">중복 제외 순수 방문</p>
          </div>
          <div className="rounded-sm border border-line bg-bg p-4">
            <p className="text-util text-muted">총 세션 (방문 수)</p>
            <p className="mt-1 text-heading font-bold text-text">
              {data.summary.totalSessions.toLocaleString()}회
            </p>
            <p className="mt-1 text-[11px] text-muted">사이트 유입 세션 수</p>
          </div>
          <div className="rounded-sm border border-line bg-bg p-4">
            <p className="text-util text-muted">총 페이지뷰 (PV)</p>
            <p className="mt-1 text-heading font-bold text-text">
              {data.summary.totalPageviews.toLocaleString()}회
            </p>
            <p className="mt-1 text-[11px] text-muted">
              세션당 평균 {(data.summary.totalSessions > 0 ? (data.summary.totalPageviews / data.summary.totalSessions).toFixed(1) : 0)}회
            </p>
          </div>
          <div className="rounded-sm border border-line bg-bg p-4">
            <p className="text-util text-muted">평균 체류 시간</p>
            <p className="mt-1 text-heading font-bold text-text">
              {formatDuration(data.summary.avgDuration)}
            </p>
            <p className="mt-1 text-[11px] text-muted">사이트 내 머문 평균 시간</p>
          </div>
          <div className="rounded-sm border border-line bg-bg p-4">
            <p className="text-util text-muted">이탈률 (Bounce Rate)</p>
            <p className="mt-1 text-heading font-bold text-text">
              {data.summary.bounceRate}%
            </p>
            <p className="mt-1 text-[11px] text-muted">단일 페이지만 보고 이탈</p>
          </div>
        </div>
      )}

      {/* 방문 추이 차트 */}
      {data && data.dailyTrends && data.dailyTrends.length > 0 && (
        <div className="rounded-sm border border-line bg-bg p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-nav font-bold text-text">일별 방문 & 페이지뷰 추이</h2>
              <p className="text-util text-muted">
                {hoveredTrend
                  ? `${hoveredTrend.date}: 세션 ${hoveredTrend.sessions}회 · 페이지뷰 ${hoveredTrend.pageviews}회 · 방문자 ${hoveredTrend.visitors}명`
                  : "막대에 마우스를 올리면 상세 수치를 확인할 수 있습니다."}
              </p>
            </div>
            <div className="flex items-center gap-4 text-util">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-xs bg-text" /> 세션 (방문)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-xs bg-[#888]" /> 페이지뷰 (조회)
              </span>
            </div>
          </div>

          <div className="mt-6 flex h-44 items-end gap-2 border-b border-line pb-2 sm:gap-3">
            {data.dailyTrends.map((trend) => {
              const sessionHeight = Math.max(Math.round((trend.sessions / maxViews) * 100), 2);
              const pvHeight = Math.max(Math.round((trend.pageviews / maxViews) * 100), 2);
              const isHovered = hoveredTrend?.date === trend.date;

              return (
                <div
                  key={trend.date}
                  className="group relative flex h-full flex-1 flex-col items-center justify-end"
                  onMouseEnter={() => setHoveredTrend(trend)}
                  onMouseLeave={() => setHoveredTrend(null)}
                >
                  {/* 막대 묶음 */}
                  <div className="flex w-full max-w-[28px] items-end justify-center gap-1">
                    {/* 세션 막대 */}
                    <div
                      className={`w-1/2 rounded-t-xs transition-all ${
                        isHovered ? "bg-black" : "bg-text"
                      }`}
                      style={{ height: `${trend.sessions > 0 ? sessionHeight : 0}%` }}
                    />
                    {/* PV 막대 */}
                    <div
                      className={`w-1/2 rounded-t-xs transition-all ${
                        isHovered ? "bg-neutral-600" : "bg-[#888]"
                      }`}
                      style={{ height: `${trend.pageviews > 0 ? pvHeight : 0}%` }}
                    />
                  </div>

                  {/* 날짜 라벨 */}
                  <span className="mt-2 text-[10px] text-muted group-hover:font-bold group-hover:text-text">
                    {formatShortDate(trend.date)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2열 레이아웃: 인기 페이지 Top 10 & 유입 도메인 순위 */}
      {data && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 1. 인기 페이지 Top 10 */}
          <div className="rounded-sm border border-line bg-bg p-5">
            <h2 className="text-nav font-bold text-text">가장 많이 본 페이지 Top 10</h2>
            <p className="mt-0.5 text-util text-muted">페이지별 조회수 및 평균 체류 시간</p>

            <div className="mt-4 divide-y divide-line">
              {data.topPages.length === 0 ? (
                <p className="py-6 text-center text-util text-muted">방문 기록이 없습니다.</p>
              ) : (
                data.topPages.map((page, index) => (
                  <div key={page.path} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs bg-soft text-util font-bold text-text">
                        {index + 1}
                      </span>
                      <a
                        href={page.path}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-util font-medium text-text hover:underline"
                        title={page.path}
                      >
                        {page.path}
                      </a>
                    </div>
                    <div className="flex shrink-0 items-center gap-4 text-util">
                      <span className="font-bold text-text">{page.views.toLocaleString()}회</span>
                      <span className="text-muted">{formatDuration(page.avgDuration)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 2. 유입 경로 / 도메인 순위 */}
          <div className="rounded-sm border border-line bg-bg p-5">
            <h2 className="text-nav font-bold text-text">유입 경로 순위 (Referrers)</h2>
            <p className="mt-0.5 text-util text-muted">방문자가 어디를 통해 유입되었는지 분석</p>

            <div className="mt-4 space-y-3">
              {data.topReferrers.length === 0 ? (
                <p className="py-6 text-center text-util text-muted">유입 기록이 없습니다.</p>
              ) : (
                data.topReferrers.map((ref) => (
                  <div key={ref.domain} className="space-y-1">
                    <div className="flex items-center justify-between text-util">
                      <span className="font-medium text-text">{ref.domain}</span>
                      <span className="text-muted">
                        <strong className="text-text">{ref.count}회</strong> ({ref.percentage}%)
                      </span>
                    </div>
                    {/* 프로그레스 바 */}
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-soft">
                      <div
                        className="h-full bg-text transition-all duration-300"
                        style={{ width: `${ref.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2열 레이아웃: 기기 & 브라우저/OS 분포 */}
      {data && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 기기 분포 */}
          <div className="rounded-sm border border-line bg-bg p-5">
            <h2 className="text-nav font-bold text-text">접속 기기 (Devices)</h2>
            <div className="mt-4 space-y-3">
              {data.devices.length === 0 ? (
                <p className="py-4 text-center text-util text-muted">기록이 없습니다.</p>
              ) : (
                data.devices.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-util">
                      <span className="font-medium text-text">{item.name}</span>
                      <span className="text-muted">
                        <strong className="text-text">{item.count}회</strong> ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-soft">
                      <div
                        className="h-full bg-text"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 브라우저 분포 */}
          <div className="rounded-sm border border-line bg-bg p-5">
            <h2 className="text-nav font-bold text-text">브라우저 (Browsers)</h2>
            <div className="mt-4 space-y-3">
              {data.browsers.length === 0 ? (
                <p className="py-4 text-center text-util text-muted">기록이 없습니다.</p>
              ) : (
                data.browsers.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-util">
                      <span className="font-medium text-text">{item.name}</span>
                      <span className="text-muted">
                        <strong className="text-text">{item.count}회</strong> ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-soft">
                      <div
                        className="h-full bg-[#666]"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 실시간 최근 방문자 세션 로그 */}
      {data && (
        <div className="rounded-sm border border-line bg-bg p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-nav font-bold text-text">최근 방문자 세션 로그 (최근 20건)</h2>
              <p className="mt-0.5 text-util text-muted">실시간 접속자의 진입 경로, 체류 시간, 열람 페이지 수</p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-util">
              <thead className="border-b border-line bg-soft text-muted">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">접속 일시</th>
                  <th className="px-3 py-2.5 font-semibold">방문자 ID</th>
                  <th className="px-3 py-2.5 font-semibold">유입 경로</th>
                  <th className="px-3 py-2.5 font-semibold">첫 진입 페이지</th>
                  <th className="px-3 py-2.5 font-semibold">체류 시간</th>
                  <th className="px-3 py-2.5 font-semibold">열람 페이지</th>
                  <th className="px-3 py-2.5 font-semibold">기기 / 브라우저</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.recentSessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-muted">
                      수집된 방문 세션이 없습니다.
                    </td>
                  </tr>
                ) : (
                  data.recentSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-soft">
                      <td className="px-3 py-2.5 text-muted">
                        {new Date(session.createdAt).toLocaleString("ko-KR", {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-muted">
                        {session.visitorId}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-text">
                        <span className="inline-block rounded-xs bg-soft px-1.5 py-0.5 text-[11px]">
                          {session.referrerDomain}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-text">
                        {session.entryPath}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-text">
                        {formatDuration(session.duration)}
                      </td>
                      <td className="px-3 py-2.5 text-text">
                        {session.pageCount} 페이지
                      </td>
                      <td className="px-3 py-2.5 text-muted">
                        {session.device} · {session.browser} ({session.os})
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
