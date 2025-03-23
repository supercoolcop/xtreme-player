@echo off
REM Build script for Xtream IPTV Player on Windows
REM This script helps build the app for iOS TestFlight using secure credentials

REM Check if credentials file exists
if not exist ".\credentials\apple.json" (
  echo Error: credentials\apple.json not found!
  echo Please create this file with your Apple credentials:
  echo {
  echo   "appleId": "YOUR_APPLE_ID_HERE",
  echo   "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID_HERE",
  echo   "appleTeamId": "YOUR_APPLE_TEAM_ID_HERE"
  echo }
  exit /b 1
)

REM Load credentials from file using PowerShell
for /f "tokens=*" %%a in ('powershell -Command "Get-Content .\credentials\apple.json | ConvertFrom-Json | Select-Object -ExpandProperty appleId"') do set APPLE_ID=%%a
for /f "tokens=*" %%a in ('powershell -Command "Get-Content .\credentials\apple.json | ConvertFrom-Json | Select-Object -ExpandProperty ascAppId"') do set ASC_APP_ID=%%a
for /f "tokens=*" %%a in ('powershell -Command "Get-Content .\credentials\apple.json | ConvertFrom-Json | Select-Object -ExpandProperty appleTeamId"') do set APPLE_TEAM_ID=%%a

REM Check if credentials are valid
if "%APPLE_ID%"=="YOUR_APPLE_ID_HERE" (
  echo Error: Please update your Apple ID in credentials\apple.json
  exit /b 1
)

if "%ASC_APP_ID%"=="YOUR_APP_STORE_CONNECT_APP_ID_HERE" (
  echo Error: Please update your App Store Connect App ID in credentials\apple.json
  exit /b 1
)

if "%APPLE_TEAM_ID%"=="YOUR_APPLE_TEAM_ID_HERE" (
  echo Error: Please update your Apple Team ID in credentials\apple.json
  exit /b 1
)

REM Export environment variables
set EXPO_APPLE_ID=%APPLE_ID%
set EXPO_ASC_APP_ID=%ASC_APP_ID%
set EXPO_APPLE_TEAM_ID=%APPLE_TEAM_ID%

REM Run prebuild to generate native projects
echo Running prebuild to generate native projects...
call npx expo prebuild --clean

REM Build for iOS
echo Building for iOS...
call eas build --platform ios --profile preview --non-interactive

echo Build process initiated. Check the EAS dashboard for build status.
