"use client";

import Image from "@/src/components/ui/ProgressiveImage";
import type { Product } from "@/src/data/products";

export default function ProductOptions({
  product,
  options,
  selected,
  quantities,
  open,
  onToggle,
  onSelect,
  onRemove,
  onQuantityChange,
}: {
  product: Product;
  options: Product[];
  selected: Product[];
  quantities: Record<string, number>;
  open: boolean;
  onToggle: () => void;
  onSelect: (product: Product) => void;
  onRemove: (slug: string) => void;
  onQuantityChange: (slug: string, quantity: number) => void;
}) {
  if (!product.optionGroup || options.length < 2) return null;

  return (
    <section data-product-options className="mt-6 px-3" aria-labelledby="product-options-title">
      <h2 id="product-options-title" className="text-body font-semibold text-text">
        {product.optionGroup === "che-postcard-2026" ? "계절 선택" : "색상 · 사이즈 선택"}
      </h2>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="mt-3 flex w-full items-center justify-between border border-line-strong bg-bg px-3 py-3 text-left text-body transition-colors hover:bg-soft"
      >
        <span>{selected.length ? `${selected.length}개 옵션 선택됨` : "옵션을 선택해 주세요 (필수)"}</span>
        <span aria-hidden="true" className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>

      {open && (
        <div className="mt-2 border border-line bg-bg p-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {options.map((option) => {
              const isSelected = selected.some((item) => item.slug === option.slug);
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

      <div className="mt-3 space-y-2">
        {selected.map((option) => (
          <div key={option.slug} className="flex items-center gap-3 border border-line bg-soft/40 p-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-bg">
              <Image src={option.image} alt="" fill sizes="64px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body font-semibold text-text">{option.title}</p>
              <p className="mt-1 text-util text-muted">{option.optionLabel}</p>
              <div className="mt-2 inline-flex items-center border border-line-strong bg-bg">
                <button type="button" aria-label={`${option.optionLabel} 수량 줄이기`} onClick={() => onQuantityChange(option.slug, (quantities[option.slug] ?? 1) - 1)} className="h-7 w-7 text-body hover:bg-soft">−</button>
                <span className="min-w-7 text-center text-util">{quantities[option.slug] ?? 1}</span>
                <button type="button" aria-label={`${option.optionLabel} 수량 늘리기`} onClick={() => onQuantityChange(option.slug, (quantities[option.slug] ?? 1) + 1)} className="h-7 w-7 text-body hover:bg-soft">+</button>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <p className="text-body font-bold text-text">{((option.price ?? 0) * (quantities[option.slug] ?? 1)).toLocaleString("ko-KR")} KRW</p>
              <button type="button" onClick={() => onRemove(option.slug)} className="text-util text-muted underline hover:text-text">삭제</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
