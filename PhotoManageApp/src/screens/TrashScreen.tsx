import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import PhotoService from '../services/PhotoService';
import { Photo } from '../types/photo';

const TrashScreen: React.FC = () => {
  const [trashPhotos, setTrashPhotos] = useState<Photo[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const loadTrashPhotos = useCallback(async () => {
    try {
      const photos = await PhotoService.getTrashPhotos();
      // Sort by deletedAt descending (most recently deleted first)
      photos.sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
      setTrashPhotos(photos);
    } catch (error) {
      console.error('Error loading trash photos:', error);
      Alert.alert('Error', 'Failed to load trash photos');
    }
  }, []);

  useEffect(() => {
    const initLoad = async () => {
      setIsLoading(true);
      await loadTrashPhotos();
      setIsLoading(false);
    };
    initLoad();
  }, [loadTrashPhotos]);

  useFocusEffect(
    useCallback(() => {
      loadTrashPhotos();
    }, [loadTrashPhotos])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTrashPhotos();
    setRefreshing(false);
  };

  const getDaysUntilDeletion = (deletedAt: number): number => {
    const now = Date.now();
    const elapsedMs = now - deletedAt;
    const elapsedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
    return Math.max(0, PhotoService.TRASH_RETENTION_DAYS - elapsedDays);
  };

  const toggleSelection = (photoId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedIds(newSelected);

    if (newSelected.size === 0) {
      setIsSelectionMode(false);
    }
  };

  const handlePhotoPress = (photo: Photo) => {
    if (isSelectionMode) {
      toggleSelection(photo.id);
    }
  };

  const handlePhotoLongPress = (photo: Photo) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
    }
    toggleSelection(photo.id);
  };

  const handleRestoreSelected = async () => {
    if (selectedIds.size === 0) {
      return;
    }

    Alert.alert(
      'Restore Photos',
      `Are you sure you want to restore ${selectedIds.size} photo(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            try {
              await PhotoService.restoreFromTrash(Array.from(selectedIds));
              setSelectedIds(new Set());
              setIsSelectionMode(false);
              await loadTrashPhotos();
              Alert.alert('Success', `Restored ${selectedIds.size} photo(s)`);
            } catch (error) {
              console.error('Error restoring photos:', error);
              Alert.alert('Error', 'Failed to restore photos');
            }
          },
        },
      ]
    );
  };

  const handleDeletePermanently = async () => {
    if (selectedIds.size === 0) {
      return;
    }

    Alert.alert(
      'Delete Permanently',
      `Are you sure you want to permanently delete ${selectedIds.size} photo(s)? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await PhotoService.permanentlyDeletePhotos(Array.from(selectedIds));
              setSelectedIds(new Set());
              setIsSelectionMode(false);
              await loadTrashPhotos();
              Alert.alert('Success', `Permanently deleted ${selectedIds.size} photo(s)`);
            } catch (error) {
              console.error('Error deleting photos:', error);
              Alert.alert('Error', 'Failed to delete photos');
            }
          },
        },
      ]
    );
  };

  const handleEmptyTrash = async () => {
    if (trashPhotos.length === 0) {
      return;
    }

    Alert.alert(
      'Empty Trash',
      `Are you sure you want to permanently delete all ${trashPhotos.length} photo(s) in trash? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Empty Trash',
          style: 'destructive',
          onPress: async () => {
            try {
              await PhotoService.emptyTrash();
              setSelectedIds(new Set());
              setIsSelectionMode(false);
              await loadTrashPhotos();
              Alert.alert('Success', 'Trash emptied successfully');
            } catch (error) {
              console.error('Error emptying trash:', error);
              Alert.alert('Error', 'Failed to empty trash');
            }
          },
        },
      ]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.size === trashPhotos.length) {
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } else {
      setSelectedIds(new Set(trashPhotos.map(p => p.id)));
      setIsSelectionMode(true);
    }
  };

  const handleCancelSelection = () => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const renderPhotoItem = ({ item }: { item: Photo }) => {
    const daysLeft = getDaysUntilDeletion(item.deletedAt || 0);
    const selected = selectedIds.has(item.id);

    return (
      <TouchableOpacity
        style={styles.photoCard}
        onPress={() => handlePhotoPress(item)}
        onLongPress={() => handlePhotoLongPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.photoImageContainer}>
          <Image source={{ uri: item.uri }} style={styles.photoImage} />
          {isSelectionMode && (
            <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
              {selected && <Text style={styles.checkmark}>✓</Text>}
            </View>
          )}
        </View>
        <View style={styles.photoInfo}>
          <Text style={styles.photoName} numberOfLines={1}>
            {item.filename}
          </Text>
          <Text style={styles.deletionWarning}>
            {daysLeft === 0
              ? 'Expires today'
              : daysLeft === 1
              ? '1 day until permanent deletion'
              : `${daysLeft} days until permanent deletion`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🗑️</Text>
      <Text style={styles.emptyTitle}>Trash is Empty</Text>
      <Text style={styles.emptyDescription}>
        Deleted photos will appear here for {PhotoService.TRASH_RETENTION_DAYS} days before being permanently removed.
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trash</Text>
        {trashPhotos.length > 0 && (
          <TouchableOpacity style={styles.emptyTrashButton} onPress={handleEmptyTrash}>
            <Text style={styles.emptyTrashText}>Empty Trash</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Selection Actions */}
      {isSelectionMode && (
        <View style={styles.selectionBar}>
          <TouchableOpacity onPress={handleCancelSelection}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.selectionCount}>{selectedIds.size} selected</Text>
          <TouchableOpacity onPress={handleSelectAll}>
            <Text style={styles.selectAllText}>
              {selectedIds.size === trashPhotos.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Photo List */}
      {trashPhotos.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={trashPhotos}
          renderItem={renderPhotoItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.photosList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#007AFF"
            />
          }
        />
      )}

      {/* Bottom Action Bar */}
      {isSelectionMode && selectedIds.size > 0 && (
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.restoreButton} onPress={handleRestoreSelected}>
            <Text style={styles.restoreButtonText}>Restore</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePermanently}>
            <Text style={styles.deleteButtonText}>Delete Permanently</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  emptyTrashButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyTrashText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  selectionCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  selectAllText: {
    fontSize: 16,
    color: '#007AFF',
  },
  photosList: {
    padding: 16,
  },
  photoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  photoImageContainer: {
    position: 'relative',
    width: 72,
    height: 72,
  },
  photoImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  checkbox: {
    position: 'absolute',
    top: 4,
    right: 4,
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
  photoInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  photoName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  deletionWarning: {
    fontSize: 13,
    color: '#FF9500',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 22,
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  restoreButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default TrashScreen;
