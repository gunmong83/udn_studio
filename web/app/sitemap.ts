import type { MetadataRoute } from "next";
import { products } from "@/src/data/products";
import { journalEntries } from "@/src/data/journal";

const baseUrl = "https://studioundesignated.com";

export default function sitemap(): MetadataRoute.Sitemap {
  // 검색엔진에는 판매 상품과 핵심 안내 페이지만 제출한다. 포트폴리오는
  // 페이지 자체에서 noindex 처리하고 사이트맵에서도 제외해 상품 검색 의도를 보존한다.
  const staticPages = ["", "/about", "/products", "/journal"];
  const productPages = products.map((product) => `/products/${product.slug}`);
  const journalPages = journalEntries.map((entry) => `/journal/${entry.slug}`);

  const now = new Date();

  return [...new Set([...staticPages, ...productPages, ...journalPages])].map(
    (path) => ({
      url: `${baseUrl}${path}`,
      lastModified: now,
      changeFrequency: path === "" ? ("daily" as const) : ("weekly" as const),
      priority: path === "" ? 1 : 0.7,
    }),
  );
}
