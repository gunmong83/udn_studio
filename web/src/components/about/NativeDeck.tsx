// 파동8-② 3차 — About 장표 5종 HTML 네이티브 렌더(board mup972cufj56·envelope mup7lwvo20c3).
// 스펙 정본: docs/designer/wave10-native-render-spec.md AMEND본(2026-10-01 17:40 — diff 6건 반영).
// 대표 지시 원문: "완전히 똑같게 그냥 직접 렌더링…다른 샘들 안넣고 흰색 검은색 필요하면 약한
// 회색정도만 섞어서…폰트도 같은걸로 렌더하고 선들도 원본과 완전히 똑같게 렌더해야해."
//
// 좌표 체계(스펙 §1 재량 — 컨테이너 스케일 채택): 컨테이너 container-type:inline-size +
// 전 수치 cqw 단위(1440 기준 px ÷ 14.4 = cqw — 종횡비 7:5 고정이라 x/y 동일 계수·반응형 자동).
// 색 6토큰만(§3): #fff/#111/#333/#666/#999/#e8e8e8. 선 전부 1px(§2 C5). radius 0·그림자 없음.
// aboutDeck 원문 그대로(오타 포함·수정 금지 §7-2)·s5 헤드 별도 행(결합형 금지 — AMEND C2).

import type { ReactNode, CSSProperties } from "react";
import { Bodoni_Moda } from "next/font/google";
import { site } from "@/src/data/site";

// 디돈 계층 번호/Why·How·What(§4-1 — SIL OFL 1.1·weight 500·latin)
const bodoni = Bodoni_Moda({
  weight: "500",
  subsets: ["latin"],
  display: "swap",
});

// 1440 기준 px → cqw(컨테이너 폭 1% = 14.4px @설계폭)
const u = (v: number) => `${(v / 14.4).toFixed(4)}cqw`;

// s1 목록 원문(wave6 추출 정본 — 오타 AUDIANCES 보존·aboutDeck에 없음·컴포넌트 상수 §7-2)
const S1_ITEMS = ["01_BRAND STORY", "02_BRAND CORE VALUE", "03_GOLDEN CIRCLE", "04_AUDIANCES"];

// ---------- 공통 프리미티브(§7-1) ----------

/** 캔버스 — aspect 7/5·max-width 726·배경·1px #e8e8e8 테두리(§1)·cqw 스케일 루트 */
function SlideShell({ bg, children, label }: { bg: string; children: ReactNode; label?: string }) {
  return (
    <div
      style={{ containerType: "inline-size", backgroundColor: bg }}
      className="relative mx-auto w-full max-w-[726px] border border-[#e8e8e8]"
    >
      <div className="relative aspect-[7/5] w-full">
        {label !== undefined && <SlideLabel label={label} />}
        {children}
      </div>
    </div>
  );
}

/** 좌측 세로 OVERVIEW(vertical-rl 무회전 — AMEND C4) + 상단 섹션 라벨(§2) */
function SlideLabel({ label }: { label: string }) {
  return (
    <>
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: u(72),
          top: u(76),
          fontSize: u(16),
          color: "#999",
          writingMode: "vertical-rl",
          letterSpacing: 0,
        }}
      >
        OVERVIEW
      </span>
      <span
        style={{
          position: "absolute",
          left: u(404),
          top: u(78),
          fontSize: u(19),
          color: "#999",
          letterSpacing: 0,
        }}
      >
        {label}
      </span>
    </>
  );
}

/** 구분선 — variant: "3seg"(3세그먼트·폭 304·간격 60 — §5 s2/s4) | "h"(단선) */
function SlideRule({ y, variant = "3seg" }: { y: number; variant?: "3seg" | "h" }) {
  if (variant === "h") {
    return (
      <hr
        style={{ position: "absolute", left: 0, top: u(y), width: "100%", borderTop: "1px solid #999" }}
        className="border-0 border-t"
      />
    );
  }
  // 3세그 — [AMEND 2-①] 세그=열과 동일 위치 x404-708/732-1036/1059-1363·간격 24
  // (원본 s2 y2148·s4 y1274 크롭 스캔 native (1004,1760)/(1819,2575)/(2634,3390) — 1차 "간격 60" native 단위 혼재 오기 교정)
  return (
    <>
      {[404, 732, 1059].map((x) => (
        <hr
          key={x}
          style={{
            position: "absolute",
            left: u(x),
            top: u(y),
            width: u(304),
            borderTop: "1px solid #999",
          }}
          className="border-0 border-t"
        />
      ))}
    </>
  );
}

/** 절대 배치 텍스트 블록 공통 스타일 */
function block(x: number, y: number, style: CSSProperties = {}): CSSProperties {
  return { position: "absolute", left: u(x), top: u(y), letterSpacing: 0, ...style };
}

// ---------- s1 — CONTENTS(배경 #e8e8e8 — §3 매핑: 라벤더→연회) ----------

