import type { MetadataRoute } from "next";
import { getWorks, products } from "@/src/data/products";
import { journalEntries } from "@/src/data/journal";

const baseUrl = "https://studioundesignated.com";

// 2026-10-18 재작성(SEO 진단 반영):
// - lastModified 제거 — 데이터에 발행·수정일이 실측돼 있지 않다(journal.ts 상단 주석:
//   "날짜를 지어내지 않는다"). 이전에는 요청 시각(new Date())이 191건 전부의 lastmod로
//   찍혀 크롤러가 신뢰하지 않았다.
// - /products/ 에는 실제 판매 상품(kind="product")만 넣는다. 작품(kind="work")은 /portfolio/
//   축이며, 같은 slug가 /products/<slug>로도 200을 반환해 중복 URL이었다(해당 페이지의
//   canonical은 이제 /portfolio/<slug>).
// - adminOnly(관리자 전용 테스트 상품)는 어떤 목록에도 넣지 않는다 — 이전에
//   /products/test-payment-100이 404 상태로 사이트맵에 들어가 있었다.
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = ["", "/about", "/products", "/journal", "/portfolio", "/notice", "/faq"];
  const productPages = products
    .filter((product) => product.kind === "product" && !product.adminOnly)
    .map((product) => `/products/${product.slug}`);
  const journalPages = journalEntries.map((entry) => `/journal/${entry.slug}`);
  const portfolioPages = getWorks()
    .filter((work) => !work.adminOnly)
    .map((work) => ({
      url: `${baseUrl}/portfolio/${work.slug}`,
      images: [work.image, ...(work.detailImages ?? []).map((image) => image.src)].map(
        (image) => `${baseUrl}${image}`,
      ),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  const pageEntries = [...new Set([...staticPages, ...productPages, ...journalPages])].map(
    (path) => ({
      url: `${baseUrl}${path}`,
      changeFrequency: path === "" ? ("daily" as const) : ("weekly" as const),
      priority: path === "" ? 1 : path === "/about" ? 0.8 : 0.7,
    }),
  );

  return [...pageEntries, ...portfolioPages];
}
