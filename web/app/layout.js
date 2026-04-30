import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://studioudn.com';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Studio Undesignated | 스튜디오 UDN | 토탈 브랜딩 디자인 스튜디오',
  description:
    'Studio Undesignated (스튜디오 UDN) - 서울, 나주, 과천 기반의 토탈 브랜딩 디자인 스튜디오. 로고 디자인, 브랜드 아이덴티티 전문.',
  keywords: [
    '스튜디오 udn',
    'studio udn',
    'studioudn',
    'studioundesignated',
    '스튜디오 유디엔',
    'Studio Undesignated',
    '브랜딩',
    '로고 디자인',
    '브랜드 아이덴티티',
  ],
  authors: [{ name: 'Studio Undesignated' }],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    locale: 'ko_KR',
    title: 'Studio Undesignated | 스튜디오 UDN | 토탈 브랜딩 디자인 스튜디오',
    description:
      '스튜디오 UDN (Studio Undesignated) - 서울, 나주, 과천 기반의 토탈 브랜딩 디자인 스튜디오. 로고, 아이덴티티, 포스터 전문 디자인 솔루션.',
    images: ['/assets/main_background.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Studio Undesignated | 스튜디오 UDN',
    description:
      '스튜디오 UDN (Studio Undesignated) - 서울, 나주, 과천 기반의 토탈 브랜딩 디자인 스튜디오.',
    images: ['/assets/main_background.png'],
  },
  verification: {
    other: {
      'naver-site-verification': '6ecf5f9ae06a24e081644eb202182b8900f4a60a',
    },
  },
};

export default function RootLayout({ children }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Studio Undesignated',
    alternateName: [
      '스튜디오 UDN',
      'studioudn',
      'studioundesignated',
      'stduio udn',
      'studio udn',
      '스튜디오 유디엔',
    ],
    url: `${siteUrl}/`,
    logo: `${siteUrl}/assets/UDN_logo_favicon.svg`,
    image: `${siteUrl}/assets/main_background.png`,
    description:
      'Studio Undesignated (스튜디오 UDN) - 서울, 나주, 과천 등 한국 전역에서 활동하는 토탈 브랜딩 디자인 스튜디오입니다.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'KR',
      addressRegion: 'Seoul',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 37.5665,
      longitude: 126.978,
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Design Services',
      itemListElement: ['Total Branding', 'Logo Design', 'Poster Design'].map((name) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name,
        },
      })),
    },
    sameAs: ['https://smartstore.naver.com/studioudn'],
  };

  return (
    <html lang="ko">
      <head>
        <meta name="geo.region" content="KR-11" />
        <meta name="geo.placename" content="Seoul, Naju, Gwaheon" />
        <meta name="geo.position" content="37.5665;126.9780" />
        <meta name="ICBM" content="37.5665, 126.9780" />
        <link rel="icon" type="image/svg+xml" href="/assets/UDN_logo_favicon.svg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
