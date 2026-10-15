"use client";

import type { CommerceReport } from "@/src/lib/commerce-report";

const money = (value: number) => `${value.toLocaleString("ko-KR")}원`;
const reasonLabels: Record<string, string> = {
  required_name: "수령인 미입력", invalid_phone: "연락처 형식", required_address: "주소 미입력",
  order_or_payment: "주문 생성·결제창 준비 오류", payment_timeout: "결제창 응답 지연", provider_return: "결제 실패 페이지 도착", unknown: "기타",
};

function Breakdown({ title, rows }: { title: string; rows: CommerceReport["channels"] }) {
  return <section className="min-w-0 rounded-sm border border-line bg-bg p-5">
    <h3 className="text-nav font-bold">{title}</h3>
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[540px] text-left text-util">
        <thead><tr className="border-b border-line text-muted">{["구분", "세션", "구매 세션", "전환율", "주문", "결제금액"].map((h) => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={row.name} className="border-b border-line last:border-0">
          <td className="max-w-[250px] break-words px-2 py-3">{row.name}</td>
          <td className="px-2 py-3">{row.sessions}</td><td className="px-2 py-3">{row.buyers}</td>
          <td className="px-2 py-3">{row.conversionRate}%</td><td className="px-2 py-3">{row.orders}</td><td className="whitespace-nowrap px-2 py-3">{money(row.revenue)}</td>
        </tr>)}</tbody>
      </table>
      {!rows.length && <p className="py-6 text-center text-muted">아직 측정 데이터가 없습니다.</p>}
    </div>
  </section>;
}

