"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { removeFromCart, setCartQty, useCart } from "@/src/lib/store";
import { getProduct } from "@/src/data/products";
import { requestTossPayment } from "@/src/lib/toss";
import { FREE_SHIPPING_THRESHOLD, getShippingFee } from "@/src/lib/shipping";

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

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const cart = useCart();

  const [recipientName, setRecipientName] = useState(session?.user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [zonecode, setZonecode] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"카드" | "계좌이체">("카드");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const addressDetailInputRef = useRef<HTMLInputElement>(null);

  const items = cart
    .map((item) => ({ item, product: getProduct(item.slug) }))
    .filter(
      (entry): entry is { item: typeof entry.item; product: NonNullable<typeof entry.product> } =>
        Boolean(entry.product && entry.product.kind === "product" && entry.product.price)
    );

  const total = items.reduce((sum, x) => sum + (x.product.price ?? 0) * x.item.qty, 0);
  const shippingFee = getShippingFee(total);
  const finalTotal = total + shippingFee;

  const handleSearchAddress = async () => {
    try {
      await loadDaumPostcodeScript();
      if (!window.daum?.Postcode) {
        throw new Error("다음 주소 검색 서비스를 실행할 수 없습니다.");
      }

      new window.daum.Postcode({
        oncomplete: (data: DaumPostcodeData) => {
          let fullAddr = data.roadAddress || data.jibunAddress;
          let extraAddr = "";

          if (data.bname !== "" && /[동|로|가]$/g.test(data.bname)) {
            extraAddr += data.bname;
          }
          if (data.buildingName !== "" && data.apartment === "Y") {
            extraAddr += extraAddr !== "" ? `, ${data.buildingName}` : data.buildingName;
          }
          if (extraAddr !== "") {
            fullAddr += ` (${extraAddr})`;
          }

          setZonecode(data.zonecode);
          setAddress(fullAddr);

          // 상세 주소 입력창으로 포커스 이동
          setTimeout(() => {
            addressDetailInputRef.current?.focus();
          }, 100);
        },
      }).open();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "주소 검색을 불러오지 못했습니다.";
      alert(msg);
    }
  };

  const loadDefaultAddress = async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.profile?.defaultAddress) {
        throw new Error("마이페이지에서 기본 배송지를 먼저 등록해주세요.");
      }
      const profile = data.profile;
      setRecipientName(profile.defaultRecipientName ?? profile.name ?? "");
      setPhone(profile.defaultPhone ?? profile.phone ?? "");
      setZonecode(profile.defaultZonecode ?? "");
      setAddress(profile.defaultAddress ?? "");
      setAddressDetail(profile.defaultAddressDetail ?? "");
      setErrorMessage("기본 배송지를 불러왔습니다.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "기본 배송지를 불러오지 못했습니다.");
    }
  };

  if (status === "loading") {
    return (
      <div className="w-full px-3 pb-section pt-section text-center">
        <p className="text-body text-muted">사용자 정보를 확인하고 있습니다...</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="w-full px-3 pb-section pt-section">
        <h1 className="text-label font-bold text-text">CHECKOUT</h1>
        <div className="mx-auto mt-12 max-w-[480px] rounded-sm border border-line p-6 text-center">
          <p className="text-body font-semibold text-text">로그인이 필요한 서비스입니다.</p>
          <p className="mt-2 text-util text-muted">
            주문 내역 관리 및 안전한 결제를 위해 로그인 후 이용해주세요.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/login?callbackUrl=/checkout"
              className="flex h-11 w-full items-center justify-center bg-text text-nav font-medium text-bg transition-colors hover:bg-[#444]"
            >
              로그인하고 계속하기
            </Link>
            <Link
              href="/cart"
              className="flex h-11 w-full items-center justify-center border border-line text-nav text-text transition-colors hover:bg-soft"
            >
              장바구니로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full px-3 pb-section pt-section">
        <h1 className="text-label font-bold text-text">CHECKOUT</h1>
        <div className="py-16 text-center">
          <p className="text-body text-muted">결제할 상품이 장바구니에 없습니다.</p>
          <Link
            href="/products"
            className="mt-4 inline-block text-nav text-muted underline hover:text-text"
          >
            PRODUCTS 둘러보기
          </Link>
        </div>
      </div>
    );
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedName = recipientName.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();

    if (!trimmedName) {
      setErrorMessage("받으시는 분 성함을 입력해주세요.");
      return;
    }
    if (!trimmedPhone || trimmedPhone.length < 9) {
      setErrorMessage("올바른 연락처(전화번호)를 입력해주세요.");
      return;
    }
    if (!trimmedAddress) {
      setErrorMessage("배송지 주소를 검색하여 입력해주세요.");
      return;
    }

    setLoading(true);
    let createdOrderId: string | null = null;

    try {
      // 1. 서버에 주문 생성 (금액 및 재고 서버 검증)
      const fullDeliveryAddress = zonecode ? `(${zonecode}) ${trimmedAddress}` : trimmedAddress;
      const orderPayload = {
        recipientName: trimmedName,
        phone: trimmedPhone,
        address: fullDeliveryAddress,
        addressDetail: addressDetail.trim() || undefined,
        items: items.map((x) => ({
          productId: x.product.slug,
          quantity: x.item.qty,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.order?.id) {
        if (res.status === 401) {
          throw new Error("로그인 세션이 만료되었습니다. 다시 로그인한 후 결제해주세요.");
        }
        throw new Error(data?.error || "주문 생성에 실패했습니다. 다시 시도해주세요.");
      }

      const createdOrder = data.order;
      createdOrderId = createdOrder.id;
      const orderTitle =
        items.length === 1
          ? items[0].product.title
          : `${items[0].product.title} 외 ${items.length - 1}건`;

      // 2. 토스페이먼츠 결제창 호출
      await requestTossPayment({
        method: paymentMethod,
        amount: createdOrder.totalAmount,
        orderId: createdOrder.id,
        orderName: orderTitle,
        customerName: trimmedName,
        customerEmail: session.user?.email ?? undefined,
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
      });
    } catch (err: unknown) {
      if (createdOrderId) {
        fetch(`/api/orders?id=${createdOrderId}`, { method: "DELETE" }).catch(() => {});
      }
      const msg =
        err instanceof Error ? err.message : "결제 진행 중 오류가 발생했습니다.";
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-3 pb-section pt-section">
      <h1 className="text-label font-bold text-text">CHECKOUT</h1>

      <div className="mx-auto mt-8 max-w-[680px]">
        {/* 주문 상품 요약 */}
        <section className="border-b border-line pb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-nav font-semibold text-text">주문 상품 ({items.length}개)</h2>
            <Link href="/cart" className="text-util text-muted hover:text-text">
              장바구니 전체보기 →
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {items.map(({ item, product }) => (
              <li
                key={item.slug}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="relative aspect-card w-12 shrink-0 overflow-hidden bg-soft">
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body font-medium text-text">{product.title}</p>
                    <p className="text-util text-muted">
                      {product.price?.toLocaleString("ko-KR")} KRW
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pl-15 sm:justify-end sm:pl-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={item.qty <= 1}
                      onClick={() => setCartQty(item.slug, item.qty - 1)}
                      aria-label="수량 감소"
                      className="flex h-7 w-7 items-center justify-center border border-line text-body text-text transition-colors hover:bg-soft disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-util font-medium">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => setCartQty(item.slug, item.qty + 1)}
                      aria-label="수량 증가"
                      className="flex h-7 w-7 items-center justify-center border border-line text-body text-text transition-colors hover:bg-soft"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.slug)}
                      className="ml-2 text-util text-muted transition-colors hover:text-red-600"
                    >
                      삭제
                    </button>
                  </div>

                  <p className="min-w-[90px] text-right text-body font-semibold text-text">
                    {((product.price ?? 0) * item.qty).toLocaleString("ko-KR")} KRW
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 배송지 및 주문자 정보 입력 */}
        <form onSubmit={handlePayment} className="mt-6 space-y-6">
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-nav font-semibold text-text">배송 정보</h2>
              <button type="button" onClick={() => void loadDefaultAddress()} className="border border-line px-3 py-1.5 text-util text-text transition-colors hover:bg-soft">
                기본 배송지 불러오기
              </button>
            </div>

            <div>
              <label htmlFor="recipientName" className="block text-util font-medium text-text">
                받는 분 성함 <span className="text-red-500">*</span>
              </label>
              <input
                id="recipientName"
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="홍길동"
                className="mt-1 h-11 w-full border border-line px-3 text-body outline-none focus:border-text"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-util font-medium text-text">
                연락처 <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-1234-5678"
                className="mt-1 h-11 w-full border border-line px-3 text-body outline-none focus:border-text"
              />
            </div>

            {/* 주소 검색 연동 */}
            <div>
              <label htmlFor="address" className="block text-util font-medium text-text">
                배송 주소 (도로명 / 지번) <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex gap-2">
                {zonecode && (
                  <input
                    type="text"
                    readOnly
                    value={zonecode}
                    placeholder="우편번호"
                    className="h-11 w-24 border border-line bg-soft px-3 text-center text-body font-mono text-text outline-none"
                  />
                )}
                <input
                  id="address"
                  type="text"
                  required
                  readOnly
                  value={address}
                  onClick={handleSearchAddress}
                  placeholder="주소 검색 버튼을 눌러 도로명 또는 지번을 검색하세요"
                  className="h-11 flex-1 cursor-pointer border border-line bg-soft/40 px-3 text-body outline-none transition-colors hover:bg-soft focus:border-text"
                />
                <button
                  type="button"
                  onClick={handleSearchAddress}
                  className="h-11 shrink-0 border border-line bg-text px-4 text-nav font-medium text-bg transition-colors hover:bg-[#444]"
                >
                  주소 검색
                </button>
              </div>
            </div>

            {/* 상세 주소 입력 */}
            <div>
              <label htmlFor="addressDetail" className="block text-util font-medium text-text">
                상세 주소 (동, 호수 등)
              </label>
              <input
                id="addressDetail"
                ref={addressDetailInputRef}
                type="text"
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                placeholder="상세 주소를 입력해주세요 (예: 101동 1204호)"
                className="mt-1 h-11 w-full border border-line px-3 text-body outline-none focus:border-text"
              />
            </div>
          </section>

          {/* 결제 수단 선택 */}
          <section className="border-t border-line pt-6">
            <h2 className="text-nav font-semibold text-text">결제 수단</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(["카드", "계좌이체"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`h-11 border text-util font-medium transition-colors ${
                    paymentMethod === method
                      ? "border-text bg-text text-bg"
                      : "border-line text-text hover:bg-soft"
                  }`}
                >
                  {method === "카드" ? "신용 / 체크카드" : method}
                </button>
              ))}
            </div>
            <p className="mt-2 text-util text-muted">
              * 토스페이, 카카오페이, 네이버페이, 삼성페이 등 간편결제는 [신용 / 체크카드] 선택 후 결제창에서 이용 가능합니다.
            </p>
          </section>

          {/* 최종 결제 금액 및 결제 버튼 */}
          <section className="border-t border-line pt-6">
            <div className="flex items-center justify-between text-body">
              <span className="text-muted">총 상품 금액</span>
              <span>{total.toLocaleString("ko-KR")} KRW</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-body">
              <span className="text-muted">배송비</span>
              <span>{shippingFee === 0 ? "무료" : `${shippingFee.toLocaleString("ko-KR")} KRW`}</span>
            </div>
            <p className="mt-1 text-right text-util text-muted">
              {shippingFee === 0
                ? "50만원 이상 구매로 무료 배송이 적용되었습니다."
                : `상품 합계 ${FREE_SHIPPING_THRESHOLD.toLocaleString("ko-KR")}원 이상 구매 시 무료 배송`}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-nav font-bold text-text">
              <span>최종 결제 금액</span>
              <span className="text-lg">{finalTotal.toLocaleString("ko-KR")} KRW</span>
            </div>

            {errorMessage && (
              <p role="alert" className="mt-4 text-util font-medium text-red-600">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex h-12 w-full items-center justify-center bg-text text-nav font-medium text-bg transition-colors transition-transform hover:bg-[#444] active:scale-[.99] disabled:opacity-50"
            >
              {loading ? "결제창을 여는 중…" : `${finalTotal.toLocaleString("ko-KR")} KRW 토스 결제하기`}
            </button>

            <p className="mt-3 text-center text-util text-muted">
              토스페이먼츠 보안 결제창을 통해 안전하게 암호화되어 결제됩니다.
            </p>
          </section>
        </form>
      </div>
    </div>
  );
}
