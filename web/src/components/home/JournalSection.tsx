import Image from "next/image";
import Link from "next/link";
import { journalEntries } from "@/src/data/journal";

// 홈 JOURNAL 섹션 — mujagi #MainJN 실측 (가이드 §1-2·§4-2·§5-3):
// - 섹션 라벨 h1 "JOURNAL" 14px/700(§2-2) · 섹션 상단 패딩 30px(§4-1)
// - 최신 1건: 726×726 정방 카드(§6) + 카드테고리 13px/500/#111 + 제목 20px/500/#111
// 파동4 §①-7·8 — 홈은 mujagi 문법대로 카드 1장만(보드 2장·"모두 보기" CTA 제거·가역).
// journal.ts 데이터 전량 유지 — /journal 페이지에서 전건 표시(변동 없음).
// 재활성화: slice(0,1)→(0,3) + rest 그리드·CTA 블록 복원(JournalCard import 포함).
// '최신' 판정: 원본에 발행일이 없어 원본 홈 포트폴리오 순서 상위(데이터 주석 참조).

export default function JournalSection() {
  const [first] = journalEntries.slice(0, 1);
  if (!first) return null;

  return (
    <section className="w-full px-3 pt-section">
      <h1 className="text-label font-bold text-text">JOURNAL</h1>

      {/* 최신 1건 카드 — 파동5 §7 #1: aspect-card 공용 토큰(3:4 확정 — B1 토큰 준용.
          파동4 726×726 정방 폐지·원본 비율 축과 분리된 카드 축 단일 비율) */}
      <Link href={`/journal/${first.slug}`} className="mt-section block">
        <div className="relative aspect-card w-full overflow-hidden">
          <Image
            src={first.image}
            alt={first.title}
            fill
            sizes="726px"
            className="object-cover"
          />
        </div>
        <div className="pt-3">
          <p className="text-nav font-medium text-ink-strong">
            {first.category}
          </p>
          <h2 className="text-heading font-medium text-ink-strong">
            {first.title}
          </h2>
          <p className="mt-2 text-nav text-ink-strong">Read More →</p>
        </div>
      </Link>
    </section>
  );
}
