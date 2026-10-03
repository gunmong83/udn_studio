"use client";

import { useState } from "react";

export default function ShippingPolicy({ className = "" }: { className?: string }) {
  const [openSection, setOpenSection] = useState<"all" | "shipping" | "return">("all");

  return (
    <div id="shipping-policy" className={`rounded-sm border border-line bg-bg p-6 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
        <div>
          <h3 className="text-body font-bold text-text">배송 & 교환 안내</h3>
          <p className="mt-0.5 text-util text-muted">
            스튜디오 UDN의 모든 오브제는 파손 방지를 위해 정성껏 검수 및 안전 포장 후 발송됩니다.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-util">
          <button
            type="button"
            onClick={() => setOpenSection("all")}
            className={`rounded-xs px-2.5 py-1 transition-colors ${
              openSection === "all" ? "bg-text text-bg font-medium" : "text-muted hover:text-text"
            }`}
          >
            전체 보기
          </button>
          <button
            type="button"
            onClick={() => setOpenSection("shipping")}
            className={`rounded-xs px-2.5 py-1 transition-colors ${
              openSection === "shipping" ? "bg-text text-bg font-medium" : "text-muted hover:text-text"
            }`}
          >
            배송 안내
          </button>
          <button
            type="button"
            onClick={() => setOpenSection("return")}
            className={`rounded-xs px-2.5 py-1 transition-colors ${
              openSection === "return" ? "bg-text text-bg font-medium" : "text-muted hover:text-text"
            }`}
          >
            교환/반품 안내
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 text-util">
        {/* 배송 안내 */}
        {(openSection === "all" || openSection === "shipping") && (
          <div className="space-y-3 rounded-xs bg-soft p-4">
            <h4 className="flex items-center gap-2 font-bold text-text text-[13px]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-text text-[10px] text-bg">
                📦
              </span>
              배송 안내
            </h4>
            <ul className="space-y-2 text-muted leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-text font-medium">• 택배사:</span>
                <span>CJ대한통운 / 우체국택배 (기본 택배사)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-text font-medium">• 배송비:</span>
                <span>기본 4,000원 (상품 합계 500,000원 이상 구매 시 무료 배송)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-text font-medium">• 출고 일정:</span>
                <span>주문 결제 완료 후 영업일 기준 1~3일 이내 순차 출고</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-text font-medium">• 배송 소요:</span>
                <span>출고 후 영업일 기준 1~2일 이내 수령 (택배사 사정에 따라 일부 상이)</span>
              </li>
            </ul>
          </div>
        )}

        {/* 교환 및 반품 안내 */}
        {(openSection === "all" || openSection === "return") && (
          <div className="space-y-3 rounded-xs bg-soft p-4">
            <h4 className="flex items-center gap-2 font-bold text-text text-[13px]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-text text-[10px] text-bg">
                🔄
              </span>
              교환 및 반품 안내
            </h4>
            <ul className="space-y-2 text-muted leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-text font-medium">• 신청 기간:</span>
                <span>상품 수령일로부터 7일 이내 신청 가능</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-text font-medium">• 왕복 배송비:</span>
                <span>단순 변심 교환/반품 시 6,000원 (불량/오배송 시 전액 무료)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-text font-medium">• 접수 절차:</span>
                <span>마이페이지 내 주문 건 조회 또는 실시간 문의를 통해 접수 후 수거 진행</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-text font-medium">• 유의 사항:</span>
                <span>수공예 제작 특성상 고유의 질감 차이가 있을 수 있으며 고객 부주의로 훼손된 경우 반품이 제한됩니다.</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
