# Deploy DaData party lookup to Yandex Cloud Functions (Windows).
# Requires: yc init + DADATA_API_KEY in .env
#
# Usage: .\scripts\deploy-dadata-party.ps1

$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$EnvFile = Join-Path $Root '.env'

function Read-DotEnvValue([string]$Name) {
  if (-not (Test-Path $EnvFile)) {
    throw ".env not found in $Root"
  }

  foreach ($line in Get-Content $EnvFile) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }
    if ($trimmed -match "^${Name}=(.*)$") {
      return $matches[1].Trim().Trim('"').Trim("'")
    }
  }

  throw "Missing in .env: $Name"
}

function Try-DotEnvValue([string]$Name) {
  try { return Read-DotEnvValue $Name } catch { return '' }
}

$FunctionName = if ($env:YC_DADATA_FUNCTION_NAME) { $env:YC_DADATA_FUNCTION_NAME } else { 'avers-find-party' }
$Runtime = if ($env:YC_DADATA_RUNTIME) { $env:YC_DADATA_RUNTIME } else { 'nodejs22' }
$ApiKey = if ($env:DADATA_API_KEY) { $env:DADATA_API_KEY } else { Read-DotEnvValue 'DADATA_API_KEY' }
$SecretKey = if ($env:DADATA_SECRET_KEY) { $env:DADATA_SECRET_KEY } else { Try-DotEnvValue 'DADATA_SECRET_KEY' }

$Yc = Join-Path $env:USERPROFILE 'yandex-cloud\bin\yc.exe'
if (-not (Test-Path $Yc)) {
  $ycCmd = Get-Command yc -ErrorAction SilentlyContinue
  if ($ycCmd) {
    $Yc = $ycCmd.Source
  } else {
    throw 'yc not found. Install Yandex Cloud CLI and run yc init.'
  }
}

$StageDir = Join-Path ([IO.Path]::GetTempPath()) ("yc-dadata-deploy-" + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $StageDir | Out-Null

try {
  Copy-Item (Join-Path $Root 'yandex-cloud\findParty\index.js') $StageDir
  Copy-Item (Join-Path $Root 'yandex-cloud\findParty\package.json') $StageDir
  Copy-Item (Join-Path $Root 'functions\dadataParty.js') (Join-Path $StageDir 'dadataParty.js')

  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  & $Yc serverless function create --name $FunctionName 2>&1 | Out-Null
  $ErrorActionPreference = $prevEap

  $EnvVars = "DADATA_API_KEY=$ApiKey"
  if ($SecretKey) {
    $EnvVars = "$EnvVars,DADATA_SECRET_KEY=$SecretKey"
  }

  & $Yc serverless function version create `
    --function-name $FunctionName `
    --runtime $Runtime `
    --entrypoint index.handler `
    --memory 128m `
    --execution-timeout 15s `
    --source-path $StageDir `
    --environment $EnvVars

  $ErrorActionPreference = 'Continue'
  & $Yc serverless function allow-unauthenticated-invoke $FunctionName 2>&1 | Out-Null
  $ErrorActionPreference = $prevEap

  $functionJson = & $Yc serverless function get $FunctionName --format json | ConvertFrom-Json
  $Url = "https://functions.yandexcloud.net/$($functionJson.id)"

  Write-Host ''
  Write-Host 'Done. Add to .env or GitHub Secrets:'
  Write-Host "  VITE_DADATA_PARTY_URL=$Url"
  Write-Host ''
  Write-Host 'Then restart dev server or rebuild.'
}
finally {
  Remove-Item -Recurse -Force $StageDir -ErrorAction SilentlyContinue
}
