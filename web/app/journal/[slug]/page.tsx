import Image from "@/src/components/ui/ProgressiveImage";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getJournalEntry, journalEntries } from "@/src/data/journal";

export function generateStaticParams() {
  return journalEntries.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getJournalEntry(slug);
  if (!entry) {
    return { title: "JOURNAL", robots: { index: false, follow: true } };
  }
  // 2026-10-18 — 이전에는 루트 레이아웃의 canonical "/" 을 상속해 저널 상세 전건이
  // "홈의 중복"으로 신고됐다(색인 제외). 이제 자기 경로를 선언한다.
  return {
    title: entry.title,
    description: entry.excerpt,
    alternates: { canonical: `/journal/${entry.slug}` },
    openGraph: {
      type: "article",
      url: `https://studioundesignated.com/journal/${entry.slug}`,
      title: entry.title,
      description: entry.excerpt,
      images: [`https://studioundesignated.com${entry.image}`],
    },
    robots: { index: true, follow: true },
  };
}

// 저널 상세 — mujagi 저널 카드 문법 확장(§5-1 — 상세 페이지는 미측정):
// 카테고리 13px/500/#111 → 제목 20px/500/#111(사이트 최대 타이포) →
// 이미지 전폭(§6) → 본문 12px/1.8 → "포트폴리오에서 보기"(Read More 문법 13px/#111).
// 작가·날짜 라인 없음: UDN 원본에 발행일·작가 실측 없음(지어내지 않음).
export default async function JournalDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getJournalEntry(slug);
  if (!entry) notFound();

  return (
    <article className="w-full pb-section">
      <div className="px-3 pt-section">
        <p className="text-nav font-medium text-ink-strong">{entry.category}</p>
        <h1 className="text-heading font-medium text-ink-strong">
          {entry.title}
        </h1>
      </div>
      {/* §7 #3(파동5 B3): 저널 상세 대표 = 원본 비율 전폡(per-asset aspectRatio —
          products 데이터 승계·무크롭. 기존 375/256 고정 축 폐지) */}
      <div
        className="relative mt-section w-full overflow-hidden"
        style={{ aspectRatio: entry.aspect }}
      >
        <Image
          src={entry.image}
          alt={entry.title}
          fill
          priority
          sizes="750px"
          className="object-cover"
        />
      </div>
      {entry.excerpt && (
        <p className="px-3 pt-section text-body leading-[21.6px] text-text">
          {entry.excerpt}
        </p>
      )}
      <div className="px-3 pt-section">
        <Link
          href={`/products/${entry.productSlug}`}
          className="text-nav text-ink-strong hover:text-text"
        >
          포트폴리오에서 보기 →
        </Link>
      </div>
    </article>
  );
}
