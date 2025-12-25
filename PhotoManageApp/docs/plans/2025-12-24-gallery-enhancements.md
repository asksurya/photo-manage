# Gallery Enhancements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add missing UX features including pull-to-refresh, bulk selection, photo deletion, album management, search/filtering, and quality-of-life improvements.

**Architecture:** Extend existing PhotoService and AlbumService with new methods. Add SelectionContext for multi-select state. Create SearchService for filtering. Add OnboardingScreen for first-time users.

**Tech Stack:** React Native 0.82, TypeScript, AsyncStorage, React Navigation, React Context API

---

## Task 1: Pull-to-Refresh for Gallery

**Files:**
- Modify: `src/screens/GalleryScreen.tsx`
- Modify: `src/components/PhotoGallery.tsx`

**Step 1: Add refreshing state to GalleryScreen**

In `src/screens/GalleryScreen.tsx`, add refreshing state and handler:

```typescript
// Add to existing state declarations
const [refreshing, setRefreshing] = useState(false);

// Add refresh handler
const handleRefresh = useCallback(async () => {
  setRefreshing(true);
  try {
    const loadedPhotos = await PhotoService.loadPhotos();
    setPhotos(loadedPhotos);
  } catch (error) {
    console.error('Error refreshing photos:', error);
  } finally {
    setRefreshing(false);
  }
}, []);
```

**Step 2: Pass refreshing props to PhotoGallery**

```typescript
<PhotoGallery
  // ...existing props
  refreshing={refreshing}
  onRefresh={handleRefresh}
/>
```

**Step 3: Update PhotoGallery to support RefreshControl**

In `src/components/PhotoGallery.tsx`, add RefreshControl:

```typescript
import { RefreshControl } from 'react-native';

interface PhotoGalleryProps {
  // ...existing props
  refreshing?: boolean;
  onRefresh?: () => void;
}

// In the FlatList/ScrollView:
refreshControl={
  onRefresh ? (
    <RefreshControl
      refreshing={refreshing || false}
      onRefresh={onRefresh}
      tintColor="#007AFF"
      colors={['#007AFF']}
    />
  ) : undefined
}
```

**Step 4: Run app and test pull-to-refresh**

Run: `npm start` then test on simulator
Expected: Pull down on gallery refreshes photo list

**Step 5: Commit**

```bash
git add src/screens/GalleryScreen.tsx src/components/PhotoGallery.tsx
git commit -m "feat: add pull-to-refresh to gallery"
```

---

## Task 2: Selection Mode Context

**Files:**
- Create: `src/contexts/SelectionContext.tsx`
- Test: `__tests__/contexts/SelectionContext.test.tsx`

**Step 1: Write the test**

```typescript
// __tests__/contexts/SelectionContext.test.tsx
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { SelectionProvider, useSelection } from '../../src/contexts/SelectionContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SelectionProvider>{children}</SelectionProvider>
);

describe('SelectionContext', () => {
  it('should start with empty selection', () => {
    const { result } = renderHook(() => useSelection(), { wrapper });
    expect(result.current.selectedIds).toEqual([]);
    expect(result.current.isSelectionMode).toBe(false);
  });

  it('should toggle selection mode', () => {
    const { result } = renderHook(() => useSelection(), { wrapper });
    act(() => {
      result.current.enterSelectionMode();
    });
    expect(result.current.isSelectionMode).toBe(true);
    act(() => {
      result.current.exitSelectionMode();
    });
    expect(result.current.isSelectionMode).toBe(false);
    expect(result.current.selectedIds).toEqual([]);
  });

  it('should toggle photo selection', () => {
    const { result } = renderHook(() => useSelection(), { wrapper });
    act(() => {
      result.current.enterSelectionMode();
      result.current.toggleSelection('photo-1');
    });
    expect(result.current.selectedIds).toContain('photo-1');
    act(() => {
      result.current.toggleSelection('photo-1');
    });
    expect(result.current.selectedIds).not.toContain('photo-1');
  });

  it('should select all and clear all', () => {
    const { result } = renderHook(() => useSelection(), { wrapper });
    const allIds = ['photo-1', 'photo-2', 'photo-3'];
    act(() => {
      result.current.enterSelectionMode();
      result.current.selectAll(allIds);
    });
    expect(result.current.selectedIds).toEqual(allIds);
    act(() => {
      result.current.clearSelection();
    });
    expect(result.current.selectedIds).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=SelectionContext`
