# iOS TestFlight Submission Guide

This guide explains how to submit an existing successful iOS build to TestFlight.

## Prerequisites

- A successful iOS build on EAS
- Apple Developer account credentials

## Submission Process

### Option 1: Using EAS Submit Command

If you've already built the app successfully but just need to submit it to TestFlight:

```bash
# Submit the latest successful build to TestFlight
eas submit --platform ios --latest
```

Or if you want to submit a specific build:

```bash
# Submit a specific build by ID
eas submit --platform ios --id YOUR_BUILD_ID
```

### Option 2: Using the EAS Dashboard

1. Go to the [EAS Dashboard](https://expo.dev/accounts/your-account/projects/your-project/builds)
2. Find your successful build
3. Click the "Submit to App Store" button
4. Follow the prompts to complete submission

## Troubleshooting

If submission fails, check the following:

1. **App Store Connect Setup**: Ensure your app is properly set up in App Store Connect
2. **Credentials**: Verify your Apple Developer credentials are correct
3. **Build Status**: Make sure the build was successful before attempting submission
4. **App Store Metadata**: Ensure all required metadata is filled out in App Store Connect

## Common Errors

- **Invalid Apple ID**: Make sure your Apple ID is correctly formatted in credentials/app-store.json
- **Invalid App Store Connect App ID**: Verify your ascAppId is correct in credentials/app-store.json
- **Invalid Apple Team ID**: Check that your teamId is correct in credentials/app-store.json

## Using the build.sh Script

Our build.sh script includes the `--auto-submit` flag which automatically submits successful builds to TestFlight. If you want to build and submit in one step:

```bash
./build.sh
```

If you want to build without auto-submitting:

```bash
# Modify the eas build command in build.sh to remove --auto-submit
eas build --platform ios --profile production
```
