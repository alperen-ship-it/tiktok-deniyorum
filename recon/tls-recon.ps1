<#
  TikTok LIVE Studio - Yerel Kesif / Recon Scripti
  ------------------------------------------------
  Kendi bilgisayarindaki TikTok LIVE Studio kurulumunu analiz eder ve
  tek bir rapor dosyasi uretir. Hicbir seyi DEGISTIRMEZ, sadece okur.

  Kullanim (PowerShell'i normal kullanici olarak ac):
      cd <bu-repo>\recon
      powershell -ExecutionPolicy Bypass -File .\tls-recon.ps1

  Cikti:
      .\tls-recon-raporu.txt   -> bu dosyayi bana yapistir

  Notlar:
   * Yonetici yetkisi gerekmez. Port taramasi icin admin olursan daha
     fazla detay gorur (process sahipligi).
   * Rapor icinde kullanici adin / makine adin gecebilir; paylasmadan
     once bir goz at.
#>

[CmdletBinding()]
param(
    # Bos birakilirsa asagida hesaplaniyor. Dikkat: $PSScriptRoot'u BURADA
    # varsayilan deger olarak kullanma — param blogu degerlendirilirken bazi
    # PowerShell surumlerinde henuz dolu olmuyor ve Join-Path bos string hatasi veriyor.
    [string]$OutFile,
    # -Deep : app.asar iceriginin dosya listesini de cikarmaya calisir (npx gerekir)
    [switch]$Deep
)

# --- Cikti yolunu guvenli sekilde belirle ---
if (-not $OutFile) {
    $scriptDir = $PSScriptRoot
    if (-not $scriptDir -and $MyInvocation.MyCommand.Definition) {
        $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
    }
    if (-not $scriptDir) { $scriptDir = (Get-Location).Path }
    $OutFile = Join-Path $scriptDir 'tls-recon-raporu.txt'
}

$ErrorActionPreference = 'Continue'
$script:Report = New-Object System.Text.StringBuilder

function W {
    param([string]$Text = '')
    [void]$script:Report.AppendLine($Text)
    Write-Host $Text
}
function Section {
    param([string]$Title)
    W ''
    W ('=' * 72)
    W ("  $Title")
    W ('=' * 72)
}
function KV {
    param([string]$K, $V)
    W ("  {0,-28} : {1}" -f $K, $V)
}

Section "TIKTOK LIVE STUDIO - KESIF RAPORU"
KV 'Tarih'            (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
KV 'Windows'          ([System.Environment]::OSVersion.VersionString)
KV 'PowerShell'       $PSVersionTable.PSVersion.ToString()
KV 'Mimari'           $env:PROCESSOR_ARCHITECTURE

# ---------------------------------------------------------------------------
# 1. KURULUM DIZINLERINI BUL
# ---------------------------------------------------------------------------
Section "1) KURULUM DIZINLERI"

$candidates = @(
    # <-- kullanicinin dogruladigi kurulum yolu, once buna bak
    "C:\Program Files\TikTok LIVE Studio",
    "$env:ProgramFiles\TikTok LIVE Studio",
    "$env:LOCALAPPDATA\Programs\TikTok LIVE Studio",
    "$env:LOCALAPPDATA\Programs\tiktok-live-studio",
    "$env:LOCALAPPDATA\TikTok LIVE Studio",
    "$env:LOCALAPPDATA\TikTokLiveStudio",
    "${env:ProgramFiles(x86)}\TikTok LIVE Studio",
    "$env:ProgramFiles\TikTok",
    "${env:ProgramFiles(x86)}\TikTok",
    "$env:APPDATA\TikTok LIVE Studio",
    "$env:LOCALAPPDATA\TikTok\LiveStudio"
)

$found = @()
foreach ($c in $candidates) {
    if (Test-Path -LiteralPath $c) { $found += (Get-Item -LiteralPath $c).FullName }
}

# Bulunamadiysa genis arama yap
if ($found.Count -eq 0) {
    W "  Bilinen yollarda bulunamadi, genis arama yapiliyor (biraz surebilir)..."
    $roots = @($env:LOCALAPPDATA, $env:APPDATA, $env:ProgramFiles, ${env:ProgramFiles(x86)}) |
             Where-Object { $_ -and (Test-Path -LiteralPath $_) }
    foreach ($r in $roots) {
        Get-ChildItem -LiteralPath $r -Directory -Recurse -Depth 3 -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -match '(?i)tiktok' } |
            ForEach-Object { $found += $_.FullName }
    }
}

$found = $found | Select-Object -Unique
if ($found.Count -eq 0) {
    W "  [!] Hicbir TikTok dizini bulunamadi."
    W "      Uygulamayi baslatip Gorev Yoneticisi > Detaylar > sag tik > 'Dosya konumunu ac'"
    W "      ile yolu bulup bana soyle."
} else {
    foreach ($f in $found) { W "  [+] $f" }
}

# ---------------------------------------------------------------------------
# 2. EXE / VERSIYON BILGISI
# ---------------------------------------------------------------------------
Section "2) CALISTIRILABILIR DOSYALAR VE VERSIYONLAR"

$exes = @()
foreach ($dir in $found) {
    Get-ChildItem -LiteralPath $dir -Filter *.exe -Recurse -Depth 2 -ErrorAction SilentlyContinue |
        ForEach-Object { $exes += $_ }
}
if ($exes.Count -eq 0) { W "  (exe bulunamadi)" }
foreach ($e in ($exes | Select-Object -First 25)) {
    $vi = $e.VersionInfo
    W ''
    W "  --> $($e.FullName)"
    KV '    Boyut (MB)'   ([math]::Round($e.Length / 1MB, 2))
    KV '    Urun adi'     $vi.ProductName
    KV '    Urun surumu'  $vi.ProductVersion
    KV '    Dosya surumu' $vi.FileVersion
    KV '    Sirket'       $vi.CompanyName
    KV '    Aciklama'     $vi.FileDescription
    KV '    Degistirilme' $e.LastWriteTime
}

# ---------------------------------------------------------------------------
# 3. TEKNOLOJI PARMAK IZI  (Electron mi? CEF mi? Native mi?)
# ---------------------------------------------------------------------------
Section "3) TEKNOLOJI PARMAK IZI"

$fingerprints = @{
    'Electron'          = @('resources\app.asar', 'resources\app', 'electron.exe', 'ffmpeg.dll', 'LICENSES.chromium.html', 'v8_context_snapshot.bin')
    'CEF (Chromium)'    = @('libcef.dll', 'cef.pak', 'chrome_elf.dll', 'icudtl.dat', 'snapshot_blob.bin')
    'Chromium/Blink'    = @('chrome_100_percent.pak', 'resources.pak', 'd3dcompiler_47.dll')
    'Qt'                = @('Qt5Core.dll', 'Qt6Core.dll', 'Qt5WebEngineCore.dll')
    'CefSharp/.NET'     = @('CefSharp.dll', 'CefSharp.Core.dll')
    'Node.js gomulu'    = @('node.dll', 'node.exe')
    'Webview2'          = @('WebView2Loader.dll', 'msedgewebview2.exe')
}

$hits = @{}
foreach ($dir in $found) {
    foreach ($tech in $fingerprints.Keys) {
        foreach ($needle in $fingerprints[$tech]) {
            $p = Join-Path $dir $needle
            if (Test-Path -LiteralPath $p) {
                if (-not $hits.ContainsKey($tech)) { $hits[$tech] = @() }
                $hits[$tech] += $p
            }
        }
        # ic ice klasorlerde de ara (versiyon klasoru: app-1.2.3\)
        Get-ChildItem -LiteralPath $dir -Directory -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -match '(?i)^(app|current|\d+\.\d+)' } |
            ForEach-Object {
                foreach ($needle in $fingerprints[$tech]) {
                    $p2 = Join-Path $_.FullName $needle
                    if (Test-Path -LiteralPath $p2) {
                        if (-not $hits.ContainsKey($tech)) { $hits[$tech] = @() }
                        $hits[$tech] += $p2
                    }
                }
            }
    }
}

