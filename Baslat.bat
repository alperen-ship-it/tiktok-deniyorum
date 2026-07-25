@echo off
chcp 65001 >nul
title TikTok Yayin Oyuncaklari
cd /d "%~dp0"

echo.
echo   ================================================
echo    TikTok Yayin Oyuncaklari
echo   ================================================
echo.

REM --- Node kurulu mu ---
where node >nul 2>nul
if errorlevel 1 (
    echo   [!] Node.js bulunamadi.
    echo.
    echo   Kurmak icin bir yonetici komut penceresinde:
    echo       winget install --id OpenJS.NodeJS.LTS -e
    echo.
    echo   Kurduktan sonra bu pencereyi kapatip tekrar cift tikla.
    echo.
    pause
    exit /b 1
)

REM --- Bagimliliklar kurulu mu (sadece gercek yayina baglanmak icin gerekli) ---
if not exist "server\node_modules" (
    echo   Ilk calistirma: gerekli paketler kuruluyor, bir dakika surebilir...
    echo.
    pushd server
    call npm install --no-audit --no-fund
    popd
    echo.
)

REM --- Kullanici adi ---
REM Bir kez yazdiktan sonra kullanici-adi.txt icinde saklaniyor,
REM sonraki acilislarda sormadan onu kullaniyor.
set "TT_USER="
if exist "kullanici-adi.txt" set /p TT_USER=<kullanici-adi.txt

if "%TT_USER%"=="" (
    echo   TikTok kullanici adin nedir?  ^(bassindaki @ olmadan^)
    echo   Bos birakirsan SAHTE veri ile calisir - test icin yeterli.
    echo.
    set /p TT_USER="   Kullanici adi: "
    if not "%TT_USER%"=="" echo %TT_USER%>kullanici-adi.txt
)

echo.
if "%TT_USER%"=="" (
    echo   MOCK modu - sahte olaylarla baslatiliyor.
    set "TT_ARGS=--mock"
) else (
    echo   @%TT_USER% yayinina baglanilacak.
    set "TT_ARGS=--user %TT_USER%"
)

echo.
echo   Kontrol paneli birazdan acilacak.
echo   KAPATMAK ICIN: panel uzerindeki "Durdur" dugmesi,
echo   ya da bu pencereyi kapat.
echo.

REM --- Paneli tarayicida ac (kopru ayaga kalksin diye kisa bekleme) ---
start "" /b cmd /c "timeout /t 3 /nobreak >nul && start "" http://localhost:8787/"

node server\bridge.js %TT_ARGS% --verbose

echo.
echo   Kopru kapandi.
pause
