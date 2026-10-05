"use client";

import Image from "next/image";
import type { Product } from "@/src/data/products";

export default function ProductOptions({
  product,
  options,
  selected,
  open,
  onToggle,
  onSelect,
}: {
  product: Product;
  options: Product[];
  selected: Product | null;
  open: boolean;
  onToggle: () => void;
  onSelect: (product: Product) => void;
}) {
  if (!product.optionGroup || options.length < 2) return null;

  return (
    <section data-product-options className="mt-6 px-3" aria-labelledby="product-options-title">
      <h2 id="product-options-title" className="text-body font-semibold text-text">
        색상 · 사이즈 선택
      </h2>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="mt-3 flex w-full items-center justify-between border border-line-strong bg-bg px-3 py-3 text-left text-body transition-colors hover:bg-soft"
      >
        <span>{selected ? `${selected.optionLabel} · ${selected.priceLabel}` : "옵션을 선택해 주세요 (필수)"}</span>
        <span aria-hidden="true" className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>

      {open && (
        <div className="mt-2 border border-line bg-bg p-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {options.map((option) => {
              const isSelected = option.slug === selected?.slug;
              return (
                <button
                  key={option.slug}
                  type="button"
                  onClick={() => onSelect(option)}
                  aria-pressed={isSelected}
                  className={`border px-3 py-2 text-left text-util transition-colors ${
                    isSelected
                      ? "border-text bg-text text-bg hover:bg-[#444]"
                      : "border-line text-text hover:bg-soft"
                  }`}
                >
                  <span className="block font-semibold">{option.optionLabel}</span>
                  <span className={isSelected ? "text-bg/80" : "text-muted"}>
                    {option.priceLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selected && (
        <div className="mt-3 flex items-center gap-3 border border-line bg-soft/40 p-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-bg">
            <Image src={selected.image} alt="" fill sizes="64px" className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-body font-semibold text-text">{selected.title}</p>
            <p className="mt-1 text-util text-muted">{selected.optionLabel}</p>
          </div>
          <p className="shrink-0 text-body font-bold text-text">{selected.priceLabel}</p>
        </div>
      )}
    </section>
  );
}