export default function CommerceAnalyticsPanel({ data }: { data: CommerceReport }) {
  const s = data.summary;
  return <div className="space-y-5 text-text">
    <div className="rounded-sm border border-line bg-soft p-4 text-util leading-relaxed">
      <p>유입부터 구매까지 연결한 분석입니다. 전환율은 선택한 기간에 시작된 측정 세션 중 결제 완료 주문이 있는 세션의 비율입니다.</p>
      <p className="mt-1 text-muted">이 기능 적용 이후 데이터부터 연결됩니다. 관리자·테스트 상품·환불 주문은 제외합니다. 결제금액은 배송비 포함이며, 상품별 매출은 상품 금액만 집계합니다.</p>
      {data.measuredSince && <p className="mt-1 text-muted">선택 기간의 최초 측정: {new Date(data.measuredSince).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</p>}
    </div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        { label: "구매 전환율", value: `${s.conversionRate}%`, note: `측정 세션 ${s.sessions} · 구매 세션 ${s.buyers}` },
        { label: "유입 연결 주문", value: `${s.orders}건`, note: `해당 세션의 결제금액 ${money(s.revenue)}` },
        { label: "기간 내 결제 완료", value: money(s.periodRevenue), note: `결제 시점 기준 ${s.periodOrders}건` },
        { label: "유입 연결률", value: s.periodOrders ? `${s.attributionRate}%` : "—", note: `기간 내 주문 중 연결 안 된 주문 ${s.unattributedOrders}건` },
      ].map((card) => <div key={card.label} className="border border-line bg-bg p-4">
        <p className="text-util text-muted">{card.label}</p><p className="mt-1 text-heading font-bold">{card.value}</p><p className="mt-2 text-[11px] text-muted">{card.note}</p>
      </div>)}
    </div>
    <section className="rounded-sm border border-line bg-bg p-5">
      <h2 className="text-nav font-bold">구매 단계와 이탈</h2>
      <p className="mt-1 text-util text-muted">같은 세션에서 아래 순서를 통과한 방문만 집계합니다. 저장된 장바구니에서 바로 결제한 구매 등은 전체 전환율에는 포함되지만 이 경로에서는 빠질 수 있습니다.</p>
      <ol className="mt-5 space-y-3">{data.funnel.map((step, i) => <li key={step.label} className="grid grid-cols-[110px_1fr_70px] items-center gap-3 text-util sm:grid-cols-[140px_1fr_160px]">
        <span>{i + 1}. {step.label}</span>
        <div><div className="h-5 bg-soft"><div className="h-5 bg-text transition-all" style={{ width: `${step.rate}%` }} /></div><span className="mt-1 block text-[11px] text-muted">{step.sessions}개 세션 · 전체의 {step.rate}%</span></div>
        <span className="text-right text-muted">{i ? `이전 대비 ${step.previousRate}% · 이탈 ${step.lost}` : "시작"}</span>
      </li>)}</ol>
    </section>
    <section className="rounded-sm border border-line bg-bg p-5">
      <h2 className="text-nav font-bold">다음 개선을 위한 관측</h2>
      <p className="mt-1 text-util text-muted">관측을 바탕으로 한 점검 가설입니다. 변경 전후에 같은 기간·유입·기기 조건으로 비교하세요.</p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-util">{(data.suggestions.length ? data.suggestions : ["아직 뚜렷한 이탈 신호가 없습니다. 유입별 전환율과 상품별 반응을 비교해 보세요."]).map((note) => <li key={note}>{note}</li>)}</ul>
      <p className="mt-4 border-t border-line pt-3 text-util text-muted">캠페인 링크 예시: <code className="break-all">/products?utm_source=instagram&amp;utm_medium=social&amp;utm_campaign=postcard_2026</code><br />유입 경로가 전달되지 않은 방문은 Direct로 표시됩니다. 광고 차단·쿠키 제한·다른 기기에서의 구매는 연결되지 않을 수 있습니다.</p>
    </section>
    <Breakdown title="유입 경로·캠페인별 구매 전환" rows={data.channels} />
    <div className="grid min-w-0 gap-5 xl:grid-cols-2">
      <Breakdown title="기기별 구매 전환" rows={data.devices} />
      <Breakdown title="첫 방문 페이지별 구매 전환" rows={data.landingPages} />
    </div>
    <section className="rounded-sm border border-line bg-bg p-5">
      <h2 className="text-nav font-bold">상품별 관심과 구매</h2>
      <p className="mt-1 text-util text-muted">조회·담기·구매는 각각 중복 제거한 세션 수입니다. 조회→담기는 상품을 조회한 세션 중 해당 상품을 담은 비율이며, 직접 담기·옵션 상품 구매는 조회 없이 나타날 수 있습니다.</p>
      <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-util">
        <thead><tr className="border-b border-line text-muted">{["상품", "조회", "담기", "조회→담기", "구매 세션", "판매 수량", "상품 매출"].map((h) => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}</tr></thead>
        <tbody>{data.products.map((p) => <tr key={p.productId} className="border-b border-line last:border-0">
          <td className="max-w-[300px] px-2 py-3"><a href={`/products/${p.productId}`} target="_blank" rel="noreferrer" className="hover:underline">{p.title}</a>{p.comingSoon && <span className="ml-2 text-[11px] text-muted">출시 예정</span>}</td>
          <td className="px-2 py-3">{p.viewers}</td><td className="px-2 py-3">{p.cartUsers}</td><td className="px-2 py-3">{p.cartRate}%</td><td className="px-2 py-3">{p.buyers}</td><td className="px-2 py-3">{p.units}</td><td className="whitespace-nowrap px-2 py-3">{money(p.revenue)}</td>
        </tr>)}</tbody>
      </table></div>
    </section>
    <section className="rounded-sm border border-line bg-bg p-5">
      <h2 className="text-nav font-bold">결제 전 장애 신호</h2>
      <p className="mt-2 text-util">로그인 필요: {s.loginBlocked}개 세션 · 빈 장바구니로 결제 진입: {s.emptyCheckouts}개 세션 · 오류 관측: {s.errorSessions}개 세션</p>
      <div className="mt-3 flex flex-wrap gap-2">{data.errors.map((e) => <span key={e.reason} className="border border-line bg-soft px-3 py-2 text-util">{reasonLabels[e.reason] || e.reason}: {e.sessions}개 세션</span>)}</div>
      <p className="mt-3 text-util text-muted">오류는 한 세션에 여러 사유가 있을 수 있으며 결제 취소와 최종 실패를 확정하는 수치는 아닙니다.</p>
    </section>
  </div>;
}