function SlideContents() {
  return (
    <SlideShell bg="#e8e8e8">
      {/* 헤더 상부 3세그 y75 — [AMEND 2-②] x76 w304·x404 w304·x732 w631(관통선·짧은 선 오독 폐기) */}
      <hr style={{ position: "absolute", left: u(76), top: u(75), width: u(304), borderTop: "1px solid #999" }} className="border-0 border-t" />
      <hr style={{ position: "absolute", left: u(404), top: u(75), width: u(304), borderTop: "1px solid #999" }} className="border-0 border-t" />
      <hr style={{ position: "absolute", left: u(732), top: u(75), width: u(631), borderTop: "1px solid #999" }} className="border-0 border-t" />
      {/* 3단 헤더 y88 */}
      <span style={block(76, 88, { fontSize: u(20), fontWeight: 700, color: "#111" })}>CONTENTS</span>
      <span style={block(260, 88, { fontSize: u(20), fontWeight: 400, color: "#111" })}>00_OVERVIEW</span>
      {/* 목록 4행 x731·피치 38·행 상하 1px 선(테이블 스트라이프) */}
      <div style={{ position: "absolute", left: u(731), top: u(88), width: u(632) }}>
        {S1_ITEMS.map((item) => (
          <div
            key={item}
            style={{
              fontSize: u(17),
              lineHeight: u(38),
              color: "#111",
              borderTop: "1px solid #999",
              borderBottom: "1px solid #999",
              paddingTop: u(0),
            }}
          >
            {item}
          </div>
        ))}
      </div>
      {/* 하단 75% 무지 */}
    </SlideShell>
  );
}

// ---------- s2 — BRAND STORY(배경 #fff) ----------

function SlideBrandStory() {
  const { brandStory } = site.aboutDeck;
  const colX = [404, 732, 1060];
  return (
    <SlideShell bg="#fff" label={`01_${brandStory.label}`}>
      {/* 슬로건 y224 */}
      <p style={block(404, 224, { fontSize: u(21), fontWeight: 700, color: "#111" })}>
        {brandStory.slogan}
      </p>
      {/* 워드마크 studioUDN y542(studio 400 + UDN 700 동일 크기) */}
      <p style={block(404, 542, { fontSize: u(36), color: "#111" })}>
        <span style={{ fontWeight: 400 }}>studio</span>
        <span style={{ fontWeight: 700 }}>UDN</span>
      </p>
      {/* 본문 3행 y633/666/699 — fs15 lh34·우측 extend 95% */}
      <div style={block(404, 633, { width: u(915) })}>
        {brandStory.paragraphs.map((p, i) => (
          <p key={i} style={{ fontSize: u(15), lineHeight: u(34), color: "#111", marginTop: i === 0 ? 0 : u(0) }}>
            {p}
          </p>
        ))}
      </div>
      {/* 번호 1. 2. 3. y781 — fs36 Bodoni Moda 500·열 좌정렬 */}
      {brandStory.items.map((it, i) => (
        <span
          key={it.number}
          className={bodoni.className}
          style={block(colX[i], 781, { fontSize: u(36), color: "#111" })}
        >
          {it.number}
        </span>
      ))}
      {/* 구분선 y864 — 3세그 */}
      <SlideRule y={864} />
      {/* 소제목 y889(fs15/700/#111) + 설명 y923(fs15/400/#666·lh34) — 3열 */}
      {brandStory.items.map((it, i) => (
        <div key={it.number} style={block(colX[i], 889, { width: u(304) })}>
          <p style={{ fontSize: u(15), fontWeight: 700, color: "#111" }}>{it.title}</p>
          <p style={{ marginTop: u(34 - 15), fontSize: u(15), lineHeight: u(34), color: "#666" }}>
            {it.description}
          </p>
        </div>
      ))}
    </SlideShell>
  );
}

// ---------- s3 — CORE VALUE(배경 #fff·원 3개 — AMEND C1 수치 그대로) ----------

function SlideCoreValue() {
  const { coreValue } = site.aboutDeck;
  const centers = [325, 720, 1115]; // 디스크 중심 x(§5 — AMEND C1)
  const ringR = [199, 213, 228, 241, 256]; // 링 5중(§6-1)
  return (
    <SlideShell bg="#fff" label={`02_${coreValue.label}`}>
      {/* 원 3개 — 단일 SVG 오버레이(§6-1 권장): 디스크 r184 채움 #e8e8e8 + 링 5중 stroke #999 1px */}
      <svg
        viewBox="0 0 1440 1028"
        aria-hidden
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        {centers.map((cx) => (
          <circle key={`d${cx}`} cx={cx} cy={534} r={184} fill="#e8e8e8" />
        ))}
        {centers.map((cx) =>
          ringR.map((r) => (
            <circle key={`r${cx}-${r}`} cx={cx} cy={534} r={r} fill="none" stroke="#999" strokeWidth={1} />
          )),
        )}
      </svg>
      {/* 헤드라인 y473(fs31/700) + 설명 4행 y550(fs14·lh25·#999) — 원 내 중앙정렬·열 중심=원 중심 */}
      {coreValue.items.map((it, i) => (
        <div
          key={it.head}
          style={{
            position: "absolute",
            left: `${(centers[i] / 14.4).toFixed(4)}cqw`,
            top: u(473),
            width: u(369),
            transform: "translateX(-50%)",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: u(31), fontWeight: 700, color: "#111" }}>{it.head}</p>
          <p style={{ marginTop: u(77 - 31), fontSize: u(14), lineHeight: u(25), color: "#999" }}>
            {it.description}
          </p>
        </div>
      ))}
    </SlideShell>
  );
}

