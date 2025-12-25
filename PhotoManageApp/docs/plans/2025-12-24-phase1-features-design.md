# Phase 1 Features Design

**Date:** 2025-12-24
**Status:** In Progress
**Features:** Trash, Favorites, Video, Tags, Map View

## Overview

Implementing 5 features in parallel to close gaps with Immich while maintaining photo-manage's mobile-first, offline-capable architecture.

---

## Feature 1: Trash/Recycle Bin

### Data Model
```typescript
// Add to Photo interface in src/types/photo.ts
interface Photo {
  // ... existing fields
  deletedAt?: number;  // Timestamp when moved to trash, undefined = not deleted
}
```

### Constants
- `TRASH_RETENTION_DAYS = 30` - Auto-delete after 30 days

### New Methods (PhotoService)
- `moveToTrash(photoIds: string[])` - Set deletedAt timestamp
- `restoreFromTrash(photoIds: string[])` - Clear deletedAt
- `emptyTrash()` - Permanently delete all trashed photos
- `getTrashPhotos()` - Get photos where deletedAt is set
- `cleanupExpiredTrash()` - Delete photos older than 30 days

### UI Changes
- Add "Trash" tab/screen accessible from Settings or Albums
- Modify delete to move to trash instead of permanent delete
- Add "Restore" and "Delete Permanently" actions in Trash view

---

## Feature 2: Favorites

### Data Model
```typescript
// Add to Photo interface
interface Photo {
  // ... existing fields
  isFavorite?: boolean;
}
```

### New Methods (PhotoService)
- `toggleFavorite(photoId: string)` - Toggle favorite status
- `getFavorites()` - Get all favorited photos

### UI Changes
- Add heart icon overlay on photos in grid
- Add "Favorites" section in Albums screen or as filter
- Tap heart to toggle favorite status

---

## Feature 3: Video Support

### Supported Formats
- MP4, MOV, M4V (common mobile formats)
- Live Photos (iOS): Import as photo+video pair

### Data Model
```typescript
// Update Photo interface
interface Photo {
  // ... existing fields
  mediaType: 'photo' | 'video';
  duration?: number;  // Video duration in seconds
  thumbnailUri?: string;  // Video thumbnail
}
```

### New Methods (PhotoService)
- `importVideos()` - Import videos from library
- `generateVideoThumbnail(videoUri: string)` - Create thumbnail

### UI Changes
- Video indicator badge on grid items
- Video player component for playback
- Import picker includes videos
- Duration overlay on thumbnails

### Dependencies
- `react-native-video` for playback
- `react-native-create-thumbnail` for thumbnails

---

## Feature 4: Tags

### Data Model
```typescript
// New interface in src/types/photo.ts
interface Tag {
  id: string;
  name: string;
  color?: string;  // Optional color coding
}

// Add to Photo interface
interface Photo {
  // ... existing fields
  tagIds?: string[];
}
```

### Storage
- Tags stored separately: `@photo_manage_tags`
- Photo references tags by ID

### New Service: TagService
- `createTag(name: string, color?: string)` - Create new tag
- `deleteTag(tagId: string)` - Delete tag (remove from all photos)
- `renameTag(tagId: string, newName: string)` - Rename tag
- `getAllTags()` - Get all tags
- `addTagToPhotos(tagId: string, photoIds: string[])` - Tag photos
- `removeTagFromPhotos(tagId: string, photoIds: string[])` - Untag photos
- `getPhotosByTag(tagId: string)` - Get photos with tag

### UI Changes
- Tag management screen (create, edit, delete tags)
- Tag picker when viewing/editing photo
- Filter by tag in gallery
- Tag chips display on photo details

---

## Feature 5: Map View

### Approach
Use `react-native-maps` with photo clustering

### Components
- `MapScreen` - Full screen map with photo markers
- `PhotoCluster` - Grouped photos at zoom level
- `PhotoMarker` - Individual photo marker

### Features
- Cluster photos by proximity
- Tap cluster to zoom in
- Tap marker to view photo
- Filter by date range on map

### Data Flow
1. Load photos with GPS coordinates
2. Group by location proximity
3. Render clusters/markers on map
4. Update on zoom/pan

### Dependencies
- `react-native-maps` - Map component
- `supercluster` - Clustering algorithm (optional, can do simple grouping)

---

## Implementation Plan

Each feature will be implemented in a separate git worktree/branch:
1. `feature/trash` - Trash/recycle bin
2. `feature/favorites` - Favorites
3. `feature/video` - Video support
4. `feature/tags` - Tags system
5. `feature/map-view` - Map view

### Branch Strategy
- Create from main
- Implement feature with tests
- PR back to main
- Resolve conflicts if any

### Parallel Execution
Features 1, 2, 4 can run fully in parallel (no conflicts)
Feature 3 (video) modifies PhotoService heavily
Feature 5 (map) is mostly new code

---

## Test Coverage

Each feature should include:
- Unit tests for new service methods
- Snapshot tests for new components (if applicable)
- Integration tests for data persistence
