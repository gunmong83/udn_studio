param(
  [int]$Port = 3100,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$webRoot = Join-Path $repoRoot "web"
$pidFile = Join-Path $repoRoot ".local-stage.pid"
$logFile = Join-Path $repoRoot ".local-stage.log"
$errorLogFile = Join-Path $repoRoot ".local-stage-error.log"

function Resolve-PnpmCommand {
  if (Get-Command pnpm -ErrorAction SilentlyContinue) { return "pnpm" }
  if (Get-Command corepack -ErrorAction SilentlyContinue) { return "corepack" }
  throw "pnpm 또는 corepack이 필요합니다. Node.js를 설치한 뒤 다시 실행하세요."
}

& (Join-Path $PSScriptRoot "stop-local-stage.ps1")

if (-not $SkipBuild) {
  & (Join-Path $PSScriptRoot "test-local.ps1") -SkipInstall
}

$pnpmCommand = Resolve-PnpmCommand
$arguments = if ($pnpmCommand -eq "corepack") {
  @("pnpm", "exec", "next", "start", "-H", "127.0.0.1", "-p", "$Port")
} else {
  @("exec", "next", "start", "-H", "127.0.0.1", "-p", "$Port")
}

$process = Start-Process -FilePath $pnpmCommand -ArgumentList $arguments -WorkingDirectory $webRoot -RedirectStandardOutput $logFile -RedirectStandardError $errorLogFile -PassThru
Set-Content -LiteralPath $pidFile -Value $process.Id

$baseUrl = "http://127.0.0.1:$Port"
$paths = @("/", "/login", "/signup", "/terms", "/privacy", "/api/auth/providers")
$ready = $false
for ($attempt = 0; $attempt -lt 30; $attempt++) {
  try {
    $response = Invoke-WebRequest -Uri $baseUrl -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) { $ready = $true; break }
  } catch {
    Start-Sleep -Seconds 1
  }
}

if (-not $ready) {
  & (Join-Path $PSScriptRoot "stop-local-stage.ps1")
  throw "로컬 가배포가 시작되지 않았습니다. .local-stage-error.log를 확인하세요."
}

foreach ($path in $paths) {
  $response = Invoke-WebRequest -Uri "$baseUrl$path" -UseBasicParsing -TimeoutSec 10
  if ($response.StatusCode -ne 200) { throw "스모크 테스트 실패: $path ($($response.StatusCode))" }
  Write-Host "OK $path" -ForegroundColor Green
}

Write-Host "로컬 가배포 실행 중: $baseUrl" -ForegroundColor Cyan
Write-Host "종료: .\scripts\stop-local-stage.ps1"
