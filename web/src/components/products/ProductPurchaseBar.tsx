"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/src/data/products";
import { addToCart } from "@/src/lib/store";
import { useSession } from "next-auth/react";

export default function ProductPurchaseBar({
  products,
  quantities,
  requiresOption = false,
  onRequestOption,
}: {
  products: Product[];
  quantities?: Record<string, number>;
  requiresOption?: boolean;
  onRequestOption?: () => void;
}) {
  const [added, setAdded] = useState(false);
  const { data: session } = useSession();

  if (!products.length || products.some((product) => product.price == null)) return null;

  const requestOption = () => {
    onRequestOption?.();
  };

  const addProduct = () => {
    if (requiresOption) {
      requestOption();
      return;
    }
    products.forEach((product) => {
      const quantity = quantities?.[product.slug] ?? 1;
      addToCart(product.slug, quantity);
      if (session?.user?.id) {
        void fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.slug, title: product.title, price: product.price, quantity }),
        }).catch((error) => console.error("[cart-sync] 장바구니 추가 저장 실패", error));
      }
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-canvas border-y border-line bg-bg/95 px-3 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-sm"
    >
      <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={addProduct}
        className="h-10 min-w-0 border border-line-strong bg-text px-2 text-nav font-medium text-bg transition-colors hover:bg-[#444] active:scale-[.99]"
      >
        {added ? "담았습니다 ✓" : "장바구니 담기"}
      </button>
      {requiresOption ? (
        <button
          type="button"
          onClick={requestOption}
          className="flex h-10 min-w-0 items-center justify-center border border-line-strong bg-bg px-2 text-nav font-medium text-ink-strong transition-colors hover:bg-soft active:scale-[.99]"
        >
          옵션 선택 후 결제하기
        </button>
      ) : (
        <Link
          href="/checkout"
          onClick={addProduct}
          className="flex h-10 min-w-0 items-center justify-center border border-line-strong bg-bg px-2 text-nav font-medium text-ink-strong transition-colors hover:bg-soft active:scale-[.99]"
        >
          결제하기
        </Link>
      )}
      </div>
    </div>
  );
}
