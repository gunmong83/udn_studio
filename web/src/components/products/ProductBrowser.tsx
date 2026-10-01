"use client";

import { useState } from "react";
import {
  CATEGORY_FILTERS,
  WORK_CATEGORY_FILTERS,
  products,
  type CategoryFilter,
} from "@/src/data/products";
import ProductCard from "./ProductCard";

// 상품 목록 — mujagi 목록 실측 (가이드 §2-2·§4-2):
// - h1 라벨: 현재 카테고리명 14px/700(§2-2 "All" — mujagi 목록 h1)
// - 브랜드탭: 13px, 비활성 400/#aaa, 활성 600/#333, line-height 44px(§2-2)
// - 그리드: 3열, 열 간격 6px, 행 간격 12px(§4-2) — 카드 237px 수준
// 카테고리 클라이언트 필터(메가메뉴·링크의 ?category= 초기값 지원).
//
// 파동5 B1(§4·muos3okq61ob): kind prop — "work"=PORTFOLIO(6작품·Calendar 제외 탭),
// "product"=PRODUCTS(B2 — 판매 상품 2건·**탭 제거**: 브랜드탭은 PORTFOLIO로 이동·필터 불요),
// undefined=전체(호환).

function normalizeCategory(
  value: string | undefined,
  filters: readonly string[],
): CategoryFilter {
  return filters.includes(value ?? "") ? (value as CategoryFilter) : "All";
}

export default function ProductBrowser({
  initialCategory,
  kind,
}: {
  initialCategory?: string;
  kind?: "product" | "work";
}) {
  const filters = kind === "work" ? WORK_CATEGORY_FILTERS : CATEGORY_FILTERS;
  const showTabs = kind !== "product";
  const pool = kind
    ? products.filter((p) => p.kind === kind)
    : products;
  const [filter, setFilter] = useState<CategoryFilter>(
    normalizeCategory(initialCategory, filters),
  );
  const visible =
    !showTabs || filter === "All"
      ? pool
      : pool.filter((p) => p.category === filter);

  return (
    <div>
      <h1 className="text-label font-bold text-text">
        {filter === "All" || !showTabs ? "All" : filter}
      </h1>
      {showTabs && (
        <div className="mt-2 flex flex-wrap gap-6">
          {filters.map((c) => {
            const active = filter === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setFilter(c)}
                aria-pressed={active}
                className={
                  active
                    ? "flex h-11 items-center text-nav font-semibold text-text"
                    : "flex h-11 items-center text-nav font-normal text-tab hover:text-text"
                }
              >
                {c === "All" ? "ALL" : c}
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-3 grid grid-cols-3 gap-x-gutter gap-y-row">
        {visible.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
      {visible.length === 0 && (
        <p className="py-16 text-center text-body text-muted">
          해당 카테고리의 작업이 없습니다.
        </p>
      )}
    </div>
  );
}