if ($hits.Count -eq 0) {
    W "  Bilinen bir web-tabanli framework izi bulunamadi (native C++ olabilir)."
} else {
    foreach ($t in $hits.Keys) {
        W ''
        W "  [KANIT] $t"
        foreach ($p in ($hits[$t] | Select-Object -Unique)) { W "      $p" }
    }
}

# Chromium surumunu cikarmaya calis
foreach ($dll in @('libcef.dll','chrome_elf.dll','node.dll')) {
    foreach ($dir in $found) {
        Get-ChildItem -LiteralPath $dir -Filter $dll -Recurse -Depth 3 -ErrorAction SilentlyContinue |
            Select-Object -First 1 | ForEach-Object {
                W ''
                KV "  $dll surumu" $_.VersionInfo.ProductVersion
            }
    }
}

# ---------------------------------------------------------------------------
# 4. DIZIN AGACI
# ---------------------------------------------------------------------------
Section "4) DIZIN AGACI (ilk 2 seviye)"

foreach ($dir in $found) {
    W ''
    W "  # $dir"
    Get-ChildItem -LiteralPath $dir -Recurse -Depth 1 -ErrorAction SilentlyContinue |
        Sort-Object FullName |
        Select-Object -First 250 |
        ForEach-Object {
            $rel  = $_.FullName.Substring($dir.Length).TrimStart('\')
            $size = if ($_.PSIsContainer) { '<DIR>' } else { '{0,10:N0} B' -f $_.Length }
            W ("    {0,-14} {1}" -f $size, $rel)
        }
}

# ---------------------------------------------------------------------------
# 5. KULLANICI VERISI / CONFIG / CACHE
# ---------------------------------------------------------------------------
Section "5) KULLANICI VERISI, AYAR VE LOG DOSYALARI"

$dataDirs = @(
    "$env:APPDATA\TikTok LIVE Studio",
    "$env:LOCALAPPDATA\TikTok LIVE Studio",
    "$env:APPDATA\TikTokLiveStudio",
    "$env:LOCALAPPDATA\TikTokLiveStudio"
) | Where-Object { Test-Path -LiteralPath $_ }

# genis arama
$more = Get-ChildItem -LiteralPath $env:APPDATA, $env:LOCALAPPDATA -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '(?i)tiktok|livestudio' } | ForEach-Object { $_.FullName }
$dataDirs = @($dataDirs + $more) | Select-Object -Unique

