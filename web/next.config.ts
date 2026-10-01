import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 서버 직접 IP 접속 허용 — 파동6 원인 수리(wave6-hero-rootcause.md).
  // Next 16.3.7 dev 의 block-cross-site-dev Origin 검증이 IP 오리진
  // (http://10.85.96.53:3300) 의 HMR WebSocket 을 'Unauthorized' 로 거부해
  // hydration 미완료 → 히어로 자동 전환·닷 무반응(dev.log:138 차단 기록).
  // 항목은 호스트명 형식(프로토콜/포트 없음) — csrf-protection 의
  // isCsrfOriginAllowed 가 originHostname 과 문자열 직접 비교·서버 로그
  // 권고안과 동일. dev 전용 설정 — 프로덕션 빌드·배포 무영향.
  allowedDevOrigins: ["10.85.96.53"],
  // 파동8-② v2(designer 승인 mup5yqc8sdqn·스펙 §5-3 렌더 보조): 리컬러 장표
  // 서빙 품질 75→95 — Next Image 재압축(3579→750px 축소)에서 안티앨리어싱
  // 열화·밝은 테두리 강화 완화. 원본 무손실 PNG(recolored-v2/)와 병행.
  images: { qualities: [75, 95] },
};

export default nextConfig;
