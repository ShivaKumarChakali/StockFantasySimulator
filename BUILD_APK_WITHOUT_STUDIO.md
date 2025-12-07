# Build APK Without Android Studio

You can build the Android APK without installing Android Studio using several methods:

## Method 1: GitHub Actions (Recommended - Easiest) ⭐

This automatically builds the APK when you push code to GitHub.

### Setup

1. **Push your code to GitHub** (if not already done)

2. **Trigger the build:**
   - Go to your GitHub repository
   - Click **Actions** tab
   - Select **Build Android APK** workflow
   - Click **Run workflow** → **Run workflow**

3. **Download the APK:**
   - Wait for the workflow to complete (~5-10 minutes)
   - Click on the completed workflow run
   - Scroll down to **Artifacts**
   - Download `app-debug` (or `app-release` if configured)

### For Release APK (Optional)

To build a signed release APK, you need to add keystore secrets:

1. **Generate keystore locally:**
   ```bash
   keytool -genkey -v -keystore stockfantasy-release.keystore \
     -alias stockfantasy -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Add GitHub Secrets:**
   - Go to repository → **Settings** → **Secrets and variables** → **Actions**
   - Add these secrets:
     - `KEYSTORE_BASE64` - Base64 encoded keystore file
     - `KEYSTORE_PASSWORD` - Keystore password
     - `KEY_ALIAS` - Key alias (usually `stockfantasy`)
     - `KEY_PASSWORD` - Key password

3. **Update workflow** to use secrets (workflow already configured)

## Method 2: Command Line (If you have Android SDK)

If you have Android SDK installed but not Android Studio:

### Prerequisites

1. **Install Android SDK Command Line Tools:**
   ```bash
   # macOS (using Homebrew)
   brew install --cask android-commandlinetools
   
   # Or download from:
   # https://developer.android.com/studio#command-tools
   ```

2. **Set Environment Variables:**
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

3. **Install Required SDK Components:**
   ```bash
   sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
   ```

### Build APK

```bash
# 1. Build web app
npm run build:mobile

# 2. Sync Capacitor
npm run cap:sync

# 3. Build APK using Gradle
cd android
chmod +x gradlew
./gradlew assembleDebug

# APK will be in:
# android/app/build/outputs/apk/debug/app-debug.apk
```

## Method 3: Online Build Services

### Option A: EAS Build (Expo)

If you want a cloud-based solution:
1. Sign up at [expo.dev](https://expo.dev)
2. Use EAS Build service (paid, but has free tier)

### Option B: GitHub Actions (Already Set Up)

The workflow is already configured! Just push to GitHub.

## Method 4: Install Android Studio (If you want GUI)

If you prefer a visual interface:

### macOS

1. **Download Android Studio:**
   ```bash
   brew install --cask android-studio
   ```

2. **Or download manually:**
   - Visit: https://developer.android.com/studio
   - Download and install

3. **Set up:**
   - Open Android Studio
   - Complete setup wizard
   - Install Android SDK

4. **Build APK:**
   ```bash
   npm run cap:build:android
   ```

## Quick Start (GitHub Actions)

**Easiest method - no installation needed:**

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Add Capacitor for mobile app"
   git push origin main
   ```

2. **Go to GitHub Actions:**
   - Visit: `https://github.com/YOUR_USERNAME/StockFantasySimulator/actions`
   - Click **Build Android APK**
   - Click **Run workflow** → **Run workflow**

3. **Wait and download:**
   - Wait ~5-10 minutes
   - Download APK from Artifacts section

## Troubleshooting

### GitHub Actions Build Fails

- Check the Actions logs for errors
- Ensure all dependencies are in `package.json`
- Verify `capacitor.config.ts` is correct

### Command Line Build Fails

**Error: SDK location not found**
- Create `android/local.properties`:
  ```properties
  sdk.dir=/path/to/android/sdk
  ```

**Error: Java version**
- Ensure Java 17 is installed:
  ```bash
  java -version  # Should show 17.x
  ```

## Recommended Approach

**For most users:** Use **GitHub Actions** (Method 1)
- ✅ No installation needed
- ✅ Automatic builds on push
- ✅ Works on any OS
- ✅ Free for public repos

The workflow is already configured in `.github/workflows/build-android.yml`!

## Next Steps

1. **Push to GitHub** (if not done)
2. **Go to Actions tab**
3. **Run the workflow**
4. **Download APK**

That's it! No Android Studio needed. 🎉

