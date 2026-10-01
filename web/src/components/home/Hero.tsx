"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { site } from "@/src/data/site";

// 히어로 — mujagi #MainShortsSlideMP 실측 (가이드 §1-2·§6·파동5 §2):
// 750×1125 (2:3 세로) object-fit cover 크롭 · 오버레이/그림자 없음(mujagi 무드).
// 포트폴리오 작품 자동 전환 슬라이드쇼 4종(site.ts heroSlides — p2→p4→p6→p7.
// p3·p5·p1 제외 사유는 site.ts 데이터 주석 참조 — 변경 금지).
// 텍스트 없음 유지(파동4 §①-4 결정 승계 — mujagi 무텍스트 히어로).
//
// 설계값 고정(§2 — 가역 상수·재발명 금지) + 파동6-1c 스펙 §0(designer·승인 muoyrhq7eqhy):
// - 자동 전환 5,000ms · fade 600ms · 루프 (무결 §2 값 — 재발명 금지)
// - 인디케이터: mujagi식 프로그레스바(파동6-1c) — 트랙 734×2px(좌우/하단 인셋 8px)
//   rgba(255,255,255,0.3) 항상 렌더 · 채움 #fff scaleX 0→1 5,000ms 선형(key={index}
//   리마운트로 구간마다 재개 — 채움·인터벌 같은 5,000ms 단일 시계) · radius 0 · 무텍스트
// - 닷 인디케이터 제거(스펙 §3-6 — 원본에 닷 부재·프로그레스바가 대체) · 가역 각본 주석
// - reduced-motion 정책 A(스펙 §3-4 확정): reduce 무시·자동전환·채움 모두 유지
//   (구 §2 "reduce 시 정지" 분기 제거 — mujagi 실측 §1-7 준거)
// - 타이머 재계(스펙 §2-2 결함 수정): 인덱스 변경마다 인터벌 재구성 — 수동 전환
//   시점부터 5,000ms 재계(구 [] 1회 생성은 원 케이던스 유지 → 수동 직후 자동전환 겹침)
// - 첫 장 priority(LCP) · 나머지 lazy · 크기 750×1125 고정(CLSC 0)
// - 유저 스와이프(터치·drag) 허용 — 가로 이동 40px 임계
// - 트랙·채움 전부 absolute 오버레이 — 레이아웃 점유 0·CLS 0(스펙 §3-5)
//
// alt 원문 단어만 조합(작품명 + 스튜디오명 — 재창작 없음·파동4 규칙 승계).
// site.ts heroBackground(단일 이미지·구 p4)는 가역 보존 — 재활성화 시 src 를
// 단일 <Image> 로 되돌리면 됨(데이터 주석 참조).
const SLIDES = site.assets.heroSlides;
const SLIDE_ALTS = [
  "NeRyGe : To Slow — Studio Undesignated",
  "Louivis BeBe — Studio Undesignated",
  "The 10th YAHO Festival — Studio Undesignated",
  "Menbal Kindergarten — Studio Undesignated",
] as const;
const AUTO_INTERVAL_MS = 5000; // §2 설계값
const FADE_MS = 600; // §2 설계값
const SWIPE_THRESHOLD_PX = 40; // 스와이프 판정 임계(가로)

// 하이드레이션 게이트(감수 §5-15): 채움은 hydration 후 개시 — SSR 시 트랙만
// 정적 렌더(2px 오버레이·CLS 불유발). useSyncExternalStore 정석 패턴
// (eslint react-hooks/set-state-in-effect 회피 — §2 핵심지식 승계).
const emptySubscribe = () => () => {};
const useIsHydrated = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true, // 클라이언트 스냅샷
    () => false, // SSR·hydration 첫 렌더 스냅샷
  );

