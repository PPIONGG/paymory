# Paymory — safely reset the PostgreSQL 'postgres' password to a known dev value.
# It backs up pg_hba.conf, briefly switches to passwordless (trust) mode to set
# the new password, then ALWAYS restores the original secure config.
$ErrorActionPreference = 'Stop'
$pg    = 'C:\Program Files\PostgreSQL\18'
$hba   = "$pg\data\pg_hba.conf"
$svc   = 'postgresql-x64-18'
$newPw = 'paymory_dev'

Write-Host '== Paymory: resetting postgres password ==' -ForegroundColor Cyan

# 1) Back up the current config
Copy-Item $hba "$hba.paymory-bak" -Force
Write-Host '[1/4] Backed up pg_hba.conf'

try {
  # 2) Temporarily allow passwordless local login
  (Get-Content $hba -Raw) -replace 'scram-sha-256', 'trust' | Set-Content $hba -Encoding ascii
  Restart-Service $svc -Force
  Start-Sleep -Seconds 3
  Write-Host '[2/4] Temporary trust mode enabled'

  # 3) Set the new password
  & "$pg\bin\psql.exe" -U postgres -h localhost -p 5432 -c "ALTER USER postgres PASSWORD '$newPw';" | Out-Null
  Write-Host "[3/4] New password set: $newPw" -ForegroundColor Green
}
finally {
  # 4) Always restore the original secure config
  Copy-Item "$hba.paymory-bak" $hba -Force
  Restart-Service $svc -Force
  Start-Sleep -Seconds 3
  Write-Host '[4/4] Secure config restored'
}

Write-Host ''
Write-Host 'DONE. postgres password is now: paymory_dev' -ForegroundColor Green
