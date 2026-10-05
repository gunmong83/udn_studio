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
  const [selected, setSelected] = useState(product);

  return (
    <>
      <ProductOptions product={selected} options={options} onSelect={setSelected} />
      <div className="mt-6">
        <ProductPurchaseBar product={selected} />
      </div>
      <div className="px-3">
        <ProductActions product={selected} accent />
      </div>
    </>
  );
}
