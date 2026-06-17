param(
  [string]$HostAlias = "paymory-vps",
  [string]$RemoteRoot = "/var/www/paymory",
  [string]$LauncherRoot = "/var/www/launcher"
)

$ErrorActionPreference = "Stop"

function Invoke-Checked {
  param(
    [string]$FilePath,
    [string[]]$Arguments
  )

  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$FilePath exited with code $LASTEXITCODE"
  }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host "Building Paymory client..."
Invoke-Checked "npm.cmd" @("run", "build")

$indexPath = Join-Path $repoRoot "client\dist\index.html"
$indexHtml = Get-Content -Raw -LiteralPath $indexPath
if ($indexHtml -notmatch "/paymory/assets/") {
  throw "Production build is not using /paymory/assets/. Check client/.env.production and Vite config."
}

Write-Host "Preparing remote directories..."
Invoke-Checked "ssh.exe" @(
  $HostAlias,
  "rm -rf '$RemoteRoot/client/dist' && mkdir -p '$RemoteRoot/client' '$LauncherRoot'"
)

Write-Host "Uploading Paymory build..."
Invoke-Checked "scp.exe" @(
  "-r",
  "client/dist",
  "${HostAlias}:$RemoteRoot/client/"
)

Write-Host "Uploading launcher..."
Invoke-Checked "scp.exe" @(
  "deploy/launcher/index.html",
  "${HostAlias}:$LauncherRoot/index.html"
)

Write-Host "Reloading nginx..."
Invoke-Checked "ssh.exe" @(
  $HostAlias,
  "chmod -R a+rX '$RemoteRoot/client/dist' '$LauncherRoot' && nginx -t && systemctl reload nginx"
)

Write-Host "Verifying public URLs..."
Invoke-Checked "curl.exe" @(
  "-sS",
  "-o",
  "NUL",
  "-w",
  "launcher %{http_code} %{content_type}`n",
  "--max-time",
  "15",
  "http://187.127.110.15/"
)
Invoke-Checked "curl.exe" @(
  "-sS",
  "-o",
  "NUL",
  "-w",
  "paymory-login %{http_code} %{content_type}`n",
  "--max-time",
  "15",
  "http://187.127.110.15/paymory/login"
)
Invoke-Checked "curl.exe" @(
  "-sS",
  "--max-time",
  "15",
  "http://187.127.110.15/paymory/api/health"
)

Write-Host "Deploy complete."
