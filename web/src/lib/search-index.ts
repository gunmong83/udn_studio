// 정적 검색 색인 — 상품(포트폴리오)·저널 제목/카테고리/설명 클라이언트 검색용.

import { products } from "@/src/data/products";
import { journalEntries } from "@/src/data/journal";

export interface SearchDoc {
  type: "product" | "journal";
  slug: string;
  title: string;
  category: string;
  text?: string;
  href: string;
}

export const searchIndex: SearchDoc[] = [
  ...products.map((p) => ({
    type: "product" as const,
    slug: p.slug,
    title: p.title,
    category: p.category,
    text: p.description,
    href: `/products/${p.slug}`,
  })),
  ...journalEntries.map((e) => ({
    type: "journal" as const,
    slug: e.slug,
    title: e.title,
    category: e.category,
    text: e.excerpt,
    href: `/journal/${e.slug}`,
  })),
];

export function searchDocs(query: string): SearchDoc[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return searchIndex.filter((doc) => {
    const hay = `${doc.title} ${doc.category} ${doc.text ?? ""}`.toLowerCase();
    return q.split(/\s+/).every((token) => hay.includes(token));
  });
}
