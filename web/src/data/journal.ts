// UDN 작업노트(JOURNAL) — 포트폴리오 기반 엔트리.
// UDN 원본은 단일 페이지 사이트로 저널·발행 날짜가 없다(2026-09-30 실측:
// sitemap 홈 1건뿐, 홈 HTML에 날짜·저널 섹션 없음).
// 따라서 date는 옵셔널 필드로만 정의하고 전 항목 미설정 — 날짜를 지어내지 않는다.
// '최신' 판정 = 원본 홈 포트폴리오 순서 상위(원본 순서가 유일한 순서 신호).
//
// 파동5 B2(§5·muosdkwtl1yu ②): products.map 자동 확장 — 령 2027 등록으로
// **8건**(원본 순서 7건 + 령 append — §5 "신규는 append" 해석). 코드 0줄 변경·
// 이 주석만 갱신. 령 excerpt: undefined(description 부재 — 달력과 동일 처리).
// 홈 카드 slice(0,1) 무변경(첫 엔트리 = 달력 — §5 확인).

import { products, type Product, type ProductCategory } from "./products";

export interface JournalEntry {
  slug: string;
  title: string;
  category: ProductCategory;
  image: string;
  /** 대표 원본 비율(§7 상세 축 — "3012/4799" 문자열·저널 상세 전폡용) */
  aspect: string;
  /** 카드 크롭 앵커(§7 특례 — 파동5 감수 7-c: ProductCard와 동일 전파·the-tov만 "100% 50%") */
  objectPosition?: string;
  /** 원문 설명(원본에 있는 항목만) */
  excerpt?: string;
  /** 원본에 날짜 정보 없음 — 실측되면 추가 */
  date?: string;
  /** 대응 포트폴리오 상세로 연결 */
  productSlug: string;
}

function fromProduct(p: Product): JournalEntry {
  return {
    slug: p.slug,
    title: p.title,
    category: p.category,
    image: p.image,
    aspect: p.aspect,
    objectPosition: p.objectPosition,
    excerpt: p.description,
    productSlug: p.slug,
  };
}

// 파동7(mup25o02ou86·board mup28gc3c1je): 최신 우선 정렬 — 대표 지시 원문
// "2027년 달력이 가장 최근거니까 최근거를 보여줘". 랜딩 저널 섹션(slice(0,1) 첫 카드)·
// /journal 피드 전부 배열 순서를 소비하므로 이 단일 재배치로 양쪽 동일 적용.
// products.ts 원본 순서는 불변(제품 그리드·검색 등 타 표면 무영향) — 파생 지점에서만
// ryeong-2027(령令 2027)을 선두로, 나머지 7종은 기존(원본) 순서 유지.
// date 필드는 전 항목 미설정(날짜 지어내지 않음 — 상단 주석 승계)이라 '최신' 판정은
// 명시적 배치로만 표현. 가역: 이 블록을 products.map 그대로로 되돌리면 파동5 상태 복원.
export const journalEntries: JournalEntry[] = (() => {
  const entries = products.map(fromProduct);
  const latestIdx = entries.findIndex((e) => e.slug === "ryeong-2027");
  return latestIdx > 0
    ? [entries[latestIdx], ...entries.toSpliced(latestIdx, 1)]
    : entries;
})();

export function getJournalEntry(slug: string): JournalEntry | undefined {
  return journalEntries.find((e) => e.slug === slug);
}
