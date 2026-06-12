@echo off
title Subir para GitHub - Dashboard Admin
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File ".\scripts\push-to-github.ps1" %*
pause