if ($dataDirs.Count -eq 0) { W "  (kullanici verisi klasoru bulunamadi)" }

foreach ($d in $dataDirs) {
    W ''
    W "  # $d"
    Get-ChildItem -LiteralPath $d -Recurse -Depth 2 -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Extension -match '(?i)\.(json|ini|cfg|conf|xml|yaml|yml|log|db|sqlite|txt|ldb)$' } |
        Sort-Object Length -Descending |
        Select-Object -First 60 |
        ForEach-Object {
            W ("    {0,10:N0} B  {1}" -f $_.Length, $_.FullName.Substring($d.Length).TrimStart('\'))
        }
}

# Kucuk JSON ayar dosyalarinin icerigini goster (sir icermesi muhtemel alanlari maskele)
W ''
W "  --- Kucuk JSON/config dosyalarinin icerigi (maskelenmis) ---"
foreach ($d in $dataDirs) {
    Get-ChildItem -LiteralPath $d -Recurse -Depth 2 -File -Filter *.json -ErrorAction SilentlyContinue |
        Where-Object { $_.Length -lt 24000 -and $_.Name -notmatch '(?i)cookie|credential|token|session' } |
        Select-Object -First 8 |
        ForEach-Object {
            W ''
            W "  ### $($_.FullName)"
            $raw = Get-Content -LiteralPath $_.FullName -Raw -ErrorAction SilentlyContinue
            if ($raw) {
                # olasi sirlari maskele
                $raw = [regex]::Replace($raw, '(?i)("(?:[a-z_]*(?:token|secret|password|sessionid|cookie|key|auth)[a-z_]*)"\s*:\s*")([^"]{4,})(")', '$1***MASKELENDI***$3')
                # W() tek bir string bekliyor; diziyi dogrudan verirsek
                # PowerShell hepsini tek satirda birlestirir. Satir satir bas.
                ($raw -split "`n" | Select-Object -First 80) | ForEach-Object { W "    $_" }
            }
        }
}

# ---------------------------------------------------------------------------
# 6. app.asar VAR MI?
# ---------------------------------------------------------------------------
Section "5b) SAHNE / KAYNAK GRAFIGI  (services.json)"

# LIVE Studio sahnelerini ve icindeki kaynaklari burada tutuyor.
# Link (tarayici) kaynagi:  type = 'browser',  payload.url = adres
$svc = Join-Path $env:APPDATA 'TikTok LIVE Studio\TTStore\services.json'
if (-not (Test-Path -LiteralPath $svc)) {
    W "  Bulunamadi: $svc"
    W "  (LIVE Studio hic calistirilmamis ya da yol degismis olabilir)"
} else {
    W "  Dosya: $svc"
    W ("  Boyut: {0:N0} B   Degistirilme: {1}" -f (Get-Item $svc).Length, (Get-Item $svc).LastWriteTime)
    W ''
    try {
        $j = Get-Content -LiteralPath $svc -Raw | ConvertFrom-Json
        $st = $j.SourceService.state
        if ($null -eq $st) {
            W "  [!] SourceService.state yok - sema degismis olabilir."
            W "      Ust seviye anahtarlar: $($j.PSObject.Properties.Name -join ', ')"
        } else {
            $linkSayisi = 0
            foreach ($sc in $st.scenes) {
                W "  SAHNE: $($sc.name)   [$($sc.id)]"
                $bucket = $st.sceneSource.($sc.id).data
                if ($null -eq $bucket) { W "     (bos)" }
                else {
                    foreach ($p in $bucket.PSObject.Properties) {
                        $src = $p.Value
                        $tip = if ($src.type -eq 'browser') { 'LINK' } else { "$($src.type)".ToUpper() }
                        W ("     {0,-10} {1}" -f $tip, $src.name)
                        if ($src.payload.url) {
                            W ("     {0,-10} -> {1}" -f '', $src.payload.url)
                            $linkSayisi++
                        }
                    }
                }
                W ''
            }
            W "  Toplam $($st.scenes.Count) sahne, $linkSayisi Link kaynagi."
            if ($linkSayisi -eq 0) {
                W ''
                W "  Hic Link kaynagin yok. LIVE Studio icinde:"
                W "     Kaynak ekle > Link  -> gecici bir adres yaz"
                W "  sonra:  node tools\ttls-sahne.js set-url `"<ad>`" `"<yeni adres>`""
            }
        }
    } catch {
        W "  [!] JSON cozulemedi: $_"
    }
}

Section "6) UYGULAMA KAYNAK KODU"

# Beklenti (topluluk tersine muhendisligiyle dogrulandi):
#   LIVE Studio = ByteDance'in kendi Electron catallamasi ("TTElectron").
#   Kurulum yapisi:  <kok>\<surum>\resources\app\   <- ASAR DEGIL, ACIK DIZIN
#   Yani tum renderer JS kodu duz dosya olarak orada duruyor; cikarmaya gerek yok.

$verDirs = @()
foreach ($dir in $found) {
    Get-ChildItem -LiteralPath $dir -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^\d+\.\d+' } |
        ForEach-Object { $verDirs += $_ }
}

if ($verDirs.Count -eq 0) {
    W "  Surum klasoru bulunamadi (beklenen: <kok>\<surum>\ ornegin 1.27.0\)."
} else {
    W "  Surum klasorleri:"
    foreach ($v in $verDirs) { W "    $($v.Name)   -> $($v.FullName)" }

    # En yuksek surumu al
    $cur = $verDirs | Sort-Object { [version]($_.Name -replace '[^\d\.].*$','') } -Descending |
           Select-Object -First 1
    W ''
    W "  Aktif surum: $($cur.Name)"

    # --- resources\app\package.json : guncelleme kanali ve build kimligi ---
    $pkg = Join-Path $cur.FullName 'resources\app\package.json'
    if (Test-Path -LiteralPath $pkg) {
        W ''
        W "  ### resources\app\package.json"
        try {
            $j = Get-Content -LiteralPath $pkg -Raw | ConvertFrom-Json
            foreach ($p in $j.PSObject.Properties) {
                $val = "$($p.Value)"
                if ($val.Length -gt 200) { $val = $val.Substring(0,200) + '...' }
                W ("    {0,-16} : {1}" -f $p.Name, $val)
            }
        } catch { W "    [!] okunamadi: $_" }
    } else {
        W "  [!] resources\app\package.json YOK - yapi degismis olabilir."
    }

    # --- renderer JS paketleri ---
    $staticJs = Join-Path $cur.FullName 'resources\app\static\js'
    if (Test-Path -LiteralPath $staticJs) {
        W ''
        W "  ### resources\app\static\js  (renderer kodu - ASAR yok, duz dosya)"
        Get-ChildItem -LiteralPath $staticJs -Filter *.js -ErrorAction SilentlyContinue |
            Sort-Object Length -Descending | Select-Object -First 15 |
            ForEach-Object { W ("    {0,12:N0} B  {1}" -f $_.Length, $_.Name) }
        W ''
        W "  Kaynak tiplerini bu paketlerde aratabilirsin:"
        W "     Select-String -Path `"$staticJs\*.js`" -Pattern 'browser','game_capture','window_capture' -List"
    }

    # --- native medya sunucusu ---
    $media = Join-Path $cur.FullName 'resources\app\electron\sdk\lib\mediasdk_server.exe'
    if (Test-Path -LiteralPath $media) {
        W ''
        W "  [+] MediaSDK (yakalama/kodlama ayri native process):"
        W "      $media"
    }
}

# --- asar yine de var mi diye bak (surum degisirse yakalayalim) ---
$asars = @()
foreach ($dir in $found) {
    Get-ChildItem -LiteralPath $dir -Filter *.asar -Recurse -Depth 5 -ErrorAction SilentlyContinue |
        ForEach-Object { $asars += $_ }
}
W ''
if ($asars.Count -eq 0) {
    W "  asar arsivi yok - beklenen durum (kod acik dizinde duruyor)."
} else {
    W "  [!] asar arsivi BULUNDU (beklenmiyordu, yapi degismis):"
    foreach ($a in $asars) { W ("    {0}  ({1:N1} MB)" -f $a.FullName, ($a.Length / 1MB)) }
    W "    Cikarmak icin:  npx --yes @electron/asar extract `"$($asars[0].FullName)`" .\asar-cikti"
}

# ---------------------------------------------------------------------------
# 7. CALISAN PROCESS + ACIK PORTLAR
# ---------------------------------------------------------------------------
Section "7) CALISAN PROCESSLER VE DINLENEN PORTLAR"

$procs = Get-Process -ErrorAction SilentlyContinue |
         Where-Object { $_.ProcessName -match '(?i)tiktok|livestudio|live_studio' }

if (-not $procs) {
    W "  [!] TikTok LIVE Studio su an CALISMIYOR."
    W "      Port/IPC analizi icin uygulamayi ACIK birakip bu scripti tekrar calistir."
} else {
    foreach ($p in $procs) {
        W ''
        W "  --> PID $($p.Id)  $($p.ProcessName)"
        try { KV '    Yol' $p.Path } catch {}
        KV '    Bellek (MB)' ([math]::Round($p.WorkingSet64 / 1MB, 1))
        try {
            $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($p.Id)" -ErrorAction SilentlyContinue).CommandLine
            if ($cmd) {
                W "    Komut satiri:"
                W "      $cmd"
                if ($cmd -match 'remote-debugging-port=(\d+)') {
                    W "    [!!] DEVTOOLS ACIK -> port $($Matches[1])  (http://localhost:$($Matches[1])/json)"
                }
            }
        } catch {}
    }

    W ''
    W "  --- Bu processlerin dinledigi TCP portlari ---"
    $pids = $procs | ForEach-Object { $_.Id }
    try {
        Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
            Where-Object { $pids -contains $_.OwningProcess } |
            ForEach-Object {
                W ("    {0}:{1}   PID {2}" -f $_.LocalAddress, $_.LocalPort, $_.OwningProcess)
            }
        W ''
        W "  --- Kurulu baglantilar (hangi sunuculara konusuyor) ---"
        Get-NetTCPConnection -State Established -ErrorAction SilentlyContinue |
            Where-Object { $pids -contains $_.OwningProcess } |
            Select-Object -First 40 |
            ForEach-Object {
                W ("    -> {0}:{1}   PID {2}" -f $_.RemoteAddress, $_.RemotePort, $_.OwningProcess)
            }
    } catch {
        W "    (Get-NetTCPConnection kullanilamadi, netstat deneniyor)"
        netstat -ano | Select-String -Pattern ($pids -join '|') | Select-Object -First 40 |
            ForEach-Object { W "    $_" }
    }
}

# Yaygin DevTools portlarini yokla
W ''
W "  --- STREAM DECK YEREL API PORTLARI ---"
W "  LIVE Studio, Elgato Stream Deck eklentisi icin 127.0.0.1 uzerinde bir"
W "  Socket.IO sunucusu aciyor. Resmi eklentinin paketinden cikan aday portlar:"
$sdOpen = @()
foreach ($port in @(28189, 39728, 34246, 42205, 38534, 40825, 40622)) {
    $tcp = Test-NetConnection -ComputerName 127.0.0.1 -Port $port -WarningAction SilentlyContinue -InformationLevel Quiet -ErrorAction SilentlyContinue
    W ("    {0,-7} {1}" -f $port, $(if ($tcp) { 'ACIK  <--' } else { 'kapali' }))
    if ($tcp) { $sdOpen += $port }
}
if ($sdOpen.Count -gt 0) {
    W ''
    W "  [!!] Yerel API acik. Konusmak icin:"
    W "       node tools\ttls-control.js listen --port $($sdOpen[0])"
} else {
    W ''
    W "  Hicbiri acik degil (uygulama kapali olabilir ya da bu surumde port farkli)."
}

W ''
W "  --- DevTools / uzaktan hata ayiklama portlari ---"
foreach ($port in @(9222, 9229, 8315, 9333)) {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:$port/json/version" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        W "    [!!] Port $port ACIK ve DevTools protokolu konusuyor:"
        W "         $($r.Content)"
    } catch {
        $tcp = Test-NetConnection -ComputerName 127.0.0.1 -Port $port -WarningAction SilentlyContinue -InformationLevel Quiet -ErrorAction SilentlyContinue
        if ($tcp) { W "    [?] Port $port acik ama DevTools cevabi vermedi." }
    }
}
W ''
W "  DevTools'u zorlamak icin (uygulama kapaliyken calistir):"
W "     & `"<kurulum>\<surum>\TikTok LIVE Studio.exe`" --remote-debugging-port=9222"
W "     sonra tarayicida: http://127.0.0.1:9222/json/list"
W "     (ByteDance catallamasi bu bayragi kaldirmis olabilir - denenmedi)"

W ''
W "  --- TikFinity acik mi? (alternatif olay kaynagi) ---"
$tf = Test-NetConnection -ComputerName 127.0.0.1 -Port 21213 -WarningAction SilentlyContinue -InformationLevel Quiet -ErrorAction SilentlyContinue
if ($tf) {
    W "    [+] Port 21213 ACIK - TikFinity Desktop calisiyor gorunuyor."
    W "        Overlay'ler bu kaynaga dogrudan baglanabilir (kopruye gerek yok)."
} else {
    W "    Port 21213 kapali - TikFinity calismiyor."
}

# ---------------------------------------------------------------------------
# 8. SANAL KAMERA VE YAKALAMA CIHAZLARI
# ---------------------------------------------------------------------------
Section "8) KAMERA / SANAL KAMERA CIHAZLARI (overlay'i buradan sokabiliriz)"

Get-CimInstance Win32_PnPEntity -ErrorAction SilentlyContinue |
    Where-Object { $_.PNPClass -in @('Camera','Image','Media') -or $_.Name -match '(?i)camera|webcam|capture|virtual' } |
    Select-Object -First 40 |
    ForEach-Object { W "    $($_.Name)   [$($_.PNPClass)]" }

W ''
W "  --- OBS kurulu mu? ---"
$obs = @(
    "$env:ProgramFiles\obs-studio\bin\64bit\obs64.exe",
    "${env:ProgramFiles(x86)}\obs-studio\bin\64bit\obs64.exe"
) | Where-Object { Test-Path -LiteralPath $_ }
if ($obs) { $obs | ForEach-Object { W "    [+] $_" } } else { W "    OBS bulunamadi." }

W ''
W "  --- Tarayicilar (overlay penceresini yakalamak icin) ---"
$browsers = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Mozilla Firefox\firefox.exe"
) | Where-Object { Test-Path -LiteralPath $_ }
if ($browsers) { $browsers | ForEach-Object { W "    [+] $_" } } else { W "    Tarayici bulunamadi (?)" }

# ---------------------------------------------------------------------------
# 9. KURULU PROGRAM KAYDI
# ---------------------------------------------------------------------------
Section "9) KAYIT DEFTERI - KURULU PROGRAM KAYDI"

$regPaths = @(
    'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
    'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
    'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*'
)
$any = $false
foreach ($rp in $regPaths) {
    Get-ItemProperty -Path $rp -ErrorAction SilentlyContinue |
        Where-Object { $_.DisplayName -match '(?i)tiktok' } |
        ForEach-Object {
            $any = $true
            W ''
            KV '  DisplayName'    $_.DisplayName
            KV '  DisplayVersion' $_.DisplayVersion
            KV '  Publisher'      $_.Publisher
            KV '  InstallLocation' $_.InstallLocation
            KV '  InstallDate'    $_.InstallDate
        }
}
if (-not $any) { W "  (kayit defterinde TikTok kaydi yok - portable/per-user kurulum olabilir)" }

# ---------------------------------------------------------------------------
Section "BITTI"
W "  Rapor dosyasi: $OutFile"
W "  Bu dosyayi bana oldugu gibi yapistir; ona gore devam edecegiz."

$script:Report.ToString() | Out-File -FilePath $OutFile -Encoding UTF8
Write-Host ""
Write-Host "==> Rapor yazildi: $OutFile" -ForegroundColor Green
