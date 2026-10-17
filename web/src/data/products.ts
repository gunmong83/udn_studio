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
  ARTIST_NOTE_ROK_MASKING_TAPE,
} from "./artist-notes";

export type ProductCategory =
  | "Total Branding"
  | "Editorial Design"
  | "Packaging Design"
  | "Exhibition Design"
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
  /** 옵션별 이미지가 아닌 공통 상세 이미지를 표시할 때 false */
  optionGallery?: boolean;
  /** 원본 설명 원문 — 없는 항목은 undefined(지어내지 않음) */
  description?: string;
  /** 스마트스토어 상세 설명 원문 전문(§3 작가노트 배치 — 검수 승인 ②) */
  artistNote?: string;
  /** KRW — 현재가 원칙(관측 시각 주석 참조) */
  price?: number;
  /** 가격 표기(예: "50,000 KRW") */
  priceLabel?: string;
  /** 현재 판매를 중지한 상품 — 상세·목록에는 노출하되 구매 CTA를 비활성화한다. */
  soldOut?: boolean;
  /** 목록·상세에서 옵션 가격 범위를 함께 보여줄 때 사용 */
  displayPriceLabel?: string;
  /** 구매 링크(스마트스토어) */
  link?: string;
  /** 공개 상품 목록에서 숨기고 관리자 테스트 화면에서만 사용하는 상품 */
  adminOnly?: boolean;
  /** 관리자 결제 연동 확인용 상품은 배송 대상이 아니므로 배송비를 부과하지 않는다. */
  freeShipping?: boolean;
  /** 함께 포장할 수 있는 배송 그룹 */
  shippingGroup?: string;
  /** 같은 상품의 옵션을 묶는 키. 개별 옵션도 주문 가능한 상품으로 유지한다. */
  optionGroup?: string;
  optionLabel?: string;
}

export const CATEGORY_FILTERS = [
  "All",
  "Total Branding",
  "Editorial Design",
  "Packaging Design",
  "Exhibition Design",
  "Exhibition Poster",
  "Poster",
  "Calendar",
  "Goods",
] as const;

