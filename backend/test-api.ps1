# =====================================================================
# Script de test rapide pour l'API Homaid Store
# Usage : .\test-api.ps1
# Prérequis : l'API doit tourner sur http://localhost:5080
# =====================================================================

$ErrorActionPreference = 'Continue'
$base = "http://localhost:5080"

function Write-Section($title) {
  Write-Host "`n========================================================" -ForegroundColor Cyan
  Write-Host "  $title" -ForegroundColor Cyan
  Write-Host "========================================================" -ForegroundColor Cyan
}

function Show-Json($obj) {
  ($obj | ConvertTo-Json -Depth 10) -split "`n" | ForEach-Object { Write-Host "  $_" }
}

# --- 1. Health -------------------------------------------------------
Write-Section "1. Health check"
try {
  $r = Invoke-RestMethod -Uri "$base/api/health" -Method Get
  Show-Json $r
} catch {
  Write-Host "ERREUR : API non joignable. Lance d'abord :" -ForegroundColor Red
  Write-Host "  dotnet run --project src/Homaid.API --urls http://localhost:5080" -ForegroundColor Yellow
  exit 1
}

# --- 2. Login admin --------------------------------------------------
Write-Section "2. Login admin (admin@homaid.local / ChangeMe!2026)"
$adminLogin = Invoke-RestMethod -Uri "$base/api/auth/admin/login" -Method Post `
  -ContentType "application/json" `
  -Body (@{ email = "admin@homaid.local"; password = "ChangeMe!2026" } | ConvertTo-Json)
Show-Json $adminLogin
$adminAccess  = $adminLogin.data.accessToken
$adminRefresh = $adminLogin.data.refreshToken
Write-Host "`n  Access token (60 premiers) : $($adminAccess.Substring(0, 60))..." -ForegroundColor Green

# --- 3. Inscription client ------------------------------------------
Write-Section "3. Inscription nouveau client"
$rand = Get-Random
$cust = Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post `
  -ContentType "application/json" `
  -Body (@{
    email = "test$rand@homaid.local"
    phone = "+21260011$rand"
    firstName = "Karim"
    lastName = "Test"
    password = "MotDePasse123!"
    preferredLanguage = "fr"
  } | ConvertTo-Json)
Show-Json $cust
$custRefresh = $cust.data.refreshToken

# --- 4. Login client ------------------------------------------------
Write-Section "4. Login client"
$login = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post `
  -ContentType "application/json" `
  -Body (@{ email = "test$rand@homaid.local"; password = "MotDePasse123!" } | ConvertTo-Json)
Write-Host "  Login OK, user = $($login.data.user.fullName)" -ForegroundColor Green

# --- 5. Refresh token (rotation) ------------------------------------
Write-Section "5. Refresh token (rotation)"
$refreshed = Invoke-RestMethod -Uri "$base/api/auth/refresh" -Method Post `
  -ContentType "application/json" `
  -Body (@{ refreshToken = $custRefresh } | ConvertTo-Json)
Write-Host "  Nouveau access token genere, expire le $($refreshed.data.accessExpiresAt)" -ForegroundColor Green
Write-Host "  Ancien refresh token revoque (rotation)." -ForegroundColor Green

# --- 6. Vérif rotation : ancien refresh doit échouer ----------------
Write-Section "6. Verif rotation : reutilisation ancien refresh → 401"
try {
  Invoke-RestMethod -Uri "$base/api/auth/refresh" -Method Post `
    -ContentType "application/json" `
    -Body (@{ refreshToken = $custRefresh } | ConvertTo-Json) | Out-Null
  Write-Host "  PROBLEME : devrait avoir echoue" -ForegroundColor Red
} catch {
  Write-Host "  OK - retourne $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Green
}

# --- 7. Email déjà utilisé → 409 ------------------------------------
Write-Section "7. Email deja utilise → 409"
try {
  Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post `
    -ContentType "application/json" `
    -Body (@{
      email = "test$rand@homaid.local"
      phone = "+212600"
      firstName = "X"; lastName = "Y"
      password = "AutrePass123!"
    } | ConvertTo-Json) | Out-Null
} catch {
  Write-Host "  OK - retourne $($_.Exception.Response.StatusCode.value__) (Conflict)" -ForegroundColor Green
}

# --- 8. Mauvais mot de passe → 401 ----------------------------------
Write-Section "8. Mauvais mot de passe admin → 401"
try {
  Invoke-RestMethod -Uri "$base/api/auth/admin/login" -Method Post `
    -ContentType "application/json" `
    -Body (@{ email = "admin@homaid.local"; password = "WRONG" } | ConvertTo-Json) | Out-Null
} catch {
  Write-Host "  OK - retourne $($_.Exception.Response.StatusCode.value__) (Unauthorized)" -ForegroundColor Green
}

# --- 9. Mot de passe trop court → 400 -------------------------------
Write-Section "9. Mot de passe trop court → 400"
try {
  Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post `
    -ContentType "application/json" `
    -Body (@{
      email = "short@test.ma"; phone = "+212"; firstName = "A"; lastName = "B"; password = "abc"
    } | ConvertTo-Json) | Out-Null
} catch {
  Write-Host "  OK - retourne $($_.Exception.Response.StatusCode.value__) (BadRequest)" -ForegroundColor Green
}

# --- 10. Security headers -------------------------------------------
Write-Section "10. Security headers sur /api/health"
$resp = Invoke-WebRequest -Uri "$base/api/health" -Method Get
foreach ($h in @("X-Frame-Options", "X-Content-Type-Options", "Strict-Transport-Security", "Referrer-Policy", "Permissions-Policy")) {
  $val = $resp.Headers[$h]
  if ($val) { Write-Host "  $h : $val" -ForegroundColor Green }
  else      { Write-Host "  $h : MANQUANT" -ForegroundColor Red }
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "  Tous les tests termines" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
