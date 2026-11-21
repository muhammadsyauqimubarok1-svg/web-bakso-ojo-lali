@echo off
setlocal
title Push Web Bakso Ojo Lali ke GitHub
echo ===============================================================
echo   PUSH REPOSITORY KE GITHUB - WEB BAKSO OJO LALI V6
echo ===============================================================
echo.

set PATH=C:\laragon\bin\git\mingw64\bin;C:\laragon\bin\git\cmd;C:\laragon\bin\git\bin;%PATH%

cd /d "%~dp0"

echo Lokasi Proyek: %CD%
echo Target: https://github.com/muhammadsyauqimubarok1-svg/web-bakso-ojo-lali.git
echo.

echo [1/4] Mengaktifkan Login Otomatis Browser (Git Credential Manager)...
git config credential.helper manager

echo [2/4] Menghubungkan remote GitHub...
git remote remove origin 2>nul
git remote add origin https://github.com/muhammadsyauqimubarok1-svg/web-bakso-ojo-lali.git

echo [3/4] Memastikan branch utama adalah 'main'...
git branch -M main

echo [4/4] Melakukan push kode ke GitHub...
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ===============================================================
    echo   [BERHASIL] Seluruh kode berhasil di-push ke GitHub!
    echo   Silakan buka browser dan refresh (F5) halaman GitHub Anda.
    echo ===============================================================
) else (
    echo.
    echo [INFO] Jika gagal, pastikan Anda telah menyetujui izin di jendela browser yang muncul.
)

echo.
pause
