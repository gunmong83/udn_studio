"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/src/lib/store";
import { uiCopy } from "@/src/lib/i18n";

// 메인 메뉴바 — mujagi #menu_line 실측 (가이드 §4-3).
// 높이 51px · static(스크롤아웃 — sticky는 유틸바만) · 항목 13px.
// 비활성 #ccc/500 → 활성 #333/600 (색+웨이트 스왑 — 밑줄 없음).
// 메뉴바 726px in 750px 캔버스: px-3 + 4개 항목 justify-between.
// 서브 네비게이션은 드로어(§4-4)와 목록 페이지 브랜드탭이 담당 — 드롭다운 없음.
// 파동5 B3(§1·D-2 amend): 5항 → 4축 — COLLECTIONS·GIFTING 제거·PORTFOLIO 추가.
// 4항 justify-between 유지(간격 자연 확대 — mujagi 문법 위반 아님·검수 육안 확인).
const MENU = [
  { key: "products", href: "/products" },
  { key: "portfolio", href: "/portfolio" },
  { key: "journal", href: "/journal" },
  { key: "about", href: "/about" },
] as const;

export default function Header() {
  const pathname = usePathname();
  const lang = useLang();
  const copy = uiCopy(lang);

  return (
    <nav className="flex h-[51px] items-center justify-between px-3">
      {MENU.map((m) => {
        const active =
          pathname === m.href || pathname.startsWith(m.href + "/");
        return (
          <Link
            key={m.href}
            href={m.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "text-nav font-semibold text-text"
                : "text-nav font-medium text-idle hover:font-semibold hover:text-text"
            }
          >
            {copy.nav[m.key]}
          </Link>
        );
      })}
    </nav>
  );
}