Expected: FAIL - module not found

**Step 3: Implement SelectionContext**

```typescript
// src/contexts/SelectionContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SelectionContextType {
  selectedIds: string[];
  isSelectionMode: boolean;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export const SelectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIds([]);
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.includes(id);
  }, [selectedIds]);

  return (
    <SelectionContext.Provider
      value={{
        selectedIds,
        isSelectionMode,
        enterSelectionMode,
        exitSelectionMode,
        toggleSelection,
        selectAll,
        clearSelection,
        isSelected,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelection = (): SelectionContextType => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within SelectionProvider');
  }
  return context;
};
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern=SelectionContext`
Expected: PASS

**Step 5: Commit**

```bash
git add src/contexts/SelectionContext.tsx __tests__/contexts/SelectionContext.test.tsx
git commit -m "feat: add SelectionContext for multi-select mode"
```

---

## Task 3: Photo Deletion Service

**Files:**
- Modify: `src/services/PhotoService.ts`
- Modify: `__tests__/services/PhotoService.test.ts`

**Step 1: Write the test for deletePhotos**

```typescript
// Add to __tests__/services/PhotoService.test.ts
describe('deletePhotos', () => {
  it('should delete single photo', async () => {
    const mockPhotos = [
      { id: '1', uri: 'file:///photo1.jpg', filename: 'photo1.jpg' },
      { id: '2', uri: 'file:///photo2.jpg', filename: 'photo2.jpg' },
    ];
    await PhotoService.savePhotos(mockPhotos);

    await PhotoService.deletePhotos(['1']);

    const remaining = await PhotoService.loadPhotos();
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe('2');
  });

  it('should delete multiple photos', async () => {
    const mockPhotos = [
      { id: '1', uri: 'file:///photo1.jpg', filename: 'photo1.jpg' },
      { id: '2', uri: 'file:///photo2.jpg', filename: 'photo2.jpg' },
      { id: '3', uri: 'file:///photo3.jpg', filename: 'photo3.jpg' },
    ];
    await PhotoService.savePhotos(mockPhotos);

    await PhotoService.deletePhotos(['1', '3']);

    const remaining = await PhotoService.loadPhotos();
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe('2');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=PhotoService.test`
Expected: FAIL - deletePhotos is not a function

**Step 3: Implement deletePhotos in PhotoService**

```typescript
// Add to src/services/PhotoService.ts
static async deletePhotos(photoIds: string[]): Promise<void> {
  try {
    const photos = await this.loadPhotos();
    const idsToDelete = new Set(photoIds);
    const remaining = photos.filter(p => !idsToDelete.has(p.id));
    await this.savePhotos(remaining);

    // Also remove from any albums
    const albums = await this.getAlbums();
    const updatedAlbums = albums.map(album => ({
      ...album,
      photoIds: album.photoIds.filter(id => !idsToDelete.has(id)),
    }));
    await this.saveAlbums(updatedAlbums);
  } catch (error) {
    console.error('Error deleting photos:', error);
    throw new Error('Failed to delete photos');
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern=PhotoService.test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/PhotoService.ts __tests__/services/PhotoService.test.ts
git commit -m "feat: add deletePhotos method to PhotoService"
```

---

## Task 4: Selection UI in PhotoGrid

**Files:**
- Modify: `src/components/PhotoGrid.tsx`
- Modify: `App.tsx` (wrap with SelectionProvider)

**Step 1: Wrap App with SelectionProvider**

```typescript
// App.tsx
import { SelectionProvider } from './src/contexts/SelectionContext';

const App: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SelectionProvider>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AppNavigator />
      </SafeAreaProvider>
    </SelectionProvider>
  );
};
```

**Step 2: Update PhotoGrid for selection mode**

