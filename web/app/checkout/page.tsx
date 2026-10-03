"use client";

import Link from "next/link";
import { useCart } from "@/src/lib/store";
import { getProduct } from "@/src/data/products";

export default function CheckoutPage() {
  const cart = useCart();
  const items = cart.map((item) => ({ item, product: getProduct(item.slug) })).filter((x) => x.product?.kind === "product");
  const total = items.reduce((sum, x) => sum + (x.product?.price ?? 0) * x.item.qty, 0);
  return <div className="w-full px-3 pb-section pt-section">
    <h1 className="text-label font-bold text-text">CHECKOUT</h1>
    {items.length === 0 ? <p className="mt-8 text-body text-muted">결제할 상품이 없습니다. <Link href="/products" className="underline">상품 보기</Link></p> : <div className="mx-auto mt-8 max-w-[520px] space-y-4">
      <p className="text-body text-muted">배송 정보와 결제 수단은 토스 결제창에서 안전하게 입력합니다.</p>
      <div className="border-y border-line py-4 text-body">결제 예정 금액 <strong className="float-right">{total.toLocaleString("ko-KR")} KRW</strong></div>
      <p className="text-util text-muted">결제 승인은 서버에서 주문 금액을 재검증한 뒤 처리됩니다.</p>
      <button type="button" disabled className="h-11 w-full bg-text text-nav text-bg disabled:opacity-40">토스 결제 준비 중</button>
    </div>}
  </div>;
}
