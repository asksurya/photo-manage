# 🔧 Troubleshooting - Permission Handler Error

## The Error
```
⚠ No permission handler detected.
Check that you have correctly set up setup_permissions in your Podfile.
```

## Root Cause

React Native 0.82 uses **New Architecture (Fabric)** and needs specific permission configuration.

## ✅ PRIMARY SOLUTION: Install CocoaPods First

### Step 0: Install CocoaPods (Required)

```bash
# Install CocoaPods using gem
sudo gem install cocoapods

# Verify installation
pod --version
# Should show: 1.x.x
```

**Why?** CocoaPods manages native iOS dependencies. Without it, you cannot build the app.

### Step 1: Add Camera Permission to Info.plist

Manually edit `PhotoManageApp/ios/PhotoManageApp/Info.plist` and add:

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to capture and geotag photos.</string>
```

**Location:** Add it directly after the `NSPhotoLibraryUsageDescription` key.

### Step 2: Verify Info.plist

Your Info.plist should contain:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs location access to add GPS coordinates to your photos for better organization.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs access to your photo library to import and organize your photos.</string>
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to capture and geotag photos.</string>
```

### Step 3: Clean Build

```bash
# Delete app from iPhone and clean Xcode build
# In Xcode: Product → Clean Build Folder
# Or manually delete DerivedData folder
```

### Step 4: Reinstall Pods

```bash
cd PhotoManageApp/ios
rm -rf Pods Podfile.lock
bundle exec pod install
cd ..
```

### Step 5: Clean Metro Cache + Rebuild

```bash
cd PhotoManageApp
npx react-native start --reset-cache
# In new terminal:
npm run ios
```

## Alternative: Expo workaround

If Xcode issues persist, you can modify the app to use Expo Image Picker instead:

```bash
cd PhotoManageApp
npm install expo-image-picker
npm uninstall react-native-image-picker react-native-permissions
```

But since you want native functionality, fixing the permissions is better.

## Verification

After fixes, your app should:
- ✅ Launch without permission warnings
- ✅ Request location permission when importing photos
- ✅ Request photo library access
- ✅ GPS geotagging should work

Run the app and check that the console no longer shows the permission handler error!
