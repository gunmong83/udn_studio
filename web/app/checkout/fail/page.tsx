"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function FailContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "PAYMENT_FAILED";
  const message = searchParams.get("message") || "결제 진행 중 오류가 발생했습니다.";
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders?id=${orderId}`, { method: "DELETE" }).catch(() => {});
    }
  }, [orderId]);

  return (
    <div className="mx-auto mt-12 max-w-[520px] rounded-sm border border-line p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 text-xl font-bold">
        ✕
      </div>
      <h2 className="mt-4 text-heading font-bold text-text">결제에 실패했습니다</h2>
      <p className="mt-2 text-body text-red-600">{message}</p>
      
      <div className="mt-6 border-t border-line pt-4 text-left text-util text-muted space-y-1">
        <p>오류 코드: <span className="font-mono text-text">{code}</span></p>
        {orderId && <p>주문 번호: <span className="font-mono text-text">{orderId}</span></p>}
      </div>

      <div className="mt-8 flex flex-col gap-2">
        <Link
          href="/checkout"
          className="flex h-11 w-full items-center justify-center bg-text text-nav font-medium text-bg hover:bg-[#444]"
        >
          다시 결제 시도하기
        </Link>
        <Link
          href="/cart"
          className="flex h-11 w-full items-center justify-center border border-line text-nav text-text hover:bg-soft"
        >
          장바구니로 돌아가기
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutFailPage() {
  return (
    <div className="w-full px-3 pb-section pt-section">
      <h1 className="text-label font-bold text-text">PAYMENT FAILED</h1>
      <Suspense
        fallback={
          <div className="py-24 text-center">
            <p className="text-body text-muted">결제 결과를 확인하는 중...</p>
          </div>
        }
      >
        <FailContent />
      </Suspense>
    </div>
  );
}
