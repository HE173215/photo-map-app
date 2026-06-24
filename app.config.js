module.exports = {
  expo: {
    name: "photo-map-app",
    slug: "photo-map-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "Ứng dụng cần quyền định vị để lưu lại vị trí thực tế chụp bức ảnh.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "Ứng dụng cần quyền định vị để lưu lại vị trí thực tế chụp bức ảnh.",
        NSCameraUsageDescription: "Ứng dụng cần quyền truy cập camera để thực hiện chụp ảnh.",
        NSPhotoLibraryUsageDescription: "Ứng dụng cần quyền truy cập thư viện để chọn ảnh và lưu trữ."
      }
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png"
      },
      permissions: [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ""
        }
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    }
  }
};
