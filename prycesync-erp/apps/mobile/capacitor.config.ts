import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prycesync.mobile',
  appName: 'PryceSync Mobile',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    path: 'android',
    buildOptions: {
      keystorePath: './keystore/release.keystore',
      keystorePassword: 'prycesync2024',
      keystoreAlias: 'prycesync-mobile',
      keystoreAliasPassword: 'prycesync2024',
      releaseType: 'APK'
    }
  },
  ios: {
    path: 'ios',
    buildOptions: {
      exportMethod: 'development'
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#5B7EFF",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999"
    }
  }
};

export default config;