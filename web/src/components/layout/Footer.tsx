import Link from "next/link";
import { site } from "@/src/data/site";

// 푸터 — mujagi 푸터 실측 (가이드 §5-5):
// padding 30px 0 80px (파동4 §⑤-3 — px-3 수평 패딩 제거, 0 기준) ·
// 4콘텐츠 블록 2×2 gap 64px(mujagi 블록 343×2+64=750) · 제목 14px/700(#333/#111) ·
// 링크 12px/400/#111 line-height 26px · 배경 흰색·상단 보더 없음 ·
// 법적 링크 + 사업자 정보(라벨 #999 / 값 #333, lh 23px).
// '#' 링크는 mock(원본 실측 없음). 원본에서 실측된 링크는 스마트스토어뿐
// (schema.org sameAs — docs/frontend-dev/evidence/udn-source-measurements.md).
// 사업자등록번호 등 원본에 없는 수치는 절대 지어내지 않는다.

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
  icon?: "threads" | "instagram" | "naver"; // 파동7 소셜 + 파동9 naver(대표 지시 mup7gezbenjf)
}

// simple-icons(CC0 1.0) 글리프 — designer 스펙 §4 복붙(재타이핑 금지 원칙).
// naver: 스펙 §4본(N 단독형 — 실네이버 N 로고 글리프·CC0. designer 판정 mup93ldu1rob (a) 확정·
// service-lead 교체 지시 mup9412ycury. 파동9 board mup7hs1uj77i·흑백 단색 currentColor).
const SOCIAL_ICONS: Record<NonNullable<FooterLink["icon"]>, string> = {
  threads:
    "M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z",
  instagram:
    "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077",
  naver:
    "M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845Z",
};

const BLOCKS: { title: string; links: FooterLink[] }[] = [
  {
    title: "고객지원",
    links: [
      { label: "실시간 문의", href: "#" }, // mock
      { label: "공지사항", href: "#" }, // mock
      { label: "FAQ", href: "#" }, // mock
      { label: "배송 & 교환", href: "#" }, // mock
    ],
  },
  {
    title: "비지니스",
    links: [
      { label: "B2B 제휴 문의", href: "#" }, // mock
      { label: "스튜디오 안내", href: "/about" },
    ],
  },
  {
    title: "회원",
    links: [
      { label: "마이페이지", href: "#" }, // mock
      { label: "회원혜택", href: "#" }, // mock
      { label: "프로모션", href: "#" }, // mock
    ],
  },
  {
    title: "소셜",
    links: [
      {
        label: "스마트스토어",
        href: "https://smartstore.naver.com/studioudn",
        external: true,
        // 파동9(mup7hs1uj77i·대표 지시 mup7gezbenjf "소셜 스마트 스토어 앞에도 네이버 로고인
        // N모양을 흑백 처리해서 넣도록 해줘") — 파동7-1 패턴 준용·naver 글리프(currentColor 흑백).
        icon: "naver",
      },
      // 파동7 — 대표 제공 소셜 URL(envelope mup25o02ou86·스펙 §3). 원본 실측 없음 주석은
      // URL을 대표가 직접 제공했으므로 해소 — 지어내지 않는다 원칙 유지(출처: 대표 발화).
      {
        label: "Threads",
        href: "https://www.threads.com/@design_studio_undesignated",
        external: true,
        icon: "threads",
      },
      {
        label: "Instagram",
        href: "https://www.instagram.com/design_studio_undesignated/",
        external: true,
        icon: "instagram",
      },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="pb-20 pt-[30px]">
      {/* 4콘텐츠 블록 2×2 (블록 폭 343px 수준·gap 64px — 파동4 §⑤-3) */}
      <div className="grid grid-cols-2 gap-16">
        {BLOCKS.map((block) => (
          <div key={block.title}>
            <h3 className="text-label font-bold leading-[30px] text-text">
              {block.title}
            </h3>
            <ul>
              {block.links.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    link.icon ? (
                      // 파동7 소셜 — 아이콘+라벨 병기(스펙 §3 템플릿): flex·gap 8px·SVG 16×16
                      // fill currentColor(라벨과 동일 색 거동·hover #111→#333). 16px·aria-hidden.
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-body leading-[26px] text-ink-strong hover:text-text"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <path d={SOCIAL_ICONS[link.icon]} />
                        </svg>
                        {link.label}
                      </a>
                    ) : (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-body leading-[26px] text-ink-strong hover:text-text"
                      >
                        {link.label}
                      </a>
                    )
                  ) : link.href.startsWith("/") ? (
                    <Link
                      href={link.href}
                      className="text-body leading-[26px] text-ink-strong hover:text-text"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-body leading-[26px] text-ink-strong hover:text-text"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* 사업자 정보 라인 — 원본에 없는 수치(사업자번호·전화 등)는 기재하지 않음 */}
      <div className="mt-10">
        <p className="text-util leading-[23px] text-muted">
          © {site.name} · {site.locations.join(" / ")}
        </p>
      </div>
    </footer>
  );
}
