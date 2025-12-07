# Capacitor Integration Complete ✅

## What's Been Set Up

### 1. ✅ Capacitor Installation
- Installed `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`
- Installed `@capacitor/splash-screen` for splash screen support

### 2. ✅ Configuration Files
- `capacitor.config.ts` - Main Capacitor configuration
- Android project created in `android/` directory
- Vite configured for Capacitor (base path, build output)

### 3. ✅ NPM Scripts Added
- `npm run build:mobile` - Build web app for mobile
- `npm run cap:sync` - Sync web build to Android
- `npm run cap:copy` - Copy web assets
- `npm run cap:update` - Update Capacitor dependencies
- `npm run cap:open:android` - Open Android Studio
- `npm run cap:build:android` - Build + Sync + Open (all-in-one)

### 4. ✅ Android Project
- Android platform added
- MainActivity configured
- Splash screen configured
- Build configuration ready for debug and release

## Quick Start

### Build APK

1. **Build the web app:**
   ```bash
   npm run build:mobile
   ```

2. **Sync to Android:**
   ```bash
   npm run cap:sync
   ```

3. **Open in Android Studio:**
   ```bash
   npm run cap:open:android
   ```

4. **In Android Studio:**
   - Wait for Gradle sync
   - Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - APK will be in `android/app/build/outputs/apk/debug/app-debug.apk`

### Or Use All-in-One Command:
```bash
npm run cap:build:android
```

## Project Structure

```
StockFantasySimulator/
├── android/                 # Android native project
│   ├── app/
│   │   ├── build.gradle    # App build config (with signing)
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       └── assets/public/  # Web app files
│   ├── keystore.properties.example
│   └── local.properties.example
├── capacitor.config.ts      # Capacitor config
├── client/                  # React web app
└── dist/public/            # Built web app
```

## Configuration Details

### Capacitor Config (`capacitor.config.ts`)
- **App ID**: `com.stockfantasy.app`
- **App Name**: `StockFantasy`
- **Web Dir**: `dist/public`
- **Android Scheme**: `https`
- **Splash Screen**: Configured (2s duration)

### Android Build (`android/app/build.gradle`)
- **Min SDK**: 22 (Android 5.1)
- **Target SDK**: 34 (Android 14)
- **Release Signing**: Configured (requires keystore.properties)
- **ProGuard**: Enabled for release builds

## Next Steps

### 1. Set Up Android SDK (if not done)
- Install Android Studio
- Set `ANDROID_HOME` environment variable
- Create `android/local.properties` with SDK path

### 2. Generate Release Keystore (for production)
```bash
keytool -genkey -v -keystore stockfantasy-release.keystore \
  -alias stockfantasy -keyalg RSA -keysize 2048 -validity 10000
```

Then create `android/keystore.properties`:
```properties
storePassword=YOUR_PASSWORD
keyPassword=YOUR_PASSWORD
keyAlias=stockfantasy
storeFile=../stockfantasy-release.keystore
```

### 3. Build Release APK
- Open Android Studio
- Build → Build Bundle(s) / APK(s) → Build APK(s)
- Select **release** variant
- APK: `android/app/build/outputs/apk/release/app-release.apk`

## Troubleshooting

### Java Version Issue
If you see "Unsupported class file major version 68":
- This means Java 24 is being used
- Gradle needs Java 17
- Set `JAVA_HOME` to Java 17:
  ```bash
  export JAVA_HOME=/path/to/java17
  ```

### SDK Location Not Found
Create `android/local.properties`:
```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

### Blank Screen in App
- Run `npm run build:mobile` first
- Then `npm run cap:sync`
- Verify `webDir` in `capacitor.config.ts` matches build output

## Documentation

See [MOBILE_APP.md](./MOBILE_APP.md) for complete mobile app development guide.

## Notes

- Android project is in `android/` (excluded from git)
- Always run `cap:sync` after building web app
- For production, use release keystore for signing
- Keep keystore file secure and backed up

