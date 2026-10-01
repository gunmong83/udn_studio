"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { searchDocs } from "@/src/lib/search-index";

// 검색 — 정적 색인(상품·저널 제목/카테고리/설명) 클라이언트 검색. mujagi 문법:
// 라벨 14px/700 · 섹션 소제목 12px/700(h4 실측 §2-2) · 링크 밑줄 없음·색 hover(§5-4)
// · 카테고리 12px/#999 · 제목 12px/#333. accent 미사용(GIFTING 전용 — §3).

export default function SearchPage() {
  const [q, setQ] = useState("");
  const results = useMemo(() => searchDocs(q), [q]);
  const productHits = results.filter((d) => d.type === "product");
  const journalHits = results.filter((d) => d.type === "journal");

  return (
    <div className="w-full px-3 pb-section pt-section">
      <h1 className="text-label font-bold text-text">SEARCH</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="상품·저널 검색 (제목 · 카테고리 · 설명)"
        className="mt-4 w-full border-b border-line bg-transparent pb-3 text-body text-text outline-none placeholder:text-muted focus:border-line-strong"
        autoFocus
      />
      {q.trim() === "" ? (
        <p className="mt-10 text-body text-muted">
          검색어를 입력하세요 — 상품(포트폴리오)과 저널의 제목·카테고리·설명에서
          찾습니다.
        </p>
      ) : results.length === 0 ? (
        <p className="mt-10 text-body text-muted">검색 결과가 없습니다.</p>
      ) : (
        <div className="mt-10 space-y-10">
          <section>
            <h2 className="mb-3 text-body font-bold text-text">
              PRODUCTS ({productHits.length})
            </h2>
            <ul className="space-y-2">
              {productHits.map((doc) => (
                <li key={`p-${doc.slug}`}>
                  <Link
                    href={doc.href}
                    className="flex items-baseline gap-3 text-body hover:text-ink-strong"
                  >
                    <span className="text-util text-muted">{doc.category}</span>
                    <span className="text-text">{doc.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="mb-3 text-body font-bold text-text">
              JOURNAL ({journalHits.length})
            </h2>
            <ul className="space-y-2">
              {journalHits.map((doc) => (
                <li key={`j-${doc.slug}`}>
                  <Link
                    href={doc.href}
                    className="flex items-baseline gap-3 text-body hover:text-ink-strong"
                  >
                    <span className="text-util text-muted">{doc.category}</span>
                    <span className="text-text">{doc.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
