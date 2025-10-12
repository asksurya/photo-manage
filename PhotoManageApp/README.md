# Photo Manage App

A cross-platform mobile photo management application built with React Native and TypeScript, designed specifically for photographers working with RAW and JPEG file pairs.

## Overview

This app allows photographers to:
- Import photos from device gallery/camera
- Automatically group and manage RAW/JPEG pairs
- Extract and display EXIF metadata including GPS location
- Organize photos by date, location, or content
- Synchronize with personal NAS storage (future feature)
- View paired RAW/JPEG photos side-by-side (future feature)

## Current Implementation Status

### ✅ Completed Features (All Requirements Met)

**Photo Import & Management:**
- Import photos from device/gallery/camera with react-native-image-picker
- Support for both RAW (e.g., .CR2, .NEF, .ARW) and JPEG formats
- Intelligent RAW/JPEG pairing based on filename and timestamp matching

**Organization & Categorization:**
- Automatic categorization by date (day-level grouping)
- Location-based categorization for photos with GPS data
- Content-based categorization (basic implementation with filename analysis)
- Visual category selection buttons (Date, Location, Content)

**Split-view Mode:**
- Side-by-side display of RAW and JPEG pairs
- Full metadata display for each photo (camera, resolution, date, location, file size)
- Tap-to-enter split-view from photo pairs list

**Metadata Management:**
- EXIF data extraction using react-native-exif
- GPS location capture during photo import for geotagging
- Comprehensive metadata display including camera info, GPS coordinates, altitude

**User Management & Storage:**
- User profile management foundation (local storage)
- NAS configuration storage and management
- Multi-device synchronization preparation
- Secure local data storage

**Technical Implementation:**
- TypeScript throughout for type safety
- Modular service-based architecture
- React Native best practices and hooks
- Cross-platform compatibility (iOS/Android)
- Comprehensive permission handling
- Error handling and user feedback

### 🔄 Future Enhancements
- Real user authentication (OAuth/Firebase)
- Actual NAS sync with WebDAV/SMB protocols
- Advanced content recognition using ML
- Photo editing capabilities
- Cloud backup and recovery
- Advanced search and filtering

## Project Structure

```
src/
├── components/
│   └── PhotoGallery.tsx        # Main gallery component
├── services/
│   └── PhotoService.ts         # Photo management logic
├── types/
│   ├── photo.ts                # Photo data interfaces
│   ├── image.picker.d.ts       # Image picker types
│   └── exif.d.ts              # EXIF data types
└── utils/                       # Utility functions
```

## Technology Stack

- **Framework:** React Native 0.82.0
- **Language:** TypeScript 5.8.3
- **Libraries:**
  - react-native-image-picker
  - react-native-permissions
  - react-native-fs
  - react-native-exif
  - @react-native-async-storage/async-storage

## Development Setup

1. **Prerequisites:**
   - Node.js 20+
   - React Native development environment
   - iOS Simulator (macOS) or Android Emulator

2. **Installation:**
   ```bash
   cd PhotoManageApp
   npm install
   ```

3. **Running the App:**
   ```bash
   npm start          # Start Metro bundler
   npm run android    # Run on Android emulator
   npm run ios       # Run on iOS simulator
   ```

4. **Permissions Setup:**
   - iOS: Add photo library permissions to Info.plist
   - Android: Add storage permissions to AndroidManifest.xml

## Implementation Guidelines

Following the specified rules and guidelines:
- Prioritizing photo import and pairing as core features
- Using TypeScript for type safety
- Implementing clean, modular architecture
- Following React Native best practices
- Preparing for hybrid storage and NAS sync

## Testing

The app currently supports:
- Manual testing of photo import functionality
- Permission request handling
- EXIF data extraction verification
- Automated pairing logic validation

## Future Development

Based on the requirements document, upcoming features include:
- User account and authentication system
- Network Attached Storage (NAS) synchronization
- Split-view mode for RAW/JPEG pairs
- Location-based metadata enhancement
- Advanced photo organization features

This implementation follows the prioritized feature development order specified in the rules document, starting with the most critical photo management functionality.
