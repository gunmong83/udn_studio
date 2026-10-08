"use client";

import { useState } from "react";
import type { Product } from "@/src/data/products";
import ProductActions from "./ProductActions";
import ProductOptions from "./ProductOptions";
import ProductPurchaseBar from "./ProductPurchaseBar";

export default function ProductDetailInteractive({
  product,
  options,
}: {
  product: Product;
  options: Product[];
}) {
  const hasOptions = options.length >= 2 && Boolean(product.optionGroup);
  const orderedOptions = [...options].sort((a, b) => {
    const order = [
      "rok-masking-tape-purple",
      "rok-masking-tape-nordic-blue",
      "rok-masking-tape-peach",
      "rok-masking-tape-green",
      "che-postcard-2026-spring",
      "che-postcard-2026-summer",
      "che-postcard-2026-autumn",
      "che-postcard-2026-winter",
    ];
    return order.indexOf(a.slug) - order.indexOf(b.slug);
  });
  const [selected, setSelected] = useState<Product[]>(hasOptions ? [] : [product]);
  const [quantities, setQuantities] = useState<Record<string, number>>({ [product.slug]: 1 });
  const [optionsOpen, setOptionsOpen] = useState(false);
  const purchaseProduct = selected.length ? selected : [product];

  const requestOption = () => {
    setOptionsOpen(true);
    window.requestAnimationFrame(() => {
      document.querySelector("[data-product-options]")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  return (
    <>
      <ProductOptions
        product={product}
        options={orderedOptions}
        selected={selected}
        quantities={quantities}
        open={optionsOpen}
        onToggle={() => setOptionsOpen((open) => !open)}
        onSelect={(option) => {
          setSelected((current) => current.some((item) => item.slug === option.slug) ? current : [...current, option]);
          setQuantities((current) => ({ ...current, [option.slug]: current[option.slug] ?? 1 }));
          setOptionsOpen(true);
        }}
        onRemove={(slug) => setSelected((current) => current.filter((item) => item.slug !== slug))}
        onQuantityChange={(slug, quantity) => setQuantities((current) => ({ ...current, [slug]: Math.max(1, Math.min(99, quantity)) }))}
      />
      <div className="mt-6">
        <ProductPurchaseBar
          products={purchaseProduct}
          quantities={quantities}
          requiresOption={hasOptions && !selected.length}
          onRequestOption={requestOption}
        />
      </div>
      <div className="px-3">
        <ProductActions product={purchaseProduct[0]} accent />
      </div>
    </>
  );
}
