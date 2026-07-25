@echo off
setlocal
chcp 65001 >nul
title TikTok Oyunlari - EXE olustur

cd /d "%~dp0"

echo.
echo   ============================================================
echo    TikTok Oyunlari  ^>  tek dosya EXE olustur
echo   ============================================================
echo.
echo    Bu islem:
echo      - Node'un Windows ikilisini indirir (~85 MB, bir kez)
echo      - Butun oyunlari ve sunucuyu icine gomer
echo      - dist\TikTokOyunlar.exe dosyasini uretir
echo.
echo    Uretilen exe'yi tek basina kopyalayabilirsin;
echo    calistigi makinede Node kurulu olmasi GEREKMEZ.
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   !! Node.js bulunamadi.
  echo.
  echo      Paketleme yapmak icin bu makinede Node gerekli
  echo      ^(uretilen exe'yi calistirmak icin degil^).
  echo.
  echo      Kur:  winget install --id OpenJS.NodeJS.LTS -e
  echo      Sonra bu pencereyi kapatip tekrar calistir.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\.bin\esbuild.cmd" (
  echo   Paketleme araclari kuruluyor ^(esbuild + postject^)...
  echo.
  call npm install --no-audit --no-fund esbuild postject
  if errorlevel 1 (
    echo.
    echo   !! Araclar kurulamadi. Internet baglantisini kontrol et.
    pause
    exit /b 1
  )
  echo.
)

if not exist "server\node_modules\tiktok-live-connector" (
  echo   TikTok kutuphanesi kuruluyor...
  echo.
  pushd server
  call npm install --no-audit --no-fund
  popd
  if errorlevel 1 (
    echo.
    echo   !! Kutuphane kurulamadi.
    pause
    exit /b 1
  )
  echo.
)

node server\paketle.js --win
if errorlevel 1 (
  echo.
  echo   !! Paketleme basarisiz oldu. Yukaridaki hatayi oku.
  pause
  exit /b 1
)

echo.
echo   Klasoru aciyorum...
if exist "dist" start "" explorer "%CD%\dist"
echo.
pause
