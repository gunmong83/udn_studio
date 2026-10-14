import type { MetadataRoute } from "next";
import { getWorks, products } from "@/src/data/products";
import { journalEntries } from "@/src/data/journal";

const baseUrl = "https://studioundesignated.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = ["", "/about", "/products", "/journal", "/portfolio"];
  const productPages = products.map((product) => `/products/${product.slug}`);
  const journalPages = journalEntries.map((entry) => `/journal/${entry.slug}`);
  const portfolioPages = getWorks().map((work) => ({
    url: `${baseUrl}/portfolio/${work.slug}`,
    images: [work.image, ...(work.detailImages ?? []).map((image) => image.src)].map(
      (image) => `${baseUrl}${image}`,
    ),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const now = new Date();

  const pageEntries = [...new Set([...staticPages, ...productPages, ...journalPages])].map(
    (path) => ({
      url: `${baseUrl}${path}`,
      lastModified: now,
      changeFrequency: path === "" ? ("daily" as const) : ("weekly" as const),
      priority: path === "" ? 1 : 0.7,
    }),
  );

  return [...pageEntries, ...portfolioPages];
}
