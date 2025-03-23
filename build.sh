#!/bin/bash

# Build script for Xtream IPTV Player
# This script helps build the app for iOS TestFlight using secure credentials

# Check if app-store.json file exists
if [ ! -f "./app-store.json" ]; then
  echo "Error: app-store.json not found!"
  echo "Please make sure your app-store.json file exists with your Apple credentials"
  exit 1
fi

# Validate credentials in app-store.json
echo "Validating credentials in app-store.json..."

# Check for appleId
if ! grep -q '"appleId"' ./app-store.json; then
  echo "Error: appleId not found in app-store.json"
  exit 1
fi

# Check for ascAppId
if ! grep -q '"ascAppId"' ./app-store.json; then
  echo "Error: ascAppId not found in app-store.json"
  exit 1
fi

# Check for teamId
if ! grep -q '"teamId"' ./app-store.json; then
  echo "Error: teamId not found in app-store.json"
  exit 1
fi

echo "Credentials validation successful!"

# Run prebuild to generate native projects
echo "Running prebuild to generate native projects..."
npx expo prebuild --clean

# Build for iOS
echo "Building for iOS..."
echo "Using credentials from app-store.json..."
eas build --platform ios --profile preview

echo "Build process initiated. Check the EAS dashboard for build status."
