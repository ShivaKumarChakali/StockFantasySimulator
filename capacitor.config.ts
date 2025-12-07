import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stockfantasy.app',
  appName: 'StockFantasy',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    // For production, set this to your server URL
    // For development, use 'localhost' or your local IP
    // Example: url: 'http://192.168.1.100:8081' (your local dev server)
    // Example: url: 'https://your-production-server.com' (production)
    // Leave undefined to use the built-in web server (for production builds)
    // url: undefined, // Set this to your server URL for mobile app
    hostname: 'localhost',
    cleartext: true,
  },
  android: {
    buildOptions: {
      keystorePath: undefined, // Set path to your keystore for release builds
      keystoreAlias: undefined, // Set your keystore alias
    },
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;
