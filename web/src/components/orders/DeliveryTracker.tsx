"use client";

export type OrderStatusType =
  | "PENDING"
  | "PAID"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export interface DeliveryTrackerProps {
  status: OrderStatusType | string;
  carrier?: string | null;
  trackingNumber?: string | null;
  className?: string;
}

const STEPS = [
  { key: "PAID", label: "결제 완료", desc: "결제가 정상 승인되었습니다." },
  { key: "PREPARING", label: "상품 준비중", desc: "상품을 정성껏 검수 및 포장 중입니다." },
  { key: "SHIPPED", label: "배송중", desc: "택배사로 인계되어 안전하게 이동 중입니다." },
  { key: "DELIVERED", label: "배송 완료", desc: "고객님께 배송이 완료되었습니다." },
];

export function getTrackingUrl(carrier?: string | null, trackingNumber?: string | null): string | null {
  if (!trackingNumber) return null;
  const clean = trackingNumber.trim().replace(/[^0-9]/g, "");
  const c = (carrier ?? "").trim();

  if (c.includes("CJ") || c.includes("대한통운")) {
    return `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${clean}`;
  }
  if (c.includes("우체국")) {
    return `https://service.epost.go.kr/trace.RetrieveDomRcvTraceList.comm?sid1=${clean}`;
  }
  if (c.includes("한진")) {
    return `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&wblnum=${clean}`;
  }
  if (c.includes("롯데")) {
    return `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${clean}`;
  }
  if (c.includes("로젠")) {
    return `https://www.ilogen.com/web/personal/trace/${clean}`;
  }
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(`${carrier || "택배"} ${trackingNumber}`)}`;
}

export function getStatusIndex(status: string): number {
  switch (status) {
    case "PAID":
      return 0;
    case "PREPARING":
      return 1;
    case "SHIPPED":
      return 2;
    case "DELIVERED":
      return 3;
    default:
      return -1;
  }
}

export function getStatusBadge(status: string): { label: string; bg: string; text: string } {
  switch (status) {
    case "PAID":
      return { label: "결제 완료", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" };
    case "PREPARING":
      return { label: "상품 준비중", bg: "bg-blue-50 border-blue-200", text: "text-blue-700" };
    case "SHIPPED":
      return { label: "배송중", bg: "bg-amber-50 border-amber-200", text: "text-amber-800" };
    case "DELIVERED":
      return { label: "배송 완료", bg: "bg-gray-100 border-gray-300", text: "text-text" };
    case "CANCELLED":
      return { label: "주문 취소", bg: "bg-rose-50 border-rose-200", text: "text-rose-700" };
    case "REFUNDED":
      return { label: "환불 완료", bg: "bg-purple-50 border-purple-200", text: "text-purple-700" };
    case "PENDING":
    default:
      return { label: "결제 미완료", bg: "bg-neutral-100 border-neutral-300", text: "text-neutral-600" };
  }
}

export default function DeliveryTracker({
  status,
  carrier,
  trackingNumber,
  className = "",
}: DeliveryTrackerProps) {
  const isCancelled = status === "CANCELLED" || status === "REFUNDED";
  const isPending = status === "PENDING";
  const currentIndex = getStatusIndex(status);
  const badge = getStatusBadge(status);
  const trackingUrl = getTrackingUrl(carrier, trackingNumber);

  return (
    <div className={`rounded-sm border border-line bg-bg p-5 ${className}`}>
      {/* 상단 상태 요약 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
        <div>
          <span className="text-util text-muted">배송 상태</span>
          <div className="mt-0.5 flex items-center gap-2">
            <span
              className={`inline-block rounded-xs border px-2 py-0.5 text-util font-semibold ${badge.bg} ${badge.text}`}
            >
              {badge.label}
            </span>
            <span className="text-body text-text font-medium">
              {isCancelled
                ? "주문이 취소 또는 환불 처리되었습니다."
                : isPending
                ? "결제가 완료되지 않은 주문 건입니다."
                : currentIndex >= 0
                ? STEPS[currentIndex]?.desc
                : "결제 확인 대기 중입니다."}
            </span>
          </div>
        </div>

        {/* 운송장 및 실시간 배송조회 버튼 */}
        {trackingNumber && (
          <div className="flex items-center gap-2">
            {trackingUrl ? (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-xs border border-text bg-text px-3 text-util font-medium text-bg transition-colors hover:bg-[#333]"
              >
                <span>{carrier ? `${carrier} 배송조회` : "실시간 배송조회"}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </a>
            ) : null}
          </div>
        )}
      </div>

      {/* 결제 미완료 안내 바 */}
      {isPending && (
        <div className="mt-3 rounded-xs bg-soft p-3 text-util text-muted">
          ⓘ 결제 도중 창을 닫았거나 결제 승인이 완료되지 않은 주문 건입니다. 실제로 결제되지 않았으므로 상품 준비 및 배송이 진행되지 않습니다.
        </div>
      )}

      {/* 송장 상세 정보 바 (운송장 등록되어 있을 때) */}
      {trackingNumber && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xs bg-soft px-3.5 py-2.5 text-util">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-text">택배사: {carrier || "기본 택배"}</span>
            <span className="text-line">|</span>
            <span className="text-muted">송장번호:</span>
            <span className="font-mono font-medium text-text">{trackingNumber}</span>
          </div>
          <span className="text-muted text-[11px]">* 택배사 전산 반영까지 몇 시간 정도 소요될 수 있습니다.</span>
        </div>
      )}

      {/* 4단계 배송 스테퍼 (결제 완료 및 정상 진행 주문에만 표시) */}
      {!isCancelled && !isPending && (
        <div className="mt-6 pt-1">
          <div className="relative flex items-center justify-between">
            {/* 연결 바 배경 */}
            <div className="absolute left-6 right-6 top-3.5 h-[2px] -translate-y-1/2 bg-line" aria-hidden="true" />
            {/* 진행된 연결 바 */}
            <div
              className="absolute left-6 top-3.5 h-[2px] -translate-y-1/2 bg-text transition-all duration-300"
              style={{
                width: `${Math.max(0, Math.min(100, (currentIndex / (STEPS.length - 1)) * 100))}%`,
              }}
              aria-hidden="true"
            />

            {/* 단계별 아이템 */}
            {STEPS.map((step, idx) => {
              const isPast = idx < currentIndex;
              const isCurrent = idx === currentIndex;

              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center">
                  {/* 동그라미 번호/체크 */}
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                      isCurrent
                        ? "bg-text text-bg ring-4 ring-black/10"
                        : isPast
                        ? "bg-text text-bg"
                        : "border border-line bg-bg text-muted"
                    }`}
                  >
                    {isPast || (isCurrent && idx === STEPS.length - 1) ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </div>
                  {/* 단계 이름 */}
                  <span
                    className={`mt-2 text-util text-center whitespace-nowrap ${
                      isCurrent
                        ? "font-bold text-text"
                        : isPast
                        ? "font-medium text-text"
                        : "text-muted"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
