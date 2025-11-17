import React from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, StyleSheet } from 'react-native';
import { PhotoPair } from '../types/photo';

interface PhotoPairListProps {
  pairs: PhotoPair[];
  onPairPress: (pair: PhotoPair) => void;
}

const PhotoPairList: React.FC<PhotoPairListProps> = ({ pairs, onPairPress }) => {
  const renderPairItem = ({ item }: { item: PhotoPair }) => (
    <TouchableOpacity
      style={styles.pairCard}
      onPress={() => onPairPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.pairHeader}>
        <Text style={styles.pairTitle} numberOfLines={1}>{item.pairingKey}</Text>
        <View style={styles.tapBadge}>
          <Text style={styles.tapText}>👆 Tap to compare</Text>
        </View>
      </View>
      <View style={styles.pairImagesContainer}>
        {item.raw && (
          <View style={styles.pairImageWrapper}>
            <Image source={{ uri: item.raw.uri }} style={styles.pairThumb} />
            <View style={styles.pairBadge}>
              <Text style={styles.pairBadgeText}>RAW</Text>
            </View>
          </View>
        )}
        {item.jpeg && (
          <View style={styles.pairImageWrapper}>
            <Image source={{ uri: item.jpeg.uri }} style={styles.pairThumb} />
            <View style={[styles.pairBadge, styles.jpegBadge]}>
              <Text style={styles.pairBadgeText}>JPEG</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Photo Pairs</Text>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>{pairs.length}</Text>
        </View>
      </View>
      <FlatList
        data={pairs}
        renderItem={renderPairItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.pairsList}
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
  pairsList: {
    paddingHorizontal: 16,
  },
  pairCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pairHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pairTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginRight: 12,
  },
  tapBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tapText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
  },
  pairImagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  pairImageWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  pairThumb: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  pairBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  jpegBadge: {
    backgroundColor: '#51CF66',
  },
  pairBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default PhotoPairList;
