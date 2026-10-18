import type { Metadata } from "next";
import ProductSlideshow from "@/src/components/home/ProductSlideshow";
import AboutBlock from "@/src/components/home/AboutBlock";
import { site } from "@/src/data/site";

// 홈: 최신 판매 상품 자동 슬라이드 → ABOUT → 푸터.
//
// SEO canonical(2026-10-18): 루트 레이아웃의 canonical "/" 을 제거했으므로 홈은 여기서
// 자기 경로를 선언한다. 하위 페이지는 각자 자기 경로를 선언한다.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// 문서 H1 — 브랜드명. 시각 변화 0(sr-only). 이전에는 섹션 라벨 "ABOUT"이 문서 H1이었다
// (AboutBlock에서 h2로 내림).
export default function HomePage() {
  return (
    <>
      <h1 className="sr-only">
        {site.name} | {site.nameKo} — {site.tagline}
      </h1>
      <ProductSlideshow />
      <AboutBlock />
    </>
  );
}
