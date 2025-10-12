# Rules and Guidelines for Cline (Photo Management App Implementation)

## Overview
This document provides rules and guidelines for Cline (the AI assistant) to follow during the implementation of the photo management mobile app, based on the gathered requirements.

## Implementation Priorities
- Implement features in the following order to ensure a solid foundation:
  1. Photo import from device/gallery/camera.
  2. User account system for login, sync, and personalization.
  3. Hybrid storage setup (local + cloud sync).
  4. Automatic categorization by date, location, or content.
  5. Metadata management and geotagging integration.
  6. Split-view mode for RAW/JPEG pairs.
  7. Intelligent matching of RAW and JPEG files as pairs.

## Technical Rules
- **Framework Choice:** Use React Native for cross-platform development to ensure consistent experience on iOS and Android. (If Flutter is preferred, confirm explicitly.)
- **Permissions:** Request and handle GPS permissions for geotagging. Ensure graceful handling when permissions are denied.
- **File Handling:**
  - Support both RAW (e.g., .CR2, .NEF, .ARW) and JPEG formats.
  - Implement algorithms for matching RAW/JPEG pairs, possibly based on filename similarity, EXIF data, timestamps, or content hashing if needed.
- **Metadata Management:**
  - Use libraries like react-native-exif for reading/writing EXIF data.
  - Store phone GPS location separately if photo lacks embedded GPS, with timestamp alignment.
- **Storage and Sync:**
  - Use local storage (e.g., AsyncStorage or local databases like SQLite) for offline access.
  - Integrate cloud providers (e.g., Firebase for simplicity and cross-platform support) for sync.
  - Ensure data privacy: encrypt sensitive data and comply with GDPR/CCPA.
- **UI/UX Standards:**
  - Follow Material Design principles for Android and Apple Human Interface Guidelines for iOS within the cross-platform framework.
  - Ensure split-view is intuitive: swipe or tap to select, with visual indicators for pairing.
- **Performance Considerations:**
  - Optimize for large photo collections (target: 10,000+ photos).
  - Use lazy loading and caching for galleries.
  - Handle high-resolution RAW files efficiently without degrading app performance.
- **Security:**
  - Implement secure authentication (e.g., OAuth or Firebase Auth).
  - Encrypt local data and use HTTPS for cloud communications.

## Coding Standards
- Write clean, modular, and well-documented code.
- Use TypeScript for type safety.
- Follow React Native best practices (hooks, functional components).
- Implement comprehensive error handling and user feedback (loading states, error messages).
- Use version control (Git) with clear commit messages.
- Write unit tests for critical logic (e.g., file matching, metadata parsing).

## Testing and Validation
- Regularly test on real devices (iOS and Android simulators/emulators, then physical devices).
- Validate RAW/JPEG pairing logic with sample photo sets.
- Ensure offline functionality and sync reliability.
- Conduct user acceptance testing focused on photographer workflows.

## Adherence to Requirements
- Strictly follow the defined requirements without adding unrelated features unless explicitly approved.
- If encountering ambiguity, refer back to this document and the requirements.md file.
- Prioritize user experience for professional photographers: efficiency, accuracy in metadata, and seamless sync.

## Communication
- Update progress regularly using task_progress checklists.
- Seek clarification if requirements seem incomplete or conflicting.
