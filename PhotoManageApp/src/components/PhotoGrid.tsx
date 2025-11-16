import React from 'react';
import { View, Text, Image, FlatList, StyleSheet } from 'react-native';
import { Photo } from '../types/photo';

interface PhotoGridProps {
  photos: Photo[];
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ photos }) => {
  const renderPhotoItem = ({ item }: { item: Photo }) => (
    <View style={styles.photoCard}>
      <Image source={{ uri: item.uri }} style={styles.photoImage} />
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
    </View>
  );

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
  photoImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
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
