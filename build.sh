#!/bin/bash

# Build script for Xtream IPTV Player
# This script helps build the app for iOS TestFlight using secure credentials

# Check if credentials file exists
if [ ! -f "./credentials/apple.json" ]; then
  echo "Error: credentials/apple.json not found!"
  echo "Please create this file with your Apple credentials:"
  echo '{
  "appleId": "YOUR_APPLE_ID_HERE",
  "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID_HERE",
  "appleTeamId": "YOUR_APPLE_TEAM_ID_HERE"
}'
  exit 1
fi

# Load credentials from file
APPLE_ID=$(grep -o '"appleId": *"[^"]*"' ./credentials/apple.json | cut -d'"' -f4)
ASC_APP_ID=$(grep -o '"ascAppId": *"[^"]*"' ./credentials/apple.json | cut -d'"' -f4)
APPLE_TEAM_ID=$(grep -o '"appleTeamId": *"[^"]*"' ./credentials/apple.json | cut -d'"' -f4)

# Check if credentials are valid
if [ "$APPLE_ID" = "YOUR_APPLE_ID_HERE" ] || [ -z "$APPLE_ID" ]; then
  echo "Error: Please update your Apple ID in credentials/apple.json"
  exit 1
fi

if [ "$ASC_APP_ID" = "YOUR_APP_STORE_CONNECT_APP_ID_HERE" ] || [ -z "$ASC_APP_ID" ]; then
  echo "Error: Please update your App Store Connect App ID in credentials/apple.json"
  exit 1
fi

if [ "$APPLE_TEAM_ID" = "YOUR_APPLE_TEAM_ID_HERE" ] || [ -z "$APPLE_TEAM_ID" ]; then
  echo "Error: Please update your Apple Team ID in credentials/apple.json"
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
