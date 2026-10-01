import type { Metadata } from "next";
import { journalEntries } from "@/src/data/journal";
import JournalCard from "@/src/components/journal/JournalCard";

export const metadata: Metadata = { title: "JOURNAL" };

// 저널 보드 — mujagi /board/journal 실측 (가이드 §4-2·§5-1):
// 2열, 좌우·상하 간격 전부 0 — 완전 밀착 타일(카드 375×432, 캔버스 에지부터).
// 라벨 h1 "JOURNAL" 14px/700(§2-2). 흰 배경끼리 맞닿아 흰 선이 구분선 역할.

export default function JournalPage() {
  return (
    <div className="w-full pb-section pt-section">
      <h1 className="px-3 text-label font-bold text-text">JOURNAL</h1>
      <div className="mt-3 grid grid-cols-2 gap-0">
        {journalEntries.map((entry) => (
          <JournalCard key={entry.slug} entry={entry} />
        ))}
      </div>
    </div>
  );
}
