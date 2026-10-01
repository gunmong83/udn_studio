"use client";

import { useState } from "react";
import type { Product } from "@/src/data/products";
import { addToCart, toggleWishlist, useWishlist } from "@/src/lib/store";

// 상세 액션 — mujagi 상세 버튼 셋 실측 (가이드 §5-3):
// - Add to bag(장바구니 담기): 337×40, 배경 #333, 텍스트 #fff, 13px/500, 1px #333, radius 0
// - Buy now(스마트스토어 구매): 337×40, 배경 #fff, 텍스트 #111, 1px #333, radius 0
// - 관심상품(위시): 40×40, transparent, 1px #333, 아이콘
// accent=true(GIFTING 페이지): Buy now를 #c0392b 배경으로 — 사이트 유일 브랜드 컬러는
// GIFTING 전용이며 mujagi mj-red 버튼에 대응(§3). 결제·인증 없음: localStorage mock.

export default function ProductActions({
  product,
  accent = false,
}: {
  product: Product;
  accent?: boolean;
}) {
  const wishlist = useWishlist();
  const wished = wishlist.includes(product.slug);
  const [added, setAdded] = useState(false);

  return (
    <div className="mt-6">
      {(product.price != null || product.link) && (
        <div className="flex flex-wrap gap-3">
          {product.price != null && (
            <button
              type="button"
              onClick={() => {
                addToCart(product.slug);
                setAdded(true);
                window.setTimeout(() => setAdded(false), 1200);
              }}
              className="h-10 w-[337px] max-w-full border border-line-strong bg-text text-nav font-medium text-bg"
            >
              {added ? "장바구니에 담았습니다" : "장바구니 담기"}
            </button>
          )}
          {product.link && (
            <a
              href={product.link}
              target="_blank"
              rel="noopener noreferrer"
              className={
                accent
                  ? "flex h-10 w-[337px] max-w-full items-center justify-center border border-accent bg-accent text-nav font-medium text-bg"
                  : "flex h-10 w-[337px] max-w-full items-center justify-center border border-line-strong bg-bg text-nav font-medium text-ink-strong hover:bg-soft"
              }
            >
              네이버 스마트스토어 구매
            </a>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => toggleWishlist(product.slug)}
        aria-label={wished ? "위시리스트에서 제거" : "위시리스트에 추가"}
        aria-pressed={wished}
        className="mt-3 flex h-10 w-10 items-center justify-center border border-line-strong bg-bg text-text"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={wished ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>

      <p className="mt-3 text-util text-muted">
        장바구니·위시리스트는 목업입니다(로컬 검수용 — 실제 결제 없음).
      </p>
    </div>
  );
}
