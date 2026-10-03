"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DeliveryTracker, {
  type OrderStatusType,
} from "@/src/components/orders/DeliveryTracker";
import ShippingPolicy from "@/src/components/orders/ShippingPolicy";

interface OrderItem {
  id: string;
  productId: string;
  title: string;
  unitPrice: number;
  quantity: number;
}

interface Order {
  id: string;
  userId: string | null;
  status: OrderStatusType;
  paymentStatus: string;
  paymentKey?: string | null;
  totalAmount: number;
  recipientName: string;
  phone: string;
  address: string;
  addressDetail?: string | null;
  carrier?: string | null;
  trackingNumber?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

const CARRIERS = [
  "CJ대한통운",
  "우체국택배",
  "한진택배",
  "롯데택배",
  "로젠택배",
  "경동택배",
  "일양로지스",
];

function OrdersContent() {
  const { data: session, status: authStatus } = useSession();
  const searchParams = useSearchParams();
  const highlightedOrderId = searchParams.get("id");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 관리자 상태 변경용 로컬 state
  const [adminEditingOrderId, setAdminEditingOrderId] = useState<string | null>(null);
  const [adminStatus, setAdminStatus] = useState<OrderStatusType>("PAID");
  const [adminCarrier, setAdminCarrier] = useState("");
  const [adminTrackingNumber, setAdminTrackingNumber] = useState("");
  const [adminSaving, setAdminSaving] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "admin";
  const [viewAllAsAdmin, setViewAllAsAdmin] = useState(false);

  const fetchOrders = async (all?: boolean) => {
    try {
      const url = (all ?? viewAllAsAdmin) ? "/api/admin/orders" : "/api/orders";
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 401) {
          setOrders([]);
          return;
        }
        throw new Error("주문 내역을 불러오지 못했습니다.");
      }
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "주문 내역 조회 오류");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function load() {
      if (authStatus === "unauthenticated") {
        if (active) setLoading(false);
        return;
      }
      if (authStatus !== "authenticated") {
        return;
      }

      try {
        const url = viewAllAsAdmin ? "/api/admin/orders" : "/api/orders";
        const res = await fetch(url);
        if (!res.ok) {
          if (res.status === 401) {
            if (active) {
              setOrders([]);
              setLoading(false);
            }
            return;
          }
          throw new Error("주문 내역을 불러오지 못했습니다.");
        }
        const data = await res.json();
        if (active) {
          setOrders(data.orders || []);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "주문 내역 조회 오류");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [authStatus, viewAllAsAdmin]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAdminUpdate = async (orderId: string) => {
    setAdminSaving(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: adminStatus,
          carrier: adminCarrier,
          trackingNumber: adminTrackingNumber,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "상태 변경 실패");
      }
      // 리스트 갱신
      await fetchOrders();
      setAdminEditingOrderId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "저장 중 오류 발생");
    } finally {
      setAdminSaving(false);
    }
  };

  const openAdminEdit = (order: Order) => {
    setAdminEditingOrderId(order.id);
    setAdminStatus(order.status);
    setAdminCarrier(order.carrier || "CJ대한통운");
    setAdminTrackingNumber(order.trackingNumber || "");
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("이 주문을 취소하시겠습니까? 결제 완료 주문은 토스 환불이 함께 처리됩니다.")) return;
    setCancellingOrderId(orderId);
    try {
      const res = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "주문 취소에 실패했습니다.");
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "주문 취소 중 오류가 발생했습니다.");
    } finally {
      setCancellingOrderId(null);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="py-24 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-text border-t-transparent" />
        <p className="mt-4 text-body text-muted">주문 내역을 불러오고 있습니다...</p>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="mx-auto mt-12 max-w-[480px] rounded-sm border border-line p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-soft text-text">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
          </svg>
        </div>
        <h2 className="mt-4 text-heading font-bold text-text">로그인이 필요합니다</h2>
        <p className="mt-2 text-body text-muted">
          주문 내역 및 실시간 배송 상태를 확인하시려면 먼저 로그인해 주세요.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/login?callbackUrl=/orders"
            className="flex h-11 w-full items-center justify-center bg-text text-nav font-medium text-bg hover:bg-[#444]"
          >
            로그인하기
          </Link>
          <Link
            href="/signup"
            className="flex h-11 w-full items-center justify-center border border-line text-nav text-text hover:bg-soft"
          >
            회원가입
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto mt-12 max-w-[480px] rounded-sm border border-line p-8 text-center">
        <p className="text-body text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setLoading(true);
            fetchOrders();
          }}
          className="mt-4 inline-flex h-10 items-center justify-center border border-line px-4 text-nav text-text hover:bg-soft"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        {isAdmin && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-neutral-300 bg-neutral-50 p-4">
            <div className="flex items-center gap-2">
              <span className="rounded-xs bg-text px-2 py-0.5 text-util font-bold text-bg">ADMIN</span>
              <span className="text-util text-text font-medium">관리자 계정으로 로그인되어 있습니다</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = !viewAllAsAdmin;
                  setViewAllAsAdmin(next);
                  fetchOrders(next);
                }}
                className="rounded-xs border border-line bg-bg px-3 py-1.5 text-util font-medium text-text hover:bg-soft"
              >
                {viewAllAsAdmin ? "✓ 전체 고객 주문 조회 중" : "전체 고객 주문 보기 (관리자)"}
              </button>
              <Link
                href="/admin"
                className="rounded-xs bg-text px-3 py-1.5 text-util font-bold text-bg hover:bg-[#444]"
              >
                관리자 대시보드 바로가기 →
              </Link>
            </div>
          </div>
        )}

        <div className="mx-auto mt-6 max-w-[520px] rounded-sm border border-line p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-soft text-muted">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <h2 className="mt-4 text-heading font-bold text-text">주문 내역이 없습니다</h2>
          <p className="mt-2 text-body text-muted">
            {isAdmin && !viewAllAsAdmin
              ? "관리자 계정으로 직접 주문한 내역이 없습니다. 고객 주문을 보시려면 위의 [전체 고객 주문 보기]를 눌러주세요."
              : "아직 완료된 주문이 없습니다. 스튜디오 UDN의 다양한 디자인 오브제를 만나보세요."}
          </p>
          <div className="mt-8">
            <Link
              href="/products"
              className="inline-flex h-11 items-center justify-center bg-text px-8 text-nav font-medium text-bg hover:bg-[#444]"
            >
              컬렉션 둘러보기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {isAdmin && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-neutral-300 bg-neutral-50 p-4">
          <div className="flex items-center gap-2">
            <span className="rounded-xs bg-text px-2 py-0.5 text-util font-bold text-bg">ADMIN</span>
            <span className="text-util text-text font-medium">관리자 모드</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = !viewAllAsAdmin;
                setViewAllAsAdmin(next);
                fetchOrders(next);
              }}
              className="rounded-xs border border-line bg-bg px-3 py-1.5 text-util font-medium text-text hover:bg-soft"
            >
              {viewAllAsAdmin ? "✓ 전체 고객 주문 조회 중 (내 주문만 보기)" : "전체 고객 주문 보기 (관리자)"}
            </button>
            <Link
              href="/admin"
              className="rounded-xs bg-text px-3 py-1.5 text-util font-bold text-bg hover:bg-[#444]"
            >
              관리자 대시보드 바로가기 →
            </Link>
          </div>
        </div>
      )}

      {orders.map((order) => {
        const isTarget = highlightedOrderId === order.id;
        const formattedDate = new Date(order.createdAt).toLocaleString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div
            key={order.id}
            id={order.id}
            className={`rounded-sm border bg-bg transition-colors ${
              isTarget ? "border-text shadow-sm" : "border-line"
            }`}
          >
            {/* 주문 카드 헤더 */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-soft px-5 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-util font-bold text-text">{formattedDate}</span>
                <span className="text-line">|</span>
                <div className="flex items-center gap-1.5 text-util">
                  <span className="text-muted">주문번호:</span>
                  <span className="font-mono font-medium text-text">{order.id}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(order.id)}
                    className="text-muted hover:text-text"
                    title="주문번호 복사"
                  >
                    {copiedId === order.id ? (
                      <span className="text-[11px] text-emerald-600 font-semibold">복사됨</span>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`rounded-xs border px-2 py-0.5 text-util font-semibold ${
                    order.paymentStatus === "PAID"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : order.paymentStatus === "REFUNDED"
                        ? "border-purple-300 bg-purple-50 text-purple-700"
                        : "border-neutral-300 bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {order.paymentStatus === "PAID"
                    ? "결제 완료"
                    : order.paymentStatus === "REFUNDED"
                      ? "환불 완료"
                      : "결제 미완료"}
                </span>
                {(order.status === "PENDING" || order.status === "PAID") && (
                  <button
                    type="button"
                    onClick={() => handleDeleteOrder(order.id)}
                    disabled={cancellingOrderId === order.id}
                    className="rounded-xs border border-line bg-bg px-2 py-0.5 text-[11px] text-muted transition-colors hover:border-red-400 hover:text-red-600"
                  >
                    {cancellingOrderId === order.id ? "취소 중..." : "주문 취소"}
                  </button>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => openAdminEdit(order)}
                    className="rounded-xs border border-line bg-bg px-2 py-0.5 text-[11px] font-medium text-muted hover:border-text hover:text-text"
                  >
                    ⚙ 관리자 배송설정
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 space-y-6">
              {/* 배송 추적 컴포넌트 */}
              <DeliveryTracker
                status={order.status}
                carrier={order.carrier}
                trackingNumber={order.trackingNumber}
              />

              {/* 주문 상품 목록 */}
              <div>
                <h3 className="text-util font-semibold text-muted">주문 상품 ({order.items.length}개)</h3>
                <div className="mt-2 divide-y divide-line border-t border-b border-line">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3.5">
                      <div className="flex-1">
                        <Link
                          href={`/products/${item.productId}`}
                          className="text-body font-medium text-text hover:underline"
                        >
                          {item.title}
                        </Link>
                        <p className="mt-0.5 text-util text-muted">
                          {item.unitPrice.toLocaleString("ko-KR")} KRW × {item.quantity}개
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-body font-bold text-text">
                          {(item.unitPrice * item.quantity).toLocaleString("ko-KR")} KRW
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 배송지 및 결제 정보 2열 그리드 */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 border-t border-line pt-5 text-util">
                {/* 배송지 정보 */}
                <div className="space-y-1.5">
                  <h4 className="font-semibold text-text">배송지 정보</h4>
                  <div className="text-muted">
                    <p>
                      <span className="text-text font-medium">{order.recipientName}</span> ({order.phone})
                    </p>
                    <p className="mt-0.5 text-text">
                      {order.address} {order.addressDetail ?? ""}
                    </p>
                  </div>
                </div>

                {/* 결제 요약 정보 */}
                <div className="space-y-1.5 md:text-right">
                  <h4 className="font-semibold text-text">결제 정보</h4>
                  <div className="text-muted">
                    <p>
                      총 결제 금액:{" "}
                      <span className="text-body font-bold text-text">
                        {order.totalAmount.toLocaleString("ko-KR")} KRW
                      </span>
                    </p>
                    {order.paymentKey && (
                      <p className="mt-0.5 text-[11px] text-muted">
                        승인번호: <span className="font-mono text-text">{order.paymentKey}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 관리자: 배송 상태 변경 모달/패널 */}
              {isAdmin && adminEditingOrderId === order.id && (
                <div className="rounded-sm border border-neutral-300 bg-neutral-50 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-util font-bold text-text">🛠 관리자: 주문 상태 및 배송 송장 관리</h4>
                    <button
                      type="button"
                      onClick={() => setAdminEditingOrderId(null)}
                      className="text-util text-muted hover:text-text"
                    >
                      ✕ 닫기
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-util text-muted">배송 상태</label>
                      <select
                        value={adminStatus}
                        onChange={(e) => setAdminStatus(e.target.value as OrderStatusType)}
                        className="mt-1 h-9 w-full rounded-xs border border-line bg-bg px-2 text-util text-text"
                      >
                        <option value="PAID">결제 완료 (PAID)</option>
                        <option value="PREPARING">상품 준비중 (PREPARING)</option>
                        <option value="SHIPPED">배송중 (SHIPPED)</option>
                        <option value="DELIVERED">배송 완료 (DELIVERED)</option>
                        <option value="CANCELLED">주문 취소 (CANCELLED)</option>
                        <option value="REFUNDED">환불 완료 (REFUNDED)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-util text-muted">택배사</label>
                      <select
                        value={adminCarrier}
                        onChange={(e) => setAdminCarrier(e.target.value)}
                        className="mt-1 h-9 w-full rounded-xs border border-line bg-bg px-2 text-util text-text"
                      >
                        <option value="">선택 안 함</option>
                        {CARRIERS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-util text-muted">운송장 번호</label>
                      <input
                        type="text"
                        value={adminTrackingNumber}
                        onChange={(e) => setAdminTrackingNumber(e.target.value)}
                        placeholder="숫자만 입력"
                        className="mt-1 h-9 w-full rounded-xs border border-line bg-bg px-2 text-util text-text font-mono"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAdminEditingOrderId(null)}
                      className="h-8 rounded-xs border border-line px-3 text-util text-muted hover:bg-soft"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      disabled={adminSaving}
                      onClick={() => handleAdminUpdate(order.id)}
                      className="h-8 rounded-xs bg-text px-4 text-util font-medium text-bg hover:bg-[#333] disabled:opacity-50"
                    >
                      {adminSaving ? "저장 중..." : "배송 상태 변경 적용"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-[800px] px-3 pb-section pt-section">
      <div className="mb-8 flex items-baseline justify-between border-b border-line pb-4">
        <div>
          <h1 className="text-label font-bold tracking-tight text-text">ORDER HISTORY</h1>
          <p className="mt-1 text-util text-muted">주문 내역 및 실시간 배송 조회를 확인하실 수 있습니다.</p>
        </div>
        <Link href="/products" className="text-util text-muted hover:text-text">
          ← 쇼핑 계속하기
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="py-24 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-text border-t-transparent" />
            <p className="mt-4 text-body text-muted">주문 내역을 불러오고 있습니다...</p>
          </div>
        }
      >
        <OrdersContent />
      </Suspense>

      <div className="mt-10">
        <ShippingPolicy />
      </div>
    </div>
  );
}
