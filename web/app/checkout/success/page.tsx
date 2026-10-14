"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { clearCart } from "@/src/lib/store";
import DeliveryTracker from "@/src/components/orders/DeliveryTracker";

interface OrderDetail {
  id: string;
  totalAmount: number;
  recipientName: string;
  phone: string;
  address: string;
  addressDetail?: string | null;
  status: string;
  paymentStatus: string;
  paymentKey?: string | null;
  carrier?: string | null;
  trackingNumber?: string | null;
  epostDeliveryStatus?: string | null;
  epostLatestEventDate?: string | null;
  epostLatestEventTime?: string | null;
  epostLatestEventLocation?: string | null;
  epostLatestEventStatus?: string | null;
  createdAt: string;
  items?: {
    id: string;
    title: string;
    unitPrice: number;
    quantity: number;
  }[];
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const provider = searchParams.get("provider") ?? "nicepay";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDetail | null>(null);

  const missingParams = !paymentKey || !orderId;

  useEffect(() => {
    if (!paymentKey || !orderId) {
      return;
    }

    const safeOrderId = orderId;
    let isMounted = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    setLoading(true);
    setError(null);
    setOrder(null);

    async function loadOrder() {
      try {
        // 읽기 전용 조회: Strict Mode의 setup → cleanup → setup에서도 다시 실행한다.
        // 결제 승인은 서버 return 라우트에서만 수행한다.
        const res = await fetch(`/api/orders?id=${encodeURIComponent(safeOrderId)}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        const data = await res.json().catch(() => null);

        if (!isMounted) return;

        if (!res.ok) {
          throw new Error(data?.error || "주문 정보를 불러오지 못했습니다.");
        }

        const confirmedOrder = data?.order as OrderDetail | undefined;
        if (!confirmedOrder || confirmedOrder.id !== safeOrderId ||
            confirmedOrder.paymentStatus !== "PAID" || confirmedOrder.paymentKey !== paymentKey) {
          throw new Error("이 주문의 결제 완료 상태를 확인할 수 없습니다. 주문 내역을 확인해주세요.");
        }

        // URL만 믿지 않고 서버에서 승인된 주문을 확인한 뒤 장바구니를 비운다.
        clearCart();
        setOrder(confirmedOrder);
      } catch (err: unknown) {
        if (isMounted) {
          const msg =
            controller.signal.aborted
              ? "주문 조회 시간이 초과되었습니다. 주문 내역에서 결제 상태를 확인해주세요."
              : err instanceof Error
              ? err.message
              : "주문 정보를 불러오는 중 오류가 발생했습니다.";
          setError(msg);
        }
      } finally {
        clearTimeout(timeout);
        if (isMounted) setLoading(false);
      }
    }

    loadOrder();

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [missingParams, paymentKey, orderId, amount, provider]);

  if (missingParams) {
    return (
      <div className="mx-auto mt-12 max-w-[520px] rounded-sm border border-line p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          ✕
        </div>
        <h2 className="mt-4 text-heading font-bold text-text">결제 정보 누락</h2>
        <p className="mt-2 text-body text-red-600">
          잘못된 결제 승인 요청입니다. 결제 정보가 누락되었습니다.
        </p>
        <div className="mt-8 flex flex-col gap-2">
          <Link
            href="/checkout"
            className="flex h-11 w-full items-center justify-center bg-text text-nav font-medium text-bg hover:bg-[#444]"
          >
            체크아웃으로 이동
          </Link>
          <Link
            href="/cart"
            className="flex h-11 w-full items-center justify-center border border-line text-nav text-text hover:bg-soft"
          >
            장바구니 확인
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-text border-t-transparent" />
        <p className="mt-4 text-body font-medium text-text">결제 처리를 확인하고 있습니다...</p>
        <p className="mt-1 text-util text-muted">잠시만 기다려주세요.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto mt-12 max-w-[520px] rounded-sm border border-line p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          ✕
        </div>
        <h2 className="mt-4 text-heading font-bold text-text">결제 상태 확인 필요</h2>
        <p className="mt-2 text-body text-red-600">{error}</p>
        <p className="mt-2 text-util text-muted">
          조회 오류가 결제 실패를 의미하지는 않습니다. 다시 결제하기 전에 주문 내역을 확인해주세요.
        </p>
        <div className="mt-8 flex flex-col gap-2">
          <Link
            href={`/orders?id=${encodeURIComponent(orderId || "")}`}
            className="flex h-11 w-full items-center justify-center bg-text text-nav font-medium text-bg hover:bg-[#444]"
          >
            주문 내역 확인하기
          </Link>
          <Link
            href="/cart"
            className="flex h-11 w-full items-center justify-center border border-line text-nav text-text hover:bg-soft"
          >
            장바구니 확인
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-8 max-w-[560px] rounded-sm border border-line p-6">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xl font-bold">
          ✓
        </div>
        <h2 className="mt-4 text-heading font-bold text-text">주문 및 결제가 완료되었습니다</h2>
        <p className="mt-1 text-util text-muted">주문해주셔서 감사합니다. 배송을 안전하게 준비하겠습니다.</p>
      </div>

      {/* 배송 상태 추적 바 */}
      <div className="mt-6">
        <DeliveryTracker
          status={order?.status || "PAID"}
          carrier={order?.carrier}
          trackingNumber={order?.trackingNumber}
          epostDeliveryStatus={order?.epostDeliveryStatus}
          epostLatestEventDate={order?.epostLatestEventDate}
          epostLatestEventTime={order?.epostLatestEventTime}
          epostLatestEventLocation={order?.epostLatestEventLocation}
          epostLatestEventStatus={order?.epostLatestEventStatus}
        />
      </div>

      <div className="mt-6 space-y-3 border-t border-line pt-6 text-body">
        <div className="flex justify-between">
          <span className="text-muted">주문 번호</span>
          <span className="font-mono text-util font-semibold text-text">{order?.id || orderId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">결제 승인 번호</span>
          <span className="font-mono text-util text-text truncate max-w-[260px]">{paymentKey}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">결제 금액</span>
          <span className="font-bold text-text">
            {(order?.totalAmount ?? Number(amount) ?? 0).toLocaleString("ko-KR")} KRW
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">결제 상태</span>
          <span className="font-semibold text-emerald-600">결제 완료 (PAID)</span>
        </div>
        {order?.recipientName && (
          <div className="flex justify-between">
            <span className="text-muted">받는 분</span>
            <span className="text-text">{order.recipientName} ({order.phone})</span>
          </div>
        )}
        {order?.address && (
          <div className="flex justify-between">
            <span className="text-muted">배송지</span>
            <span className="text-right text-text max-w-[280px]">
              {order.address} {order.addressDetail ?? ""}
            </span>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-2 border-t border-line pt-6">
        <Link
          href={`/orders?id=${order?.id || orderId || ""}`}
          className="flex h-11 w-full items-center justify-center bg-text text-nav font-medium text-bg hover:bg-[#444]"
        >
          주문 내역 및 실시간 배송 조회
        </Link>
        <Link
          href="/products"
          className="flex h-11 w-full items-center justify-center border border-line text-nav text-text hover:bg-soft"
        >
          쇼핑 계속하기
        </Link>
        <Link
          href="/"
          className="flex h-11 w-full items-center justify-center border border-line text-nav text-text hover:bg-soft"
        >
          홈으로 가기
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="w-full px-3 pb-section pt-section">
      <h1 className="text-label font-bold text-text">PAYMENT SUCCESS</h1>
      <Suspense
        fallback={
          <div className="py-24 text-center">
            <p className="text-body text-muted">결제 정보를 불러오는 중...</p>
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </div>
  );
}
