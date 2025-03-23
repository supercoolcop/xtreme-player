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

REM Check if devices are registered
echo Checking if you need to register devices for internal distribution...
echo Note: For internal distribution builds, you need to register your test devices.
echo If prompted about registering devices, select 'yes' and choose 'Website' option.
echo If asked about Apple Silicon, answer based on your Mac's processor type.
echo See DEVICE_REGISTRATION.md for detailed instructions.

REM Run prebuild to generate native projects
echo Running prebuild to generate native projects...
call npx expo prebuild --clean

REM Build for iOS
echo Building for iOS...
echo Using credentials from credentials\app-store.json...
call eas build --platform ios --profile preview

echo Build process initiated. Check the EAS dashboard for build status.
echo.
echo If the build fails with 'Failed to set up credentials' or 'You don't have any registered devices yet':
echo 1. Run 'eas device:create' to register your devices
echo 2. When prompted, choose 'Website' to generate a registration URL
echo 3. Open the URL on each iOS device you want to register
echo 4. Run this build script again
echo.
echo See DEVICE_REGISTRATION.md for more detailed instructions.
