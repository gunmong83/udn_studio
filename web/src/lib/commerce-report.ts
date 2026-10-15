type Page = { path: string; createdAt: Date };
type Event = { name: string; productId: string | null; reason: string | null; createdAt: Date };
type Item = { productId: string; title: string; quantity: number; unitPrice: number };
type Purchase = { id: string; analyticsSessionId: string | null; totalAmount: number; paidAt: Date | null; items: Item[] };
export type CommerceSession = {
  id: string; visitorId: string; createdAt: Date; entryPath: string; device: string | null;
  referrerDomain: string | null; utmSource: string | null; utmMedium: string | null;
  utmCampaign: string | null; utmContent: string | null;
  pageviews: Page[]; events: Event[]; orders: Purchase[];
};
const percent = (n: number, d: number) => d ? Math.round(n / d * 1000) / 10 : 0;
const stageLabels = ["방문", "상품 상세 조회", "장바구니 담기", "결제 페이지", "결제 시도", "결제 완료"];

export function buildCommerceReport(sessions: CommerceSession[], periodOrders: Purchase[], catalog: { slug: string; title: string; kind: string; soldOut?: boolean; adminOnly?: boolean }[]) {
  const stageCounts = stageLabels.map(() => 0);
  const grouped = { channels: new Map<string, CommerceSession[]>(), devices: new Map<string, CommerceSession[]>(), landingPages: new Map<string, CommerceSession[]>() };
  const productMap = new Map(catalog.filter((p) => p.kind === "product" && !p.adminOnly).map((p) => [p.slug, {
    productId: p.slug, title: p.title, comingSoon: Boolean(p.soldOut), viewers: new Set<string>(), cartUsers: new Set<string>(), buyers: new Set<string>(), units: 0, revenue: 0,
  }]));
  let loginBlocked = 0;
  let errorSessions = 0;
  let emptyCheckouts = 0;
  const errorReasons = new Map<string, number>();
  const countedReasons = new Set<string>();
  const channelName = (s: CommerceSession) => s.utmSource
    ? [s.utmSource, s.utmMedium || "매체 미지정", s.utmCampaign, s.utmContent].filter(Boolean).join(" / ")
    : s.referrerDomain || "Direct";
  for (const s of sessions) {
    for (const [map, key] of [[grouped.channels, channelName(s)], [grouped.devices, s.device || "Unknown"], [grouped.landingPages, s.entryPath]] as const) {
      const rows = map.get(key) || [];
      rows.push(s);
      map.set(key, rows);
    }
    const timeline = [
      ...s.pageviews.map((p) => ({ at: p.createdAt.getTime(), stage: productMap.has(p.path.replace(/^\/products\//, "")) && p.path.startsWith("/products/") ? 1 : p.path === "/checkout" ? 3 : -1 })),
      ...s.events.map((e) => ({ at: e.createdAt.getTime(), stage: e.name === "add_to_cart" ? 2 : e.name === "payment_attempt" ? 4 : -1 })),
      ...s.orders.filter((o) => o.paidAt).map((o) => ({ at: o.paidAt!.getTime(), stage: 5 })),
    ].sort((a, b) => a.at - b.at || a.stage - b.stage);
    let reached = 0;
    for (const action of timeline) if (action.stage === reached + 1) reached = action.stage;
    for (let i = 0; i <= reached; i++) stageCounts[i]++;
    if (s.events.some((e) => e.name === "checkout_login_required")) loginBlocked++;
    if (s.events.some((e) => e.name === "payment_error")) errorSessions++;
    if (s.events.some((e) => e.name === "checkout_empty")) emptyCheckouts++;
    for (const e of s.events) {
      if (e.name === "add_to_cart" && e.productId) productMap.get(e.productId)?.cartUsers.add(s.id);
      if (e.name === "payment_error") {
        const reason = e.reason || "unknown";
        const key = `${s.id}:${reason}`;
        if (!countedReasons.has(key)) { countedReasons.add(key); errorReasons.set(reason, (errorReasons.get(reason) || 0) + 1); }
      }
    }
    for (const p of s.pageviews) if (p.path.startsWith("/products/")) productMap.get(p.path.slice(10))?.viewers.add(s.id);
    for (const o of s.orders) for (const item of o.items) {
      const row = productMap.get(item.productId);
      if (row) { row.buyers.add(s.id); row.units += item.quantity; row.revenue += item.quantity * item.unitPrice; }
    }
  }
  const breakdown = (map: Map<string, CommerceSession[]>) => Array.from(map, ([name, rows]) => {
    const orders = rows.flatMap((s) => s.orders);
    const buyers = rows.filter((s) => s.orders.length > 0).length;
    return { name, sessions: rows.length, buyers, orders: orders.length, conversionRate: percent(buyers, rows.length), revenue: orders.reduce((sum, o) => sum + o.totalAmount, 0) };
  }).sort((a, b) => b.sessions - a.sessions).slice(0, 20);
  const buyers = sessions.filter((s) => s.orders.length > 0).length;
  const cohortOrders = sessions.flatMap((s) => s.orders);
  const periodAttributed = periodOrders.filter((o) => o.analyticsSessionId).length;
  const funnel = stageLabels.map((label, index) => ({ label, sessions: stageCounts[index],
    rate: percent(stageCounts[index], sessions.length),
    previousRate: index ? percent(stageCounts[index], stageCounts[index - 1]) : 100,
    lost: index ? stageCounts[index - 1] - stageCounts[index] : 0,
  }));
  const bottleneck = funnel.slice(1).filter((s, i) => stageCounts[i] >= 10).sort((a, b) => b.lost - a.lost)[0];
  const suggestions: string[] = [];
  if (sessions.length < 20) suggestions.push("아직 방문 표본이 적습니다. 캠페인 링크로 유입을 구분하고 최소 20개 이상의 측정 세션을 모은 뒤 비교하세요.");
  if (bottleneck?.lost) suggestions.push(`${bottleneck.label} 직전 단계에서 ${bottleneck.lost}개 세션이 다음 단계에 도달하지 않았습니다. 해당 화면의 안내·버튼·입력 부담을 우선 점검해 보세요.`);
  if (loginBlocked) suggestions.push(`${loginBlocked}개 세션이 비로그인 상태로 결제 페이지에 도착했습니다. 로그인 후 결제로 복귀하는 흐름과 가입 부담을 점검해 보세요.`);
  if (errorSessions) suggestions.push(`${errorSessions}개 세션에서 결제 오류 또는 입력 검증 오류가 관측됐습니다. 아래 사유와 실제 결제 기록을 함께 확인하세요. 결제창 응답 지연은 최종 결제 실패와 다를 수 있습니다.`);
  const unavailableViews = [...productMap.values()].filter((p) => p.comingSoon).reduce((sum, p) => sum + p.viewers.size, 0);
  if (unavailableViews) suggestions.push(`출시 예정 상품에 ${unavailableViews}회의 상품별 조회 세션이 집중됐습니다. 판매 중인 상품으로 이어지는 안내를 검토해 보세요.`);
  return {
    summary: { sessions: sessions.length, buyers, conversionRate: percent(buyers, sessions.length), orders: cohortOrders.length,
      revenue: cohortOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      periodOrders: periodOrders.length, periodRevenue: periodOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      attributionRate: percent(periodAttributed, periodOrders.length), unattributedOrders: periodOrders.length - periodAttributed,
      loginBlocked, errorSessions, emptyCheckouts },
    funnel, channels: breakdown(grouped.channels), devices: breakdown(grouped.devices), landingPages: breakdown(grouped.landingPages),
    products: [...productMap.values()].map((p) => ({ productId: p.productId, title: p.title, comingSoon: p.comingSoon,
      viewers: p.viewers.size, cartUsers: p.cartUsers.size, buyers: p.buyers.size, units: p.units, revenue: p.revenue,
      cartRate: percent([...p.cartUsers].filter((id) => p.viewers.has(id)).length, p.viewers.size) })).sort((a, b) => b.viewers - a.viewers || b.revenue - a.revenue),
    errors: [...errorReasons].map(([reason, sessions]) => ({ reason, sessions })), suggestions,
    measuredSince: sessions.length ? new Date(sessions.reduce((min, s) => Math.min(min, s.createdAt.getTime()), Infinity)).toISOString() : null,
  };
}

export type CommerceReport = ReturnType<typeof buildCommerceReport>;
