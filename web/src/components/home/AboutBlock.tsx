import Link from "next/link";
import { site } from "@/src/data/site";

// 홈 ABOUT 블록 — mujagi #MainSRP 실측 (가이드 §1-2·§2-2·§4-1·§5-3):
// - 라벨 h1 "ABOUT" 14px/700 · 섹션 상단 패딩 30px
// - 철학 본문: 12px/400, line-height 21.6px(1.8) — 원문 그대로
// - CTA 태그: 11px/#999, 1px #e8e8e8, h20, px10
// 파동4 §①-11·12 — introduce_1·homepage_map 이미지 2장 제거(가역):
// mujagi 홈 ABOUT은 텍스트+CTA만. site.ts introduce·homepageMap 데이터는 유지 —
// /about 페이지에서 5장+맵 전량 표시(변동 없음). 재활성화 시 Image import와
// aspect-[3579/2551]·aspect-[3508/2480] 블록 복원.
export default function AboutBlock() {
  return (
    <section className="w-full px-3 pt-section">
      <h1 className="text-label font-bold text-text">ABOUT</h1>

      <div className="mt-3 space-y-2 text-body leading-[21.6px] text-text">
        {site.philosophy.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      <div className="mb-section mt-section">
        <Link
          href="/about"
          className="inline-flex h-5 items-center border border-line px-2.5 text-cta text-muted hover:text-text"
        >
          스튜디오 더 알아보기
        </Link>
      </div>
    </section>
  );
}
