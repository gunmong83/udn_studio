"use client";

import Link from "next/link";

// 메가 드로어 — mujagi #aside 실측 재현 (스타일 가이드 §4-4).
// ☰ 클릭으로만 열림(호버 아님·실측 확인). dim 없음. fixed 391px·h600·z 10502.
// 파동4 §④ — 캔버스 중앙 정렬 전환: left = max(0px, 50% − 400px)
// (캔버스 좌단 50%−375px 에서 −25px 오버hang = mujagi 드로어 기하 유지.
// 1440 뷰포트 → x=320 · 800 이하 → 0 클램프. 가역: left-0 으로 스왑).
// 1차: 15px/400/#111/ls-0.15px/padding 20px 24px · 서브: 13px/400/#666/padding 13px 24px 13px 36px.
// 파동5 B3(§1·D-2 amend): 1차 스튜디오 UDN(서브 = PORTFOLIO 카테고리 — Calendar 제외:
// 캘린더 2종은 PRODUCTS 소속 → WORK_CATEGORY_FILTERS·링크 /portfolio?category=) +
// 1차 PRODUCTS/PORTFOLIO/JOURNAL/ABOUT(서브 없음). GIFTING 블록 제거 —
// accent #c0392b는 구매 CTA(§3)로 이동(D-3 갱신 — 구매 CTA 1곳만).

export default function MegaDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <aside
      id="aside"
      aria-label="전체 메뉴"
      className="fixed left-[max(0px,calc(50%_-_400px))] top-[52px] z-[10502] h-[calc(100dvh-52px)] w-[391px] max-w-[calc(100vw-16px)] overflow-y-auto bg-bg shadow-lg"
    >
      {/* PRODUCTS · PORTFOLIO · ABOUT */}
      <Link
        href="/products"
        onClick={onClose}
        className="block px-6 py-5 text-drawer font-normal text-ink-strong hover:font-medium"
      >
        PRODUCTS
      </Link>
      <Link
        href="/portfolio"
        onClick={onClose}
        className="block px-6 py-5 text-drawer font-normal text-ink-strong hover:font-medium"
      >
        PORTFOLIO
      </Link>
      <Link
        href="/about"
        onClick={onClose}
        className="block px-6 py-5 text-drawer font-normal text-ink-strong hover:font-medium"
      >
        ABOUT
      </Link>
    </aside>
  );
}
