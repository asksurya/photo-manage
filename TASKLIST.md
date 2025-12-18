# Task List for PhotoManageApp

Based on the analysis of Immich features and the current state of PhotoManageApp, here are the recommended tasks to implement missing features:

## 1. Search Functionality
**Description:** Implement a search screen to filter photos by date, location, and metadata.
**Tasks:**
- [ ] Create `SearchScreen` component.
- [ ] Implement search logic in `PhotoService` (filter by filename, date range, location tag).
- [ ] Add navigation to Search from Home/Gallery.
- [ ] Add UI for search filters (Date picker, text input).

## 2. Favorites System
**Description:** Add ability to mark photos as favorites and view them separately.
**Tasks:**
- [ ] Update `Photo` interface to include `isFavorite` boolean.
- [ ] Add toggle favorite function in `PhotoService` (persist to local storage/metadata).
- [ ] Add "Heart" icon to `SplitView` and `GalleryScreen` item.
- [ ] Add a "Favorites" album or filter in `AlbumsScreen`.

## 3. Selective Sync
**Description:** Allow users to select specific albums or photos to sync to NAS, instead of "all or nothing".
**Tasks:**
- [ ] Update `NasConfig` to include `syncAlbumIds` or `syncFavoritesOnly` flag.
- [ ] Update `NasSyncService.syncToNas` to respect these filters.
- [ ] Add UI in Settings to configure what to sync.

## 4. Map Visualization (Low Priority)
**Description:** Visualize photos on a map.
**Tasks:**
- [ ] (Requires `react-native-maps` or similar) Create `MapScreen`.
- [ ] Group photos by location coordinates.
- [ ] Display pins on map.
- [ ] Navigate to photo details on pin tap.

## 5. User Management Admin (Low Priority)
**Description:** Administrative functions for user management (if multi-user becomes a priority beyond local usage).
**Tasks:**
- [ ] Create Admin Dashboard screen.
- [ ] Manage user quotas/permissions.

## Recommended Next Step:
Start with **Search Functionality** or **Favorites System** as they provide immediate value for photo organization.