// ---------- s4 — GOLDEN CIRCLE(배경 #fff + 디스크 블록 2·AMEND C6) ----------

function SlideGoldenCircle() {
  const { goldenCircle } = site.aboutDeck;
  const colX = [404, 732, 1060];
  return (
    <SlideShell bg="#fff" label={`03_${goldenCircle.label}`}>
      {/* 배경 레이어 z0 — 좌상 디스크 (392,513) Ø632[AMEND C6]·우측 대아크 근사 (1750,1200) r900(§9 근사 명시) */}
      <svg
        viewBox="0 0 1440 1028"
        aria-hidden
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 }}
      >
        <circle cx={392} cy={513} r={316} fill="#e8e8e8" />
        {/* [AMEND 2-③] 우측 대아크 근사 (1970,513) r900 — 감수 경계 실측 피팅치(구 (1750,1200) 과대 교체) */}
        <circle cx={1970} cy={513} r={900} fill="#e8e8e8" />
      </svg>
      {/* 텍스트 레이어 z1 — Why/How/What y429 fs46 Bodoni 500·열 좌정렬 */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        {goldenCircle.items.map((it, i) => (
          <span
            key={it.head}
            className={bodoni.className}
            style={block(colX[i], 429, { fontSize: u(46), color: "#111" })}
          >
            {it.head}
          </span>
        ))}
        {/* 제목 하 선 y512 — 3세그 */}
        <SlideRule y={512} />
        {/* 한글 lh34 #111 + 영문 lh25 #999 — 이중 계조(§2)·각 열 스택 */}
        {goldenCircle.items.map((it, i) => (
          <div key={it.head} style={block(colX[i], 546, { width: u(304) })}>
            <p style={{ fontSize: u(15), lineHeight: u(34), color: "#111" }}>{it.korean}</p>
            <p style={{ marginTop: u(24), fontSize: u(14), lineHeight: u(25), color: "#999" }}>
              {it.english}
            </p>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

// ---------- s5 — AUDIANCES / CLIENTS(배경 #fff) ----------

function SlideAudiences() {
  const { audiences } = site.aboutDeck;
  const colX = [404, 732, 1060];
  return (
    <SlideShell bg="#fff" label={`04_${audiences.label}`}>
      {/* 세로 구분선 x719·x1047 — y300-774(KR 본문 통과·EN 직전 종료 — AMEND C3) */}
      {[719, 1047].map((x) => (
        <div
          key={x}
          style={{
            position: "absolute",
            left: u(x),
            top: u(300),
            height: u(474),
            borderLeft: "1px solid #999",
          }}
        />
      ))}
      {audiences.items.map((it, i) => (
        <div key={it.number}>
          {/* 번호 y300 — fs36 Bodoni·열 좌정렬 */}
          <span
            className={bodoni.className}
            style={block(colX[i], 300, { fontSize: u(36), color: "#111" })}
          >
            {it.number}
          </span>
          {/* 영문 헤드 y375 — fs29/700·별도 행(결합형 금지 — AMEND C2·aboutDeck head 그대로) */}
          <span style={block(colX[i], 375, { fontSize: u(29), fontWeight: 700, color: "#111" })}>
            {it.head}
          </span>
          {/* 한글 부제 2행 y439 — fs15/700/#666·lh34 */}
          <div style={block(colX[i], 439, { width: u(304) })}>
            {it.subtitle.map((s, j) => (
              <p key={j} style={{ fontSize: u(15), fontWeight: 700, lineHeight: u(34), color: "#666" }}>
                {s}
              </p>
            ))}
          </div>
          {/* KR 본문 y671 — fs15 lh34 #111(번호~부제와의 수직 여백 ≈173 자연 발생) */}
          <p style={block(colX[i], 671, { width: u(304), fontSize: u(15), lineHeight: u(34), color: "#111" })}>
            {it.korean}
          </p>
          {/* EN 본문 y798 — fs14 lh25 #999(이중 계조) */}
          <p style={block(colX[i], 798, { width: u(304), fontSize: u(14), lineHeight: u(25), color: "#999" })}>
            {it.english}
          </p>
        </div>
      ))}
    </SlideShell>
  );
}

// ---------- 시퀸스 export ----------

export function NativeDeck() {
  return (
    <>
      <SlideContents />
      <SlideBrandStory />
      <SlideCoreValue />
      <SlideGoldenCircle />
      <SlideAudiences />
    </>
  );
}
