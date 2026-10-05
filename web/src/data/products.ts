// UDN 포트폴리오+상품 — 원본 홈(studioundesignated.com) HTML + 페이지 JS 청크 실측(2026-09-30)
// + 스마트스토어(자체 스토어) 실측(2026-10-01 — 파동5 수집1).
// - title: 원문 그대로(대괄호·콜론 포함). 령 2027은 스토어 상품명 원문.
// - category: 원본 카드 <span class="cert"> 실측값. [ NeRyGe : To Slow ]도 원본 HTML에서
//   cert "Total Branding" 확인됨(마크다운 변환 뷰에서는 누락되어 미표기로 오인됨).
// - description: 원본 모달 설명 원문 그대로(원문 오탈자 포함). Calendar 2종은 원본 사이트
//   청크에 설명 부재 — 미설정("Click to view…" 청크 문구는 렌더하지 않는 데이터 필드 원문).
// - artistNote: 스마트스토어 상세 설명 원문 전문(파동5 B2·검수 승인 ② — 발췌 금지·원문 전체).
//   artist-notes.ts 참조(python이 원본 txt에서 바이트 보존 생성).
// - price·link: 가격 현재가 원칙(파동4 "카피 원문만"의 유일 예외 — service-lead 확정).
//   관측: 2026-10-01 09:20 KST 스토어 재확인(기존 가격 기록 보존용 주석).
//
// 파동5 B1(2026-10-01·muos3okq61ob + 보강 muos4z6xg80x) — kind 스키마 + §7 비율 필드:
// - kind: "product"(판매 상품 — PRODUCTS 축) | "work"(작품 — PORTFOLIO 축).
//   캘린더 2026·령 2027 = product·작품 6건 = work.
// - aspect: 대표 이미지 원본 비율 "W/H"(§7 상세 축 — 원본 전폡 무크롭·PIL 실측 2026-10-01).
// - objectPosition: 카드 크롭 앵커(§7 특례) — p3(the TOV)만 "100% 50%"(워드마크 x[1567,1841]
//   창 내 포함 기하 계산·검수 승인 muos2v2imfo9 ③). 미지정 = 50% 50% 기본.
// - detailImages: 상세 부가 이미지 {src, aspect}[](§7 상세 축 원본 전폡 — B2 통합 스키마.
//   구 string[]·detailImageAssets 폐지).
// - 카드 비율 확정: **3:4(0.750)** — qa-visual 신제품 판독(2:3 심손실 vs 3:4 경미)·
//   달력 무해(이중 검증 1px 일치)·p2·p7 우위(근거 docs/qa-visual/wave5-crop-observation.md §5~6).
//   구현은 globals.css aspect-card 공용 토큰 1곳(3/4).
//
// 파동5 B2(muosdkwtl1yu ②) — §3 PRODUCTS 재구성:
// - 령 2027 신규(자산 8종 md5 원장 대조 반입 — rep·detail 1~6·declaration).
// - 캘린더 가격은 운영 할인 정책에 따라 별도 관리·detail 4종(파동4 수집 d1~4).
// - 순서: 원본 홈 순서 7건 + 령 append(§5 — 원본 순서가 유일한 순서 신호).

import {
  ARTIST_NOTE_CALENDAR_2026,
  ARTIST_NOTE_RYEONG_2027,
} from "./artist-notes";

export type ProductCategory =
  | "Total Branding"
  | "Exhibition Poster"
  | "Poster"
  | "Calendar"
  | "Goods";

/** 파동5 §1 IA — 판매 상품(PRODUCTS 축) vs 작품(PORTFOLIO 축) */
export type ProductKind = "product" | "work";

/** 상세 부가 이미지 — §7 상세 축(원본 비율 전폡·무크롭) */
export interface ProductImageAsset {
  src: string;
  aspect: string;
}

