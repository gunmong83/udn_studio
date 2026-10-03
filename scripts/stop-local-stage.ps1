$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $repoRoot ".local-stage.pid"

if (-not (Test-Path -LiteralPath $pidFile)) { return }

$stagePid = (Get-Content -LiteralPath $pidFile -Raw).Trim()
if ($stagePid -match '^\d+$') {
  $process = Get-Process -Id ([int]$stagePid) -ErrorAction SilentlyContinue
  if ($process) {
    Stop-Process -Id $process.Id -Force
    [void]$process.WaitForExit(5000)
  }
}
Remove-Item -LiteralPath $pidFile -Force
