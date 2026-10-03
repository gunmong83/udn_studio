import Hero from "@/src/components/home/Hero";
import PortfolioSlideshow from "@/src/components/home/PortfolioSlideshow";
import AboutBlock from "@/src/components/home/AboutBlock";

// 홈: 최신 판매 상품 → 전체 포트폴리오 자동 슬라이드 → ABOUT → 푸터.
// 판매 상품과 작품 축을 분리해 첫 화면에서는 현재 판매 상품을 강조하고,
// 포트폴리오는 등록된 work 전건을 5초 간격으로 순환한다.

export default function HomePage() {
  return (
    <>
      <Hero />
      <PortfolioSlideshow />
      <AboutBlock />
    </>
  );
}