```typescript
// src/components/PhotoGrid.tsx - add selection support
import { useSelection } from '../contexts/SelectionContext';

// Inside component:
const { isSelectionMode, isSelected, toggleSelection } = useSelection();

// Update photo item render:
const handlePhotoPress = (photo: Photo) => {
  if (isSelectionMode) {
    toggleSelection(photo.id);
  } else {
    onPhotoPress?.(photo);
  }
};

const handlePhotoLongPress = (photo: Photo) => {
  if (!isSelectionMode) {
    enterSelectionMode();
    toggleSelection(photo.id);
  }
};

// In render, add selection indicator:
<TouchableOpacity
  onPress={() => handlePhotoPress(photo)}
  onLongPress={() => handlePhotoLongPress(photo)}
>
  <Image source={{ uri: photo.uri }} style={styles.photo} />
  {isSelectionMode && (
    <View style={[styles.checkbox, isSelected(photo.id) && styles.checkboxSelected]}>
      {isSelected(photo.id) && <Text style={styles.checkmark}>✓</Text>}
    </View>
  )}
</TouchableOpacity>

// Add styles:
checkbox: {
  position: 'absolute',
  top: 8,
  right: 8,
  width: 24,
  height: 24,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: '#FFFFFF',
  backgroundColor: 'rgba(0,0,0,0.3)',
  justifyContent: 'center',
  alignItems: 'center',
},
checkboxSelected: {
  backgroundColor: '#007AFF',
  borderColor: '#007AFF',
},
checkmark: {
  color: '#FFFFFF',
  fontSize: 14,
  fontWeight: 'bold',
},
```

**Step 3: Test selection UI**

Run: `npm start` and test on simulator
Expected: Long press enters selection mode, taps toggle selection

**Step 4: Commit**

```bash
git add App.tsx src/components/PhotoGrid.tsx
git commit -m "feat: add selection mode UI to PhotoGrid"
```

---

## Task 5: Selection Action Bar

**Files:**
- Create: `src/components/SelectionActionBar.tsx`
- Modify: `src/screens/GalleryScreen.tsx`

**Step 1: Create SelectionActionBar component**

