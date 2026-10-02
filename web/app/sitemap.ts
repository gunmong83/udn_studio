import type { MetadataRoute } from "next";
import { products } from "@/src/data/products";
import { journalEntries } from "@/src/data/journal";

const baseUrl = "https://studioundesignated.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = ["", "/about", "/portfolio", "/products", "/journal"];
  const productPages = products.map((product) => `/products/${product.slug}`);
  const portfolioPages = products
    .filter((product) => product.kind === "work")
    .map((product) => `/portfolio/${product.slug}`);
  const journalPages = journalEntries.map((entry) => `/journal/${entry.slug}`);

  return [...new Set([...staticPages, ...productPages, ...portfolioPages, ...journalPages])].map(
    (path) => ({
      url: `${baseUrl}${path}`,
      changeFrequency: "weekly",
      priority: path === "" ? 1 : 0.7,
    }),
  );
}
