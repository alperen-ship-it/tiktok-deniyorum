<#
  hosts-ekle.ps1 — LIVE Studio'nun Link kaynagi icin yerel alan adi olusturur.

  === Neden gerekli? ===
  TikTok LIVE Studio'nun "Link" (tarayici) kaynagi, adres alanina yazdigin
  "localhost" veya ham IP adresini REDDEDIYOR; gercek bir alan adi istiyor.

  Iki cozum var:
    1) localtest.me  -> herkese acik bir alan adi, DNS'i kalici olarak
       127.0.0.1'e cozuluyor. Hicbir kurulum gerektirmez.
       ANCAK bazi modemlerin "DNS rebind koruması" bunu engelliyor
       (AVM FritzBox basta olmak uzere).
    2) Bu script      -> hosts dosyasina kendi yerel alan adini ekler.
       Modem/DNS ne yaparsa yapsin calisir.

  === Kullanim ===
  PowerShell'i YONETICI olarak ac:
      powershell -ExecutionPolicy Bypass -File .\hosts-ekle.ps1

  Sonra Link kaynagina sunu yaz:
      http://yayin.local:8787/overlays/alerts.html?lite=1

  Geri almak icin:
      powershell -ExecutionPolicy Bypass -File .\hosts-ekle.ps1 -Kaldir
#>

[CmdletBinding()]
param(
    [string]$AlanAdi = 'yayin.local',
    [switch]$Kaldir
)

$hosts = "$env:windir\System32\drivers\etc\hosts"
$isaret = '# tiktok-yayin-oyuncaklari'

# --- Yonetici mi? ---
$admin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()
         ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $admin) {
    Write-Host ''
    Write-Host '  Bu script YONETICI yetkisi istiyor (hosts dosyasi korumali).' -ForegroundColor Yellow
    Write-Host '  PowerShell ikonuna sag tik -> "Yonetici olarak calistir" ile tekrar dene.'
    Write-Host ''
    Write-Host '  Alternatif: hic kurulum yapmadan localtest.me kullan:' -ForegroundColor Cyan
    Write-Host '     http://localtest.me:8787/overlays/alerts.html?lite=1'
    Write-Host ''
    exit 1
}

if (-not (Test-Path -LiteralPath $hosts)) {
    Write-Host "  hosts dosyasi bulunamadi: $hosts" -ForegroundColor Red
    exit 1
}

# --- Yedek ---
$yedek = "$hosts.yedek-" + (Get-Date -Format 'yyyyMMdd-HHmmss')
Copy-Item -LiteralPath $hosts -Destination $yedek -Force
Write-Host "  Yedek alindi: $yedek" -ForegroundColor DarkGray

$satirlar = Get-Content -LiteralPath $hosts

if ($Kaldir) {
    $yeni = $satirlar | Where-Object { $_ -notmatch [regex]::Escape($isaret) }
    Set-Content -LiteralPath $hosts -Value $yeni -Encoding ASCII
    Write-Host "  '$AlanAdi' kaydi kaldirildi." -ForegroundColor Green
} else {
    if ($satirlar -match [regex]::Escape($AlanAdi)) {
        Write-Host "  '$AlanAdi' zaten hosts dosyasinda kayitli." -ForegroundColor Yellow
    } else {
        Add-Content -LiteralPath $hosts -Value "127.0.0.1`t$AlanAdi`t$isaret" -Encoding ASCII
        Write-Host "  Eklendi: 127.0.0.1 -> $AlanAdi" -ForegroundColor Green
    }
}

ipconfig /flushdns | Out-Null
Write-Host '  DNS onbellegi temizlendi.'

# --- Dogrula ---
Write-Host ''
Write-Host '  Dogrulaniyor...' -ForegroundColor DarkGray
try {
    $cozum = [System.Net.Dns]::GetHostAddresses($AlanAdi) | Select-Object -First 1
    if ($Kaldir) {
        Write-Host "  $AlanAdi hala $cozum adresine cozuluyor (onbellek olabilir)." -ForegroundColor Yellow
    } elseif ("$cozum" -eq '127.0.0.1') {
        Write-Host "  BASARILI: $AlanAdi -> 127.0.0.1" -ForegroundColor Green
        Write-Host ''
        Write-Host '  Link kaynagina yapistirabilecegin adresler:' -ForegroundColor Cyan
        foreach ($o in @('alerts','chat','gift-rain','like-goal','battle','race')) {
            Write-Host "     http://$AlanAdi`:8787/overlays/$o.html?lite=1"
        }
    } else {
        Write-Host "  $AlanAdi -> $cozum  (beklenen 127.0.0.1 degil)" -ForegroundColor Yellow
    }
} catch {
    if (-not $Kaldir) {
        Write-Host "  $AlanAdi cozulemedi. hosts dosyasini elle kontrol et." -ForegroundColor Red
    } else {
        Write-Host "  $AlanAdi artik cozulmuyor — kaldirma basarili." -ForegroundColor Green
    }
}
Write-Host ''
