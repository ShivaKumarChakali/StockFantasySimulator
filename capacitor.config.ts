import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stockfantasy.app',
  appName: 'StockFantasy',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    // Allow localhost for development
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
