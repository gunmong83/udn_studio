"use client";

import Image from "next/image";
import Link from "next/link";
import { clearCart, removeFromCart, setCartQty, useCart, useLang } from "@/src/lib/store";
import { getProduct } from "@/src/data/products";
import { uiCopy } from "@/src/lib/i18n";

// 장바구니 — localStorage mock(추가·삭제·합계). mujagi 문법:
// 라벨 14px/700 · 링크 밑줄 없음·색 hover(§5-4) · 합계 금액 12px/700(§2-2) ·
// 결제 버튼 btnNormal(1px #e8e8e8, §5-3 — disabled 목업).
// 가격은 원본 실측 유일 가격(UDN Calendar 2026 19,000 KRW)만 존재한다.

export default function CartPage() {
  const cart = useCart();
  const copy = uiCopy(useLang()).commerce;
  const lines = cart
    .map((item) => ({ item, product: getProduct(item.slug) }))
    .filter((l) => l.product);
  const total = lines.reduce(
    (sum, l) => sum + (l.product!.price ?? 0) * l.item.qty,
    0,
  );

  return (
    <div className="w-full px-3 pb-section pt-section">
      <h1 className="text-label font-bold text-text">{copy.title}</h1>
      {lines.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-body text-muted">{copy.empty}</p>
          <Link
            href="/products"
            className="mt-4 inline-block text-nav text-muted hover:text-text"
          >
            {copy.browse}
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {lines.map(({ item, product }) => (
              <li key={item.slug} className="flex items-center gap-4 py-5">
                <div className="relative aspect-[258/454] w-14 shrink-0 overflow-hidden">
                  <Image
                    src={product!.image}
                    alt={product!.title}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-util text-muted">{product!.category}</p>
                  <Link
                    href={`/products/${item.slug}`}
                    className="text-body font-semibold text-text hover:text-ink-strong"
                  >
                    {product!.title}
                  </Link>
                  <p className="mt-1 text-util text-muted">
                    {product!.priceLabel ?? "가격 미표기"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCartQty(item.slug, item.qty - 1)}
                    aria-label={copy.decrease}
                    className="flex h-7 w-7 items-center justify-center border border-line text-body hover:bg-soft"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-body">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => setCartQty(item.slug, item.qty + 1)}
                    aria-label={copy.increase}
                    className="flex h-7 w-7 items-center justify-center border border-line text-body hover:bg-soft"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.slug)}
                  className="ml-2 text-util text-muted hover:text-text"
                >
                  {copy.remove}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => clearCart()}
              className="text-nav text-muted hover:text-text"
            >
              {copy.clear}
            </button>
            <p className="text-body text-text">
              {copy.total}{" "}
              <span className="font-bold">{total.toLocaleString("ko-KR")} KRW</span>
            </p>
          </div>
          <Link href="/checkout" className="mt-6 block h-10 w-full bg-text text-center leading-10 text-nav text-bg">
            {copy.checkout}
          </Link>
          <p className="mt-3 text-center text-util text-muted">{copy.note}</p>
        </>
      )}
    </div>
  );
}
