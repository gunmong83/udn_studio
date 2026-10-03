# 개발·검증·배포 절차

프로덕션 서버는 코드 푸시만으로 배포되지 않습니다. 여러 변경을 한 작업 단위로 묶고 아래 단계를 모두 통과한 경우에만 수동 배포합니다.

## 1. 로컬 기본 검증

```powershell
.\scripts\test-local.ps1
```

의존성을 잠금 파일 기준으로 확인한 뒤 ESLint와 Next.js 프로덕션 빌드를 실행합니다. 반복 실행 시 설치를 생략하려면 `-SkipInstall`을 사용합니다.

## 2. 로컬 가배포와 스모크 테스트

```powershell
.\scripts\start-local-stage.ps1
```

프로덕션 빌드를 `http://127.0.0.1:3100`에서 실행하고 홈, 로그인, 회원가입, 약관, 개인정보, 인증 제공자 API를 자동 점검합니다. 브라우저에서 주요 사용자 흐름을 직접 확인한 뒤 종료합니다.

```powershell
.\scripts\stop-local-stage.ps1
```

다른 포트가 필요하면 `-Port 3200`처럼 지정합니다. 이미 빌드가 끝났다면 `-SkipBuild`를 사용할 수 있습니다.

## 3. 작업 묶음 커밋

서로 관련된 기능과 수정사항을 한 릴리스 단위로 정리합니다. 작은 문구 변경마다 배포하지 않고, 로컬 가배포에서 확인한 변경들을 함께 커밋·푸시합니다.

## 4. 프로덕션 수동 배포

GitHub Actions의 **Production release** 워크플로에서 **Run workflow**를 누릅니다.

- `confirm`: `DEPLOY`를 정확히 입력합니다.
- `release_note`: 이번 작업 묶음의 내용을 기록합니다.

이때만 Docker 이미지를 빌드해 Docker Hub에 커밋 SHA 태그로 올리고, Lightsail이 해당 이미지를 한 번 내려받아 교체합니다. `main`이나 개발 브랜치에 푸시하는 것만으로는 서버 배포나 서버 이미지 다운로드가 발생하지 않습니다.

## 배포 전 체크리스트

- `test-local.ps1` 성공
- 로컬 가배포의 자동 스모크 테스트 성공
- 로그인·회원가입·OAuth·장바구니 등 변경 영역 수동 확인
- Git 상태와 릴리스 커밋 확인
- 여러 변경이 충분한 작업 단위로 묶였는지 확인

## 환경 변수 설정 (로컬 vs 프로덕션)

환경 변수는 로컬 개발/테스트용과 AWS Lightsail 프로덕션용으로 분리되어 있습니다.

### 1. 로컬 환경 (`web/.env.local`)
- **기준 템플릿**: `web/.env.example`
- **주요 설정**:
  - `AUTH_URL`: `http://localhost:3100`
  - `DATABASE_URL`: `file:C:/Users/gunmong/source/udn_studio/.local-stage-data/udn.db` (로컬 SQLite)
  - `TOSS_SECRET_KEY`: `test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R` (토스 공식 테스트 시크릿 키)
  - `NEXT_PUBLIC_TOSS_CLIENT_KEY`: `test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq` (토스 공식 테스트 클라이언트 키)
- **용도**: 로컬에서 `pnpm dev -p 3100` 또는 `scripts/start-local-stage.ps1` 실행 시 자동 로드되어 샌드박스 결제 및 테스트 로그인을 안전하게 검증합니다.

### 2. 프로덕션 환경 (`/opt/udn_studio/.env.production`)
- **기준 템플릿**: `web/.env.production.example` (로컬의 `web/.env.production` 파일 참고)
- **주요 설정**:
  - `AUTH_URL`: `https://studioundesignated.com`
  - `DATABASE_URL`: `file:/data/udn.db` (서버 Docker 볼륨 마운트)
  - `TOSS_SECRET_KEY`: `live_sk_...` (토스페이먼츠 상점 계약 후 발급받은 실결제 시크릿 키)
  - `NEXT_PUBLIC_TOSS_CLIENT_KEY`: `live_ck_...` (토스페이먼츠 실결제 클라이언트 키)
- **서버 적용 방법**:
  - Lightsail 서버 접속 후 `/opt/udn_studio/.env.production` 파일 생성 또는 수정
  - GitHub Actions의 Docker 배포 시 `--env-file /opt/udn_studio/.env.production` 옵션으로 컨테이너에 주입됩니다.

> **보안 주의사항**: `.env.local` 및 `.env.production`은 `.gitignore`에 등록되어 Git 저장소에 커밋되지 않으므로 키 노출 위험이 없습니다.

