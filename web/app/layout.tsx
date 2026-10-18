import type { Metadata } from "next";
import "./globals.css";
import { site } from "@/src/data/site";
import UtilBar from "@/src/components/layout/UtilBar";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import AuthSessionProvider from "@/src/components/auth/AuthSessionProvider";
import AnalyticsTracker from "@/src/components/analytics/AnalyticsTracker";

export const metadata: Metadata = {
  metadataBase: new URL("https://studioundesignated.com"),
  title: {
    default: site.title,
    template: `%s | ${site.nameKo}`,
  },
  description: site.description,
  keywords: site.keywords.split(","),
  icons: { icon: site.assets.favicon },
  // canonical은 루트 레이아웃에서 지정하지 않는다. App Router는 루트 metadata를 모든 하위
  // 페이지에 상속하므로 여기서 "/"를 선언하면 /about·/products·/journal·/faq·/notice 전부가
  // "내 정본은 홈페이지"라고 신고해 색인에서 제외된다(2026-10-18 진단).
  // 각 페이지가 자기 경로를 선언한다(page.tsx·about·products·journal·journal/[slug]·
  // faq·notice·terms·privacy·products/[slug]·portfolio/[slug]).
  openGraph: {
    type: "website",
    url: "https://studioundesignated.com/",
    siteName: site.name,
    title: site.title,
    description: site.description,
    locale: "ko_KR",
    images: [{ url: "/assets/main_background.png", alt: site.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    images: ["/assets/main_background.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// mujagi 구조(가이드 §1): 유틸바 52px(sticky) → 메뉴바 51px(스크롤아웃) → 콘텐츠 → 푸터.
// 캔버스: 750px 협폭 중앙 정렬(mx-auto) — D-1 amend(2026-09-30, 대표 결정).
// 파동4 이전: ml-canvas-offset 좌측 고정(x=25). 가역: mx-auto ↔ ml-canvas-offset 스왑.
// Pretendard: SIL OFL 1.1 — 가이드 §9-2 허용 폰트(jsdelivr CDN).
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                // 엔티티 통합용 노드 — Organization(+ProfessionalService) 1개에
                // 이름·로고·연락처·공식 채널(sameAs)을 모은다. 주소·전화·사업자번호는
                // 원본에 실측된 값이 없어 넣지 않는다(site.ts 주석 승계 — 지어내지 않음).
                "@type": ["Organization", "ProfessionalService"],
                "@id": "https://studioundesignated.com/#organization",
                name: site.name,
                alternateName: site.nameKo,
                url: "https://studioundesignated.com",
                description: site.description,
                logo: "https://studioundesignated.com/assets/UDN_logo_favicon.svg",
                email: "studioudn@naver.com",
                // 푸터에 실재하는 공식 채널만(site.links.smartstore + Footer BLOCKS 소셜/문의).
                sameAs: [
                  site.links.smartstore,
                  "https://www.instagram.com/design_studio_undesignated/",
                  "https://www.threads.com/@design_studio_undesignated",
                  "https://talk.naver.com/WJJOCY8",
                ],
                knowsAbout: [...site.services],
                hasOfferCatalog: {
                  "@type": "OfferCatalog",
                  name: "Studio UDN services",
                  itemListElement: site.services.map((name) => ({
                    "@type": "Offer",
                    itemOffered: { "@type": "Service", name },
                  })),
                },
              },
              {
                "@type": "WebSite",
                "@id": "https://studioundesignated.com/#website",
                url: "https://studioundesignated.com",
                name: site.name,
                alternateName: site.nameKo,
                inLanguage: "ko-KR",
                publisher: { "@id": "https://studioundesignated.com/#organization" },
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: "https://studioundesignated.com/search?q={search_term_string}",
                  },
                  "query-input": "required name=search_term_string",
                },
              },
            ],
          })}
        </script>
        <AuthSessionProvider>
          <AnalyticsTracker />
          <div id="wrap" className="mx-auto w-full max-w-canvas">
            <UtilBar />
            <Header />
            <main>{children}</main>
            <Footer />
          </div>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
