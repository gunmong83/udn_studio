"use client";

import Image from "next/image";
import type { Product } from "@/src/data/products";

export default function ProductOptions({
  product,
  options,
  onSelect,
}: {
  product: Product;
  options: Product[];
  onSelect: (product: Product) => void;
}) {
  if (!product.optionGroup || options.length < 2) return null;

  return (
    <section className="mt-6 px-3" aria-labelledby="product-options-title">
      <h2 id="product-options-title" className="text-body font-semibold text-text">
        색상 · 사이즈 선택
      </h2>
      <p className="mt-1 text-util text-muted">옵션을 선택하면 아래에 선택 상품이 추가됩니다.</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((option) => {
          const selected = option.slug === product.slug;
          return (
            <button
              key={option.slug}
              type="button"
              onClick={() => onSelect(option)}
              aria-pressed={selected}
              className={`border px-3 py-2 text-left text-util transition-colors ${
                selected
                  ? "border-text bg-text text-bg hover:bg-[#444]"
                  : "border-line text-text hover:bg-soft"
              }`}
            >
              <span className="block font-semibold">{option.optionLabel}</span>
              <span className={selected ? "text-bg/80" : "text-muted"}>
                {option.priceLabel}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3 border border-line bg-soft/40 p-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-bg">
          <Image src={product.image} alt="" fill sizes="64px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-semibold text-text">{product.title}</p>
          <p className="mt-1 text-util text-muted">{product.optionLabel}</p>
        </div>
        <p className="shrink-0 text-body font-bold text-text">{product.priceLabel}</p>
      </div>
    </section>
  );
}
