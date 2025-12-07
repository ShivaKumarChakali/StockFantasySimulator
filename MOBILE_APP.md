# Mobile App Setup with Capacitor

This guide explains how to build and deploy the StockFantasy app as a native Android APK using Capacitor.

## Prerequisites

1. **Node.js** (v20.x or higher)
2. **Java Development Kit (JDK)** - Version 17 or higher
3. **Android Studio** - Latest version with Android SDK
4. **Android SDK** - API Level 33 (Android 13) or higher

### Install Android Studio

1. Download from [developer.android.com/studio](https://developer.android.com/studio)
2. Install Android Studio
3. Open Android Studio and install:
   - Android SDK
   - Android SDK Platform-Tools
   - Android SDK Build-Tools
   - Android Emulator (optional, for testing)

### Set Environment Variables

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Then reload:
```bash
source ~/.zshrc  # or source ~/.bashrc
```

## Quick Start

### 1. Build the Web App

```bash
npm run build:mobile
```

This builds the React app optimized for mobile.

### 2. Sync with Capacitor

```bash
npm run cap:sync
```

This copies the web build to the Android project and updates native dependencies.

### 3. Open in Android Studio

```bash
npm run cap:open:android
```

Or use the all-in-one command:
```bash
npm run cap:build:android
```

## Building APK

### Debug APK (for testing)

1. Open Android Studio: `npm run cap:open:android`
2. Wait for Gradle sync to complete
3. Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
4. APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release APK (for distribution)

#### Step 1: Generate Keystore

```bash
keytool -genkey -v -keystore stockfantasy-release.keystore -alias stockfantasy -keyalg RSA -keysize 2048 -validity 10000
```

Save the keystore file securely and note the password and alias.

#### Step 2: Configure Keystore

1. Create `android/keystore.properties`:
```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=stockfantasy
storeFile=../stockfantasy-release.keystore
```

2. Update `android/app/build.gradle` (already configured):
```gradle
android {
    ...
    signingConfigs {
        release {
            def keystorePropertiesFile = rootProject.file("keystore.properties")
            def keystoreProperties = new Properties()
            if (keystorePropertiesFile.exists()) {
                keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
        }
    }
}
```

#### Step 3: Build Release APK

1. Open Android Studio: `npm run cap:open:android`
2. Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Select **release** build variant
4. APK will be in: `android/app/build/outputs/apk/release/app-release.apk`

### Build APK from Command Line

```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

## Development Workflow

### 1. Make Changes to Web App

Edit files in `client/src/`

### 2. Rebuild and Sync

```bash
npm run build:mobile
npm run cap:sync
```

### 3. Test in Android Studio

- Open Android Studio: `npm run cap:open:android`
- Run on emulator or connected device

### 4. Live Reload (Development)

For faster development, you can use Capacitor's live reload:

1. Start dev server: `npm run dev`
2. Update `capacitor.config.ts`:
```typescript
server: {
  url: 'http://YOUR_IP:8081',
  cleartext: true,
}
```
3. Sync: `npm run cap:sync`
4. Changes will reload automatically in the app

## Project Structure

```
StockFantasySimulator/
├── android/              # Android native project
│   ├── app/
│   │   └── build.gradle
│   └── build.gradle
├── client/              # React web app
├── capacitor.config.ts  # Capacitor configuration
└── dist/public/         # Built web app (copied to Android)
```

## Configuration

### App Details

Edit `capacitor.config.ts` to change:
- `appId`: Package identifier (e.g., `com.stockfantasy.app`)
- `appName`: Display name
- `webDir`: Web build directory

### Android Manifest

Edit `android/app/src/main/AndroidManifest.xml` for:
- Permissions
- App icons
- Splash screen
- Deep linking

### App Icon

1. Generate icons using [Capacitor Assets](https://capacitorjs.com/docs/guides/splash-screens-and-icons)
2. Or manually replace files in `android/app/src/main/res/`

## Troubleshooting

### Build Errors

**Error: SDK location not found**
- Set `ANDROID_HOME` environment variable
- Or create `local.properties` in `android/`:
```properties
sdk.dir=/path/to/android/sdk
```

**Error: Gradle sync failed**
- Check Java version: `java -version` (should be 17+)
- Update Gradle in `android/gradle/wrapper/gradle-wrapper.properties`

### Runtime Issues

**App shows blank screen**
- Check browser console in Android Studio
- Verify `webDir` in `capacitor.config.ts` matches build output
- Run `npm run cap:sync` after building

**Network requests fail**
- Check `androidScheme` in `capacitor.config.ts` (should be `https`)
- For development, enable `cleartext: true` in server config

## Publishing to Google Play Store

1. **Build App Bundle** (recommended):
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
   Output: `android/app/build/outputs/bundle/release/app-release.aab`

2. **Create Google Play Console account**
3. **Upload AAB** to Play Console
4. **Fill store listing** (description, screenshots, etc.)
5. **Submit for review**

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Google Play Console](https://play.google.com/console)

## NPM Scripts

- `npm run build:mobile` - Build web app for mobile
- `npm run cap:sync` - Sync web build to native projects
- `npm run cap:copy` - Copy web assets only
- `npm run cap:update` - Update Capacitor dependencies
- `npm run cap:open:android` - Open Android project in Android Studio
- `npm run cap:build:android` - Build + Sync + Open (all-in-one)

## Notes

- The Android project is in `android/` directory
- Always run `cap:sync` after building the web app
- For production, use release keystore for signing
- Keep keystore file secure and backed up

