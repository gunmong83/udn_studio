import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self' https://pay.nicepay.co.kr https://*.nicepay.co.kr",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pay.nicepay.co.kr https://*.nicepay.co.kr https://t1.daumcdn.net https://*.daumcdn.net https://postcode.map.daum.net",
      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://*.daumcdn.net",
      "font-src 'self' data: https://cdn.jsdelivr.net",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://pay.nicepay.co.kr https://*.nicepay.co.kr https://*.daumcdn.net https://postcode.map.daum.net",
      "frame-src 'self' https://pay.nicepay.co.kr https://*.nicepay.co.kr https://postcode.map.daum.net https://*.daumcdn.net https://*.daum.net https://*.kakao.com",
      "child-src 'self' https://pay.nicepay.co.kr https://*.nicepay.co.kr https://postcode.map.daum.net https://*.daumcdn.net",
    ].join("; ");

    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
      ],
    }];
  },
  // 개발 서버 직접 IP 접속 허용 — 파동6 원인 수리(wave6-hero-rootcause.md).
  // Next 16.3.7 dev 의 block-cross-site-dev Origin 검증이 IP 오리진
  // (http://10.85.96.53:3300) 의 HMR WebSocket 을 'Unauthorized' 로 거부해
  // hydration 미완료 → 히어로 자동 전환·닷 무반응(dev.log:138 차단 기록).
  // 항목은 호스트명 형식(프로토콜/포트 없음) — csrf-protection 의
  // isCsrfOriginAllowed 가 originHostname 과 문자열 직접 비교·서버 로그
  // 권고안과 동일. dev 전용 설정 — 프로덕션 빌드·배포 무영향.
  allowedDevOrigins: [
    "10.85.96.53",
    "127.0.0.1",
    "localhost",
    "192.168.219.135",
    "*.trycloudflare.com",
    "hypothetical-appointed-dodge-random.trycloudflare.com",
  ],
  // 파동8-② v2(designer 승인 mup5yqc8sdqn·스펙 §5-3 렌더 보조): 리컬러 장표
  // 서빙 품질 75→95 — Next Image 재압축(3579→750px 축소)에서 안티앨리어싱
  // 열화·밝은 테두리 강화 완화. 원본 무손실 PNG(recolored-v2/)와 병행.
  images: { qualities: [75, 95] },
};

export default nextConfig;
