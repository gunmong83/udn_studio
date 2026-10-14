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
  - `NICEPAY_CLIENT_ID`: 나이스페이 테스트 상점의 Server 승인 클라이언트 키(`S2_...`)
  - `NICEPAY_SECRET_KEY`: 같은 테스트 상점의 Basic 인증 시크릿 키
  - `SENS_ALIMTALK_SERVICE_ID`, `SENS_ALIMTALK_CHANNEL_ID`, `SENS_ACCESS_KEY`, `SENS_SECRET_KEY`: 승인된 NAVER Cloud SENS Biz Message 서비스와 채널 설정 (SMS 서비스 ID와 구분)
  - `EPOST_SERVICE_KEY`: 우체국 국내우편물 종적조회 OpenAPI의 서비스 인증키
- **용도**: 로컬에서 `pnpm dev -p 3100` 또는 `scripts/start-local-stage.ps1` 실행 시 자동 로드되어 샌드박스 결제 및 테스트 로그인을 안전하게 검증합니다.

### 2. 프로덕션 환경 (`/opt/udn_studio/.env.production`)
- **기준 템플릿**: `web/.env.production.example` (로컬의 `web/.env.production` 파일 참고)
- **주요 설정**:
  - `AUTH_URL`: `https://studioundesignated.com`
  - `DATABASE_URL`: `file:/data/udn.db` (서버 Docker 볼륨 마운트)
  - `NICEPAY_CLIENT_ID`: 나이스페이 운영 상점의 Server 승인 클라이언트 키(`R2_...`)
  - `NICEPAY_SECRET_KEY`: 같은 운영 상점의 Basic 인증 시크릿 키
  - `SENS_ALIMTALK_SERVICE_ID`, `SENS_ALIMTALK_CHANNEL_ID`, `SENS_ACCESS_KEY`, `SENS_SECRET_KEY`: 승인된 NAVER Cloud SENS Biz Message 서비스와 채널 설정 (SMS 서비스 ID와 구분)
  - `EPOST_SERVICE_KEY`: 우체국 국내우편물 종적조회 OpenAPI의 운영 서비스 인증키
  - `EPOST_POLLING_TOKEN`: 매시간 배송조회 작업을 인증하는 비밀 토큰 (같은 값을 GitHub Actions secret에도 설정)
- GitHub Actions 저장소 시크릿 `EPOST_SERVICE_KEY`와 `EPOST_POLLING_TOKEN`은 배포 시 Lightsail의 `.env.production`에 안전하게 반영됩니다. 두 시크릿은 서로 다른 목적의 값이며, 우체국에서 발급한 키는 `EPOST_SERVICE_KEY`뿐입니다.
- **서버 적용 방법**:
  - Lightsail 서버 접속 후 `/opt/udn_studio/.env.production` 파일 생성 또는 수정
  - GitHub Actions의 Docker 배포 시 `--env-file /opt/udn_studio/.env.production` 옵션으로 컨테이너에 주입됩니다.

SENS 및 우체국 키는 서버 전용 환경 변수로만 관리합니다. 우체국 명세서에 기재된 API는 HTTP이며 TLS 전송 암호화가 표시되어 있지 않으므로, 서비스 키는 TLS로 보호되지 않은 연결을 통해 전송됩니다. 우체국 API 호출은 인증키가 없거나 API가 실패하면 저장을 차단합니다. 실제 서비스 설정·알림톡 승인 본문·테스트 절차는 [alimtalk-shipping.md](alimtalk-shipping.md)를 확인하세요. Docker 시작 시 마이그레이션 이력이 없는 현재 구조는 `prisma db push --skip-generate`로 새 인증/발송기록 테이블을 적용합니다. 데이터 삭제를 승인하는 옵션은 사용하지 않습니다.

> **보안 주의사항**: `.env.local` 및 `.env.production`은 `.gitignore`에 등록되어 Git 저장소에 커밋되지 않으므로 키 노출 위험이 없습니다.

## 운영 SQLite 백업

Production release는 새 컨테이너를 교체하기 전에 Python 표준 라이브러리의 SQLite 온라인 백업 API로 `/data/udn.db`의 일관된 스냅샷을 만듭니다. 백업은 `/data/backups/udn-<commit>-<run>.sqlite.gz`에 저장하고 SQLite 무결성 검사와 gzip 검사가 모두 통과해야 배포를 계속합니다. 실패하면 앱 교체 및 스키마 적용을 중단합니다. 백업 디렉터리는 권한 `0700`, 백업 파일은 `0600`으로 설정하고 30일 지난 배포 백업만 제거합니다. 별도 유료 스토리지는 추가되지 않지만, 압축 백업이 Lightsail의 `/data` 디스크를 사용하므로 사용량은 배포 빈도와 DB 크기에 따라 달라집니다. 워크플로 로그에는 압축 백업 크기만 출력됩니다.

같은 서버 디스크에 저장하므로 서버나 디스크 자체 장애에 대비한 오프사이트 백업은 아닙니다. 복구할 때는 선택한 `.sqlite.gz`를 `/data/udn.db`로 복원한 뒤 애플리케이션을 시작해야 합니다. 복원 리허설과 오프사이트 복제는 별도 운영 항목입니다.
