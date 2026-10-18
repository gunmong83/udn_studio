# Studio Undesignated — 스튜디오 UDN

## 공식 웹사이트 → **https://studioundesignated.com**

Studio Undesignated(스튜디오 UDN)는 **정해지지 않은 가능성을 디자인하는 토탈 브랜딩 디자인 스튜디오**입니다.
로고 디자인과 브랜드 아이덴티티부터 전시 포스터, 패키지, 출판물, 굿즈까지 — 브랜드가 전달하고자 하는 본질적인 메시지를 시각화합니다.

| | |
| --- | --- |
| 웹사이트 | https://studioundesignated.com |
| 포트폴리오 | https://studioundesignated.com/portfolio |
| 스튜디오 소개 | https://studioundesignated.com/about |
| 작업 노트(저널) | https://studioundesignated.com/journal |
| 스마트스토어 | https://smartstore.naver.com/studioudn |
| Instagram | https://www.instagram.com/design_studio_undesignated/ |
| Threads | https://www.threads.com/@design_studio_undesignated |
| 문의 | studioudn@naver.com · 카카오톡 채널 https://talk.naver.com/WJJOCY8 |

### 대표 상품

- **UDN Calendar 2027 Food in Season [令 Ryung]** — https://studioundesignated.com/products/ryeong-2027
- **UDN Calendar 2026 Food in Season [令 Ryung]** — https://studioundesignated.com/products/udn-calendar-2026
- 굿즈(마스킹테이프·엽서·스티커) 전체 보기 — https://studioundesignated.com/products

---

## 이 저장소에 대하여

위 웹사이트(자사몰)의 소스 저장소입니다.

- 스택: Next.js (App Router) · Prisma / SQLite · NextAuth (Google · Naver · Credentials) · NICEPAY 결제 · nginx + Docker (AWS)
- 환경 변수 템플릿: [`web/.env.example`](web/.env.example), [`web/.env.production.example`](web/.env.production.example)
- 배포: 개발·검증·프로덕션 배포 절차는 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)를 따릅니다. 코드 푸시는 프로덕션 서버를 자동 배포하지 않으며, 로컬 검증과 가배포를 통과한 작업 묶음만 GitHub Actions의 `Production release`에서 수동 배포합니다.

