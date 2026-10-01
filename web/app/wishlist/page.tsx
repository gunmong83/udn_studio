"use client";

import Link from "next/link";
import { toggleWishlist, useWishlist } from "@/src/lib/store";
import { getProduct } from "@/src/data/products";
import ProductCard from "@/src/components/products/ProductCard";

// 위시리스트 — localStorage mock(추가·제거). mujagi 문법:
// 라벨 14px/700 · 상품 그리드 3열·거터 6px·행 12px(§4-2) · 카드 §5-2(ProductCard 재사용).

export default function WishlistPage() {
  const slugs = useWishlist();
  const items = slugs.map(getProduct).filter(Boolean);

  return (
    <div className="w-full px-3 pb-section pt-section">
      <h1 className="text-label font-bold text-text">WISHLIST</h1>
      {items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-body text-muted">위시리스트가 비어 있습니다.</p>
          <Link
            href="/products"
            className="mt-4 inline-block text-nav text-muted hover:text-text"
          >
            PRODUCTS 둘러보기
          </Link>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-x-gutter gap-y-row">
          {items.map(
            (product) =>
              product && (
                <div key={product.slug}>
                  <ProductCard product={product} />
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.slug)}
                    className="mt-2 text-util text-muted hover:text-text"
                  >
                    위시리스트에서 제거
                  </button>
                </div>
              ),
          )}
        </div>
      )}
    </div>
  );
}
