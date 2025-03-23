# TestFlight Deployment Guide for Xtream IPTV Player

This guide provides step-by-step instructions for building and submitting the Xtream IPTV Player app to TestFlight for testing.

## Prerequisites

1. An Apple Developer account
2. Xcode installed on a Mac
3. App Store Connect access
4. Expo EAS CLI installed (`npm install -g eas-cli`)

## Setup EAS Build

1. Log in to your Expo account:
   ```
   eas login
   ```

2. Configure your project for EAS Build:
   ```
   eas build:configure
   ```

3. Create an `eas.json` file in your project root with the following content:
   ```json
   {
     "cli": {
       "version": ">= 3.13.3"
     },
     "build": {
       "development": {
         "developmentClient": true,
         "distribution": "internal"
       },
       "preview": {
         "distribution": "internal",
         "ios": {
           "simulator": false
         }
       },
       "production": {}
     },
     "submit": {
       "production": {
         "ios": {
           "appleId": "YOUR_APPLE_ID",
           "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
           "appleTeamId": "YOUR_APPLE_TEAM_ID"
         }
       }
     }
   }
   ```

4. Replace the placeholder values with your actual Apple Developer account information.

## Build for iOS

1. Run the build command:
   ```
   eas build --platform ios --profile preview
   ```

2. Follow the prompts to set up your iOS credentials:
   - You can let EAS handle your credentials or use your existing ones
   - If prompted, provide your Apple Developer account credentials

3. Wait for the build to complete. This may take 10-15 minutes.

4. Once complete, EAS will provide a URL to download the IPA file or view the build status.

## Submit to TestFlight

### Option 1: Using EAS Submit

1. Run the submit command:
   ```
   eas submit --platform ios --latest
   ```

2. This will upload your latest successful build to App Store Connect and prepare it for TestFlight.

### Option 2: Manual Upload with Transporter

1. Download the IPA file from the EAS build page.
2. Open Transporter app on your Mac.
3. Sign in with your Apple ID.
4. Drag and drop the IPA file into Transporter.
5. Click "Deliver" to upload the build to App Store Connect.

## TestFlight Configuration in App Store Connect

1. Log in to [App Store Connect](https://appstoreconnect.apple.com/).
2. Navigate to your app > TestFlight.
3. Wait for the build to finish processing (may take up to an hour).
4. Complete the "Test Information" section:
   - Add a test description
   - Provide contact information
   - Add notes for testers

5. For internal testing:
   - Add testers to the "App Store Connect Users" group
   - Each tester will receive an email invitation

6. For external testing:
   - Create a new external testing group
   - Add email addresses for external testers
   - Submit for Beta App Review (required for external testers)
   - Beta App Review typically takes 1-2 days

## Troubleshooting

- **Build Failures**: Check the EAS build logs for specific errors
- **Upload Issues**: Verify your Apple Developer account has the correct roles and permissions
- **TestFlight Processing Issues**: Ensure your app meets Apple's guidelines and has all required metadata

## Additional Resources

- [Expo EAS Documentation](https://docs.expo.dev/eas/)
- [TestFlight Documentation](https://developer.apple.com/testflight/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