export default function Hero() {
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);
  const mounted = useIsHydrated();

  // 자동 전환 5,000ms 루프(§2 무결 설계값 — 값·루프 로직 재발명 없음).
  // 정책 A(스펙 §3-4 확정): prefers-reduced-motion 무시 — 구 mq.matches early
  // return 제거(reduce 환경에서도 자동전환·채움 유지 — mujagi 실측 §1-7 준거).
  // 타이머 재계(스펙 §2-2 결함 수정): [index] 의존 — 인덱스 변경(자동·수동 전부)마다
  // 인터벌 재구성. 수동 전환 시점부터 5,000ms 재계(채움 key={index} 리셋과 동일
  // 시계 — 수동 직후 0.5s 내 자동전환 겹침 0건이 검증 게이트).
  useEffect(() => {
    const timer = setInterval(
      () => setIndex((v) => (v + 1) % SLIDES.length),
      AUTO_INTERVAL_MS,
    );
    return () => clearInterval(timer);
  }, [index]);

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    // 좌→우 드래그(dx<0) = 다음 · 우→좌 드래그(dx>0) = 이전(루프)
    setIndex((v) =>
      dx < 0 ? (v + 1) % SLIDES.length : (v + SLIDES.length - 1) % SLIDES.length,
    );
  };
  const onPointerCancel = () => {
    startX.current = null;
  };

  return (
    <section>
      <div
        className="relative aspect-[2/3] w-full touch-pan-y overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {SLIDES.map((src, k) => (
          <Image
            key={src}
            src={src}
            alt={SLIDE_ALTS[k]}
            fill
            priority={k === 0}
            sizes="800px"
            style={{ transitionDuration: `${FADE_MS}ms` }}
            // pointer-events-none: <img> 기본 네이티브 드래그가 pointercancel 을
            // 유발해 컨테이너의 pointerup 을 삼키는 것을 방지(스와이프 실측 발견).
            // 입력은 컨테이너가 소유 — 프로그레스바는 비상호작용 오버레이(§3-3
            // 호버 무일시정지 — mujagi 실측 §1-5 준거).
            className={`pointer-events-none object-cover transition-opacity ${
              k === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        {/* 프로그레스바(타이머 겸 인디케이터) — 파동6-1c 스펙 §0·mujagi 실측 §1-2 준거.
            트랙: absolute 좌우/하단 인셋 8px·높이 2px(750 캔버스에서 734×2px)·
            rgba(255,255,255,0.3)·radius 0·항상 렌더(비활성 구간에도 표시 — §3-5).
            채움: #fff·scaleX(0→1) origin-left·5,000ms 선형(인터벌과 동일 단일 시계)·
            key={index} 리마운트로 슬라이드 구간마다 0에서 재개(§3-1: 채움 완료 =
            자동 전환 개시·fade 600ms 진행 중 이미 새 채움 — §1-4 동일).
            무텍스트(2px 순수 기하 — 바에 텍스트·수치 없음 §2-3). DOM 순서로 이미지 위.
            채움은 hydration 후 개시(mounted 게이트 — SSR HTML엔 트랙만, 감수 §5-15). */}
        <div className="absolute bottom-2 left-2 right-2 h-0.5 bg-[rgba(255,255,255,0.3)]">
          {mounted && (
            <div
              key={index}
              className="h-full w-full origin-left bg-white"
              style={{
                animation: `hero-progress ${AUTO_INTERVAL_MS}ms linear forwards`,
              }}
            />
          )}
        </div>
        {/* 채움 애니메이션 키프레임 — 컴포넌트 로컬(공유 CSS 무변경·scaleX 기법 스펙 §0) */}
        <style>{`
@keyframes hero-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
`}</style>
        {/* 닷 인디케이터 — 파동6-1c 제거(스펙 §3-6: 원본 mujagi에 닷 부재 실측 §1-6·
            프로그레스바가 인디케이터 대체·이중 인디케이터 절제 위반). 재지정 시 재삽입
            각본(키보드 슬라이드 직접 선택 경로 복원 — 이 블록을 그대로 되돌린다):
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {SLIDES.map((_, k) => (
            <button
              key={k}
              type="button"
              aria-label={`슬라이드 ${k + 1}`}
              aria-current={k === index ? "true" : undefined}
              onClick={() => setIndex(k)}
              className={`h-1 w-1 ${k === index ? "bg-text" : "bg-idle"}`}
            />
          ))}
        </div> */}
      </div>
    </section>
  );
}
