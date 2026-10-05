import Hero from "@/src/components/home/Hero";
import ProductSlideshow from "@/src/components/home/ProductSlideshow";
import AboutBlock from "@/src/components/home/AboutBlock";

// 홈: 최신 판매 상품 자동 슬라이드 → ABOUT → 푸터.

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProductSlideshow />
      <AboutBlock />
    </>
  );
}