/** PORTFOLIO 브랜드탭(§4) — Calendar 제외(캘린더 2종은 PRODUCTS 소속) */
export const WORK_CATEGORY_FILTERS = [
  "All",
  "Total Branding",
  "Editorial Design",
  "Packaging Design",
  "Exhibition Design",
  "Exhibition Poster",
  "Poster",
  "Goods",
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
    title: "UDN Calendar 2026 Food in Season [令 Ryung]",
    category: "Calendar",
    kind: "product",
    // 파동4(대표 피드백 3번): 스마트스토어 대표 자체 스토어 원본 상품 이미지로 교체
    // (2026-09-30, https://smartstore.naver.com/studioudn/products/12907475385 대표 이미지
    //  3012×4799 JPEG — 기존 258×454 PNG는 750px 표시에 2.9배 업스케일로 흐릿했음)
    image: "/assets/portfolio_images/udn-calendar-2026/main.png",
    aspect: "3959/2922",
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
    shippingGroup: "calendar-2026",
    link: "https://smartstore.naver.com/studioudn/products/12907475385",
  },
  {
    slug: "rok-masking-tape-green",
    title: "UDN Masking Tape Food in Season [錄 Rok]",
    listingTitle: "UDN Masking Tape Food in Season [錄 Rok]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/rok-masking-tape/green.png",
    listingImage: "/assets/products/rok-masking-tape/main.jpg",
    listingAspect: "3959/2922",
    aspect: "3959/2922",
    detailImages: [
      { src: "/assets/products/rok-masking-tape/peach.png", aspect: "2829/2122" },
      { src: "/assets/products/rok-masking-tape/blue.png", aspect: "2829/2122" },
      { src: "/assets/products/rok-masking-tape/purple.png", aspect: "2829/2122" },
    ],
    description: "제철음식과 계절의 기록을 담은 제철테잎 록(錄) 그린.",
    artistNote: ARTIST_NOTE_ROK_MASKING_TAPE,
    price: 6000,
    priceLabel: "6,000 KRW",
    displayPriceLabel: "5,000~6,000 KRW",
    link: "https://smartstore.naver.com/studioudn/products/13791005349",
    optionGroup: "rok-masking-tape",
    optionLabel: "수산물 2 (그린 · 20mm × 7m) · +1,000원",
    shippingGroup: "calendar-2027-tape",
  },
  {
    slug: "rok-masking-tape-peach",
    title: "UDN Masking Tape Food in Season [錄 Rok]",
    listingTitle: "UDN Masking Tape Food in Season [錄 Rok]",
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
    optionLabel: "수산물 1 (피치 · 20mm × 7m) · +1,000원",
    shippingGroup: "calendar-2027-tape",
  },
  {
    slug: "rok-masking-tape-nordic-blue",
    title: "UDN Masking Tape Food in Season [錄 Rok]",
    listingTitle: "UDN Masking Tape Food in Season [錄 Rok]",
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
    optionLabel: "야채 (노틱블루 · 15mm × 7m)",
    shippingGroup: "calendar-2027-tape",
  },
  {
    slug: "rok-masking-tape-purple",
    title: "UDN Masking Tape Food in Season [錄 Rok]",
    listingTitle: "UDN Masking Tape Food in Season [錄 Rok]",
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
    optionLabel: "생선 (퍼플 · 15mm × 7m)",
    shippingGroup: "calendar-2027-tape",
  },
  {
    slug: "che-postcard-2026",
    title: "UDN PostCard 2026 Edible flowers in Season [彩 Che]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/che-postcard-2026/main.jpg",
    aspect: "3959/2922",
    description: `the Vessel series 02
[彩]Che, the color of mind
Edible flowers in season Post Card
100x148mm`,
    price: 2000,
    priceLabel: "2,000 KRW",
    soldOut: true,
    optionGroup: "che-postcard-2026",
    shippingGroup: "che-postcard-2026",
  },
  {
    slug: "che-postcard-2026-fruits",
    title: "UDN PostCard 2026 Fruits in Season [彩 Che]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/che-postcard-2026-fruits/main.jpg",
    aspect: "3959/2922",
    description: `the Vessel series 02
[彩]CHE, the color of mind
Fruits in season Post Card
100x148mm

마음을 담는 그릇의 채색 시리즈 [彩]Che의 과실수 버젼입니다. 열매들은 마치 마음을 모으고 모아 결과로서 세상에 남기는 것 같습니다. 갖가지 색으로 맺는 결실들을 바라보며 우리도 어떠한 결실을 맺기 위해 우리의 마음의 색들을 모으고 있지 않을까 생각합니다. 제 자신의 계절의 색과 마음을 떠올려봅니다.

This is the fruit-bearing tree edition of Che [彩], the Colors of the Heart series from A Vessel for the Heart. Fruit seems to gather the heart, little by little, until it ripens into something tangible and leaves its presence in the world. As I look upon these fruits, each coming to fruition in its own hue, I wonder whether we, too, are gathering the many colors of our hearts toward something we hope one day to bring to fruition. I find myself contemplating the colors and feelings of the season that is uniquely my own.`,
    price: 2000,
    priceLabel: "2,000 KRW",
    soldOut: true,
    optionGroup: "che-postcard-2026-fruits",
    shippingGroup: "che-postcard-2026-fruits",
  },
  {
    slug: "che-postcard-2026-fruits-spring-strawberry",
    title: "UDN PostCard 2026 Fruits in Season [彩 Che]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/che-postcard-2026-fruits/spring-strawberry.jpg",
    aspect: "3959/2922",
    price: 2000,
    priceLabel: "2,000 KRW",
    soldOut: true,
    optionGroup: "che-postcard-2026-fruits",
    optionLabel: "봄 (딸기) · 2,000원",
    shippingGroup: "che-postcard-2026-fruits",
  },
  {
    slug: "che-postcard-2026-fruits-spring-cheonhyehyang",
    title: "UDN PostCard 2026 Fruits in Season [彩 Che]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/che-postcard-2026-fruits/spring-cheonhyehyang.jpg",
    aspect: "3959/2922",
    price: 2000,
    priceLabel: "2,000 KRW",
    soldOut: true,
    optionGroup: "che-postcard-2026-fruits",
    optionLabel: "봄 (천혜향) · 2,000원",
    shippingGroup: "che-postcard-2026-fruits",
  },
  {
    slug: "che-postcard-2026-fruits-summer-maesil",
    title: "UDN PostCard 2026 Fruits in Season [彩 Che]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/che-postcard-2026-fruits/summer-maesil.jpg",
    aspect: "3959/2922",
    price: 2000,
    priceLabel: "2,000 KRW",
    soldOut: true,
    optionGroup: "che-postcard-2026-fruits",
    optionLabel: "여름 (매실) · 2,000원",
    shippingGroup: "che-postcard-2026-fruits",
  },
  {
    slug: "che-postcard-2026-fruits-summer-peach",
    title: "UDN PostCard 2026 Fruits in Season [彩 Che]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/che-postcard-2026-fruits/summer-peach.jpg",
    aspect: "3959/2922",
    price: 2000,
    priceLabel: "2,000 KRW",
    soldOut: true,
    optionGroup: "che-postcard-2026-fruits",
    optionLabel: "여름 (복숭아) · 2,000원",
    shippingGroup: "che-postcard-2026-fruits",
  },
  {
    slug: "che-postcard-2026-fruits-autumn-grape",
    title: "UDN PostCard 2026 Fruits in Season [彩 Che]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/che-postcard-2026-fruits/autumn-grape.jpg",
    aspect: "3959/2922",
    price: 2000,
    priceLabel: "2,000 KRW",
    soldOut: true,
    optionGroup: "che-postcard-2026-fruits",
    optionLabel: "가을 (포도) · 2,000원",
    shippingGroup: "che-postcard-2026-fruits",
  },
  {
    slug: "che-postcard-2026-fruits-autumn-persimmon",
    title: "UDN PostCard 2026 Fruits in Season [彩 Che]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/che-postcard-2026-fruits/autumn-persimmon.jpg",
    aspect: "3959/2922",
    price: 2000,
    priceLabel: "2,000 KRW",
    soldOut: true,
    optionGroup: "che-postcard-2026-fruits",
    optionLabel: "가을 (감) · 2,000원",
    shippingGroup: "che-postcard-2026-fruits",
  },
  {
    slug: "che-postcard-2026-fruits-winter-sansuyu",
    title: "UDN PostCard 2026 Fruits in Season [彩 Che]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/che-postcard-2026-fruits/winter-sansuyu.jpg",
    aspect: "3959/2922",
    price: 2000,
    priceLabel: "2,000 KRW",
    soldOut: true,
    optionGroup: "che-postcard-2026-fruits",
    optionLabel: "겨울 (산수유) · 2,000원",
    shippingGroup: "che-postcard-2026-fruits",
  },
  {
    slug: "che-postcard-2026-fruits-winter-yuja",
    title: "UDN PostCard 2026 Fruits in Season [彩 Che]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/che-postcard-2026-fruits/winter-yuja.jpg",
    aspect: "3959/2922",
    price: 2000,
    priceLabel: "2,000 KRW",
    soldOut: true,
    optionGroup: "che-postcard-2026-fruits",
    optionLabel: "겨울 (유자) · 2,000원",
    shippingGroup: "che-postcard-2026-fruits",
  },
  {
    slug: "buhm-postcard-2026",
    title: "UDN PostCard 2026 Geometric Net [範 Buhm]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/buhm-postcard-2026/main.jpg",
    aspect: "3959/2922",
    description: `the Vessel series 07
[範]Buhm, the Law of Structure
Amethyst Post Card
100x148mm

구조의 법을 담는 그릇, 범[範] 시리즈의 첫 번째 작품으로, 수학을 좋아하는 첫째 아이가 만든 전개도를 그래픽화 한 작업입니다. 구조를 관통하는 근본 원리, 법을 담는 이 그릇은 사물 안에 존재하는 구조적 질서를 표현합니다. 겉으로 보이는 것과 그 구조가 어떻게, 얼마나 다른지 직관적으로 알 수 있도록 전개도로 펼쳐두고 앞과 뒤에 담아 당신을 상상하게 만듭니다. 자수정이라고 이름을 지은 것은 전개도를 그린 아이가 붙여준 제목입니다. 그 결정을 닮았다고 느꼈다고 합니다.

The first work in Buhm[範], a series of vessels that hold The Law of Structure, transforms into a graphic composition a geometric net created by my eldest child, who loves mathematics. This vessel—holding the fundamental principle that runs through all structure—expresses the structural order inherent within things. The form is unfolded into a net and carried across the front and reverse, allowing us to perceive intuitively how, and how greatly, a thing may differ from the structure concealed within its outward appearance. In that space between the visible form and its underlying order, the work invites you to imagine. The title Amethyst was chosen by the child who drew the net. They felt that its form resembled the crystalline structure of an amethyst.`,
    price: 2000,
    priceLabel: "2,000 KRW",
    soldOut: false,
  },
  {
    slug: "che-sticker-2026-fruits",
    title: "UDN STICKER 2026 Fruits in season [彩 Che]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/che-sticker-2026-fruits/main.jpg",
    aspect: "3959/2922",
    description: `the Vessel series 02
[彩]Che, the color of mind
Fruits Character Sticker
200x140mm

마음을 담는 그릇의 색채 시리즈 채[彩]Che의 과실들 캐릭터 버젼입니다. 다양한 모양 속에 갖가지 감정과 표정이 드러납니다. 이토록 다채로움을 담은 색채 그릇, 채가 이번에는 좀 더 가볍고 다가가기 쉬운 형태로 단순화 되었습니다. 다이어리를 꾸미거나 동봉하는 편지지에 붙여도 좋겠습니다. 투명한 PET재질로 되어있어 일반 스티커보다는 단단하고, 색상은 조금 더 화사합니다.

The fruits of Che [彩], the colour series of A Vessel for the Heart, take on a playful life as characters. Within their many shapes, a whole spectrum of feelings finds a face. Che, a vessel holding these many shades of the heart, now takes a simpler, lighter form—one that feels a little easier to welcome into everyday life. Let them brighten the pages of your journal, or carry a little feeling on the stationery tucked into a letter. Made from clear PET, they are firmer than ordinary stickers, with colours that bloom a little brighter.`,
    price: 3000,
    priceLabel: "3,000 KRW",
    soldOut: true,
  },
  {
    slug: "udn-package-2027",
    title: "UDN Mailer bag 2026 Food in season [達 DaL]",
    category: "Goods",
    kind: "product",
    image: "/assets/landing/udn-calendar-2026-back.jpg",
    aspect: "3959/2922",
    description: `the Vessel series 05
[達]DaL, the vessel to reach
White craft paper
145x195mm

당신에게 다다르다는 뜻의 다섯번째 그릇 시리즈 달[達]DaL은 그릇을 담는 그릇을 의미합니다. 이 안에는 UDN의 어떠한 상품도 담길 수 있겠지요.  소중하게 포장된 그릇은 당신에게 도달하는 길을 찾기 전까지 멈추지 않을 거에요. 당신에게 이르는 길이 안전하길 기원하며.

The fifth vessel in the UDN series, 達 DaL, means to reach you.
A vessel that carries another vessel, DaL is made to hold any creation from UDN, each one carefully wrapped and entrusted to its care.
Bearing what was made with love and intention, it will not rest until it finds its way to you.
May its journey be gentle, its passage safe, and all that it carries arrive in your hands with the care in which it was made.`,
    price: 1000,
    priceLabel: "1,000 KRW",
    soldOut: false,
  },
  {
    slug: "udn-tissue-paper-2026",
    title: "UDN Tissue Paper 2026 Food in season [達 DaL]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/udn-tissue-paper-2026/main.jpg",
    aspect: "3959/2922",
    detailImages: [
      { src: "/assets/products/udn-tissue-paper-2026/detail_1.jpg", aspect: "3959/2922" },
      { src: "/assets/products/udn-tissue-paper-2026/detail_2.jpg", aspect: "3959/2922" },
    ],
    description: `the Vessel series 05
[達]DaL, the vessel to reach
White wrapping tissue paper
720x500mm

당신에게 다다른다는 뜻의 다섯번째 그릇 시리즈 달[達]DaL은 그릇을 담는 그릇을 의미합니다. 그 중에서도 소중한 그릇을 안전하게 보호하기 위해 최선을 다할 포장지를 소개합니다. UDN의 그릇들이 당신에게 안전하게 다다르길.

DaL [達], the fifth chapter in our Vessel series, takes its name from the meaning “to reach you”—a vessel that holds other vessels.
Here, it takes the form of wrapping paper, made with care to gently shelter the precious vessels within.
May UDN’s vessels find their way safely to you.`,
    price: 500,
    priceLabel: "500 KRW",
    soldOut: false,
  },
  {
    slug: "udn-sticky-notes-2026-fruits",
    title: "UDN Sticky Notes 2026 Seasonal Fruits [標 Pyo]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/udn-sticky-notes-2026-fruits/main.jpg",
    aspect: "3959/2922",
    detailImages: [
      { src: "/assets/products/udn-sticky-notes-2026-fruits/detail_1.jpg", aspect: "3959/2922" },
    ],
    optionGallery: false,
    description: `the Vessel series 04.
[標]Pyo, the pattern of imprint
Fruits in season Sticky Note.
70x70mm

흔적의 패턴을 담는 네번째 그릇 시리즈의 표[標]Pyo는 인장이나 마크를 의미합니다. 중요한 정보들을 표시할 수 있고, 기존의 무언가에 나의 흔적을 남길 수 있습니다. 이 포스트잇은 글씨를 쓰기 어려운 구조로 되어있으며, 당신의 메세지를 찾아내는 데 많은 공을 들이게 할 것입니다. 내부에는 해당 과일의 조생종과 만생종, 그리고 품종이 적혀 있습니다.

Pyo[標], meaning a seal or mark, is the fourth series in A Vessel—a vessel holding the patterns of the traces we leave. It marks what matters and lets you leave something of yourself upon what is already there. These sticky notes offer little room for writing, inviting you to take time and care in finding a place for your message. Within each fruit are the names of its varieties, including those that ripen early and those that ripen late.`,
    price: 5000,
    priceLabel: "5,000 KRW",
    soldOut: true,
    optionGroup: "udn-sticky-notes-2026-fruits",
    shippingGroup: "udn-sticky-notes-2026-fruits",
  },
  {
    slug: "udn-sticky-notes-2026-peach",
    title: "UDN Sticky Notes 2026 Seasonal Fruits [標 Pyo]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/udn-sticky-notes-2026-fruits/main.jpg",
    aspect: "3959/2922",
    price: 5000,
    priceLabel: "5,000 KRW",
    soldOut: true,
    optionGroup: "udn-sticky-notes-2026-fruits",
    optionLabel: "복숭아 · 5,000원",
    shippingGroup: "udn-sticky-notes-2026-fruits",
  },
  {
    slug: "udn-sticky-notes-2026-grape",
    title: "UDN Sticky Notes 2026 Seasonal Fruits [標 Pyo]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/udn-sticky-notes-2026-fruits/main.jpg",
    aspect: "3959/2922",
    price: 5000,
    priceLabel: "5,000 KRW",
    soldOut: true,
    optionGroup: "udn-sticky-notes-2026-fruits",
    optionLabel: "포도 · 5,000원",
    shippingGroup: "udn-sticky-notes-2026-fruits",
  },
  {
    slug: "udn-sticky-notes-2026-strawberry",
    title: "UDN Sticky Notes 2026 Seasonal Fruits [標 Pyo]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/udn-sticky-notes-2026-fruits/main.jpg",
    aspect: "3959/2922",
    price: 5000,
    priceLabel: "5,000 KRW",
    soldOut: true,
    optionGroup: "udn-sticky-notes-2026-fruits",
    optionLabel: "딸기 · 5,000원",
    shippingGroup: "udn-sticky-notes-2026-fruits",
  },
  {
    slug: "udn-sticky-notes-2026-yuju",
    title: "UDN Sticky Notes 2026 Seasonal Fruits [標 Pyo]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/udn-sticky-notes-2026-fruits/main.jpg",
    aspect: "3959/2922",
    price: 5000,
    priceLabel: "5,000 KRW",
    soldOut: true,
    optionGroup: "udn-sticky-notes-2026-fruits",
    optionLabel: "유자 · 5,000원",
    shippingGroup: "udn-sticky-notes-2026-fruits",
  },
  {
    slug: "che-postcard-2026-spring",
    title: "UDN PostCard 2026 Edible flowers in Season [彩 Che]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/che-postcard-2026/spring.jpg",
    aspect: "3959/2922",
    price: 2000,
    priceLabel: "2,000 KRW",
    soldOut: true,
    optionGroup: "che-postcard-2026",
    optionLabel: "봄 (목련) · 2,000원",
    shippingGroup: "che-postcard-2026",
  },
  {
    slug: "che-postcard-2026-summer",
    title: "UDN PostCard 2026 Edible flowers in Season [彩 Che]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/che-postcard-2026/summer.jpg",
    aspect: "3959/2922",
    price: 2000,
    priceLabel: "2,000 KRW",
    soldOut: true,
    optionGroup: "che-postcard-2026",
    optionLabel: "여름 (연꽃) · 2,000원",
    shippingGroup: "che-postcard-2026",
  },
  {
    slug: "che-postcard-2026-autumn",
    title: "UDN PostCard 2026 Edible flowers in Season [彩 Che]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/che-postcard-2026/autumn.jpg",
    aspect: "3959/2922",
    price: 2000,
    priceLabel: "2,000 KRW",
    soldOut: true,
    optionGroup: "che-postcard-2026",
    optionLabel: "가을 (국화) · 2,000원",
    shippingGroup: "che-postcard-2026",
  },
  {
    slug: "che-postcard-2026-winter",
    title: "UDN PostCard 2026 Edible flowers in Season [彩 Che]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/che-postcard-2026/winter.jpg",
    aspect: "3959/2922",
    price: 2000,
    priceLabel: "2,000 KRW",
    soldOut: true,
    optionGroup: "che-postcard-2026",
    optionLabel: "겨울 (동백) · 2,000원",
    shippingGroup: "che-postcard-2026",
  },
  {
    slug: "che-card-2026",
    title: "UDN CARD 2026 Edible Flowers [彩 Che]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/che-card-2026/main.jpg",
    aspect: "3959/2922",
    description: `the Vessel series 02.
[彩]Che, the color of mind
Edible flowers in season greeeting card.
110x220mm

마음을 담는 그릇의 색채 시리즈 채[彩]Che의 프리미엄 카드입니다. 이 카드들은 4개의 다양한 계절과 감정을 담고 있습니다. 해당 계절에만 볼 수 있고, 음식으로 사용되어질 수 있는 꽃들을 선보입니다. 이들 모두가 먹을 수 있다는 것은 첫번째 그릇 시리즈 령令과도 자연스럽게 이어집니다.  안부를 묻고 상대를 생각하는 마음을 담은 채彩 식용화 카드로 말만으로는 설명하기 어려운 당신의 감정을 더욱 선명하게 전달하길 기대합니다.

These premium cards belong to Che[彩], the colour series of vessels that hold the heart. Each carries a season and the feelings that unfold within it, through edible flowers that bloom in their own time. Flowers that may nourish us as well as move us—a quiet thread connecting these cards to Ryung [令], the first vessel series.
With a thought of someone dear, Che[彩] the edible flower cards hold what you wish to share. May they lend colour and clarity to the feelings that words alone cannot quite express.`,
    price: 7000,
    priceLabel: "7,000 KRW",
    soldOut: true,
    optionGroup: "che-card-2026",
    shippingGroup: "che-card-2026",
  },
  {
    slug: "che-card-2026-spring",
    title: "UDN CARD 2026 Edible Flowers [彩 Che]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/che-card-2026/spring.jpg",
    aspect: "3959/2922",
    price: 7000,
    priceLabel: "7,000 KRW",
    soldOut: true,
    optionGroup: "che-card-2026",
    optionLabel: "봄 (목련) · 7,000원",
    shippingGroup: "che-card-2026",
  },
  {
    slug: "che-card-2026-summer",
    title: "UDN CARD 2026 Edible Flowers [彩 Che]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/che-card-2026/summer.jpg",
    aspect: "3959/2922",
    price: 7000,
    priceLabel: "7,000 KRW",
    soldOut: true,
    optionGroup: "che-card-2026",
    optionLabel: "여름 (연꽃) · 7,000원",
    shippingGroup: "che-card-2026",
  },
  {
    slug: "che-card-2026-autumn",
    title: "UDN CARD 2026 Edible Flowers [彩 Che]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/che-card-2026/autumn.jpg",
    aspect: "3959/2922",
    price: 7000,
    priceLabel: "7,000 KRW",
    soldOut: true,
    optionGroup: "che-card-2026",
    optionLabel: "가을 (국화) · 7,000원",
    shippingGroup: "che-card-2026",
  },
  {
    slug: "che-card-2026-winter",
    title: "UDN CARD 2026 Edible Flowers [彩 Che]",
    category: "Goods",
    kind: "product",
    image: "/assets/products/che-card-2026/winter.jpg",
    aspect: "3959/2922",
    price: 7000,
    priceLabel: "7,000 KRW",
    soldOut: true,
    optionGroup: "che-card-2026",
    optionLabel: "겨울 (동백) · 7,000원",
    shippingGroup: "che-card-2026",
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
      { src: "/assets/portfolio_images/portfolio_2/5.png", aspect: "3959/2922" },
    ],
    description:
      "the cake house in Naju, Jeonam, Korea convey the meaning of speed in right time, NeRyGe, on its logo with its cakebox and businesscard ",
  },
  {
    slug: "neryge-to-slow-packaging",
    title: "NeRyGe : To Slow Packaging",
    category: "Packaging Design",
    kind: "work",
    image: "/assets/portfolio_images/portfolio_2/2.jpg",
    aspect: "1206/1206",
    // Packaging-only entry: photos 3–5 on the original page (counting the
    // original hero as photo 1); the first selected photo is this entry's hero.
    detailImages: [
      { src: "/assets/portfolio_images/portfolio_2/3.jpeg", aspect: "750/939" },
      { src: "/assets/portfolio_images/portfolio_2/4.jpeg", aspect: "750/938" },
    ],
    description:
      "Custom takeaway packaging for NeRyGe, a dessert house in Naju. The periwinkle carry box brings the brand identity onto a practical package for cakes and baked treats, with a colorful patterned band adding a distinctive finishing touch.",
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
    title: "UDN Calendar 2027 Food in Season [令 Ryung]",
    category: "Calendar",
    kind: "product",
    // 대표 이미지는 운영에서 전달받은 최신 촬영 이미지로 교체했으며,
    // 상품 카드 기준 비율(3959/2922)에 맞춰 표시한다.
    image: "/assets/portfolio_images/ryeong-2027/main.jpg",
    aspect: "3959/2922",
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
    description: `the Vessel series 01
[令]Ryung, the map of time
Food in Season Calendar
150x170mm

당신의 날짜들과 달, 계절들을 제 시간에 맞게, 하늘의 부름인 령에 맞게 보낼 수 있게 도와주는 교구입니다.
누가 알려주지 않아도 제 시기를 찾아 자라나는 작물들을 가장 건강할 때 만날 수 있도록 시간의 지도가 되어 당신을 안내합니다.
숫자보다도 당신의 삶이, 날짜보다도 우리의 제 철에 맞는 성장이 중요함을 잊지 않게 해주길 바랍니다.

A learning companion to help you move through your days, months, and seasons in their own time, guided by 令—Ryeong, the call of the heavens.
Like a map of time, it guides you toward the crops that find their season and grow without being told, so you may meet them at their fullest and most nourishing.
May it remind you that your life matters more than numbers, and that growing in our own season matters more than the dates we count.`,
    // 현재가(원장 §7 2차 재확인 — dispSalePrice 20000·2026-10-01 2차 재추출·변동 없음)
    price: 20000,
    priceLabel: "20,000 KRW",
    shippingGroup: "calendar-2027-tape",
    link: "https://smartstore.naver.com/studioudn/products/13767984847",
  },
  {
    slug: "dubgeuk-after-school-posters",
    title: "두근두근방과후 — 댄스 수업 포스터",
    category: "Poster",
    kind: "work",
    image: "/assets/portfolio_images/dubgeuk-after-school-posters/rep.jpg",
    aspect: "1080/1080",
    description:
      "두근두근방과후의 댄스 수업을 알리는 포스터입니다. 보라색 배경에 노랑·분홍의 큰 제목을 배치하고, 춤추는 사람들과 호랑이, 별, 새, 음표를 함께 그려 움직임과 리듬을 표현했습니다. 표정이 있는 해와 다양한 캐릭터로 몸을 움직이는 즐거움을 전달하고, 수업 일정과 장소는 흰색 글씨로 명확하게 구분했습니다.",
  },
  {
    slug: "dubgeuk-schema-immersive-reading-poster",
    title: "두근두근방과후 — 스키마 독서와 몰입 독서",
    category: "Poster",
    kind: "work",
    image: "/assets/portfolio_images/dubgeuk-after-school-posters/detail_1.jpg",
    aspect: "720/720",
    description:
      "스키마 독서와 몰입 독서를 소개하는 두근두근방과후 교육 포스터입니다. 커다란 노란 원 안에 책 읽는 아이와 책을 나르는 캐릭터, 돋보기와 전구, 로켓과 행성을 배치해 독서에서 시작되는 탐색과 상상력을 표현했습니다. 밝은 색상과 친근한 캐릭터를 사용하고, 하단에는 교육 주제와 안내 문구를 배치해 즐거운 독서의 이미지를 전달했습니다.",
  },
  {
    slug: "dubgeuk-future-competencies-career-education",
    title: "두근두근방과후 — 우리 아이 미래 역량 키우기",
    category: "Poster",
    kind: "work",
    image: "/assets/portfolio_images/dubgeuk-after-school-posters/detail_2.jpg",
    aspect: "1080/1080",
    detailImages: [
      { src: "/assets/portfolio_images/dubgeuk-after-school-posters/detail_3.jpg", aspect: "1080/1080" },
    ],
    description:
      "부모가 도울 수 있는 자녀의 성장과 미래 역량을 주제로 한 교육 강연의 홍보 포스터와 안내 이미지입니다. 초록 들판 위의 작은 아이들과 구름을 그린 대표 포스터에 강연 제목과 일정을 배치했습니다. 함께 구성한 안내 이미지는 노랑·파랑의 질감 있는 배경 위에 학습 준비, 진로흥미탐색과 홀랜드 검사에 대한 질문·답변을 정리해 강연의 내용과 참여 방법을 전달합니다.",
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
  {
    slug: "dubgeuk-immersive-play-reading",
    title: "몰입해서 놀고 읽는 아이들의 힘",
    category: "Poster",
    kind: "work",
    image: "/assets/portfolio_images/dubgeuk-immersive-reading/rep.jpg",
    aspect: "3959/2922",
    description: `2025 두근 상반기 조합원 교육 포스터

현장 교사 신천주 강사의 강연 「몰입해서 놀고 읽는 아이들의 힘」을 위한 포스터입니다. 잘 노는 것과 책 읽는 교육의 의미를 살펴보고, 몰입독서의 뜻과 방법·효과, IB 프로그램 속 몰입독서를 소개하는 교육 내용을 담았습니다.`,
  },
  {
    slug: "dubgeuk-after-school-business-card",
    title: "두근두근방과후 명함",
    category: "Total Branding",
    kind: "work",
    image: "/assets/portfolio_images/dubgeuk-business-card/rep.jpg",
    aspect: "3959/2922",
    description: "두근두근방과후의 로고와 컬러 아이덴티티를 담아 앞·뒷면으로 구성한 명함 디자인입니다.",
  },
  {
    slug: "mnm-2012-honors-benefit-invitation",
    title: "MNM 2012 Honors benefit Invitation full package",
    category: "Total Branding",
    kind: "work",
    image: "/assets/portfolio_images/mnm-2012-honors-invitation/rep.jpg",
    aspect: "3959/2922",
    detailImages: [
      { src: "/assets/portfolio_images/mnm-2012-honors-invitation/detail_1.jpg", aspect: "3959/2922" },
      { src: "/assets/portfolio_images/mnm-2012-honors-invitation/detail_2.jpg", aspect: "3959/2922" },
    ],
    description: "Malaria No More International Honors의 2012년 베네핏 초청장 패키지입니다. 접이식 초청장과 행사 프로그램, 봉투를 한 세트로 구성하고 모노톤 타이포그래피에 선명한 오렌지 포인트를 더했습니다.",
  },
  {
    slug: "mushmina-total-branding",
    title: "Mushmina Total Branding",
    category: "Total Branding",
    kind: "work",
    image: "/assets/portfolio_images/mushmina-total-branding/rep.jpg",
    aspect: "3959/2922",
    description:
      "A complete brand identity for Mushmina, bringing together its distinctive wordmark, business cards, product tags, and packaging. Inspired by Moroccan craft and handmade accessories, the system pairs ornate detailing with a warm, understated palette across bags, pouches, and jewelry.",
  },
  {
    slug: "the-wine-occasional-party-wine",
    title: "[the]Wine — Occasional Party Wine",
    category: "Total Branding",
    kind: "work",
    image: "/assets/portfolio_images/the-wine/rep.jpg",
    aspect: "2048/1512",
    detailImages: [
      { src: "/assets/portfolio_images/the-wine/detail_1.jpg", aspect: "2048/1512" },
    ],
    description:
      "Occasional party wine branding built around three playful varieties—Tailgate, Clambake, and Bachelorette. Hand-drawn illustrations bring each bottle label to life, paired with a matching postcard to create a spirited, cohesive identity for gathering and celebration.",
  },
  {
    slug: "kyungnong-herbicide-resistance-book",
    title: "경농 — Resistance of Herbicide",
    category: "Editorial Design",
    kind: "work",
    image: "/assets/portfolio_images/kyungnong-herbicide-resistance-book/rep.jpg",
    aspect: "2551/3579",
    description:
      "경농의 제초제와 저항성 관련 정보를 담은 전문 서적 편집 디자인입니다. 식물 이미지와 작용 기전 도해, 화학 구조식, 비교 차트를 일정한 그리드 안에 배치해 복잡한 정보를 읽기 쉽게 구성했습니다. 차분한 회녹색을 중심으로 장별 색상과 선명한 강조색을 적용하고, 알파벳 표제와 탐색 요소로 정보를 찾기 쉬운 지면을 설계했습니다. 210×297mm 판형의 150페이지 책입니다.",
  },
  {
    slug: "allen-organ-product-catalog",
    title: "Allen Organ — 제품 브로슈어 & 카탈로그",
    category: "Editorial Design",
    kind: "work",
    image: "/assets/portfolio_images/allen-organ-product-catalog/rep.jpg",
    aspect: "2551/3579",
    description:
      "Allen Korea의 오르간을 소개하는 브로슈어·카탈로그 디자인입니다. 건반과 스톱, 목재 외장의 세부 사진을 넓은 가로 지면에 배치해 악기의 구조와 소재감을 보여줍니다. 제품별 색상 구분과 일관된 정보 블록을 사용해 섹션을 정리하고, 표지부터 내지까지 사진과 여백의 리듬을 이어 제품의 특징을 명료하게 전달하도록 구성했습니다.",
  },
  {
    slug: "samsung-caster-2017-calendar",
    title: "삼성캐스터 — 2017 월 캘린더",
    category: "Editorial Design",
    kind: "work",
    image: "/assets/portfolio_images/samsung-caster-2017-calendar/rep.jpg",
    aspect: "2551/3579",
    description:
      "삼성캐스터의 제품 이미지를 담은 2017년 벽걸이 캘린더 디자인입니다. 큰 월 숫자와 정돈된 날짜 배열을 중심으로 캐스터 제품 사진과 정보를 함께 배치했습니다. 제품의 금속 질감과 바퀴의 색상을 살리는 배경색, 명확한 타이포그래피로 일상적인 일정 확인과 제품 소개가 자연스럽게 이어지도록 구성했습니다. 380×660mm 판형의 13페이지 캘린더입니다.",
  },
  {
    slug: "renault-samsung-happycare-brochure",
    title: "르노삼성 — HappyCare Auto Solution",
    category: "Editorial Design",
    kind: "work",
    image: "/assets/portfolio_images/renault-samsung-happycare-brochure/rep.jpg",
    aspect: "2551/3579",
    description:
      "르노삼성의 HappyCare Auto Solution을 소개하는 3단 접지 브로슈어 디자인 시안입니다. 자동차 사진과 입체적인 H 형태의 그래픽을 결합해 서비스의 이름을 시각적으로 표현했습니다. 회색과 흰색을 바탕으로 노란색을 강조색으로 사용하고, 접힌 표지와 펼친 내지의 정보 흐름을 연결해 차량 관리 서비스의 내용을 단계적으로 읽을 수 있도록 구성했습니다.",
  },
  {
    slug: "seoul-samgaetang-brand-identity",
    title: "서울삼계탕 — 브랜드 아이덴티티",
    category: "Total Branding",
    kind: "work",
    image: "/assets/portfolio_images/seoul-samgaetang-brand-identity/rep.jpg",
    aspect: "2551/3579",
    description:
      "서울삼계탕의 매장과 인쇄물에 적용한 브랜드 아이덴티티 디자인입니다. 전통적인 닭의 형상과 친근한 캐릭터, 붓글씨 느낌의 한글 로고를 중심으로 음식점의 개성을 표현했습니다. 짙은 바탕에 빨강·파랑·초록의 색띠를 더해 간판, 명함, 메뉴판에 통일된 인상을 주고, 매장 입구의 캐릭터 조형물까지 브랜드의 시각 언어를 확장했습니다.",
  },
  {
    slug: "kyungnong-divide-water-packaging",
    title: "경농 — DIVIDE WATER® 나누다 분수호스",
    category: "Packaging Design",
    kind: "work",
    image: "/assets/portfolio_images/kyungnong-divide-water-packaging/rep.jpg",
    aspect: "2551/3579",
    description:
      "경농의 나누다 분수호스 DIVIDE WATER® 박스 패키지 디자인입니다. 물을 연상시키는 파란색과 흰색을 사용하고, 호스처럼 이어지는 선과 물방울 그래픽을 상자의 여러 면에 연결했습니다. 제품명, 규격, 사용 정보와 도해를 구분해 배치해 쌓인 상자에서도 제품을 식별하기 쉽게 구성했습니다. 전개도와 실제 패키지에 동일한 그래픽 체계를 적용한 460×250×300mm 박스입니다.",
  },
  {
    slug: "mnm-endmalaria-campaign",
    title: "Malaria No More — #EndMalaria 캠페인 & 로고",
    category: "Total Branding",
    kind: "work",
    image: "/assets/portfolio_images/mnm-endmalaria-campaign/rep.jpg",
    aspect: "2551/3579",
    description:
      "Malaria No More의 캠페인 로고와 #EndMalaria 디지털 홍보 디자인입니다. Young Ambassadors와 TEAM 2012 등 여러 활동의 로고를 구성하고, 인물 사진과 큰 타이포그래피로 캠페인의 메시지를 전달했습니다. 오렌지와 청록 계열의 강조색을 중심으로 AOL 웹페이지와 다양한 규격의 배너를 전개해, 매체가 달라져도 캠페인의 인상과 참여를 유도하는 메시지가 이어지도록 설계했습니다.",
  },
  {
    slug: "korean-afoc-exhibition",
    title: "대한민국 공군 — AFOC 전시 공간 디자인",
    category: "Exhibition Design",
    kind: "work",
    image: "/assets/portfolio_images/korean-afoc-exhibition/rep.jpg",
    aspect: "2551/3579",
    description:
      "대한민국 공군의 역사와 활동을 소개하는 전시 공간 및 설치 디자인입니다. 시대별 기록과 사진, 항공기 이미지와 도면을 벽면에 구성해 관람 동선을 따라 전시 내용을 읽을 수 있도록 설계했습니다. 파란색과 회색을 중심으로 방향성을 가진 그래픽과 연대별 표제를 연결하고, 입체 패널과 조명, 모형 전시를 함께 배치해 기록과 실물이 이어지는 공간을 구성했습니다.",
  },
  {
    slug: "korean-marine-corps-exhibition",
    title: "대한민국 해병대 — 역사 전시 공간 디자인",
    category: "Exhibition Design",
    kind: "work",
    image: "/assets/portfolio_images/korean-marine-corps-exhibition/rep.jpg",
    aspect: "2551/3579",
    description:
      "대한민국 해병대의 역사와 활동을 소개하는 전시 공간 및 설치 디자인입니다. 팔각형을 중심 모티프로 삼아 시대별 기록, 사진, 지도와 연표를 연결하고, 빨강·연두·초록의 색상으로 전시 구역을 구분했습니다. 벽면 그래픽과 영상 화면, 실물 전시, 중앙 조형물을 하나의 시각 체계로 구성해 관람객이 공간을 이동하며 전시의 흐름을 따라갈 수 있도록 설계했습니다.",
  },
  {
    slug: "farfars-steady-hand-storybook",
    title: "The Secret of Farfar’s Steady Hand",
    category: "Editorial Design",
    kind: "work",
    image: "/assets/portfolio_images/farfars-steady-hand-storybook/rep.jpg",
    aspect: "3959/2922",
    detailImages: [
      { src: "/assets/portfolio_images/farfars-steady-hand-storybook/detail_1.jpg", aspect: "3959/2922" },
      { src: "/assets/portfolio_images/farfars-steady-hand-storybook/detail_2.jpg", aspect: "3959/2922" },
    ],
    description:
      "Created in just one week at a client’s personal request, this illustrated storybook celebrates Edlund’s 65th birthday, looking back on his life through a collection of short fairy tales.",
  },
  {
    slug: "connecting-ib-beyond-ib",
    title: "Connecting IB Beyond IB",
    category: "Editorial Design",
    kind: "work",
    image: "/assets/portfolio_images/connecting-ib-beyond-ib/rep.jpg",
    aspect: "3959/2922",
    detailImages: [
      { src: "/assets/portfolio_images/connecting-ib-beyond-ib/detail_1.jpg", aspect: "3959/2922" },
      { src: "/assets/portfolio_images/connecting-ib-beyond-ib/detail_2.jpg", aspect: "3959/2922" },
    ],
    description:
      "128 × 210 mm. I designed the book and directed its title development, overall content structure, and editorial review. Bringing together classroom teachers’ firsthand experiences with IB education, the book features their personal reflections on its cover flaps.",
  },
  {
    slug: "moonwon-charm-journal-grade-2",
    title: "Moonwon Elementary School — CHARM Character Development Journal, Grade 2",
    category: "Editorial Design",
    kind: "work",
    image: "/assets/portfolio_images/moonwon-charm-journal-grade-2/rep.jpg",
    aspect: "3959/2922",
    detailImages: [
      { src: "/assets/portfolio_images/moonwon-charm-journal-grade-2/detail_1.jpg", aspect: "3959/2922" },
    ],
    description:
      "A CHARM character development journal for Grade 2 students at Moonwon Elementary School. A turquoise palette, cheerful flower characters, and diamond motifs connect the cover with the activity pages. Clear prompts and structured writing spaces invite children to explore self-management, practise ways of handling emotions, and reflect on the promises they make with their families.",
  },
  {
    slug: "pearl-fan-coloring-postcard",
    title: "Pearl Fan Coloring Postcard",
    category: "Goods",
    kind: "work",
    image: "/assets/portfolio_images/pearl-fan-coloring-postcard/rep.jpg",
    aspect: "3959/2922",
    detailImages: [
      { src: "/assets/portfolio_images/pearl-fan-coloring-postcard/detail_1.jpg", aspect: "3959/2922" },
    ],
    description:
      "Neon Green: 172 × 297 mm. Blue: 126 × 178 mm. Coloring postcards in two editions: green for adults and blue for children. Inspired by the traditional pearl fan, the designs pair floral line illustrations with space for a handwritten message on the reverse.",
  },
  {
    slug: "itf-exhibition-poster",
    title: "ITF POSTER",
    category: "Exhibition Poster",
    kind: "work",
    image: "/assets/portfolio_images/itf-exhibition-poster/rep.jpg",
    aspect: "3959/2922",
    description:
      "297 × 420 mm. An exhibition poster for 잇-프, a Korea–France exchange exhibition. Sweeping blue curves bring two contrasting artworks into one composition, echoing the exhibition’s theme of connection. Bold blue typography and a clear hierarchy organise the exhibition title, dates, and artist information alongside the paintings.",
  },
  {
    slug: "twice-a-day-blue-hour-poster",
    title: "Twice a Day, Blue Hour Poster",
    category: "Exhibition Poster",
    kind: "work",
    image: "/assets/portfolio_images/twice-a-day-blue-hour-poster/rep.jpg",
    aspect: "3959/2922",
    detailImages: [
      { src: "/assets/portfolio_images/twice-a-day-blue-hour-poster/detail_1.png", aspect: "2048/1512" },
    ],
    description:
      "297 × 420 mm. A poster for An Sun Young’s solo exhibition, Twice a Day, Blue Hour, at Redboots Gallery. The painting’s layered blues, luminous moon, and delicate butterflies set the atmosphere, while white typography carries the exhibition title and information. The composition preserves the artwork’s texture and quiet sense of light, reflecting the fleeting blue hours at dawn and dusk.",
  },
  {
    slug: "yuyujajuk-minhwa-exhibition-brochure",
    title: "The First Yuyujajuk Minhwa Members’ Exhibition Brochure",
    category: "Editorial Design",
    kind: "work",
    image: "/assets/portfolio_images/yuyujajuk-minhwa-exhibition-brochure/rep.jpg",
    aspect: "3959/2922",
    detailImages: [
      { src: "/assets/portfolio_images/yuyujajuk-minhwa-exhibition-brochure/detail_1.jpg", aspect: "3959/2922" },
    ],
    description:
      "297 × 420 mm. A folding brochure for the first Yuyujajuk Minhwa members’ exhibition. The cover pairs vertical Korean typography with floral and bird motifs, while the unfolded interior presents the members’ paintings alongside their titles and artist names. A light, spacious layout lets the varied colours and traditional subjects of the works take centre stage, bringing the exhibition information and artwork selection together in one compact piece.",
  },
  {
    slug: "cest-si-bon-business-card",
    title: "C’est Si Bon Business Card",
    category: "Total Branding",
    kind: "work",
    image: "/assets/portfolio_images/cest-si-bon-business-card/rep.jpg",
    aspect: "3959/2922",
    description:
      "Jazz Club in Seoul, Gangnam. 40 × 90 mm. The client requested a design that would immediately convey the bar’s identity as a place to enjoy jazz while clearly presenting its name, C’est Si Bon.",
  },
  {
    slug: "dohwaji-artist-business-card",
    title: "Business Card for Artist Dohwaji",
    category: "Total Branding",
    kind: "work",
    image: "/assets/portfolio_images/dohwaji-artist-business-card/rep.png",
    aspect: "3959/2922",
    description:
      "50 × 90 mm. Designed to showcase a selected work from the artist’s own collection, the card gives the artwork centre stage. The artist’s name is stamped in gold foil that echoes the background colour, leaving the personal details quietly concealed to be discovered on closer inspection. On the reverse, the artwork’s vivid horizontal composition almost becomes a pattern.",
  },
  {
    slug: "maenbal-cooperative-business-cards",
    title: "Business Cards for Maenbal Cooperative Childcare Center",
    category: "Total Branding",
    kind: "work",
    image: "/assets/portfolio_images/maenbal-cooperative-business-cards/rep.png",
    aspect: "3959/2922",
    description:
      "Maenbal is a parent-run cooperative childcare center built around a shared commitment to raising children together. Each year, parents elect fellow members to lead areas such as education, publicity, and facilities. These business cards were created as a farewell gift for Maikol, the outgoing education director. Adults in the community use nicknames so children can address them as friends; the card reflects that warm, informal culture. With the chairperson Mr. White (HaYang)’s generous support and his family’s printing expertise, the project explored a range of print finishes. The design follows Maenbal’s existing identity, while a later T-shirt project opened the door to introduce a new visual direction.",
  },
  {
    slug: "artis-artec-business-card",
    title: "ARTIS + ARTEC Business Card",
    category: "Total Branding",
    kind: "work",
    image: "/assets/portfolio_images/artis-artec-business-card/rep.png",
    aspect: "3959/2922",
    description:
      "90 × 50 mm. During my time at ARTIS, I led the company’s branding. The name combines “Art” and “Is”; a line above “IS” highlights the idea and creates an identity that can flex across business areas. When ARTIS expanded into printing as ARTEC, I designed a distinctive card for the CEO that brings both identities together. Blue foil, the established brand colour, is applied to translucent plastic for a striking layered finish. The experience taught me how much energy I had invested in building another company’s brand, and how strongly I wanted to put that energy into my own.",
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

// Mix artwork, photography, and presentation boards across the three-column grid.
// Keep the order stable when visitors reload or return from a project.
const WORK_DISPLAY_ORDER = [
  "neryge-to-slow",
  "kyungnong-herbicide-resistance-book",
  "itf-exhibition-poster",
  "mushmina-total-branding",
  "flowing-lines-staying-moon",
  "connecting-ib-beyond-ib",
  "dubgeuk-schema-immersive-reading-poster",
  "allen-organ-product-catalog",
  "the-tov",
  "seoul-samgaetang-brand-identity",
  "cest-si-bon-business-card",
  "dohwaji-artist-business-card",
  "the-10th-yaho-festival",
  "korean-afoc-exhibition",
  "farfars-steady-hand-storybook",
  "artis-artec-business-card",
  "kyungnong-divide-water-packaging",
  "neryge-to-slow-packaging",
  "dubgeuk-future-competencies-career-education",
  "rainbow-school-information-session",
  "samsung-caster-2017-calendar",
  "menbal-kindergarten",
  "maenbal-cooperative-business-cards",
  "dubgeuk-after-school-posters",
  "chusa-art-festival-goods",
  "twice-a-day-blue-hour-poster",
  "korean-marine-corps-exhibition",
  "moonwon-charm-journal-grade-2",
  "the-wine-occasional-party-wine",
  "daedong-bookstore-event",
  "mnm-2012-honors-benefit-invitation",
  "renault-samsung-happycare-brochure",
  "dubgeuk-immersive-play-reading",
  "mnm-endmalaria-campaign",
  "pearl-fan-coloring-postcard",
  "the-tov-books",
  "louivis-bebe",
  "dubgeuk-after-school-business-card",
  "yuyujajuk-minhwa-exhibition-brochure",
] as const;

const workDisplayRanks = new Map<string, number>(
  WORK_DISPLAY_ORDER.map((slug, index) => [slug, index]),
);

export function getWorks(): Product[] {
  return products.filter((p) => p.kind === "work").sort((a, b) =>
    (workDisplayRanks.get(a.slug) ?? Number.MAX_SAFE_INTEGER) -
    (workDisplayRanks.get(b.slug) ?? Number.MAX_SAFE_INTEGER),
  );
}
