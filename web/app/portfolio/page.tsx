import type { Metadata } from "next";
import ProductBrowser from "@/src/components/products/ProductBrowser";
import { WORK_CATEGORY_FILTERS } from "@/src/data/products";

export const metadata: Metadata = {
  title: "PORTFOLIO",
  description: "Studio UDN 포트폴리오",
  robots: { index: false, follow: true },
};

// 포트폴리오 목록(파동5 B1·§4 — muos3okq61ob) — ProductBrowser kind="work" 재사용:
// - 6작품(NeRyGe·TOV·BeBe·Flowing·YAHO·Menbal — kind="work")
// - 카테고리 브랜드탭 All/Total Branding/Exhibition Poster/Poster(Calendar 제외 —
//   캘린더는 PRODUCTS 소속)
// - 그리드 3열 237px 수준·열 간격 6px·행 간격 12px 유지(ProductBrowser 문법 그대로)
// - 카드 비율 = aspect-card 공용 토큰(§7 #11 — globals.css 1곳·3:4 확정)
// ?category= 초기값 지원(§1 드로어 서브 링크 /portfolio?category=… 대응).
export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const sp = await searchParams;
  const initial = (WORK_CATEGORY_FILTERS as readonly string[]).includes(
    sp.category ?? "",
  )
    ? sp.category
    : undefined;

  return (
    <div className="w-full px-3 pb-section pt-section">
      <ProductBrowser kind="work" initialCategory={initial} />
    </div>
  );
}
