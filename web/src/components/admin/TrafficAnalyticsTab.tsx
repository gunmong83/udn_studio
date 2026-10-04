"use client";

import { useEffect, useState, useCallback } from "react";

interface AnalyticsSummary {
  totalVisitors: number;
  totalSessions: number;
  totalPageviews: number;
  avgDuration: number;
  bounceRate: number;
  avgScrollDepth: number;
  memberSessionsCount: number;
  guestSessionsCount: number;
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
  avgScroll: number;
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
  userEmail: string | null;
  userName: string | null;
  createdAt: string;
  referrerDomain: string;
  entryPath: string;
  duration: number;
  pageCount: number;
  networkType: string | null;
  rtt: number | null;
  ip: string | null;
  country: string | null;
  device: string;
  browser: string;
  os: string;
}

interface LoginLogItem {
  id: string;
  email: string;
  userName: string | null;
  provider: string;
  status: string;
  failReason: string | null;
  ip: string | null;
  country: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  createdAt: string;
}

interface SecuritySummary {
  totalAttempts: number;
  successCount: number;
  failedCount: number;
  blockedCount: number;
  recentLogs: LoginLogItem[];
}

interface AnalyticsData {
  summary: AnalyticsSummary;
  dailyTrends: DailyTrend[];
  topPages: TopPage[];
  topReferrers: TopReferrer[];
  devices: DistributionItem[];
  browsers: DistributionItem[];
  osList: DistributionItem[];
  networks: DistributionItem[];
  resolutions: DistributionItem[];
  languages: DistributionItem[];
  recentSessions: RecentSession[];
  security: SecuritySummary;
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
  const [subTab, setSubTab] = useState<"traffic" | "security">("traffic");
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
      {/* 서브 탭 전환 & 기간 필터 컨트롤바 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-line bg-soft p-3">
        <div className="flex items-center gap-2">
          {/* 서브 모드 전환 버튼 */}
          <div className="flex rounded-xs bg-bg p-0.5 border border-line">
            <button
              type="button"
              onClick={() => setSubTab("traffic")}
              className={`px-3 py-1 text-util font-medium transition-colors ${
                subTab === "traffic"
                  ? "bg-text font-bold text-bg"
                  : "text-muted hover:text-text"
              }`}
            >
              🌐 트래픽 & 사용자 분석
            </button>
            <button
              type="button"
              onClick={() => setSubTab("security")}
              className={`px-3 py-1 text-util font-medium transition-colors ${
                subTab === "security"
                  ? "bg-text font-bold text-bg"
                  : "text-muted hover:text-text"
              }`}
            >
              🛡️ 로그인 시도 & 보안 감사
            </button>
          </div>

          <div className="hidden h-4 w-[1px] bg-line sm:block" />

