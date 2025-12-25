import React from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Photo } from '../types/photo';
import { useSelection } from '../contexts/SelectionContext';
import PhotoService from '../services/PhotoService';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoPress?: (photo: Photo) => void;
  onFavoriteToggle?: (photo: Photo) => void;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, onPhotoPress, onFavoriteToggle }) => {
  const { isSelectionMode, isSelected, toggleSelection, enterSelectionMode } = useSelection();

  const handleFavoritePress = async (photo: Photo, event: any) => {
    event.stopPropagation();
    const updatedPhoto = await PhotoService.toggleFavorite(photo.id);
    if (updatedPhoto && onFavoriteToggle) {
      onFavoriteToggle(updatedPhoto);
    }
  };

  const handlePhotoPress = (photo: Photo) => {
    if (isSelectionMode) {
      toggleSelection(photo.id);
    } else if (onPhotoPress) {
      onPhotoPress(photo);
    }
  };

  const handlePhotoLongPress = (photo: Photo) => {
    enterSelectionMode();
    toggleSelection(photo.id);
  };

  const renderPhotoItem = ({ item }: { item: Photo }) => {
    const selected = isSelected(item.id);

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
          {!isSelectionMode && (
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={(e) => handleFavoritePress(item, e)}
              activeOpacity={0.7}
            >
              <Text style={styles.favoriteIcon}>
                {item.isFavorite ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.photoInfo}>
          <Text style={styles.photoName} numberOfLines={1}>
            {item.filename}
          </Text>
          <View style={styles.photoMetaRow}>
            <Text style={styles.photoMeta}>
              {item.width}×{item.height}
            </Text>
            <Text style={styles.photoDot}>•</Text>
            <Text style={styles.photoMeta}>
              {new Date(item.timestamp).toLocaleDateString()}
            </Text>
          </View>
          {item.exif?.GPSLatitude && item.exif?.GPSLongitude && (
            <View style={styles.locationBadge}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>
                {item.exif.GPSLatitude.toFixed(4)}, {item.exif.GPSLongitude.toFixed(4)}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Photos</Text>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>{photos.length}</Text>
        </View>
      </View>
      <FlatList
        data={photos}
        renderItem={renderPhotoItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.photosList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  sectionBadge: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  photosList: {
    paddingHorizontal: 16,
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
  favoriteButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  favoriteIcon: {
    fontSize: 16,
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
  photoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  photoMeta: {
    fontSize: 13,
    color: '#6C757D',
  },
  photoDot: {
    fontSize: 13,
    color: '#DEE2E6',
    marginHorizontal: 6,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  locationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#4A90E2',
    fontWeight: '500',
  },
});

export default PhotoGrid;