```typescript
// src/components/SelectionActionBar.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSelection } from '../contexts/SelectionContext';

interface SelectionActionBarProps {
  onDelete: (ids: string[]) => void;
  onAddToAlbum: (ids: string[]) => void;
  totalCount: number;
}

const SelectionActionBar: React.FC<SelectionActionBarProps> = ({
  onDelete,
  onAddToAlbum,
  totalCount,
}) => {
  const { selectedIds, exitSelectionMode, selectAll, clearSelection } = useSelection();

  const handleDelete = () => {
    Alert.alert(
      'Delete Photos',
      `Are you sure you want to delete ${selectedIds.length} photo(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(selectedIds);
            exitSelectionMode();
          },
        },
      ]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === totalCount) {
      clearSelection();
    } else {
      // Parent needs to provide all IDs
      selectAll(Array.from({ length: totalCount }, (_, i) => `${i}`));
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={exitSelectionMode}>
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>

      <Text style={styles.countText}>{selectedIds.length} selected</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, selectedIds.length === 0 && styles.disabled]}
          onPress={() => onAddToAlbum(selectedIds)}
          disabled={selectedIds.length === 0}
        >
          <Text style={styles.actionText}>Add to Album</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton, selectedIds.length === 0 && styles.disabled]}
          onPress={handleDelete}
          disabled={selectedIds.length === 0}
        >
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    padding: 8,
  },
  buttonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  countText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  deleteText: {
    color: '#FF3B30',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default SelectionActionBar;
```

**Step 2: Integrate into GalleryScreen**

```typescript
// In GalleryScreen.tsx
import SelectionActionBar from '../components/SelectionActionBar';
import { useSelection } from '../contexts/SelectionContext';

// Inside component:
const { isSelectionMode, selectAll } = useSelection();

const handleDeletePhotos = async (ids: string[]) => {
  await PhotoService.deletePhotos(ids);
  const updated = await PhotoService.loadPhotos();
  setPhotos(updated);
};

const handleAddToAlbum = (ids: string[]) => {
  // Navigate to album picker or show modal
  navigation.navigate('AlbumPicker', { photoIds: ids });
};

// In render, add action bar when in selection mode:
{isSelectionMode && (
  <SelectionActionBar
    onDelete={handleDeletePhotos}
    onAddToAlbum={handleAddToAlbum}
    totalCount={photos.length}
  />
)}
```

**Step 3: Test selection actions**

Run: `npm start`
Expected: Selection mode shows action bar, delete works

**Step 4: Commit**

```bash
git add src/components/SelectionActionBar.tsx src/screens/GalleryScreen.tsx
git commit -m "feat: add SelectionActionBar with delete and album actions"
```

---

## Task 6: Album Management - Rename and Delete

**Files:**
- Modify: `src/services/AlbumService.ts`
- Modify: `__tests__/services/AlbumService.test.ts`
- Modify: `src/screens/AlbumsScreen.tsx`

**Step 1: Add renameAlbum and deleteAlbum tests**

```typescript
// __tests__/services/AlbumService.test.ts
describe('AlbumService', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('renameAlbum', () => {
    it('should rename an existing album', async () => {
      await AlbumService.createAlbum('Old Name');
      const albums = await AlbumService.getAlbums();
      const albumId = albums[0].id;

      await AlbumService.renameAlbum(albumId, 'New Name');

      const updated = await AlbumService.getAlbums();
      expect(updated[0].name).toBe('New Name');
    });
  });

  describe('deleteAlbum', () => {
    it('should delete an album by id', async () => {
      await AlbumService.createAlbum('Test Album');
      const albums = await AlbumService.getAlbums();
      expect(albums.length).toBe(1);

      await AlbumService.deleteAlbum(albums[0].id);

      const remaining = await AlbumService.getAlbums();
      expect(remaining.length).toBe(0);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern=AlbumService`
Expected: FAIL (renameAlbum doesn't exist)

**Step 3: Implement renameAlbum in AlbumService**

```typescript
// src/services/AlbumService.ts
static async renameAlbum(albumId: string, newName: string): Promise<void> {
  const albums = await this.getAlbums();
  const album = albums.find(a => a.id === albumId);
  if (album) {
    album.name = newName;
    await this.saveAlbums(albums);
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern=AlbumService`
Expected: PASS

**Step 5: Update AlbumsScreen with edit/delete UI**

```typescript
// In src/screens/AlbumsScreen.tsx, add album actions
const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
const [editName, setEditName] = useState('');

const handleRenameAlbum = async () => {
  if (editingAlbum && editName.trim()) {
    await AlbumService.renameAlbum(editingAlbum.id, editName.trim());
    setEditingAlbum(null);
    setEditName('');
    loadAlbums();
  }
};

const handleDeleteAlbum = (album: Album) => {
  Alert.alert(
    'Delete Album',
    `Are you sure you want to delete "${album.name}"?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await AlbumService.deleteAlbum(album.id);
          loadAlbums();
        },
      },
    ]
  );
};

// Add edit/delete buttons to album item render
```

**Step 6: Commit**

```bash
git add src/services/AlbumService.ts __tests__/services/AlbumService.test.ts src/screens/AlbumsScreen.tsx
git commit -m "feat: add album rename and delete functionality"
```

---

## Task 7: Search Service

**Files:**
- Create: `src/services/SearchService.ts`
- Create: `__tests__/services/SearchService.test.ts`

**Step 1: Write tests for SearchService**

```typescript
// __tests__/services/SearchService.test.ts
import SearchService from '../../src/services/SearchService';
import { Photo } from '../../src/types/photo';

describe('SearchService', () => {
  const mockPhotos: Photo[] = [
    { id: '1', filename: 'vacation_beach.jpg', timestamp: new Date('2024-01-15').getTime(), uri: '', exif: { GPSLatitude: 25.0, GPSLongitude: -80.0 } },
    { id: '2', filename: 'birthday_party.jpg', timestamp: new Date('2024-02-20').getTime(), uri: '', exif: {} },
    { id: '3', filename: 'vacation_mountain.jpg', timestamp: new Date('2024-01-16').getTime(), uri: '', exif: { GPSLatitude: 39.0, GPSLongitude: -106.0 } },
  ];

  describe('searchByFilename', () => {
    it('should find photos matching filename query', () => {
      const results = SearchService.searchByFilename(mockPhotos, 'vacation');
      expect(results.length).toBe(2);
      expect(results.every(p => p.filename.includes('vacation'))).toBe(true);
    });

    it('should be case insensitive', () => {
      const results = SearchService.searchByFilename(mockPhotos, 'BEACH');
      expect(results.length).toBe(1);
    });
  });

  describe('filterByDateRange', () => {
    it('should filter photos within date range', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      const results = SearchService.filterByDateRange(mockPhotos, start, end);
      expect(results.length).toBe(2);
    });
  });

  describe('filterByLocation', () => {
    it('should filter photos with GPS data', () => {
      const results = SearchService.filterByLocation(mockPhotos);
      expect(results.length).toBe(2);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern=SearchService`
Expected: FAIL - module not found

**Step 3: Implement SearchService**

```typescript
// src/services/SearchService.ts
import { Photo } from '../types/photo';

class SearchService {
  static searchByFilename(photos: Photo[], query: string): Photo[] {
    const lowerQuery = query.toLowerCase();
    return photos.filter(p => p.filename.toLowerCase().includes(lowerQuery));
  }

  static filterByDateRange(photos: Photo[], start: Date, end: Date): Photo[] {
    const startTime = start.getTime();
    const endTime = end.getTime();
    return photos.filter(p => {
      const photoTime = typeof p.timestamp === 'number' ? p.timestamp : new Date(p.timestamp).getTime();
      return photoTime >= startTime && photoTime <= endTime;
    });
  }

  static filterByLocation(photos: Photo[]): Photo[] {
    return photos.filter(p => p.exif?.GPSLatitude && p.exif?.GPSLongitude);
  }

  static filterWithoutLocation(photos: Photo[]): Photo[] {
    return photos.filter(p => !p.exif?.GPSLatitude || !p.exif?.GPSLongitude);
  }

  static combineFilters(
    photos: Photo[],
    filters: {
      query?: string;
      startDate?: Date;
      endDate?: Date;
      hasLocation?: boolean;
    }
  ): Photo[] {
    let result = photos;

    if (filters.query) {
      result = this.searchByFilename(result, filters.query);
    }

    if (filters.startDate && filters.endDate) {
      result = this.filterByDateRange(result, filters.startDate, filters.endDate);
    }

    if (filters.hasLocation === true) {
      result = this.filterByLocation(result);
    } else if (filters.hasLocation === false) {
      result = this.filterWithoutLocation(result);
    }

    return result;
  }
}

export default SearchService;
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern=SearchService`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/SearchService.ts __tests__/services/SearchService.test.ts
git commit -m "feat: add SearchService for photo filtering"
```

---

## Task 8: Search UI Component

**Files:**
- Create: `src/components/SearchBar.tsx`
- Modify: `src/screens/GalleryScreen.tsx`

**Step 1: Create SearchBar component**

```typescript
// src/components/SearchBar.tsx
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onClear,
  placeholder = 'Search photos...',
}) => {
  const [query, setQuery] = useState('');

  const handleChangeText = (text: string) => {
    setQuery(text);
    onSearch(text);
  };

  const handleClear = () => {
    setQuery('');
    onClear();
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#1A1A1A',
  },
  clearButton: {
    padding: 4,
  },
  clearText: {
    fontSize: 16,
    color: '#999',
  },
});

export default SearchBar;
```

**Step 2: Integrate SearchBar into GalleryScreen**

```typescript
// In src/screens/GalleryScreen.tsx
import SearchBar from '../components/SearchBar';
import SearchService from '../services/SearchService';

// Add state for filtered photos
const [searchQuery, setSearchQuery] = useState('');
const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);

// Add search handler
const handleSearch = useCallback((query: string) => {
  setSearchQuery(query);
  if (query.trim()) {
    const results = SearchService.searchByFilename(photos, query);
    setFilteredPhotos(results);
  } else {
    setFilteredPhotos(photos);
  }
}, [photos]);

const handleClearSearch = useCallback(() => {
  setSearchQuery('');
  setFilteredPhotos(photos);
}, [photos]);

// Use filteredPhotos in render
const displayPhotos = searchQuery ? filteredPhotos : photos;

// Add SearchBar to render
<SearchBar
  onSearch={handleSearch}
  onClear={handleClearSearch}
/>
```

**Step 3: Test search functionality**

Run: `npm start`
Expected: Search bar filters photos by filename

**Step 4: Commit**

```bash
git add src/components/SearchBar.tsx src/screens/GalleryScreen.tsx
git commit -m "feat: add search bar to gallery with filename search"
```

---

## Task 9: Onboarding Screen

**Files:**
- Create: `src/screens/OnboardingScreen.tsx`
- Modify: `src/navigation/AppNavigator.tsx`
- Modify: `src/services/UserService.ts`

**Step 1: Add hasSeenOnboarding to UserService**

```typescript
// Add to src/services/UserService.ts
private static ONBOARDING_KEY = '@photo_manage_onboarding_seen';

static async hasSeenOnboarding(): Promise<boolean> {
  const seen = await AsyncStorage.getItem(this.ONBOARDING_KEY);
  return seen === 'true';
}

static async setOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(this.ONBOARDING_KEY, 'true');
}
```

**Step 2: Create OnboardingScreen**

```typescript
// src/screens/OnboardingScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    icon: '📸',
    title: 'Manage Your Photos',
    description: 'Import and organize your RAW and JPEG photos in one place.',
  },
  {
    id: '2',
    icon: '🔍',
    title: 'Smart Pairing',
    description: 'Automatically pairs RAW and JPEG versions of the same shot.',
  },
  {
    id: '3',
    icon: '📁',
    title: 'Create Albums',
    description: 'Organize photos into custom albums for easy access.',
  },
  {
    id: '4',
    icon: '☁️',
    title: 'Sync to NAS',
    description: 'Back up your photos to your personal NAS storage.',
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const renderSlide = ({ item }: { item: typeof slides[0] }) => (
    <View style={styles.slide}>
      <Text style={styles.icon}>{item.icon}</Text>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[styles.dot, index === currentIndex && styles.activeDot]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {renderDots()}

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextText}>
          {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  icon: {
    fontSize: 80,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 26,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#007AFF',
  },
  nextButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
```

**Step 3: Integrate into AppNavigator**

```typescript
// In src/navigation/AppNavigator.tsx
import OnboardingScreen from '../screens/OnboardingScreen';

// Add onboarding state
const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

useEffect(() => {
  checkOnboarding();
}, []);

const checkOnboarding = async () => {
  const seen = await UserService.hasSeenOnboarding();
  setHasSeenOnboarding(seen);
};

const handleOnboardingComplete = async () => {
  await UserService.setOnboardingSeen();
  setHasSeenOnboarding(true);
};

// In render, show onboarding first if not seen
if (hasSeenOnboarding === false) {
  return <OnboardingScreen onComplete={handleOnboardingComplete} />;
}
```

**Step 4: Test onboarding flow**

Run: `npm start`
Expected: First launch shows onboarding, then auth

**Step 5: Commit**

```bash
git add src/screens/OnboardingScreen.tsx src/navigation/AppNavigator.tsx src/services/UserService.ts
git commit -m "feat: add onboarding screen for first-time users"
```

---

## Task 10: Network Status Indicator

**Files:**
- Create: `src/hooks/useNetworkStatus.ts`
- Create: `src/components/NetworkBanner.tsx`
- Modify: `App.tsx`

**Step 1: Create useNetworkStatus hook**

```typescript
// src/hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    });

    return () => unsubscribe();
  }, []);

  return status;
};
```

**Step 2: Create NetworkBanner component**

```typescript
// src/components/NetworkBanner.tsx
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const NetworkBanner: React.FC = () => {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = !isConnected || isInternetReachable === false;

  if (!isOffline) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📡</Text>
      <Text style={styles.text}>No internet connection</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  icon: {
    fontSize: 14,
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NetworkBanner;
```

**Step 3: Install NetInfo package**

```bash
npm install @react-native-community/netinfo
```

**Step 4: Add NetworkBanner to App**

```typescript
// In App.tsx
import NetworkBanner from './src/components/NetworkBanner';

// In render, add after StatusBar:
<NetworkBanner />
```

**Step 5: Test offline indicator**

Run: `npm start`, toggle airplane mode
Expected: Banner appears when offline

**Step 6: Commit**

```bash
git add src/hooks/useNetworkStatus.ts src/components/NetworkBanner.tsx App.tsx package.json package-lock.json
git commit -m "feat: add network status indicator banner"
```

---

## Task 11: Final Integration & Testing

**Step 1: Run all tests**

```bash
npm test
```

Expected: All tests pass

**Step 2: Run lint**

```bash
npm run lint
```

Expected: No errors

**Step 3: Manual testing checklist**

- [ ] Pull-to-refresh in gallery
- [ ] Long press to enter selection mode
- [ ] Select multiple photos
- [ ] Delete selected photos
- [ ] Add selected photos to album
- [ ] Search photos by filename
- [ ] Create, rename, delete albums
- [ ] Onboarding shows on first launch
- [ ] Network banner shows when offline

**Step 4: Final commit**

```bash
git add .
git commit -m "chore: final integration and cleanup"
```

**Step 5: Push and create PR**

```bash
git push -u origin feature/gallery-enhancements
gh pr create --title "feat: Gallery enhancements - selection, search, albums, onboarding" --body "## Summary
- Pull-to-refresh in gallery
- Multi-select mode with bulk delete
- Photo search by filename
- Album rename and delete
- Onboarding flow for new users
- Network status indicator

## Test Plan
- Run \`npm test\` - all tests pass
- Manual testing per checklist in plan

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```