export interface Product {
  slug: string;
  title: string;
  category: ProductCategory;
  kind: ProductKind;
  image: string;
  /** 상품 목록에서 사용할 대표 이미지(옵션 상품은 공통 메인 사진). */
  listingImage?: string;
  listingAspect?: string;
  listingTitle?: string;
  /** 대표 이미지 원본 비율 "W/H"(§7 상세 축 — PIL 실측).
   *  파동5 B3: required로 전환 — 전 8항목 보유(작품 6·캘린더·령)·저널 상세 전폡(journal.ts
   *  aspect 승계)이 의존. 누락 시 빌드 실패(전폡은 실측 비율만 — 폴백 값 발명 금지). */
  aspect: string;
  /** 카드 크롭 앵커(§7 특례 — p3 워드마크 보존). 미지정 시 50% 50% */
  objectPosition?: string;
  /** 상세 부가 이미지(§7 원본 비율 전폡 — B2 통합 스키마) */
  detailImages?: ProductImageAsset[];
  /** 원본 설명 원문 — 없는 항목은 undefined(지어내지 않음) */
  description?: string;
  /** 스마트스토어 상세 설명 원문 전문(§3 작가노트 배치 — 검수 승인 ②) */
  artistNote?: string;
  /** KRW — 현재가 원칙(관측 시각 주석 참조) */
  price?: number;
  /** 가격 표기(예: "50,000 KRW") */
  priceLabel?: string;
  /** 구매 링크(스마트스토어) */
  link?: string;
  /** 공개 상품 목록에서 숨기고 관리자 테스트 화면에서만 사용하는 상품 */
  adminOnly?: boolean;
  /** 관리자 결제 연동 확인용 상품은 배송 대상이 아니므로 배송비를 부과하지 않는다. */
  freeShipping?: boolean;
  /** 같은 상품의 옵션을 묶는 키. 개별 옵션도 주문 가능한 상품으로 유지한다. */
  optionGroup?: string;
  optionLabel?: string;
}

export const CATEGORY_FILTERS = [
  "All",
  "Total Branding",
  "Exhibition Poster",
  "Poster",
  "Calendar",
  "Goods",
] as const;

/** PORTFOLIO 브랜드탭(§4) — Calendar 제외(캘린더 2종은 PRODUCTS 소속) */
export const WORK_CATEGORY_FILTERS = [
  "All",
  "Total Branding",
  "Exhibition Poster",
  "Poster",
] as const;

export type CategoryFilter = (typeof CATEGORY_FILTERS)[number];

