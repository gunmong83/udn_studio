// 사이트 상수 — UDN(studioundesignated.com) 원문 실측 기반(2026-09-30 webfetch).
// 원본에 없는 정보(사업자등록번호·전화·이메일·소셜 등)는 절대 지어내지 않는다.

export const site = {
  name: "Studio Undesignated",
  nameKo: "스튜디오 UDN",
  // 원본 <title> 그대로
  title: "Studio Undesignated | 스튜디오 UDN | 토탈 브랜딩 디자인 스튜디오",
  // 원본 meta description 그대로
  description:
    "Studio Undesignated (스튜디오 UDN) - 정해지지 않은 가능성을 디자인하는 토탈 브랜딩 디자인 스튜디오. 로고 디자인, 브랜드 아이덴티티 전문.",
  // 원본 meta keywords 그대로
  keywords:
    "스튜디오 udn,studio udn,studioudn,studioundesignated,스튜디오 유디엔,Studio Undesignated,브랜딩,로고 디자인,브랜드 아이덴티티",
  // 히어로 문구(철학 첫 문장의 요항 — 지시서 지정 문구)
  tagline: "정해지지 않은 가능성을 디자인하는 토탈 브랜딩 스튜디오",
  // 원본 홈 introduce 섹션 원문 그대로
  philosophy: {
    heading: "Studio Undesignated의 철학 (Our Philosophy)",
    paragraphs: [
      "Studio Undesignated(스튜디오 UDN)는 정해지지 않은 가능성을 디자인하는 토탈 브랜딩 스튜디오입니다.",
      "현대적 감각과 고유한 지역적 특색을 결합하여 로고 디자인부터 전시 포스터, 패키지까지 브랜드가 전달하고자 하는 본질적인 메시지를 시각화합니다.",
    ],
  },
  // 원본 schema.org ProfessionalService 지역 표기
  locations: [],
  // 원본에서 실측된 유일 외부 링크(schema.org sameAs)
  links: {
    smartstore: "https://smartstore.naver.com/studioudn",
    calendarProduct:
      "https://smartstore.naver.com/studioudn/products/12907475385",
  },
  // 원본 schema.org hasOfferCatalog 서비스명
  services: ["Total Branding", "Logo Design", "Poster Design"],
  // 파동6 항목2(일감 muozb2dbo9mp) — About 장표 텍스트 재구성 콘텐츠 데이터.
  // 출처: docs/designer/wave6-about-redesign.md §5 원문 인용 목록(리드 독립 기계 대조
  //   55/55 확인본) ↔ docs/qa-visual/wave6-about-extraction.md 전사 정본.
  // **복붙 원칙(§8-2)** — 이 필드는 설계 문서에서 기계 추출로 생성(재타이핑 금지).
  //   오타(AUDIANCES)·불완전 영문(ongoing depletion-cause)·"있었던으나"·표기
  //   (’ U+2019·— U+2014 무공백·"지속 가능한" 띄어쓰기·선행 콜론 :undesignated)
  //   전부 원문 그대로 — 교정·재작성 금지. 페이지(app/about/page.tsx)는 렌더만.
  aboutDeck: {
    brandStory: {
      label: "BRAND STORY",
      slogan: ":undesignated는 이미 도착한 사람을 위한 브랜드이다.",
      paragraphs: ["정해질 필요가 없기에 함부로 방향을 정하지 않는다.", "변화와 성장, 성과나 문제 해결로 증명하는 대신 기준 좌표(anchor)를 제시한다. 완결된 개방성으로 선택권을 넓힌다.", "판단과 책임, 정보의 과잉으로부터 보호하는 시스템적 사고로 지속 가능한 생태계를 지향한다."],
      items: [
        { number: "1.", title: "정보의 공개 및 선별", description: "설득, 선동이 아닌 기준의 제공" },
        { number: "2.", title: "침범하지 않는 설계", description: "판단이 아닌 개인의 권한 존중" },
        { number: "3.", title: "선택의 존엄", description: "설명 대신 운영의 로직으로 선택권을 넓힘" },
      ],
    },
    coreValue: {
      label: "BRAND CORE VALUE",
      items: [
        { head: "Sovereignty 주권", description: "이미 알고 있었던으나 허락되지 않았던 것들을 회수. 변화, 성장, 성과라는 외부 기준으로부터 보호하고, 진정한 자신을 기준으로 삼는다." },
        { head: "Introspection 통찰", description: "숨겨진, 왜곡된 정보들을 드러낸다. 설명하지 않는다. 설득하지 않는다. 계산할 수 있게 한다. 우선순위의 설계로 판단을 돕는다." },
        { head: "Systematic 인지통합", description: "필요로부터 이어지는 인지 시스템 통합체계를 구성. 외부 권위에 기대지 않고, 과도한 책임, 정보, 판단으로부터 개인과 에너지를 보호한다." },
      ],
    },
    goldenCircle: {
      label: "GOLDEN CIRCLE",
      items: [
        { head: "Why", korean: "외부의 욕망과, 검증, 투사, 소모로 인해 자신을 잃고 표류하는 개인에게 기준과 쉼을 제공한다. 외주화라는 자본주의의 회피 시스템에 저항하는 에너지 분배 윤리의 기준점을 세우고자 함이다.", english: "to offer a standard for those who are ongoing depletion-cause individuals to lose themselves by the external desires, demands of validation, other’s projections." },
        { head: "How", korean: "정보공개의 윤리를 따른다. 공포를 자극하는 선동으로 훼손된 개인의 판단을 되돌려주는 구조를 포함한다. 외부 권위를 검증하고 덕과 윤리를 이용해 권위를 세우는 시스템을 해체한다.", english: "following an ethic of transparency and disclosure, which includes a structure designed to restore one’s judgment, damaged by fear-driven provocation and agitation. Dismantle the elevated authorities by invoking morality and ethics to their interests, by insisting on scrutinizing external authority." },
        { head: "What", korean: "인지 에너지를 절약하는 디자인을 통해 회복을 돕고 기준과 체계를 제공해 판단과 선택, 책임을 존중한다. 개인의 욕구와 행복, 안전은 지켜져야 할 최소한의 베이스라인이다. 비판과 판단이 아닌 선택과 존엄을 지킨다.", english: "design to conserve cognitive energy, supporting recovery and provide standards and a framework that respect judgment, choice, and responsibility. One’s needs, happiness, and safety are the baseline that must be protected. It upholds choice and dignity—not criticism or judgment." },
      ],
    },
    audiences: {
      label: "AUDIANCES / CLIENTS", // 원문 오타 그대로(§1 — AUDIANCES)
      items: [
        { number: "1.", head: "Responsible", subtitle: ["선택의 무게를 아는,", "그래서 소모가 쉬운"], korean: "자신의 선택이 미치는 영향을 고려해 선택하고 그를 책임지느라 오히려 자신을 위한 에너지를 내기 어려운", english: "those who, in considering the impact of their choices and taking responsibility for them, find it all the harder to spare any energy for themselves." },
        { number: "2.", head: "Ethical", subtitle: ["윤리적인,", "그러나 권위에 종속되지 않은"], korean: "윤리를 지키고자 하지만 그것으로 타인을 판단하거나 자신의 권위를 세우는 데 윤리를 수단삼지 않는", english: "those who aim to uphold ethics, yet do not use them as a tool to judge others or to establish their own authority." },
        { number: "3.", head: "Strict standard", subtitle: ["높은 기준,", "그러나 외주화하지 않는"], korean: "성공이나 보상이 아닌 자신만의 확고한 기준을 가진, 그러나 그것을 타인에게 요구하지 않고 스스로에게 요구하는", english: "those who hold a firm standard of their own—one grounded not in success or reward—yet do not impose it on others, only on themselves." },
      ],
    },
  },
  assets: {
    // 파동4 §③ 최종 확정(2026-09-30 23:05 service-lead 정정 통보 muo5bnamja7p) —
    // 히어로 = Louivis BeBe(portfolio_4.jpg 1754×2539, 크릠 톤·채도 0.189·크롭 결함 0·
    // 히어로≠저널 카드 성립). p1(캘린더) 1차 확정(22:55)은 옐로 채감 경고(qa-visual 명시)
    // + 홈 2중 노출 문법 편차로 designer 공개 정정·폐기.
    // 가역 보존(1줄 스왑 각본): 폐기 p1 값 "/assets/portfolio_images/portfolio_1.jpg"
    // · 파동3 구 경로 "/assets/main_background.png"(남색 99.9%·글리프 절단 — 대표 폐기 결정)
    heroBackground: "/assets/portfolio_images/portfolio_4.jpg",
    // 파동5 §2(B2 데이터 추가·muosdkwtl1yu ② — 컴포넌트 슬라이드쇼는 B4):
    // 히어로 = 포트폴리오 작품 자동 전환 슬라이드쇼 4종(2:3 750×1125·mujagi §1-2).
    // 순서: NeRyGe(p2) → BeBe(p4) → YAHO(p6) → Menbal(p7).
    // 제외 근거(qa-visual 판독·docs/designer/wave5-design.md §2):
    // - p3(the TOV): 워드마크 x[1567,1841] 2:3 분할 소실 — 판독 손실
    // - p5(Flowing): QR 하단 1/4 피절 y=2001 — 판독 손실
    // - p1(달력): PRODUCTS 소속 상품 — "포트폴리오 작품" 범위 제외
    // 포함 4종 무해 판독: p4 1.7%·p6 2.8%·p2 8.3% 무해·p7 18.6% 무해.
    // heroBackground(단일 이미지·현행 p4)는 가역 보존 — B4 전환 시까지 렌더 지속.
    heroSlides: [
      "/assets/portfolio_images/portfolio_2.jpg",
      "/assets/portfolio_images/portfolio_4.jpg",
      "/assets/portfolio_images/portfolio_6.jpg",
      "/assets/portfolio_images/portfolio_7.jpg",
    ],
    // 파동6 §8-1(일감 muozb2dbo9mp) — /about 렌더에서 introduce 5장 전부 제거(대표 지시
    // "PPT 장표 같은 것들을 빼고"·designer §0). 두 데이터 전부 가역 보존.
    // 파동8-①(2026-10-01·board mup4bw9fwwh0·대표 지시 원문 mup4a2ypf775) — homepageMap도
    // 렌더 제거 확정: "파란색 ppt는 제거해도 되겠어. 그 장표가 의미하는건 홈페이지 맵인데 이미
    // 홈페이지가 구조가 바뀌어 버려서 필요가 없어." — 파동6 §7 유지 ꄁ고의 재지정 시점.
    // 가역 각본(재지정 시): app/about/page.tsx에 지도 블록 1개 복귀(§7 마크업 그대로 —
    // <div className="relative mt-section aspect-[3508/2480] w-full overflow-hidden">
    //   <Image src={site.assets.homepageMap} alt="Studio Undesignated Project Map - Branding
    //   and Design Locations in Korea" fill sizes="750px" className="object-cover" /></div>
    // — 파동8 이전 상태는 스냅샷 site-snapshot-20261001-pre-wave6.tar.gz와 page.tsx git 대조).
    homepageMap: "/assets/introduce_images/homepage_map.png",
    introduce: [
      "/assets/introduce_images/introduce_1.jpg",
      "/assets/introduce_images/introduce_2.jpg",
      "/assets/introduce_images/introduce_3.jpg",
      "/assets/introduce_images/introduce_4.jpg",
      "/assets/introduce_images/introduce_5.jpg",
    ],
    favicon: "/assets/UDN_logo_favicon.svg",
  },
} as const;
