import type { Metadata } from "next";
import { site } from "@/src/data/site";
import { NativeDeck } from "@/src/components/about/NativeDeck";

export const metadata: Metadata = { title: "ABOUT" };

// ABOUT — 파동8-② 3차: 장표 5종 HTML 네이티브 렌더(board mup972cufj56 · 대표 지시
// mup7lwvo20c3 "완전히 똑같게 그냥 직접 렌더링…다른 색들 안넣고 흰색 검은색 필요하면 약한
// 회색정도만 섞어서…폰트도 같은걸로 렌더하고 선들도 원본과 완전히 똑같게 렌더해야해."
// ·스펙 정본 docs/designer/wave10-native-render-spec.md AMEND본[2026-10-01 17:40·diff 6건]):
// - 장표 5종 전부 React/CSS(+SVG) 네이티브 렌더(NativeDeck — 슬라이드당 1컴포넌트+
//   프리미티브 3종·좌표 1440 기준 cqw 스케일·색 6토큰만·선 전부 1px·aboutDeck 원문 그대로).
// - 이미지 참조 전부 제거(introduce 5종·next/image/srcset — §7-4). 원본
//   introduce_{1..5}.jpg·recolored/·recolored-v2/ 자산은 전량 무수정 보존(가역성·대조 근거).
//   site.ts introduce 경로 데이터도 가역 보존(파동6 §8-1 방식 승계 — 복귀 각본 주석 참조).
// - philosophy(h1+p1/p2·파동6 재구성본)·하단 유틸 라인은 유지(스펙 §4 승계 — 문단이 서두).
// - 폰트: Pretendard 기존 스택 승계(jsdelivr CDN)·디돈 계층 Bodoni Moda 500
//   (next/font/google·SIL OFL 1.1 — 스펙 §4-1) 1종 추가.
// - 이식 승인 전 원본 site/ 무수정 — 본 파일은 격리 작업복사본(wave10-native) 구현분.

export default function AboutPage() {
  const [paragraph1, paragraph2] = site.philosophy.paragraphs;

  return (
    <div className="w-full pb-section">
      {/* 00_OVERVIEW 축 — philosophy 블록(불변·파동6 재구성본 — 스펙 §4 유지) */}
      <div className="px-3 pt-section">
        <h1 className="text-page font-medium text-text">
          {site.philosophy.heading}
        </h1>
        <p className="mt-3 text-body leading-[21.6px] text-text">{paragraph1}</p>
        <p className="mt-3 text-body leading-[21.6px] text-text">{paragraph2}</p>
      </div>

      {/* 파동8-② 3차 — 장표 5종 네이티브 렌더 시퀸스(원본 순서: 목차→내용·스펙 §7) */}
      <div className="px-3">
        <NativeDeck />
      </div>

      {/* 지도 블록 — 파동8-① 제거(대표 지시 mup4a2ypf775·2026-10-01): "파란색 ppt는 제거해도
          되겠어. 그 장표가 의미하는건 홈페이지 맵인데 이미 홈페이지가 구조가 바뀌어 버려서
          필요가 없어." — 파동6 §7 유지 권고의 재지정. 데이터(site.assets.homepageMap)는
          site.ts에 가역 보존·재지정 시 site.ts 주석의 각본대로 이 자리에 1블록 복귀.
          파동8-② v2 리컬러 장표 렌더 분도 가역 보존(복귀 시 RECOLORED_DECK 배열 재이식 —
          원본 page.tsx·wave8 이력·recolored-v2/ 자산 전량 보존). */}

      <p className="px-3 pt-section text-util text-muted">
        {site.name} · {site.services.join(" · ")}
      </p>
    </div>
  );
}
