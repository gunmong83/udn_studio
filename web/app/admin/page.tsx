"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import DeliveryTracker, {
  type OrderStatusType,
  getTrackingUrl,
} from "@/src/components/orders/DeliveryTracker";

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
  user?: {
    id: string;
    email: string | null;
    name: string | null;
  } | null;
}

interface Member {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  createdAt: string;
  _count: {
    orders: number;
  };
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

const STATUS_LABELS: Record<OrderStatusType, string> = {
  PENDING: "결제 대기",
  PAID: "결제 완료",
  PREPARING: "상품 준비중",
  SHIPPED: "배송중",
  DELIVERED: "배송 완료",
  CANCELLED: "주문 취소",
  REFUNDED: "환불 완료",
};

export default function AdminPage() {
  const { data: session, status: authStatus } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [activeTab, setActiveTab] = useState<"orders" | "members">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 및 검색
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // 편집 상태
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<OrderStatusType>("PAID");
  const [editCarrier, setEditCarrier] = useState("");
  const [editTrackingNumber, setEditTrackingNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders");
      if (!res.ok) throw new Error("전체 주문 내역을 불러오지 못했습니다.");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "주문 조회 실패");
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/admin/members");
      if (!res.ok) throw new Error("회원 목록을 불러오지 못했습니다.");
      const data = await res.json();
      setMembers(data.members || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원 조회 실패");
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchOrders(), fetchMembers()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function initialize() {
      if (authStatus === "unauthenticated" || (authStatus === "authenticated" && !isAdmin)) {
        if (active) setLoading(false);
        return;
      }
      if (authStatus !== "authenticated" || !isAdmin) {
        return;
      }

      try {
        const [ordersRes, membersRes] = await Promise.all([
          fetch("/api/admin/orders"),
          fetch("/api/admin/members"),
        ]);
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          if (active) setOrders(ordersData.orders || []);
        } else {
          throw new Error("주문 목록을 불러오지 못했습니다.");
        }

        if (membersRes.ok) {
          const membersData = await membersRes.json();
          if (active) setMembers(membersData.members || []);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "관리자 데이터 조회 실패");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, [authStatus, isAdmin]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openEdit = (order: Order) => {
    setEditingOrderId(order.id);
    setEditStatus(order.status);
    setEditCarrier(order.carrier || "CJ대한통운");
    setEditTrackingNumber(order.trackingNumber || "");
  };

  const handleUpdate = async (orderId: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: editStatus,
          carrier: editCarrier,
          trackingNumber: editTrackingNumber,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "상태 변경 실패");
      }
      await fetchOrders();
      setEditingOrderId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "저장 중 오류 발생");
    } finally {
      setSaving(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="py-24 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-text border-t-transparent" />
        <p className="mt-4 text-body text-muted">관리자 모드를 불러오고 있습니다...</p>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="mx-auto mt-12 max-w-[480px] rounded-sm border border-line p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-soft text-text">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="mt-4 text-heading font-bold text-text">관리자 로그인이 필요합니다</h2>
        <p className="mt-2 text-body text-muted">
          관리자 권한이 있는 계정(gunmong83@gmail.com)으로 로그인해 주세요.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/login?callbackUrl=/admin"
            className="flex h-11 w-full items-center justify-center bg-text text-nav font-medium text-bg hover:bg-[#444]"
          >
            관리자 계정으로 로그인하기
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

  if (!isAdmin) {
    return (
      <div className="mx-auto mt-12 max-w-[480px] rounded-sm border border-line p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          ✕
        </div>
        <h2 className="mt-4 text-heading font-bold text-text">관리자 권한이 없습니다</h2>
        <p className="mt-2 text-body text-muted">
          현재 로그인된 계정: <span className="font-semibold text-text">{session?.user?.email}</span>
        </p>
        <p className="mt-1 text-util text-muted">
          관리자 권한 계정: <span className="font-mono text-text">gunmong83@gmail.com</span>
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/login?callbackUrl=/admin"
            className="flex h-11 w-full items-center justify-center bg-text text-nav font-medium text-bg hover:bg-[#444]"
          >
            다른 계정으로 로그인
          </Link>
          <Link
            href="/"
            className="flex h-11 w-full items-center justify-center border border-line text-nav text-text hover:bg-soft"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // 통계 계산
  const totalCount = orders.length;
  const paidCount = orders.filter((o) => o.status === "PAID").length;
  const prepCount = orders.filter((o) => o.status === "PREPARING").length;
  const shippedCount = orders.filter((o) => o.status === "SHIPPED").length;
  const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "PAID")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // 주문 필터링
  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "ALL" && order.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchId = order.id.toLowerCase().includes(term);
      const matchRecipient = order.recipientName.toLowerCase().includes(term);
      const matchPhone = order.phone.includes(term);
      const matchEmail = order.user?.email?.toLowerCase().includes(term) ?? false;
      const matchTracking = order.trackingNumber?.toLowerCase().includes(term) ?? false;
      return matchId || matchRecipient || matchPhone || matchEmail || matchTracking;
    }
    return true;
  });

