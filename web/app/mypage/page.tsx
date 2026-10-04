"use client";

import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import type { OrderStatusType } from "@/src/components/orders/DeliveryTracker";
import { clearCart, setCartOwner, useCart, useWishlist } from "@/src/lib/store";

interface DaumPostcodeData {
  address: string;
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  buildingName: string;
  bname: string;
  apartment: string;
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeData) => void;
      }) => {
        open: () => void;
      };
    };
  }
}

function loadDaumPostcodeScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.daum?.Postcode) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="postcode.v2.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("우편번호 스크립트 로드 실패")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("다음 주소 검색 서비스를 불러오지 못했습니다."));
    document.head.appendChild(script);
  });
}

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

function MyPageContent() {
  const { data: session, status: authStatus } = useSession();
  const searchParams = useSearchParams();
  const highlightedOrderId = searchParams.get("id");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 관리자 상태 변경용 state
  const [adminEditingOrderId, setAdminEditingOrderId] = useState<string | null>(null);
  const [adminStatus, setAdminStatus] = useState<OrderStatusType>("PAID");
  const [adminCarrier, setAdminCarrier] = useState("");
  const [adminTrackingNumber, setAdminTrackingNumber] = useState("");
  const [adminSaving, setAdminSaving] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [defaultAddress, setDefaultAddress] = useState({
    recipientName: "",
    phone: "",
    zonecode: "",
    address: "",
    addressDetail: "",
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [showAccountDeletion, setShowAccountDeletion] = useState(false);
  const [accountDeletionAcknowledged, setAccountDeletionAcknowledged] = useState(false);
  const [accountDeletionConfirmation, setAccountDeletionConfirmation] = useState("");
  const [accountDeletionMessage, setAccountDeletionMessage] = useState("");
  const [accountDeletionLoading, setAccountDeletionLoading] = useState(false);
  const addressDetailInputRef = useRef<HTMLInputElement>(null);

  const cartItems = useCart();
  const wishlist = useWishlist();
  const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const wishCount = wishlist.length;

  const isAdmin = session?.user?.role === "admin";

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
        const res = await fetch("/api/orders");
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
  }, [authStatus]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    fetch("/api/profile")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        const profile = data?.profile;
        if (!profile) return;
        setDefaultAddress({
          recipientName: profile.defaultRecipientName ?? profile.name ?? "",
          phone: profile.defaultPhone ?? profile.phone ?? "",
          zonecode: profile.defaultZonecode ?? "",
          address: profile.defaultAddress ?? "",
          addressDetail: profile.defaultAddressDetail ?? "",
        });
      })
      .catch(() => {});
  }, [authStatus]);

  const saveDefaultAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileMessage("");
    setProfileSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaultAddress),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "기본 배송지 저장에 실패했습니다.");
      setProfileMessage("기본 배송지를 저장했습니다.");
    } catch (saveError) {
      setProfileMessage(saveError instanceof Error ? saveError.message : "기본 배송지 저장에 실패했습니다.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSearchDefaultAddress = async () => {
    setProfileMessage("");
    try {
      await loadDaumPostcodeScript();
      if (!window.daum?.Postcode) {
        throw new Error("다음 주소 검색 서비스를 실행할 수 없습니다.");
      }

      new window.daum.Postcode({
        oncomplete: (data: DaumPostcodeData) => {
          let fullAddress = data.roadAddress || data.jibunAddress || data.address;
          let extraAddress = "";

          if (data.bname && /[동|로|가]$/g.test(data.bname)) {
            extraAddress += data.bname;
          }
          if (data.buildingName && data.apartment === "Y") {
            extraAddress += extraAddress ? `, ${data.buildingName}` : data.buildingName;
          }
          if (extraAddress) {
            fullAddress += ` (${extraAddress})`;
          }

          setDefaultAddress((value) => ({
            ...value,
            zonecode: data.zonecode,
            address: fullAddress,
          }));
          window.setTimeout(() => addressDetailInputRef.current?.focus(), 100);
        },
      }).open();
    } catch (searchError) {
      setProfileMessage(searchError instanceof Error ? searchError.message : "주소 검색을 불러오지 못했습니다.");
    }
  };

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
      const refreshRes = await fetch("/api/orders");
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setOrders(refreshData.orders || []);
      }
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
    const targetOrder = orders.find((order) => order.id === orderId);
    // 미결제 주문은 금전 거래가 없으므로 브라우저 확인창 없이 바로 취소합니다.
    if (targetOrder?.paymentStatus === "PAID" && !window.confirm("이 주문을 취소하시겠습니까? 결제 취소가 함께 처리됩니다.")) return;
    setCancellingOrderId(orderId);
    try {
      const res = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "주문 취소에 실패했습니다.");
      // 고객 화면에서는 취소된 주문을 즉시 목록에서 숨깁니다.
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "주문 취소 중 오류가 발생했습니다.");
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleAccountDeletion = async () => {
    if (!accountDeletionAcknowledged || accountDeletionConfirmation !== "탈퇴") return;
    setAccountDeletionLoading(true);
    setAccountDeletionMessage("");
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: accountDeletionConfirmation, acknowledged: accountDeletionAcknowledged }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "계정 탈퇴 처리에 실패했습니다.");
      clearCart();
      setCartOwner(null);
      if (typeof window !== "undefined") window.localStorage.removeItem("udn-wishlist");
      await signOut({ callbackUrl: "/" });
    } catch (deletionError) {
      setAccountDeletionMessage(deletionError instanceof Error ? deletionError.message : "계정 탈퇴 처리에 실패했습니다.");
    } finally {
      setAccountDeletionLoading(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="py-24 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-text border-t-transparent" />
        <p className="mt-4 text-body text-muted">마이페이지 정보를 불러오고 있습니다...</p>
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
          마이페이지를 이용하시려면 먼저 로그인해 주세요.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/login?callbackUrl=/mypage"
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

  return (
    <div className="space-y-10">
      {/* 1. 회원 프로필 요약 카드 */}
      <div className="rounded-sm border border-line bg-bg p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-soft text-text">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-body font-bold text-text">{session?.user?.name ?? "회원"}님</h2>
                {isAdmin && (
                  <span className="rounded-xs bg-text px-2 py-0.5 text-[11px] font-semibold text-bg">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-util text-muted">{session?.user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-xs bg-text px-3 py-1.5 text-util font-bold text-bg transition-colors hover:bg-[#444]"
              >
                🛠 관리자 센터 (전체 주문/배송 관리) →
              </Link>
            )}
            <button
              type="button"
              onClick={() => { clearCart(); setCartOwner(null); void signOut({ callbackUrl: "/" }); }}
              className="rounded-xs border border-line px-3 py-1.5 text-util text-muted transition-colors hover:border-text hover:text-text"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 활동 요약 퀵 바 */}
        <div className="mt-6 grid grid-cols-3 divide-x divide-line border-t border-line pt-4 text-center">
          <Link href="/mypage#orders-section" className="group py-1">
            <div className="text-util text-muted group-hover:text-text">주문 내역</div>
            <div className="mt-1 font-mono text-heading font-bold text-text">{orders.length}</div>
          </Link>
          <Link href="/cart" className="group py-1">
            <div className="text-util text-muted group-hover:text-text">장바구니</div>
            <div className="mt-1 font-mono text-heading font-bold text-text">{cartCount}</div>
          </Link>
          <Link href="/wishlist" className="group py-1">
            <div className="text-util text-muted group-hover:text-text">위시리스트</div>
            <div className="mt-1 font-mono text-heading font-bold text-text">{wishCount}</div>
          </Link>
        </div>
      </div>

      {/* 기본 배송지 */}
      <section className="rounded-sm border border-line bg-bg p-6">
        <div className="border-b border-line pb-3">
          <h2 className="text-label font-bold text-text">기본 배송지</h2>
          <p className="mt-1 text-util text-muted">결제할 때 기본 배송지를 불러와 배송 정보를 빠르게 입력할 수 있습니다.</p>
        </div>
        <form onSubmit={saveDefaultAddress} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="text-util text-text">받는 분<input required value={defaultAddress.recipientName} onChange={(e) => setDefaultAddress((v) => ({ ...v, recipientName: e.target.value }))} className="mt-1 h-10 w-full border border-line px-3" /></label>
          <label className="text-util text-text">연락처<input required value={defaultAddress.phone} onChange={(e) => setDefaultAddress((v) => ({ ...v, phone: e.target.value }))} className="mt-1 h-10 w-full border border-line px-3" placeholder="010-1234-5678" /></label>
          <div className="text-util text-text md:col-span-2">
            <span>우편번호</span>
            <div className="mt-1 flex gap-2">
              <input readOnly value={defaultAddress.zonecode} className="h-10 flex-1 border border-line bg-soft px-3" placeholder="주소 검색으로 입력" />
              <button type="button" onClick={handleSearchDefaultAddress} className="h-10 shrink-0 border border-line px-4 text-util transition-colors hover:bg-soft hover:text-text">우편번호 검색</button>
            </div>
          </div>
          <label className="text-util text-text md:col-span-2">주소<input required readOnly value={defaultAddress.address} className="mt-1 h-10 w-full border border-line bg-soft px-3" placeholder="우편번호 검색으로 입력" /></label>
          <label className="text-util text-text md:col-span-2">상세 주소<input ref={addressDetailInputRef} value={defaultAddress.addressDetail} onChange={(e) => setDefaultAddress((v) => ({ ...v, addressDetail: e.target.value }))} className="mt-1 h-10 w-full border border-line px-3" placeholder="상세주소를 입력해 주세요" /></label>
          <div className="flex items-center justify-between gap-3 md:col-span-2">
            <p role="status" className="text-util text-muted">{profileMessage}</p>
            <button type="submit" disabled={profileSaving} className="h-10 bg-text px-5 text-nav font-medium text-bg transition-colors hover:bg-[#444] disabled:opacity-50">{profileSaving ? "저장 중…" : "기본 배송지 저장"}</button>
          </div>
        </form>
      </section>

      {/* 주문 내역 */}
      <section id="orders-section">
        <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
          <div>
            <h2 className="text-label font-bold text-text">ORDER HISTORY</h2>
            <p className="mt-0.5 text-util text-muted">결제된 주문 품목과 주문 상태를 확인하실 수 있습니다.</p>
          </div>
          <span className="text-util font-medium text-muted">총 {orders.length}건</span>
        </div>

        {error && (
          <div className="rounded-sm border border-line p-6 text-center text-body text-red-600">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="rounded-sm border border-line p-10 text-center">
            <p className="text-body text-muted">주문 내역이 없습니다.</p>
            <Link
              href="/products"
              className="mt-4 inline-flex h-10 items-center justify-center bg-text px-6 text-nav text-bg hover:bg-[#444]"
            >
              컬렉션 둘러보기
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
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

                    {/* 배송지 및 결제 정보 */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 border-t border-line pt-4 text-util">
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
        )}
      </section>

      {/* 계정 탈퇴 */}
      <section className="border-t border-line pt-8" aria-labelledby="account-deletion-heading">
        <button
          type="button"
          onClick={() => {
            setShowAccountDeletion((value) => !value);
            setAccountDeletionMessage("");
          }}
          className="text-util text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text"
        >
          계정 탈퇴
        </button>
        {showAccountDeletion && (
          <div className="mt-4 rounded-sm border border-line bg-soft p-5">
            <h2 id="account-deletion-heading" className="text-body font-bold text-text">계정 탈퇴 안내</h2>
            <div className="mt-3 space-y-2 text-util leading-relaxed text-muted">
              <p>탈퇴하면 로그인 정보, OAuth 연결 정보, 기본 배송지, 장바구니와 위시리스트가 즉시 삭제됩니다.</p>
              <p>주문·결제 기록은 전자상거래 관련 법령과 정산·분쟁 처리 의무에 따라 최대 5년간 보관될 수 있습니다. 주문 기록의 회원 연결과 배송 개인정보는 탈퇴 즉시 삭제·익명화되며, 관리자에게는 정산에 필요한 익명 주문 원장만 남습니다.</p>
              <p>소비자 불만·분쟁 처리 기록은 최대 3년간 보관될 수 있습니다. 처리 중인 결제 또는 배송 주문이 있으면 탈퇴가 완료되지 않습니다.</p>
            </div>
            <label className="mt-4 flex items-start gap-2 text-util text-text">
              <input
                type="checkbox"
                checked={accountDeletionAcknowledged}
                onChange={(event) => setAccountDeletionAcknowledged(event.target.checked)}
                className="mt-0.5"
              />
              <span>위 내용을 확인했고, 계정 탈퇴에 동의합니다.</span>
            </label>
            <label className="mt-3 block text-util text-text">
              확인을 위해 <span className="font-semibold">탈퇴</span>를 입력해 주세요.
              <input
                value={accountDeletionConfirmation}
                onChange={(event) => setAccountDeletionConfirmation(event.target.value)}
                className="mt-1 h-10 w-full border border-line bg-bg px-3"
                placeholder="탈퇴"
                autoComplete="off"
              />
            </label>
            {accountDeletionMessage && <p role="alert" className="mt-3 text-util text-red-600">{accountDeletionMessage}</p>}
            <button
              type="button"
              onClick={handleAccountDeletion}
              disabled={!accountDeletionAcknowledged || accountDeletionConfirmation !== "탈퇴" || accountDeletionLoading}
              className="mt-4 h-10 border border-red-300 px-4 text-util text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {accountDeletionLoading ? "탈퇴 처리 중…" : "계정 탈퇴하기"}
            </button>
          </div>
        )}
      </section>

    </div>
  );
}

export default function MyPage() {
  return (
    <div className="mx-auto max-w-[800px] px-3 pb-section pt-section">
      <div className="mb-8 flex items-baseline justify-between border-b border-line pb-4">
        <div>
          <h1 className="text-label font-bold tracking-tight text-text">MY PAGE</h1>
          <p className="mt-1 text-util text-muted">회원 정보 및 주문 내역을 확인하실 수 있습니다.</p>
        </div>
        <Link href="/products" className="text-util text-muted hover:text-text">
          ← 쇼핑 계속하기
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="py-24 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-text border-t-transparent" />
            <p className="mt-4 text-body text-muted">마이페이지 정보를 불러오고 있습니다...</p>
          </div>
        }
      >
        <MyPageContent />
      </Suspense>
    </div>
  );
}
