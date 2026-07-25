@echo off
chcp 65001 >nul
title TikTok Yayin Oyuncaklari - Durdur
cd /d "%~dp0"

echo.
echo   Kopru durduruluyor...
echo.

REM Once nazik yol: koprunun kendi kapatma ucuna istek at.
REM Boylece acik baglantilar duzgunce kapanir.
powershell -NoProfile -Command ^
  "try { Invoke-WebRequest -Uri 'http://localhost:8787/api/kapat' -TimeoutSec 3 -UseBasicParsing | Out-Null; Write-Host '   Kapatma istegi gonderildi.' } catch { Write-Host '   Kopru zaten kapali gorunuyor.' }"

timeout /t 2 /nobreak >nul

REM Hala ayakta mi? O zaman bridge.js calistiran node surecini bul ve kapat.
REM DIKKAT: butun node sureclerini degil, SADECE bridge.js olani kapatiyoruz —
REM makinede baska Node isleri calisiyor olabilir.
powershell -NoProfile -Command ^
  "$p = Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*bridge.js*' }; if ($p) { $p | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }; Write-Host '   Kalan surec(ler) kapatildi.' } else { Write-Host '   Calisan kopru yok.' }"

echo.
timeout /t 2 /nobreak >nul