  return (
    <div className="mx-auto w-full max-w-[1200px] px-3 pb-section pt-section">
      {/* 관리자 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-xs bg-text px-2 py-0.5 text-util font-bold text-bg">ADMIN</span>
            <h1 className="text-label font-bold text-text">스튜디오 UDN 관리자 센터</h1>
          </div>
          <p className="mt-1 text-util text-muted">
            로그인된 관리자: <span className="font-semibold text-text">{session?.user?.email}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex h-9 items-center justify-center border border-line bg-bg px-3 text-util font-medium text-text hover:bg-soft"
          >
            ↻ 새로고침
          </button>
          <Link
            href="/orders"
            className="inline-flex h-9 items-center justify-center border border-line bg-bg px-3 text-util font-medium text-text hover:bg-soft"
          >
            내 주문/배송 보기
          </Link>
          <Link
            href="/"
            className="inline-flex h-9 items-center justify-center bg-text px-3 text-util font-medium text-bg hover:bg-[#444]"
          >
            쇼핑몰 홈
          </Link>
        </div>
      </div>

      {/* KPI 통계 요약 카드 */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-sm border border-line bg-soft p-4">
          <p className="text-util text-muted">전체 주문</p>
          <p className="mt-1 text-heading font-bold text-text">{totalCount}건</p>
        </div>
        <div className="rounded-sm border border-emerald-200 bg-emerald-50/50 p-4">
          <p className="text-util text-emerald-800">결제 완료</p>
          <p className="mt-1 text-heading font-bold text-emerald-700">{paidCount}건</p>
        </div>
        <div className="rounded-sm border border-amber-200 bg-amber-50/50 p-4">
          <p className="text-util text-amber-800">상품 준비중</p>
          <p className="mt-1 text-heading font-bold text-amber-700">{prepCount}건</p>
        </div>
        <div className="rounded-sm border border-blue-200 bg-blue-50/50 p-4">
          <p className="text-util text-blue-800">배송중</p>
          <p className="mt-1 text-heading font-bold text-blue-700">{shippedCount}건</p>
        </div>
        <div className="rounded-sm border border-neutral-200 bg-neutral-100 p-4">
          <p className="text-util text-neutral-700">배송 완료</p>
          <p className="mt-1 text-heading font-bold text-neutral-800">{deliveredCount}건</p>
        </div>
        <div className="rounded-sm border border-line bg-soft p-4">
          <p className="text-util text-muted">총 결제 매출</p>
          <p className="mt-1 text-util font-bold text-text">
            {totalRevenue.toLocaleString("ko-KR")} 원
          </p>
        </div>
      </div>

      {/* 메인 탭 */}
      <div className="mt-8 flex gap-2 border-b border-line">
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`border-b-2 px-5 py-3 text-nav font-medium transition-colors ${
            activeTab === "orders"
              ? "border-text font-bold text-text"
              : "border-transparent text-muted hover:text-text"
          }`}
        >
          📦 주문 & 배송 관리 ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={`border-b-2 px-5 py-3 text-nav font-medium transition-colors ${
            activeTab === "members"
              ? "border-text font-bold text-text"
              : "border-transparent text-muted hover:text-text"
          }`}
        >
          👥 회원 목록 ({members.length})
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-sm border border-red-300 bg-red-50 p-4 text-util text-red-700">
          {error}
        </div>
      )}

      {/* 탭 1: 주문 및 배송 관리 */}
      {activeTab === "orders" && (
        <div className="mt-6 space-y-6">
          {/* 필터 및 검색 컨트롤 */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 text-util">
              {[
                { key: "ALL", label: "전체" },
                { key: "PAID", label: "결제 완료" },
                { key: "PREPARING", label: "상품 준비중" },
                { key: "SHIPPED", label: "배송중" },
                { key: "DELIVERED", label: "배송 완료" },
                { key: "CANCELLED", label: "취소/환불" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key)}
                  className={`rounded-xs border px-3 py-1.5 font-medium transition-colors ${
                    statusFilter === f.key
                      ? "border-text bg-text text-bg"
                      : "border-line bg-bg text-muted hover:border-text hover:text-text"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-72">
              <input
                type="text"
                placeholder="주문자/수령인/송장번호 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-full rounded-xs border border-line bg-bg px-3 text-util text-text placeholder:text-muted focus:border-text focus:outline-none"
              />
            </div>
          </div>

          {/* 주문 리스트 */}
          {filteredOrders.length === 0 ? (
            <div className="rounded-sm border border-line p-12 text-center text-body text-muted">
              조건에 일치하는 주문 내역이 없습니다.
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => {
                const formattedDate = new Date(order.createdAt).toLocaleString("ko-KR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const isEditing = editingOrderId === order.id;
                const trackingUrl = getTrackingUrl(order.carrier, order.trackingNumber);

                return (
                  <div
                    key={order.id}
                    className="rounded-sm border border-line bg-bg transition-colors"
                  >
                    {/* 주문 카드 헤더 */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-soft px-5 py-3.5">
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
                              <span className="text-[11px] font-semibold text-emerald-600">복사됨</span>
                            ) : (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                              </svg>
                            )}
                          </button>
                        </div>
                        {order.user?.email && (
                          <>
                            <span className="text-line">|</span>
                            <span className="text-util text-muted">
                              회원: <span className="font-medium text-text">{order.user.email}</span>
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-xs border px-2 py-0.5 text-util font-semibold ${
                            order.status === "DELIVERED"
                              ? "border-neutral-300 bg-neutral-100 text-neutral-700"
                              : order.status === "SHIPPED"
                              ? "border-blue-300 bg-blue-50 text-blue-700"
                              : order.status === "PREPARING"
                              ? "border-amber-300 bg-amber-50 text-amber-700"
                              : order.status === "PAID"
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : "border-neutral-300 bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {STATUS_LABELS[order.status] || order.status}
                        </span>

                        <button
                          type="button"
                          onClick={() => (isEditing ? setEditingOrderId(null) : openEdit(order))}
                          className="rounded-xs border border-text bg-text px-2.5 py-1 text-util font-medium text-bg hover:bg-[#444]"
                        >
                          {isEditing ? "✕ 편집 닫기" : "⚙ 배송설정 / 상태변경"}
                        </button>
                      </div>
                    </div>

                    {/* 배송 상태 추적 바 */}
                    <div className="px-5 pt-5">
                      <DeliveryTracker
                        status={order.status}
                        carrier={order.carrier}
                        trackingNumber={order.trackingNumber}
                      />
                    </div>

                    {/* 배송 설정 인라인 에디터 패널 */}
                    {isEditing && (
                      <div className="m-5 rounded-sm border border-neutral-300 bg-neutral-50 p-4">
                        <h4 className="text-util font-bold text-text">🛠 관리자: 배송 상태 및 운송장 정보 수정</h4>
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div>
                            <label className="block text-util font-medium text-muted">배송 상태 변경</label>
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value as OrderStatusType)}
                              className="mt-1 h-9 w-full rounded-xs border border-line bg-bg px-2 text-util text-text focus:border-text focus:outline-none"
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
                            <label className="block text-util font-medium text-muted">택배사 선택</label>
                            <select
                              value={editCarrier}
                              onChange={(e) => setEditCarrier(e.target.value)}
                              className="mt-1 h-9 w-full rounded-xs border border-line bg-bg px-2 text-util text-text focus:border-text focus:outline-none"
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
                            <label className="block text-util font-medium text-muted">운송장 번호</label>
                            <input
                              type="text"
                              value={editTrackingNumber}
                              onChange={(e) => setEditTrackingNumber(e.target.value)}
                              placeholder="숫자만 입력 (예: 68160868)"
                              className="mt-1 h-9 w-full rounded-xs border border-line bg-bg px-2 text-util text-text focus:border-text focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingOrderId(null)}
                            className="h-8 border border-line bg-bg px-3 text-util text-muted hover:text-text"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleUpdate(order.id)}
                            className="h-8 bg-text px-4 text-util font-medium text-bg hover:bg-[#444] disabled:opacity-50"
                          >
                            {saving ? "저장 중..." : "✓ 변경사항 저장"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 주문 상품 목록 */}
                    <div className="px-5 pt-3">
                      <h4 className="text-util font-semibold text-muted">주문 상품 ({order.items.length}개)</h4>
                      <div className="mt-2 divide-y divide-line border-t border-b border-line">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-3">
                            <div>
                              <span className="text-body font-medium text-text">{item.title}</span>
                              <span className="ml-2 font-mono text-util text-muted">({item.productId})</span>
                              <p className="mt-0.5 text-util text-muted">
                                {item.unitPrice.toLocaleString("ko-KR")} KRW × {item.quantity}개
                              </p>
                            </div>
                            <span className="text-body font-bold text-text">
                              {(item.unitPrice * item.quantity).toLocaleString("ko-KR")} KRW
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 배송지 및 결제 정보 */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 p-5 text-util">
                      <div className="space-y-1">
                        <h5 className="font-semibold text-text">배송지 및 수령인 정보</h5>
                        <p className="text-text">
                          <span className="font-medium">{order.recipientName}</span> ({order.phone})
                        </p>
                        <p className="text-text">
                          {order.address} {order.addressDetail ?? ""}
                        </p>
                        {order.carrier && order.trackingNumber && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-muted">배송정보:</span>
                            <span className="font-semibold text-text">{order.carrier}</span>
                            <span className="font-mono text-text">{order.trackingNumber}</span>
                            {trackingUrl && (
                              <a
                                href={trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-xs border border-line bg-soft px-1.5 py-0.5 text-[11px] text-text hover:bg-line"
                              >
                                배송조회 ↗
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 md:text-right">
                        <h5 className="font-semibold text-text">결제 정보</h5>
                        <p className="text-muted">
                          총 결제 금액:{" "}
                          <span className="text-body font-bold text-text">
                            {order.totalAmount.toLocaleString("ko-KR")} KRW
                          </span>
                        </p>
                        {order.paymentKey && (
                          <p className="text-[11px] text-muted">
                            토스 승인번호: <span className="font-mono text-text">{order.paymentKey}</span>
                          </p>
                        )}
                        <p className="text-[11px] text-emerald-700">
                          결제 상태: <span className="font-semibold">결제 완료 (PAID)</span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 탭 2: 회원 목록 관리 */}
      {activeTab === "members" && (
        <div className="mt-6">
          <div className="overflow-x-auto rounded-sm border border-line">
            <table className="w-full text-left text-util">
              <thead className="border-b border-line bg-soft text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">회원 ID</th>
                  <th className="px-4 py-3 font-semibold">이메일</th>
                  <th className="px-4 py-3 font-semibold">이름</th>
                  <th className="px-4 py-3 font-semibold">주문 건수</th>
                  <th className="px-4 py-3 font-semibold">가입일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-soft">
                    <td className="px-4 py-3 font-mono text-muted">{m.id}</td>
                    <td className="px-4 py-3 font-medium text-text">{m.email ?? "-"}</td>
                    <td className="px-4 py-3 text-text">{m.name ?? "-"}</td>
                    <td className="px-4 py-3 font-bold text-text">{m._count?.orders ?? 0}건</td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(m.createdAt).toLocaleString("ko-KR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
