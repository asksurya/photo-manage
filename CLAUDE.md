# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React Native mobile app for photographers to manage RAW and JPEG photo pairs. Built with TypeScript, targeting iOS and Android.

## Commands

All commands run from `PhotoManageApp/` directory:

```bash
npm install          # Install dependencies
npm start            # Start Metro bundler
npm run ios          # Run on iOS simulator
npm run android      # Run on Android emulator
npm test             # Run Jest tests
npm run lint         # Run ESLint

# Run a specific test file
npm test -- PhotoService.test.ts

# Run tests with coverage
npm test -- --coverage
```

**Requirements:** Node.js >= 20, iOS Simulator (macOS) or Android Emulator

## Architecture

```
PhotoManageApp/
├── src/
│   ├── components/      # React UI components
│   ├── screens/         # Screen containers (GalleryScreen is main entry)
│   ├── services/        # Business logic layer
│   └── types/           # TypeScript interfaces
├── __tests__/           # Jest tests mirroring src/ structure
└── App.tsx              # Root component
```

### Core Services

- **PhotoService** - Photo import, storage (AsyncStorage), EXIF extraction, RAW/JPEG pairing
- **CategorizationService** - Organizes photos by date, location, or content
- **MetadataService** - EXIF data management and geotagging
- **AlbumService** - Album CRUD operations
- **UserService** - User profile and NAS configuration
- **NasSyncService** - NAS synchronization (future implementation)

### Key Types (`src/types/photo.ts`)

- `Photo` - Individual photo with uri, filename, type, size, timestamp, exif data
- `PhotoPair` - Matched RAW and JPEG photos with a shared `pairingKey`
- `CategoryType` - Enum: DATE, LOCATION, CONTENT

### RAW/JPEG Pairing Logic

`PhotoService.generatePairs()` matches photos by:
1. Extracting base filename (without extension)
2. Combining with EXIF timestamp
3. Creating a pairing key to group RAW and JPEG versions

Supported RAW formats: .cr2, .nef, .arw, .raw, .orf, .raf

## Testing

Tests use mocks for native modules (jest.setup.js):
- react-native-permissions (always returns 'granted')
- @react-native-async-storage/async-storage
- react-native-geolocation-service
- react-native-exif

## Implementation Priorities

From `rules.md`:
1. Photo import from device/gallery/camera
2. User account system
3. Hybrid storage (local + NAS sync)
4. Automatic categorization
5. Metadata management and geotagging
6. Split-view mode for RAW/JPEG pairs
7. Intelligent RAW/JPEG matching
