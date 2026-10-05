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
  const [selected, setSelected] = useState<Product | null>(hasOptions ? null : product);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const purchaseProduct = selected ?? product;

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
        options={options}
        selected={selected}
        open={optionsOpen}
        onToggle={() => setOptionsOpen((open) => !open)}
        onSelect={(option) => {
          setSelected(option);
          setOptionsOpen(false);
        }}
      />
      <div className="mt-6">
        <ProductPurchaseBar
          product={purchaseProduct}
          requiresOption={hasOptions && !selected}
          onRequestOption={requestOption}
        />
      </div>
      <div className="px-3">
        <ProductActions product={purchaseProduct} accent />
      </div>
    </>
  );
}
