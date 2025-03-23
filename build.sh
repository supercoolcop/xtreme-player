#!/bin/bash

# Build script for Xtream IPTV Player
# This script helps build the app for iOS TestFlight using secure credentials

# Check if app-store.json file exists
if [ ! -f "./app-store.json" ]; then
  echo "Error: app-store.json not found!"
  echo "Please make sure your app-store.json file exists with your Apple credentials"
  exit 1
fi

# Load credentials from file
APPLE_ID=$(grep -o '"appleId": *"[^"]*"' ./app-store.json | cut -d'"' -f4)
ASC_APP_ID=$(grep -o '"ascAppId": *"[^"]*"' ./app-store.json | cut -d'"' -f4)
APPLE_TEAM_ID=$(grep -o '"appleTeamId": *"[^"]*"' ./app-store.json | cut -d'"' -f4)

# Check if credentials are valid
if [ -z "$APPLE_ID" ]; then
  echo "Error: Apple ID not found in app-store.json"
  exit 1
fi

if [ -z "$ASC_APP_ID" ]; then
  echo "Error: App Store Connect App ID not found in app-store.json"
  exit 1
fi

if [ -z "$APPLE_TEAM_ID" ]; then
  echo "Error: Apple Team ID not found in app-store.json"
  exit 1
fi

# Export environment variables
export EXPO_APPLE_ID="$APPLE_ID"
export EXPO_ASC_APP_ID="$ASC_APP_ID"
export EXPO_APPLE_TEAM_ID="$APPLE_TEAM_ID"

# Run prebuild to generate native projects
echo "Running prebuild to generate native projects..."
npx expo prebuild --clean

# Build for iOS
echo "Building for iOS..."
eas build --platform ios --profile preview --non-interactive

echo "Build process initiated. Check the EAS dashboard for build status."
