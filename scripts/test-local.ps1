param(
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$webRoot = Join-Path $repoRoot "web"

function Invoke-Pnpm {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)
  if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    & pnpm @Arguments
  } elseif (Get-Command corepack -ErrorAction SilentlyContinue) {
    & corepack pnpm @Arguments
  } else {
    throw "pnpm 또는 corepack이 필요합니다. Node.js를 설치한 뒤 다시 실행하세요."
  }
  if ($LASTEXITCODE -ne 0) { throw "pnpm 명령이 실패했습니다: $($Arguments -join ' ')" }
}

Push-Location $webRoot
try {
  if (-not $SkipInstall) {
    Invoke-Pnpm install --frozen-lockfile
  }
  Invoke-Pnpm lint
  Invoke-Pnpm build
  Write-Host "로컬 검증 완료: lint + production build" -ForegroundColor Green
} finally {
  Pop-Location
}
