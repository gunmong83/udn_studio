import Hero from "@/src/components/home/Hero";
import JournalSection from "@/src/components/home/JournalSection";
import AboutBlock from "@/src/components/home/AboutBlock";

// 홈 — mujagi 3단 준거(가이드 §1-2, 파동4 §① 축소): 히어로 1장(텍스트 없음)
// → JOURNAL 카드 1장 → ABOUT(철학 원문 2문장+CTA) → 푸터.
// 유틸바·헤더·푸터는 layout.tsx. 파동4 이전: 히어로+태그라인·JOURNAL 3장+CTA·
// ABOUT+이미지 2장 — 데이터는 전부 유지(컴포넌트 가역 라벨 참조).

export default function HomePage() {
  return (
    <>
      <Hero />
      <JournalSection />
      <AboutBlock />
    </>
  );
}