          {/* 기간 필터 */}
          <div className="flex items-center gap-1">
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
                className={`h-8 px-2.5 text-util font-medium transition-colors ${
                  range === item.key
                    ? "bg-text font-bold text-bg"
                    : "border border-line bg-bg text-muted hover:text-text"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
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

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. 서브 탭: 트래픽 & 사용자 분석 */}
      {/* ──────────────────────────────────────────────────────────── */}
      {subTab === "traffic" && data && (
        <>
          {/* KPI 카드 6개 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-sm border border-line bg-bg p-4">
              <p className="text-util text-muted">순 방문자 (UV)</p>
              <p className="mt-1 text-heading font-bold text-text">
                {data.summary.totalVisitors.toLocaleString()}명
              </p>
              <p className="mt-1 text-[11px] text-muted">
                회원 {data.summary.memberSessionsCount} · 비회원 {data.summary.guestSessionsCount}
              </p>
            </div>
            <div className="rounded-sm border border-line bg-bg p-4">
              <p className="text-util text-muted">총 세션 (방문 수)</p>
              <p className="mt-1 text-heading font-bold text-text">
                {data.summary.totalSessions.toLocaleString()}회
              </p>
              <p className="mt-1 text-[11px] text-muted">사이트 유입 수</p>
            </div>
            <div className="rounded-sm border border-line bg-bg p-4">
              <p className="text-util text-muted">총 페이지뷰 (PV)</p>
              <p className="mt-1 text-heading font-bold text-text">
                {data.summary.totalPageviews.toLocaleString()}회
              </p>
              <p className="mt-1 text-[11px] text-muted">
                세션당 {(data.summary.totalSessions > 0 ? (data.summary.totalPageviews / data.summary.totalSessions).toFixed(1) : 0)}회
              </p>
            </div>
            <div className="rounded-sm border border-line bg-bg p-4">
              <p className="text-util text-muted">평균 체류 시간</p>
              <p className="mt-1 text-heading font-bold text-text">
                {formatDuration(data.summary.avgDuration)}
              </p>
              <p className="mt-1 text-[11px] text-muted">머문 평균 시간</p>
            </div>
            <div className="rounded-sm border border-line bg-bg p-4">
              <p className="text-util text-muted">평균 스크롤 깊이</p>
              <p className="mt-1 text-heading font-bold text-text">
                {data.summary.avgScrollDepth}%
              </p>
              <p className="mt-1 text-[11px] text-muted">콘텐츠 열람 몰입도</p>
            </div>
            <div className="rounded-sm border border-line bg-bg p-4">
              <p className="text-util text-muted">이탈률 (Bounce)</p>
              <p className="mt-1 text-heading font-bold text-text">
                {data.summary.bounceRate}%
              </p>
              <p className="mt-1 text-[11px] text-muted">단일 페이지만 열람</p>
            </div>
          </div>

          {/* 일별 추이 차트 */}
          {data.dailyTrends && data.dailyTrends.length > 0 && (
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
                      <div className="flex w-full max-w-[28px] items-end justify-center gap-1">
                        <div
                          className={`w-1/2 rounded-t-xs transition-all ${
                            isHovered ? "bg-black" : "bg-text"
                          }`}
                          style={{ height: `${trend.sessions > 0 ? sessionHeight : 0}%` }}
                        />
                        <div
                          className={`w-1/2 rounded-t-xs transition-all ${
                            isHovered ? "bg-neutral-600" : "bg-[#888]"
                          }`}
                          style={{ height: `${trend.pageviews > 0 ? pvHeight : 0}%` }}
                        />
                      </div>
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
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 인기 페이지 Top 10 */}
            <div className="rounded-sm border border-line bg-bg p-5">
              <h2 className="text-nav font-bold text-text">가장 많이 본 페이지 Top 10</h2>
              <p className="mt-0.5 text-util text-muted">페이지별 조회수, 체류 시간 및 스크롤 깊이</p>

              <div className="mt-4 divide-y divide-line">
                {data.topPages.length === 0 ? (
                  <p className="py-6 text-center text-util text-muted">방문 기록이 없습니다.</p>
                ) : (
                  data.topPages.map((page, index) => (
                    <div key={page.path} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
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
                      <div className="flex shrink-0 items-center gap-3 text-util">
                        <span className="font-bold text-text">{page.views.toLocaleString()}회</span>
                        <span className="text-muted">{formatDuration(page.avgDuration)}</span>
                        {page.avgScroll > 0 && (
                          <span className="rounded-xs bg-soft px-1.5 py-0.5 text-[11px] text-muted">
                            📜 {page.avgScroll}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 유입 경로 / 도메인 순위 */}
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

          {/* 3열 레이아웃: 네트워크 / 화면 해상도 / 언어 및 브라우저 */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* 1. 네트워크 및 통신 상태 */}
            <div className="rounded-sm border border-line bg-bg p-5">
              <h2 className="text-nav font-bold text-text">네트워크 상태 (Network)</h2>
              <p className="mt-0.5 text-util text-muted">통신 유형 (4G, Wi-Fi 등)</p>
              <div className="mt-4 space-y-3">
                {data.networks.length === 0 ? (
                  <p className="py-3 text-center text-util text-muted">측정 기록 없음</p>
                ) : (
                  data.networks.map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-util">
                        <span className="font-medium text-text">{item.name}</span>
                        <span className="text-muted">{item.count}회 ({item.percentage}%)</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-soft">
                        <div className="h-full bg-text" style={{ width: `${item.percentage}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. 화면 해상도 Top 5 */}
            <div className="rounded-sm border border-line bg-bg p-5">
              <h2 className="text-nav font-bold text-text">화면 해상도 (Resolutions)</h2>
              <p className="mt-0.5 text-util text-muted">방문자 기기 해상도 Top 5</p>
              <div className="mt-4 space-y-3">
                {data.resolutions.length === 0 ? (
                  <p className="py-3 text-center text-util text-muted">측정 기록 없음</p>
                ) : (
                  data.resolutions.map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-util">
                        <span className="font-medium text-text">{item.name}</span>
                        <span className="text-muted">{item.count}회 ({item.percentage}%)</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-soft">
                        <div className="h-full bg-[#666]" style={{ width: `${item.percentage}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. 기기 & 브라우저 */}
            <div className="rounded-sm border border-line bg-bg p-5">
              <h2 className="text-nav font-bold text-text">기기 & 브라우저 (Devices)</h2>
              <p className="mt-0.5 text-util text-muted">단말기 및 브라우저 비율</p>
              <div className="mt-4 space-y-3">
                {data.devices.concat(data.browsers.slice(0, 3)).map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-util">
                      <span className="font-medium text-text">{item.name}</span>
                      <span className="text-muted">{item.count}회 ({item.percentage}%)</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-soft">
                      <div className="h-full bg-[#444]" style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 최근 방문자 세션 로그 (20건) */}
          <div className="rounded-sm border border-line bg-bg p-5">
            <h2 className="text-nav font-bold text-text">최근 방문자 세션 로그 (실시간 20건)</h2>
            <p className="mt-0.5 text-util text-muted">실시간 접속자의 회원/비회원 여부, IP, 네트워크, 체류 시간</p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-util">
                <thead className="border-b border-line bg-soft text-muted">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">접속 일시</th>
                    <th className="px-3 py-2.5 font-semibold">사용자 / 방문자</th>
                    <th className="px-3 py-2.5 font-semibold">유입 경로</th>
                    <th className="px-3 py-2.5 font-semibold">첫 진입 페이지</th>
                    <th className="px-3 py-2.5 font-semibold">체류 시간</th>
                    <th className="px-3 py-2.5 font-semibold">열람 수</th>
                    <th className="px-3 py-2.5 font-semibold">네트워크 / IP</th>
                    <th className="px-3 py-2.5 font-semibold">환경</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.recentSessions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-muted">
                        수집된 세션이 없습니다.
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
                        <td className="px-3 py-2.5">
                          {session.userEmail ? (
                            <span className="font-semibold text-text">
                              👤 {session.userName || session.userEmail}
                            </span>
                          ) : (
                            <span className="font-mono text-muted text-[11px]">
                              {session.visitorId}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-block rounded-xs bg-soft px-1.5 py-0.5 text-[11px] font-medium text-text">
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
                          {session.pageCount}P
                        </td>
                        <td className="px-3 py-2.5 text-muted text-[11px]">
                          {session.networkType ? `${session.networkType.toUpperCase()} · ` : ""}
                          {session.ip || "-"}
                        </td>
                        <td className="px-3 py-2.5 text-muted text-[11px]">
                          {session.device} · {session.browser}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. 서브 탭: 로그인 시도 & 보안 감사 */}
      {/* ──────────────────────────────────────────────────────────── */}
      {subTab === "security" && data && (
        <>
          {/* 보안 요약 KPI 4개 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-sm border border-line bg-bg p-4">
              <p className="text-util text-muted">총 로그인 시도</p>
              <p className="mt-1 text-heading font-bold text-text">
                {data.security.totalAttempts.toLocaleString()}건
              </p>
              <p className="mt-1 text-[11px] text-muted">선택 기간 내 시도 횟수</p>
            </div>
            <div className="rounded-sm border border-emerald-200 bg-emerald-50/50 p-4">
              <p className="text-util text-emerald-800">로그인 성공</p>
              <p className="mt-1 text-heading font-bold text-emerald-700">
                {data.security.successCount.toLocaleString()}건
              </p>
              <p className="mt-1 text-[11px] text-emerald-600">
                성공률 {(data.security.totalAttempts > 0 ? ((data.security.successCount / data.security.totalAttempts) * 100).toFixed(1) : 0)}%
              </p>
            </div>
            <div className="rounded-sm border border-amber-200 bg-amber-50/50 p-4">
              <p className="text-util text-amber-800">로그인 실패</p>
              <p className="mt-1 text-heading font-bold text-amber-700">
                {data.security.failedCount.toLocaleString()}건
              </p>
              <p className="mt-1 text-[11px] text-amber-600">비밀번호 불일치 등</p>
            </div>
            <div className="rounded-sm border border-red-200 bg-red-50/50 p-4">
              <p className="text-util text-red-800">보안 차단 (Blocked)</p>
              <p className="mt-1 text-heading font-bold text-red-700">
                {data.security.blockedCount.toLocaleString()}건
              </p>
              <p className="mt-1 text-[11px] text-red-600">5회 연속 실패 Rate-limit</p>
            </div>
          </div>

          {/* 최근 로그인 시도 감사 로그 테이블 */}
          <div className="rounded-sm border border-line bg-bg p-5">
            <h2 className="text-nav font-bold text-text">실시간 로그인 감사 로그 (Login Audit Log)</h2>
            <p className="mt-0.5 text-util text-muted">모든 로그인 시도의 성공/실패 여부, 클라이언트 IP 및 실패 사유</p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-util">
                <thead className="border-b border-line bg-soft text-muted">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">시도 일시</th>
                    <th className="px-3 py-2.5 font-semibold">계정 (이메일)</th>
                    <th className="px-3 py-2.5 font-semibold">로그인 수단</th>
                    <th className="px-3 py-2.5 font-semibold">결과 상태</th>
                    <th className="px-3 py-2.5 font-semibold">상세 사유</th>
                    <th className="px-3 py-2.5 font-semibold">IP / 국가</th>
                    <th className="px-3 py-2.5 font-semibold">접속 환경</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.security.recentLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-muted">
                        기록된 로그인 시도가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    data.security.recentLogs.map((log) => {
                      const isSuccess = log.status === "SUCCESS";
                      const isBlocked = log.status === "BLOCKED";
                      return (
                        <tr key={log.id} className="hover:bg-soft">
                          <td className="px-3 py-2.5 text-muted">
                            {new Date(log.createdAt).toLocaleString("ko-KR", {
                              month: "numeric",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-text">
                            {log.email}
                            {log.userName && <span className="ml-1 text-muted">({log.userName})</span>}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="inline-block rounded-xs bg-soft px-1.5 py-0.5 text-[11px] font-semibold text-text uppercase">
                              {log.provider}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-block rounded-xs px-2 py-0.5 text-[11px] font-bold ${
                                isSuccess
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isBlocked
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[11px] text-muted">
                            {log.failReason || (isSuccess ? "정상 로그인" : "-")}
                          </td>
                          <td className="px-3 py-2.5 text-[11px] text-muted">
                            {log.ip || "-"} {log.country ? `(${log.country})` : ""}
                          </td>
                          <td className="px-3 py-2.5 text-[11px] text-muted">
                            {log.device} · {log.browser} ({log.os})
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
