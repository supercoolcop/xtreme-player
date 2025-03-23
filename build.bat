@echo off
REM Build script for Xtream IPTV Player on Windows
REM This script helps build the app for iOS TestFlight using secure credentials

REM Check if credentials\app-store.json file exists
if not exist ".\credentials\app-store.json" (
  echo Error: credentials\app-store.json not found!
  echo Please make sure your credentials\app-store.json file exists with your Apple credentials
  exit /b 1
)

REM Validate credentials in credentials\app-store.json
echo Validating credentials in credentials\app-store.json...

REM Check for appleId using PowerShell
powershell -Command "if (-not (Get-Content .\credentials\app-store.json | Select-String '\"appleId\"')) { exit 1 }" 
if %ERRORLEVEL% NEQ 0 (
  echo Error: appleId not found in credentials\app-store.json
  exit /b 1
)

REM Check for ascAppId using PowerShell
powershell -Command "if (-not (Get-Content .\credentials\app-store.json | Select-String '\"ascAppId\"')) { exit 1 }" 
if %ERRORLEVEL% NEQ 0 (
  echo Error: ascAppId not found in credentials\app-store.json
  exit /b 1
)

REM Check for teamId using PowerShell
powershell -Command "if (-not (Get-Content .\credentials\app-store.json | Select-String '\"teamId\"')) { exit 1 }" 
if %ERRORLEVEL% NEQ 0 (
  echo Error: teamId not found in credentials\app-store.json
  exit /b 1
)

echo Credentials validation successful!

REM Run prebuild to generate native projects
echo Running prebuild to generate native projects...
call npx expo prebuild --clean

REM Build for iOS
echo Building for iOS...
echo Using credentials from credentials\app-store.json...
call eas build --platform ios --profile preview

echo Build process initiated. Check the EAS dashboard for build status.
