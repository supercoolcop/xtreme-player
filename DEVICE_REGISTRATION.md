# Device Registration Guide for EAS Internal Distribution

This guide explains how to register iOS devices for internal distribution builds with EAS.

## Why Device Registration is Needed

For internal distribution builds, Apple requires all test devices to be registered with your Apple Developer account. This is a security measure enforced by Apple.

## Device Registration Process

### Step 1: Run the Device Registration Command

```bash
eas device:create
```

### Step 2: Choose Registration Method

When prompted, you'll see several options:

```
How would you like to register your devices?
> Website - generates a registration URL to be opened on your devices
  Developer Portal - import devices already registered on Apple Developer Portal
  Input - allows you to type in UDIDs (advanced option)
  Current Machine - automatically sets the provisioning UDID of the current Apple Silicon machine
  Exit
```

**Recommended option**: Choose "Website" - this will generate a URL you can open on each iOS device you want to register.

### Step 3: Follow the Website Instructions

1. Open the generated URL on each iOS device you want to register
2. Follow the on-screen instructions to register the device
3. The website will automatically detect and register your device's UDID

### Step 4: Apple Silicon Question

If you're asked about Apple Silicon:
- This is asking if your Mac uses an M1/M2/M3 chip
- Answer based on your Mac's processor type
- This doesn't affect the actual app, just how EAS builds it

### Step 5: Run the Build Again

After registering your devices, run the build script again:

```bash
# On macOS/Linux
./build.sh

# On Windows
build.bat
```

## Alternative: Using Simulator Builds

If you prefer to test without registering physical devices, you can use simulator builds:

1. Edit `eas.json` to enable simulator builds in the preview profile:
   ```json
   "preview": {
     "distribution": "internal",
     "ios": {
       "simulator": true
     }
   }
   ```

2. Run the build command again:
   ```bash
   # On macOS/Linux
   ./build.sh

   # On Windows
   build.bat
   ```

## Troubleshooting

### "Failed to set up credentials"
This error occurs when you don't have any registered devices. Follow the steps above to register your devices.

### "You don't have any registered devices yet"
Choose "yes" when prompted to register devices, then follow the steps above.

### Build Fails After Device Registration
Make sure your Apple Developer account has the correct provisioning profile. You may need to wait a few minutes after registering devices before the build will succeed.
