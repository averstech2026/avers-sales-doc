# Deploy Firestore security rules to Firebase project avers-sales-doc.
# Requires: npm i -g firebase-tools && firebase login
#
# Usage: .\scripts\deploy-firestore-rules.ps1

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

$ProjectId = if ($env:FIREBASE_PROJECT_ID) { $env:FIREBASE_PROJECT_ID } else { Read-DotEnvValue 'VITE_FIREBASE_PROJECT_ID' }

Push-Location $Root
try {
  firebase deploy --only firestore:rules --project $ProjectId
  Write-Host ""
  Write-Host "Done. Rules deployed to project: $ProjectId"
}
finally {
  Pop-Location
}