export const products: Product[] = [
  {
    slug: "test-payment-100",
    title: "관리자 전용 결제 테스트",
    category: "Calendar",
    kind: "product",
    // 별도 공개 자산을 만들지 않고 기존 스튜디오 상품 이미지를 테스트 화면의 표지로 사용한다.
    image: "/assets/portfolio_images/portfolio_1.jpg",
    aspect: "3012/4799",
    price: 100,
    priceLabel: "100 KRW",
    description: "관리자만 NICEPAY 결제·취소 흐름을 점검하기 위한 비판매 테스트 상품입니다.",
    adminOnly: true,
    freeShipping: true,
  },
  {
    slug: "udn-calendar-2026",
    title: "UDN Calendar 2026 제철달력 령令",
    category: "Calendar",
    kind: "product",
    // 파동4(대표 피드백 3번): 스마트스토어 대표 자체 스토어 원본 상품 이미지로 교체
    // (2026-09-30, https://smartstore.naver.com/studioudn/products/12907475385 대표 이미지
    //  3012×4799 JPEG — 기존 258×454 PNG는 750px 표시에 2.9배 업스케일로 흐릿했음)
    image: "/assets/portfolio_images/portfolio_1.jpg",
    aspect: "3012/4799",
    // 파동5 B2: 스토어 상세 원본 4종(3012×4799·파동4 수집 d1~4 — md5 대조 반입)
    detailImages: [
      { src: "/assets/portfolio_images/udn-calendar-2026/detail_1.jpg", aspect: "3012/4799" },
      { src: "/assets/portfolio_images/udn-calendar-2026/detail_2.jpg", aspect: "3012/4799" },
      { src: "/assets/portfolio_images/udn-calendar-2026/detail_3.jpg", aspect: "3012/4799" },
      { src: "/assets/portfolio_images/udn-calendar-2026/detail_4.jpg", aspect: "3012/4799" },
    ],
    // 원본(홈 카드·모달)에 설명 문구 없음 — 미설정(스토어 청크 "Click to view…"는 렌더 안 함)
    artistNote: ARTIST_NOTE_CALENDAR_2026,
    // 운영 할인: 기존 50,000원에서 90% 할인된 5,000원
    price: 5000,
    priceLabel: "5,000 KRW",
    link: "https://smartstore.naver.com/studioudn/products/12907475385",
  },
  {
    slug: "rok-masking-tape-green",
    title: "록 Rok 제철음식 마스킹 테이프 1개, 20mm×7m, 그린",
    listingTitle: "록 Rok 제철음식 마스킹 테이프",
    category: "Goods",
    kind: "product",
    image: "/assets/products/rok-masking-tape/green.png",
    listingImage: "/assets/products/rok-masking-tape/main.jpg",
    listingAspect: "3959/2922",
    aspect: "3959/2922",
    description: "제철음식과 계절의 기록을 담은 제철테잎 록(錄) 그린.",
    price: 6000,
    priceLabel: "6,000 KRW",
    link: "https://smartstore.naver.com/studioudn/products/13791005349",
    optionGroup: "rok-masking-tape",
    optionLabel: "그린 · 20mm × 7m",
  },
  {
    slug: "rok-masking-tape-peach",
    title: "록 Rok 제철음식 마스킹 테이프 1개, 20mm×7m, 피치",
    listingTitle: "록 Rok 제철음식 마스킹 테이프",
    category: "Goods",
    kind: "product",
    image: "/assets/products/rok-masking-tape/peach.png",
    listingImage: "/assets/products/rok-masking-tape/main.jpg",
    listingAspect: "3959/2922",
    aspect: "2829/2122",
    description: "제철음식과 계절의 기록을 담은 제철테잎 록(錄) 피치.",
    price: 6000,
    priceLabel: "6,000 KRW",
    link: "https://smartstore.naver.com/studioudn/products/13791005348",
    optionGroup: "rok-masking-tape",
    optionLabel: "피치 · 20mm × 7m",
  },
  {
    slug: "rok-masking-tape-nordic-blue",
    title: "록 Rok 제철음식 마스킹 테이프 1개, 15mm×7m, 노틱블루",
    listingTitle: "록 Rok 제철음식 마스킹 테이프",
    category: "Goods",
    kind: "product",
    image: "/assets/products/rok-masking-tape/blue.png",
    listingImage: "/assets/products/rok-masking-tape/main.jpg",
    listingAspect: "3959/2922",
    aspect: "2829/2122",
    description: "제철음식과 계절의 기록을 담은 제철테잎 록(錄) 노틱블루.",
    price: 5000,
    priceLabel: "5,000 KRW",
    link: "https://smartstore.naver.com/studioudn/products/13791005347",
    optionGroup: "rok-masking-tape",
    optionLabel: "노틱블루 · 15mm × 7m",
  },
  {
    slug: "rok-masking-tape-purple",
    title: "록 Rok 제철음식 마스킹 테이프 1개, 15mm×7m, 퍼플",
    listingTitle: "록 Rok 제철음식 마스킹 테이프",
    category: "Goods",
    kind: "product",
    image: "/assets/products/rok-masking-tape/purple.png",
    listingImage: "/assets/products/rok-masking-tape/main.jpg",
    listingAspect: "3959/2922",
    aspect: "2829/2122",
    description: "제철음식과 계절의 기록을 담은 제철테잎 록(錄) 퍼플.",
    price: 5000,
    priceLabel: "5,000 KRW",
    link: "https://smartstore.naver.com/studioudn/products/13791005346",
    optionGroup: "rok-masking-tape",
    optionLabel: "퍼플 · 15mm × 7m",
  },
  {
    slug: "neryge-to-slow",
    title: "NeRyGe : To Slow",
    category: "Total Branding",
    kind: "work",
    image: "/assets/portfolio_images/portfolio_2.jpg",
    aspect: "750/938",
    // §7 상세 축 원본 전폡(파동5 B1→B2 통합 스키마) — PIL 실측 2026-10-01
    detailImages: [
      { src: "/assets/portfolio_images/portfolio_2/1.jpeg", aspect: "750/938" },
      { src: "/assets/portfolio_images/portfolio_2/2.jpg", aspect: "1206/1206" },
      { src: "/assets/portfolio_images/portfolio_2/3.jpeg", aspect: "750/939" },
      { src: "/assets/portfolio_images/portfolio_2/4.jpeg", aspect: "750/938" },
    ],
    description:
      "the cake house in Naju, Jeonam, Korea convey the meaning of speed in right time, NeRyGe, on its logo with its cakebox and businesscard ",
  },
  {
    slug: "the-tov",
    title: "the TOV",
    category: "Total Branding",
    kind: "work",
    image: "/assets/portfolio_images/portfolio_3.jpg",
    aspect: "1920/1686",
    // §7 특례(검수 승인 ③): 워드마크 x[1567,1841] 카드 창 내 포함(우측 정렬) —
    // 좌측 한글 라벨 말단 2차 손실 감수(워드마크 > 라벨)
    objectPosition: "100% 50%",
    description:
      "publishing company in Gwaheon, Kyunggido, Korea A Hangul logo design inspired by Korean Palgwe (which can be seen on South Korean  lag, the Eight Trigrams) representing book and barcode as well as the Korean word TOV",
  },
  {
    slug: "louivis-bebe",
    title: "Louivis BeBe",
    category: "Total Branding",
    kind: "work",
    image: "/assets/portfolio_images/portfolio_4.jpg",
    aspect: "1754/2539",
    description:
      "A party, catering, and banquet company that primarily prepares first-birthday celebrations for children and milestone birthday banquets for adults, serving as a bridge that connects past and present, and links tradition with modernity.",
  },
  {
    slug: "flowing-lines-staying-moon",
    title: "Flowing Lines, Staying Moon",
    category: "Exhibition Poster",
    kind: "work",
    image: "/assets/portfolio_images/portfolio_5.jpg",
    aspect: "1181/2231",
    description:
      "Reimagining the painterly style of artist Yuyeon, the lines were set in motion while the moon was made to linger. A business card composed of luminous lines was also produced as part of the project.",
  },
  {
    slug: "the-10th-yaho-festival",
    title: "The 10th YAHO Festival",
    category: "Poster",
    kind: "work",
    image: "/assets/portfolio_images/portfolio_6.jpg",
    aspect: "1181/1670",
    description:
      "A poster commissioned by the Jung-gu Youth Center in Seoul. The typography was designed to suit Deoksugung Stone Wall Road, a historically significant site in Korea, and Korean traditional mother-of-pearl (najeon) material was incorporated.",
  },
  {
    slug: "menbal-kindergarten",
    title: "Menbal Kindergarten",
    category: "Total Branding",
    kind: "work",
    image: "/assets/portfolio_images/portfolio_7.jpg",
    aspect: "1920/1807",
    // 파동7-3(mupf5norues9) — IG 확보분 중복 추가(qa-visual 판정: MENBAL 워드마크·
    // UDN abstract 아트 동일성 확인·소재·색상 상이로 추가 가치): 화이트 티 목업(아동+
    // 성인·175/75)·티 실물·버킷햇 4종. 출처: instagram.com DC9Vv-FSSQN(통과 4/5·
    // 자식 1 스토어 UI·6 아동 얼굴 제외 — 1차 결정 유지). 원본 바이트 그대로·편집 0.
    detailImages: [
      { src: "/assets/portfolio_images/menbal-kindergarten/detail_1.jpg", aspect: "720/720" },
      { src: "/assets/portfolio_images/menbal-kindergarten/detail_2.jpg", aspect: "720/720" },
      { src: "/assets/portfolio_images/menbal-kindergarten/detail_3.jpg", aspect: "1080/1080" },
      { src: "/assets/portfolio_images/menbal-kindergarten/detail_4.jpg", aspect: "1080/1080" },
    ],
    description:
      "Logo and T-shirt production. The logo was printed large on the back to enhance visibility so that children and teachers can recognize one another.",
  },
  {
    // 파동5 B2(§3·muosdkwtl1yu ②) — 신제품 령 2027. 원문 출처: wave5-asset-ledger(수집1).
    // 파동7 번외(mup3nyil3bt2) — 스마트스토어 이미지 갱신 반영(2026-10-01 재수집·원장 §7):
    // 대표·옵션 전면 교체(신규 업로드 20261001_*·PNG 혼합)·선언문 제거·SPREAD 컷 추가·
    // 가격 25000→20000. 구 8종(20260919 세트)은 _v1_20260919/ 보존(삭제 금지 준수).
    slug: "ryeong-2027",
    // 스마트스토어 상품명 원문 그대로(원장 §1·2026-10-01 관측)
    title: "2027 달력 UDN 제철 캘린더 령令",
    category: "Calendar",
    kind: "product",
    // 신 대표(2차 갱신 — md5 3c300eb0…·947×1661·원장 §7 2차·2026-10-01 재추출 PRELOADED_STATE).
    // ※ dev 변형 캐시 잔상: 3300(무재기동)의 _next/image w=750 webp 변형이 구 rep.png 시점
    // 바이트를 재사용(natural 750×1000·원본 947×1661 — curl png 변형은 신규 750×1315 서빙
    // 실측). object-cover·컨테이너 aspect 947/1661(750×1315)로 렌더되므로 왜곡 0(가로 크롭만)
    // ·자산 GET md5는 신규 정상. 3300 재기동(감수 국면) 시 변형 캐시 재생성으로 자동 해소 —
    // 캐시버스터 쿼리(?v=) 시도는 localPatterns 재기동 필요로 기각(500 붕괴 실측 후 복구).
    image: "/assets/portfolio_images/ryeong-2027/rep.png",
    aspect: "947/1661",
    // 스토어 실제 구성과 동등(파동5 검수 원칙 승계): 2차 갱신(원장 §7 2차 — board mup67e4uyywc·
    // 대표 지시 "2027년 달력 스마트스토어 이미지가 변경됐어. 참고해서 다시 맞춰서 변경해"):
    // 신규 대표 DQx9d(947×1661)가 맨 앞에 추가되고 구 대표(gO7hk·1086×1448·92cb6ea2)가
    // 옵션1로 시프트 — 옵션 4종(구 대표+기존 3종·바이트 전부 1차와 동일)·상세 SPREAD는
    // 스토어에서 제거됨(참조 제거·spread.jpg 파일은 보존 — 재등장 시 이 자리 복귀).
    // 구 대표 바이트 활성 배치 = detail_6.png 신규(파일명 체계 유지·구 rep.png은
    // _v1_20261001/rep_v1_20261001_gO7hk.png 보존). 옵션 순서 = 스토어 optionalImageUrls 순서.
    // 파동7-3 스레드 파이프라인(mup40p3u69v9·qa-visual 판정 mup4ht7j9mr4 = ② 갤러리 추가):
    // detail_4/5.jpg = 스레드 게시물 본문 이미지 2종(고해상도 원본 바이트 그대로·편집 0).
    // 출처: threads.com/@design_studio_undesignated/post/Dd2z7SAEV4Z (2026-09-29 게시)
    // 캡션 원문(스레드 — 그대로·재작성 0): "곧 나오게 될 제철달력 령 2027, 이번엔 스프링마저도
    // 종이로 제작된다. 크기는 작은 탁상달력. 오탈자는 언제나 그렇듯 알바비도 받지 못하는 남편과
    // 아들. 나는 이렇게 도움을 받아 나의 부족한 부분을 채워가고 있다. 날짜도 중요하지만 매일의
    // 삶이 더 중요하다. 숫자도 중요하지만 매일의 먹거리도 중요하다. 정말 놓치지 말아야 할 것은
    // 그런 게 아닐런지." (령 2027 제작기 — detail_4: 표지+월 시트 작업대·detail_5: 월 시트 후면
    // copyright©studioudn 인쇄 컷. 관찰: detail_5는 일부 시트 90° 회전 배치·detail_4 10월 시트에
    // 핑크 포스트잇 — 제작 과정 흔적 원본 그대로. 원장 §8·보고서 wave7-threads-pipeline.md)
    detailImages: [
      { src: "/assets/portfolio_images/ryeong-2027/detail_6.png", aspect: "1086/1448" },
      { src: "/assets/portfolio_images/ryeong-2027/detail_1.png", aspect: "1073/1466" },
      { src: "/assets/portfolio_images/ryeong-2027/detail_2.jpg", aspect: "3479/3918" },
      { src: "/assets/portfolio_images/ryeong-2027/detail_3.png", aspect: "1123/1401" },
      // 작업 과정 사진(detail_4·detail_5)은 상품 상세에서 제외한다.
      // 파동7-3(mupf5norues9) — IG 확보분 중복 추가: Dd2z6CwEeIP_1(시트 확대 컷·
      // md5 cdbe93af·1080×810 — 기존 8종과 미중복). _2(detail_5 동일 촬영 저해상)는
      // qa-visual 미반영 권고 준수 — 미추가. 출처: instagram.com DC9WOdDSmwj 계열 아님·
      // Dd2z6CwEeIP 게시물(원본 바이트 그대로·편집 0).
      { src: "/assets/portfolio_images/ryeong-2027/detail_7.jpg", aspect: "1080/810" },
      { src: "/assets/portfolio_images/ryeong-2027/new-photos/cover-styled.jpg", aspect: "2829/4964" },
      { src: "/assets/portfolio_images/ryeong-2027/new-photos/back-panel.jpg", aspect: "3479/3918" },
      { src: "/assets/portfolio_images/ryeong-2027/new-photos/january-spread.jpg", aspect: "2829/4964" },
      { src: "/assets/portfolio_images/ryeong-2027/new-photos/standing-lilac.jpg", aspect: "2829/4964" },
      { src: "/assets/portfolio_images/ryeong-2027/new-photos/march-green.jpg", aspect: "2829/4964" },
      { src: "/assets/portfolio_images/ryeong-2027/new-photos/january-detail.jpg", aspect: "2829/4964" },
    ],
    // 원문 description 부재(원본 사이트 청크 부재 — 지어내지 않음)
    artistNote: ARTIST_NOTE_RYEONG_2027,
    // 현재가(원장 §7 2차 재확인 — dispSalePrice 20000·2026-10-01 2차 재추출·변동 없음)
    price: 20000,
    priceLabel: "20,000 KRW",
    link: "https://smartstore.naver.com/studioudn/products/13767984847",
  },
  {
    // 파동7-3(mupf5norues9) — 인스타 확보분 반영(qa-visual 판독 mupf59ufjt30 정본
    // wave13-ig-triage.md). 신규 1: 두근두근방과후 교육포스터(신규 확정 4/4).
    // 출처: instagram.com 게시물 DC9WOdDSmwj(캐러셀 4장·원본 바이트 그대로·편집 0).
    // 캡션 원문(full-captions.json — 재작성 0): "studioUDN / 두근두근방과후 교육포스터들
    // -스키마독서 -진로설정과 홀랜드검사 -두근두근 댄스수업".
    // designer 감수 확정(mupfk5she6me·2026-10-01 — Poster·work·Book 미신설·연도별 분리
    // 적용·docs/designer/wave7-3-ig-review.md).
    slug: "dubgeuk-after-school-posters",
    title: "두근두근방과후 교육포스터",
    category: "Poster",
    kind: "work",
    image: "/assets/portfolio_images/dubgeuk-after-school-posters/rep.jpg",
    aspect: "1080/1080",
    detailImages: [
      { src: "/assets/portfolio_images/dubgeuk-after-school-posters/detail_1.jpg", aspect: "720/720" },
      { src: "/assets/portfolio_images/dubgeuk-after-school-posters/detail_2.jpg", aspect: "1080/1080" },
      { src: "/assets/portfolio_images/dubgeuk-after-school-posters/detail_3.jpg", aspect: "1080/1080" },
    ],
    description:
      "두근두근방과후 교육포스터들\n\n-스키마독서\n-진로설정과 홀랜드검사\n-두근두근 댄스수업",
  },
  {
    // 파동7-3 — 신규 2: theTOVbooks 『놀라운 환대』(책 표지+출판 마케팅 4/4).
    // 출처: instagram.com 게시물 DC9b2jHy2mF(캐러셀 4장·원본 바이트 그대로·편집 0).
    // 기존 the-tov(보라 명함 브랜딩)와 세계관 동일·소재 상이 — qa-visual 신규 항목 판정.
    // ※ detail_2·3(VORA SHOW 이벤트 배너)에 실존 인물(본인측 마케팅·채널 공개 자산)
    //   사진 포함 — designer 유지 의견·대표 확인 대기(보고서 wave7-3-ig-reflect.md).
    // 캡션 원문: "studioUDN theTOVbooks / 놀라운 환대 출판 기념 / 교보문고 보라쇼 /
    // 더토브에서 확인하세요!". designer 감수 확정(mupfk5she6me·2026-10-01 —
    // Total Branding·work·Book 미신설·감수 사유 3[체계 보존·필터 카디널리티·세계관
    // 연속성]·docs/designer/wave7-3-ig-review.md §②).
    slug: "the-tov-books",
    title: "studioUDN/theTOVbooks/놀라운 환대",
    category: "Total Branding",
    kind: "work",
    image: "/assets/portfolio_images/the-tov-books/rep.jpg",
    aspect: "1080/1080",
    detailImages: [
      { src: "/assets/portfolio_images/the-tov-books/detail_1.jpg", aspect: "1080/1080" },
      { src: "/assets/portfolio_images/the-tov-books/detail_2.jpg", aspect: "1080/1080" },
      { src: "/assets/portfolio_images/the-tov-books/detail_3.jpg", aspect: "1080/1080" },
    ],
    description:
      "놀라운 환대 출판 기념\n교보문고 보라쇼\n더토브에서 확인하세요!",
  },
  {
    slug: "rainbow-school-information-session",
    title: "초등무지개학교 입학설명회",
    category: "Poster",
    kind: "work",
    image: "/assets/portfolio_images/rainbow-school/rep.jpg",
    aspect: "842/1191",
    description: "초등무지개학교 입학설명회 포스터",
  },
  {
    slug: "studio-udn-director-card",
    title: "studioUDN 디렉터 명함",
    category: "Total Branding",
    kind: "work",
    image: "/assets/portfolio_images/studio-udn-director-card/rep.jpg",
    aspect: "3024/4032",
    description: "studioUDN 디렉터 명함 디자인",
  },
  {
    slug: "chusa-art-festival-goods",
    title: "추사아트페스티벌 체험용 부스 굿즈 디자인",
    category: "Total Branding",
    kind: "work",
    image: "/assets/portfolio_images/chusa-art-festival-goods/rep.jpg",
    aspect: "1080/1080",
    detailImages: [
      { src: "/assets/portfolio_images/chusa-art-festival-goods/detail_1.jpg", aspect: "1080/1080" },
      { src: "/assets/portfolio_images/chusa-art-festival-goods/detail_2.jpg", aspect: "1440/1440" },
      { src: "/assets/portfolio_images/chusa-art-festival-goods/detail_3.jpg", aspect: "1440/1440" },
      { src: "/assets/portfolio_images/chusa-art-festival-goods/detail_4.jpg", aspect: "1440/1440" },
      { src: "/assets/portfolio_images/chusa-art-festival-goods/detail_5.jpg", aspect: "1440/1440" },
    ],
    description: "추사아트페스티벌 체험용 부스 굿즈 디자인",
  },
  {
    slug: "daedong-bookstore-event",
    title: "안양 대동문고 서점이벤트",
    category: "Poster",
    kind: "work",
    image: "/assets/portfolio_images/daedong-bookstore-event/rep.jpg",
    aspect: "1440/1440",
    detailImages: [
      { src: "/assets/portfolio_images/daedong-bookstore-event/detail_1.jpg", aspect: "1440/1440" },
      { src: "/assets/portfolio_images/daedong-bookstore-event/detail_2.jpg", aspect: "1440/1440" },
      { src: "/assets/portfolio_images/picture-books-grown-up/rep.jpg", aspect: "7087/21260" },
    ],
    description: "안양 대동문고 서점이벤트 및 어른을 위한 그림책 공부 포스터·X배너",
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getWorks(): Product[] {
  return products.filter((p) => p.kind === "work");
}
