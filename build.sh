#!/bin/bash

# Build script for Xtream IPTV Player
# This script helps build the app for iOS TestFlight using secure credentials

# Check if credentials/app-store.json file exists
if [ ! -f "./credentials/app-store.json" ]; then
  echo "Error: credentials/app-store.json not found!"
  echo "Please make sure your credentials/app-store.json file exists with your Apple credentials"
  exit 1
fi

# Validate credentials in credentials/app-store.json
echo "Validating credentials in credentials/app-store.json..."

# Check for appleId
if ! grep -q '"appleId"' ./credentials/app-store.json; then
  echo "Error: appleId not found in credentials/app-store.json"
  exit 1
fi

# Check for ascAppId
if ! grep -q '"ascAppId"' ./credentials/app-store.json; then
  echo "Error: ascAppId not found in credentials/app-store.json"
  exit 1
fi

# Check for teamId
if ! grep -q '"teamId"' ./credentials/app-store.json; then
  echo "Error: teamId not found in credentials/app-store.json"
  exit 1
fi

echo "Credentials validation successful!"

# Check if devices are registered
echo "Checking if you need to register devices for internal distribution..."
echo "Note: For internal distribution builds, you need to register your test devices."
echo "If prompted about registering devices, select 'yes' and choose 'Website' option."
echo "If asked about Apple Silicon, answer based on your Mac's processor type."
echo "See DEVICE_REGISTRATION.md for detailed instructions."

# Run prebuild to generate native projects
echo "Running prebuild to generate native projects..."
npx expo prebuild --clean

# Build for iOS
echo "Building for iOS..."
echo "Using credentials from credentials/app-store.json..."
eas build --platform ios --profile preview

echo "Build process initiated. Check the EAS dashboard for build status."
echo ""
echo "If the build fails with 'Failed to set up credentials' or 'You don't have any registered devices yet':"
echo "1. Run 'eas device:create' to register your devices"
echo "2. When prompted, choose 'Website' to generate a registration URL"
echo "3. Open the URL on each iOS device you want to register"
echo "4. Run this build script again"
echo ""
echo "See DEVICE_REGISTRATION.md for more detailed instructions."
