import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      // Explicitly document access for the major public search crawlers.
      { userAgent: ["Googlebot", "Yeti", "Bingbot", "Daumoa", "OAI-SearchBot"], allow: "/" },
      // 2026-10-18 — 생성형 검색(AI 답변)이 이 사이트를 "인용 소스"로 쓸 수 있게 허용한다.
      // Cloudflare 관리 robots.txt가 앞에 붙어 같은 에이전트를 Disallow로 먼저 선언하므로
      // 여기서 명시적 Allow를 다시 선언한다. 다만 robots.txt는 권고이고,
      // 엣지(GPTBot·ClaudeBot·Perplexity-User 403) 차단의 실제 설정은
      // Cloudflare 대시보드 AI Crawl Control이다 — 그쪽에서도 Allow로 바꾸어야 한다.
      {
        userAgent: [
          "ChatGPT-User",
          "PerplexityBot",
          "Perplexity-User",
          "Claude-User",
          "Google-Agent",
          "Applebot",
        ],
        allow: "/",
      },
      // 학습(파인튜닝) 크롤러는 계속 차단 — Cloudflare Content-Signal ai-train=no 방침 유지.
      {
        userAgent: [
          "GPTBot",
          "ClaudeBot",
          "anthropic-ai",
          "CCBot",
          "Google-Extended",
          "Bytespider",
          "Amazonbot",
          "meta-externalagent",
          "Applebot-Extended",
        ],
        disallow: "/",
      },
    ],
    sitemap: "https://studioundesignated.com/sitemap.xml",
    host: "https://studioundesignated.com",
  };
}
