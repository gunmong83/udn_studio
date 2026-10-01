import type { Metadata } from "next";
import ProductBrowser from "@/src/components/products/ProductBrowser";

export const metadata: Metadata = { title: "PRODUCTS" };

// mujagi 목록 페이지(§2-2): h1 라벨(현재 카테고리명, 14px/700)은
// 클라이언트 필터 상태와 연동되어 ProductBrowser가 렌더한다.
//
// 파동5 B2(§3 — muosdkwtl1yu ②): PRODUCTS = 판매 상품 2건(kind="product" —
// 달력 2026·령 2027). 카테고리 브랜드탭 제거(브랜드탭은 PORTFOLIO로 이동 — §4.
// 판매 상품 2건에 필터 불요). 3열 그리드 2/3 채움·빈 셀 자연.
// searchParams 폐지(탭 제거로 ?category 무의미) — 페이지 정적화.
export default function ProductsPage() {
  return (
    <div className="w-full px-3 pb-section pt-section">
      <ProductBrowser kind="product" />
    </div>
  );
}
