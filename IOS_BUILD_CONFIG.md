# iOS Build Configuration Guide for TestFlight

This guide provides detailed instructions for configuring and building the Xtream IPTV Player app for iOS TestFlight distribution.

## Prerequisites

1. An Apple Developer account ($99/year)
2. Xcode installed on a Mac
3. App Store Connect access
4. EAS CLI installed (`npm install -g eas-cli`)

## Step 1: Configure Apple Developer Account

1. Log in to [Apple Developer Portal](https://developer.apple.com/)
2. Create an App ID with the bundle identifier `org.blcharity.xtreamiptvplayer`
3. Create a Distribution Certificate and Provisioning Profile
4. Note your Apple Team ID (found in the Account section)

## Step 2: Configure App Store Connect

1. Log in to [App Store Connect](https://appstoreconnect.apple.com/)
2. Create a new app with the bundle identifier `org.blcharity.xtreamiptvplayer`
3. Fill in required metadata (name, description, screenshots, etc.)
4. Note the Apple App Store Connect App ID (numeric ID)

## Step 3: Update EAS Configuration

The `eas.json` file has been pre-configured with placeholders. Update it with your actual credentials:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "YOUR_APPLE_ID",
      "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
      "appleTeamId": "YOUR_APPLE_TEAM_ID"
    }
  }
}
```

## Step 4: Build for iOS

1. Log in to EAS:
   ```
   eas login
   ```

2. Build for iOS:
   ```
   eas build --platform ios --profile preview
   ```

3. Follow the prompts to set up your iOS credentials:
   - You can let EAS handle your credentials or use your existing ones
   - If prompted, provide your Apple Developer account credentials

4. Wait for the build to complete (10-15 minutes)

## Step 5: Submit to TestFlight

### Option 1: Using EAS Submit

```
eas submit --platform ios --latest
```

### Option 2: Manual Upload with Transporter

1. Download the IPA file from the EAS build page
2. Use Apple's Transporter app to upload the build to App Store Connect

## Step 6: Configure TestFlight

1. In App Store Connect, go to your app > TestFlight
2. Wait for the build to process (may take up to an hour)
3. Add test information and notes for testers
4. Add internal testers (App Store Connect Users) or create external testing groups

## Troubleshooting

- **Build Failures**: Check the EAS build logs for specific errors
- **Upload Issues**: Verify your Apple Developer account has the correct roles and permissions
- **TestFlight Processing Issues**: Ensure your app meets Apple's guidelines

## Additional Resources

- [Expo EAS Build Documentation](https://docs.expo.dev/build/setup/)
- [TestFlight Documentation](https://developer.apple.com/testflight/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
