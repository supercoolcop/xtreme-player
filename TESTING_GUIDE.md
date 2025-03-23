# Testing Guide for Xtream IPTV Player

This guide provides step-by-step instructions for testing the Xtream IPTV Player app using the secure credentials approach.

## Setting Up Secure Credentials

1. The app now uses a secure credentials approach with a `credentials` folder that is excluded from git via `.gitignore`.

2. First, make sure your credentials are properly set up:
   ```bash
   # Ensure the credentials directory exists
   mkdir -p credentials
   
   # Create or edit the apple.json file with your actual credentials
   nano credentials/apple.json
   ```

3. Add your Apple credentials to the `credentials/apple.json` file:
   ```json
   {
     "appleId": "your.email@example.com",
     "ascAppId": "1234567890",
     "appleTeamId": "ABCDE12345"
   }
   ```

## Testing Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the Expo development server:
   ```bash
   npx expo start
   ```

3. Test on iOS simulator:
   ```bash
   npx expo start --ios
   ```

4. Test on Android emulator:
   ```bash
   npx expo start --android
   ```

## Building for TestFlight

The app includes a convenient build script that handles credentials securely:

1. Make sure your credentials are set up in `credentials/apple.json` as described above.

2. Run the build script:
   ```bash
   ./build.sh
   ```

3. The script will:
   - Check if your credentials file exists and is properly formatted
   - Load credentials from the file
   - Export them as environment variables
   - Run prebuild to generate native projects
   - Start the EAS build process for iOS

## Manual Build with Environment Variables

If you prefer to run the build commands manually:

1. Export environment variables from your credentials file:
   ```bash
   export EXPO_APPLE_ID=$(grep -o '"appleId": *"[^"]*"' ./credentials/apple.json | cut -d'"' -f4)
   export EXPO_ASC_APP_ID=$(grep -o '"ascAppId": *"[^"]*"' ./credentials/apple.json | cut -d'"' -f4)
   export EXPO_APPLE_TEAM_ID=$(grep -o '"appleTeamId": *"[^"]*"' ./credentials/apple.json | cut -d'"' -f4)
   ```

2. Run the EAS build command:
   ```bash
   eas build --platform ios --profile preview
   ```

## Testing Features

### 1. Login Screen
- Test Xtream API login with valid credentials
- Test M3U playlist URL input
- Verify error handling for invalid inputs

### 2. Channel List
- Verify channels load correctly
- Test search functionality
- Check channel selection works

### 3. Video Player
- Verify video playback starts
- Test player controls
- Check error handling for invalid streams

### 4. Network Handling
- Test app behavior when offline
- Verify cached channels are accessible offline
- Check network status alerts

## Troubleshooting

### Build Issues
- If you encounter build errors, check the EAS build logs
- Verify your Apple credentials are correct
- Ensure your Apple Developer account has the necessary permissions

### Playback Issues
- Check the stream URL format
- Verify network connectivity
- Try different stream sources

### App Crashes
- Check the Expo logs for error messages
- Verify all dependencies are installed correctly
- Try clearing the cache: `npx expo start -c`
