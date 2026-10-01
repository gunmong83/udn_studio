import Image from "next/image";
import Link from "next/link";
import type { JournalEntry } from "@/src/data/journal";

// 저널 보드 카드 — mujagi /board/journal 실측 (가이드 §5-1):
// 썸네일 aspect-card 3:4(§7 #2·파동5 B3 — 375×500 세로) + 정보 블록.
// 카테고리 13px/500/#111 · 제목 20px/500/#111 · Read More 13px/400/#111.
// 이미지 hover 스케일 없음(§3 — 줌/트랜스폼 0건), 링크 hover는 색만 변화(§5-4).
// 작가·날짜 라인은 UDN 원본에 발행일·작가 실측 없어 생략(지어내지 않음).
// 날짜 표기 없음: UDN 원본에 발행 날짜가 없어 지어내지 않기 때문(데이터 주석 참조).
export default function JournalCard({ entry }: { entry: JournalEntry }) {
  return (
    <Link href={`/journal/${entry.slug}`} className="block">
      <div className="relative aspect-card w-full overflow-hidden">
        <Image
          src={entry.image}
          alt={entry.title}
          fill
          sizes="(max-width: 750px) 100vw, 375px"
          className="object-cover"
          // §7 특례 전파(감수 7-c): ProductCard와 동일 — objectPosition 데이터
          // 필드 읽기·미설정 시 스타일 없음(CSS 기본 50% 50% 폴백과 동일 효과).
          style={
            entry.objectPosition
              ? { objectPosition: entry.objectPosition }
              : undefined
          }
        />
      </div>
      <div className="px-3 pb-4 pt-3">
        <p className="text-nav font-medium text-ink-strong">{entry.category}</p>
        <h3 className="text-heading font-medium text-ink-strong">
          {entry.title}
        </h3>
        <p className="mt-2 text-nav text-ink-strong">Read More →</p>
      </div>
    </Link>
  );
}
