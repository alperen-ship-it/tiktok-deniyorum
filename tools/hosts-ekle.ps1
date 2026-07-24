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
# DIKKAT: Copy-Item hatasi da sonlandirici DEGIL. Yedek alinamadiysa geri donus
# yolumuz yok demektir; o durumda hic dokunmadan cikiyoruz.
$yedek = "$hosts.yedek-" + (Get-Date -Format 'yyyyMMdd-HHmmss')
try {
    Copy-Item -LiteralPath $hosts -Destination $yedek -Force -ErrorAction Stop
    Write-Host "  Yedek alindi: $yedek" -ForegroundColor DarkGray
} catch {
    Write-Host "  YEDEK ALINAMADI: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host '  hosts dosyasi kilitli ya da salt-okunur olabilir (antivirus / ReadOnly).' -ForegroundColor Red
    Write-Host '  Hicbir sey degistirilmedi.' -ForegroundColor Red
    Write-Host ''
    Write-Host '  Alternatif — hicbir kurulum gerektirmez:' -ForegroundColor Cyan
    Write-Host '     http://localtest.me:8787/overlays/alerts.html?lite=1'
    exit 1
}

$satirlar = Get-Content -LiteralPath $hosts

if ($Kaldir) {
    $yeni = @($satirlar | Where-Object { $_ -notmatch [regex]::Escape($isaret) })
    try {
        # Set-Content once dosyayi bosaltip sonra yazar: yarida patlarsa hosts
        # dosyasi BOZULUR. Bu yuzden hatayi sonlandirici yapip yakaliyoruz.
        Set-Content -LiteralPath $hosts -Value $yeni -Encoding ASCII -ErrorAction Stop
    } catch {
        Write-Host "  YAZILAMADI: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host '  DIKKAT: hosts dosyasi yarim yazilmis olabilir. Yedekten geri don:' -ForegroundColor Red
        Write-Host "     Copy-Item -LiteralPath '$yedek' -Destination '$hosts' -Force" -ForegroundColor Yellow
        exit 1
    }
    # Yazma hatasiz gorunse bile dosyayi GERI OKUYUP dogrula
    if (Select-String -LiteralPath $hosts -SimpleMatch $isaret -Quiet) {
        Write-Host '  Yazma hatasiz gorundu ama kayit hala dosyada.' -ForegroundColor Red
        Write-Host "  Yedek: $yedek" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "  '$AlanAdi' kaydi kaldirildi." -ForegroundColor Green

} else {
    # Yorum satirlarini sayma: bozuk bir kayit yuzunden 'zaten var' deyip
    # sorunu kalici hale getirmeyelim.
    $zatenVar = $satirlar | Where-Object {
        $_ -notmatch '^\s*#' -and $_ -match ('^\s*127\.0\.0\.1\s+' + [regex]::Escape($AlanAdi) + '\b')
    }

    if ($zatenVar) {
        Write-Host "  '$AlanAdi' zaten hosts dosyasinda kayitli." -ForegroundColor Yellow
    } else {
        # Add-Content degerden SONRA satir sonu yazar, ONCE yazmaz. hosts dosyasi
        # son satirdan sonra CRLF icermiyorsa (Notepad ile duzenlenmisse tipik)
        # yeni kayit son satira YAPISIR. Son satir yorumsa ('# ::1  localhost')
        # tum satir yorum sayilir ve kayit hic islemez.
        try {
            $mevcut = [System.IO.File]::ReadAllText($hosts)
            if ($mevcut.Length -gt 0 -and -not ($mevcut.EndsWith("`n") -or $mevcut.EndsWith("`r"))) {
                Add-Content -LiteralPath $hosts -Value '' -Encoding ASCII -ErrorAction Stop
            }
            Add-Content -LiteralPath $hosts -Value "127.0.0.1`t$AlanAdi`t$isaret" -Encoding ASCII -ErrorAction Stop
        } catch {
            Write-Host "  YAZILAMADI: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host '  Muhtemel sebep: hosts salt-okunur, antivirus kilidi (Malwarebytes/Avast/Norton)' -ForegroundColor Red
            Write-Host '  ya da Defender HostsFileHijack korumasi.' -ForegroundColor Red
            Write-Host ''
            Write-Host '  Alternatif — hicbir kurulum gerektirmez:' -ForegroundColor Cyan
            Write-Host '     http://localtest.me:8787/overlays/alerts.html?lite=1'
            exit 1
        }

        # Yazma "basarili" gorunse bile geri okuyup DOGRULA: antivirus yazmayi
        # sessizce geri almis olabilir.
        $dogrula = Select-String -LiteralPath $hosts `
            -Pattern ('^\s*127\.0\.0\.1\s+' + [regex]::Escape($AlanAdi) + '\b') -Quiet
        if (-not $dogrula) {
            Write-Host '  Yazma gorunuste basarili ama satir dosyada yok.' -ForegroundColor Red
            Write-Host '  (Antivirus geri almis olabilir.) Alternatif:' -ForegroundColor Cyan
            Write-Host '     http://localtest.me:8787/overlays/alerts.html?lite=1'
            exit 1
        }
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
