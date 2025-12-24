import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Button,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhotoPair, Album } from '../types/photo';
import PhotoService from '../services/PhotoService';

interface SplitViewProps {
  pair: PhotoPair;
  onBack: () => void;
}

const SplitView: React.FC<SplitViewProps> = ({ pair, onBack }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);

  useEffect(() => {
    if (modalVisible) {
      loadAlbums();
    }
  }, [modalVisible]);

  const loadAlbums = async () => {
    const loadedAlbums = await PhotoService.getAlbums();
    setAlbums(loadedAlbums);
  };

  const handleAddToAlbum = async (albumId: string) => {
    if (pair.raw) {
      await PhotoService.addPhotoToAlbum(pair.raw.id, albumId);
    }
    if (pair.jpeg) {
      await PhotoService.addPhotoToAlbum(pair.jpeg.id, albumId);
    }
    setModalVisible(false);
  };

  const rawPhoto = pair.raw;
  const jpegPhoto = pair.jpeg;

  const formatMetadata = (photo: typeof rawPhoto) => {
    if (!photo?.exif) return [];

    const metadata: Array<{ icon: string; label: string; value: string }> = [];
    
    if (photo.exif.Make) {
      metadata.push({
        icon: '📷',
        label: 'Camera',
        value: `${photo.exif.Make} ${photo.exif.Model || ''}`,
      });
    }
    
    if (photo.exif.DateTimeOriginal) {
      metadata.push({
        icon: '🕒',
        label: 'Captured',
        value: new Date(photo.exif.DateTimeOriginal).toLocaleString(),
      });
    }
    
    if (photo.width && photo.height) {
      metadata.push({
        icon: '📐',
        label: 'Resolution',
        value: `${photo.width} × ${photo.height}`,
      });
    }
    
    if (photo.size) {
      metadata.push({
        icon: '💾',
        label: 'File Size',
        value: `${(photo.size / 1024 / 1024).toFixed(2)} MB`,
      });
    }
    
    if (photo.exif.GPSLatitude && photo.exif.GPSLongitude) {
      metadata.push({
        icon: '📍',
        label: 'Location',
        value: `${photo.exif.GPSLatitude.toFixed(4)}, ${photo.exif.GPSLongitude.toFixed(4)}`,
      });
    }
    
    if (photo.exif.GPSAltitude) {
      metadata.push({
        icon: '⛰️',
        label: 'Altitude',
        value: `${photo.exif.GPSAltitude.toFixed(1)}m`,
      });
    }

    return metadata;
  };

  const renderPhotoSection = (
    photo: typeof rawPhoto,
    title: string,
    badgeColor: string
  ) => {
    if (!photo) {
      return (
        <View style={styles.photoSection}>
          <View style={styles.sectionHeader}>
            <View style={[styles.typeBadge, { backgroundColor: badgeColor }]}>
              <Text style={styles.typeBadgeText}>{title}</Text>
            </View>
          </View>
          <View style={styles.emptyPhotoContainer}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={styles.emptyText}>No {title.toLowerCase()} available</Text>
          </View>
        </View>
      );
    }

    const metadata = formatMetadata(photo);

    return (
      <View style={styles.photoSection}>
        {/* Header with badge */}
        <View style={styles.sectionHeader}>
          <View style={[styles.typeBadge, { backgroundColor: badgeColor }]}>
            <Text style={styles.typeBadgeText}>{title}</Text>
          </View>
          <Text style={styles.filename} numberOfLines={1}>
            {photo.filename}
          </Text>
        </View>

        {/* Photo */}
        <View style={styles.photoContainer}>
          <Image 
            source={{ uri: photo.uri }} 
            style={styles.photo} 
            resizeMode="contain"
          />
        </View>

        {/* Metadata */}
        {metadata.length > 0 && (
          <View style={styles.metadataContainer}>
            <Text style={styles.metadataTitle}>Details</Text>
            {metadata.map((item, index) => (
              <View key={index} style={styles.metadataRow}>
                <Text style={styles.metadataIcon}>{item.icon}</Text>
                <View style={styles.metadataContent}>
                  <Text style={styles.metadataLabel}>{item.label}</Text>
                  <Text style={styles.metadataValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backText}>Gallery</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Compare Photos</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {pair.pairingKey}
          </Text>
        </View>
        <TouchableOpacity style={styles.addToAlbumButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addToAlbumButtonText}>Add to Album</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Comparison Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🔍</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Side-by-Side Comparison</Text>
            <Text style={styles.infoText}>
              View and compare the RAW and JPEG versions of your photo
            </Text>
          </View>
        </View>

        {/* RAW Photo */}
        {renderPhotoSection(rawPhoto, 'RAW', '#FF6B6B')}

        {/* Divider */}
        {rawPhoto && jpegPhoto && (
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerBadge}>
              <Text style={styles.dividerText}>VS</Text>
            </View>
            <View style={styles.dividerLine} />
          </View>
        )}

        {/* JPEG Photo */}
        {renderPhotoSection(jpegPhoto, 'JPEG', '#51CF66')}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Add to Album</Text>
            <FlatList
              data={albums}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.albumSelectItem} onPress={() => handleAddToAlbum(item.id)}>
                  <Text style={styles.albumSelectItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              style={styles.albumList}
            />
            <Button title="Cancel" onPress={() => setModalVisible(false)} color="#6c757d" />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 12,
  },
  backIcon: {
    fontSize: 24,
    color: '#4A90E2',
    marginRight: 4,
  },
  backText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6C757D',
    marginTop: 2,
  },
  headerRight: {
    width: 80,
  },
  addToAlbumButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addToAlbumButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
  photoSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  filename: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  photoContainer: {
    backgroundColor: '#000000',
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  emptyPhotoContainer: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F3F5',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    color: '#ADB5BD',
    fontWeight: '500',
  },
  metadataContainer: {
    padding: 16,
  },
  metadataTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  metadataIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
    width: 24,
    textAlign: 'center',
  },
  metadataContent: {
    flex: 1,
  },
  metadataLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C757D',
    marginBottom: 2,
  },
  metadataValue: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DEE2E6',
  },
  dividerBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  dividerText: {
    color: '#495057',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  albumList: {
    width: '100%',
    marginBottom: 20,
  },
  albumSelectItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  albumSelectItemText: {
    fontSize: 18,
  },
});

export default SplitView;
