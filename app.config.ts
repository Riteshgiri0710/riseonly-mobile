import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: 'Riseonly',
    slug: 'rn-frontend',
    scheme: 'riseonly',
    jsEngine: 'hermes',
    version: '1.0.6',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    owner: 'nics51og',
    splash: {
      // image: './assets/splash-icon.png',
      // resizeMode: 'contain',
      backgroundColor: '#020202',
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          // image: './assets/splash-icon.png',
          // resizeMode: 'contain',
          backgroundColor: '#020202',
          // imageWidth: 200
        }
      ],
      ["react-native-compressor"],
      [
        "expo-build-properties",
        {
          ios: {
            deploymentTarget: "16.0"
          }
        }
      ]
    ],
    ios: {
      supportsTablet: true,
      jsEngine: 'hermes',
      bundleIdentifier: 'com.nics51.rn-frontend',
      buildNumber: '6',
      icon: './assets/icon.png',
      infoPlist: {
        NSPhotoLibraryUsageDescription: "This app requires access to your photo library to select images for posts.",
        NSCameraUsageDescription: "This app requires access to your camera to take photos for posts.",
        UIPasteboardAutomatic: false,
        "UIPasteboardAllowList": [],
        "UIPasteboardDenyList": ["*"],
        "UIPasteboardRequireUserPermission": false
      },
    },
    android: {
      icon: './assets/icon.png',
      package: 'com.nics51.rnfrontend',
      softwareKeyboardLayoutMode: 'pan',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundImage: './assets/bg.png',
      },
    },
    extra: {
      eas: {
        projectId: '1c3f1301-1d71-4aeb-b1f6-2890f7fd77d9',
      },
    },
  };
};
