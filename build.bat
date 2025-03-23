@echo off
REM Build script for Xtream IPTV Player on Windows
REM This script helps build the app for iOS TestFlight using secure credentials

REM Check if app-store.json file exists
if not exist ".\app-store.json" (
  echo Error: app-store.json not found!
  echo Please make sure your app-store.json file exists with your Apple credentials
  exit /b 1
)

REM Validate credentials in app-store.json
echo Validating credentials in app-store.json...

REM Check for appleId using PowerShell
powershell -Command "if (-not (Get-Content .\app-store.json | Select-String '\"appleId\"')) { exit 1 }" 
if %ERRORLEVEL% NEQ 0 (
  echo Error: appleId not found in app-store.json
  exit /b 1
)

REM Check for ascAppId using PowerShell
powershell -Command "if (-not (Get-Content .\app-store.json | Select-String '\"ascAppId\"')) { exit 1 }" 
if %ERRORLEVEL% NEQ 0 (
  echo Error: ascAppId not found in app-store.json
  exit /b 1
)

REM Check for teamId using PowerShell
powershell -Command "if (-not (Get-Content .\app-store.json | Select-String '\"teamId\"')) { exit 1 }" 
if %ERRORLEVEL% NEQ 0 (
  echo Error: teamId not found in app-store.json
  exit /b 1
)

echo Credentials validation successful!

REM Run prebuild to generate native projects
echo Running prebuild to generate native projects...
call npx expo prebuild --clean

REM Build for iOS
echo Building for iOS...
echo Using credentials from app-store.json...
call eas build --platform ios --profile preview --non-interactive

echo Build process initiated. Check the EAS dashboard for build status.
