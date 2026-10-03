import type { Metadata } from "next";
import "./globals.css";
import { site } from "@/src/data/site";
import UtilBar from "@/src/components/layout/UtilBar";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import AuthSessionProvider from "@/src/components/auth/AuthSessionProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://studioundesignated.com"),
  title: {
    default: site.title,
    template: `%s | ${site.nameKo}`,
  },
  description: site.description,
  keywords: site.keywords.split(","),
  icons: { icon: site.assets.favicon },
  alternates: { canonical: "/" },
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
              "@type": "ProfessionalService",
              name: site.name,
              alternateName: site.nameKo,
              url: "https://studioundesignated.com",
              description: site.description,
              areaServed: site.locations,
              sameAs: [site.links.smartstore],
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Studio UDN services",
                itemListElement: site.services.map((name) => ({
                  "@type": "Offer",
                  itemOffered: { "@type": "Service", name },
                })),
              },
          })}
        </script>
        <AuthSessionProvider>
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
