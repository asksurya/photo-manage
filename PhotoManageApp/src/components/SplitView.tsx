import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { PhotoPair } from '../types/photo';

interface SplitViewProps {
  pair: PhotoPair;
  onBack: () => void;
}

const SplitView: React.FC<SplitViewProps> = ({ pair, onBack }) => {
  const rawPhoto = pair.raw;
  const jpegPhoto = pair.jpeg;

  const formatMetadata = (photo: typeof rawPhoto) => {
    if (!photo?.exif) return [];

    const metadata = [];
    if (photo.exif.Make) metadata.push(`Camera: ${photo.exif.Make} ${photo.exif.Model || ''}`);
    if (photo.exif.DateTimeOriginal) {
      metadata.push(`Date: ${new Date(photo.exif.DateTimeOriginal).toLocaleString()}`);
    }
    if (photo.width && photo.height) {
      metadata.push(`Resolution: ${photo.width} x ${photo.height}`);
    }
    if (photo.size) {
      metadata.push(`File Size: ${(photo.size / 1024 / 1024).toFixed(2)} MB`);
    }
    if (photo.exif.GPSLatitude && photo.exif.GPSLongitude) {
      metadata.push(`Location: ${photo.exif.GPSLatitude.toFixed(4)}, ${photo.exif.GPSLongitude.toFixed(4)}`);
    }
    if (photo.exif.GPSAltitude) {
      metadata.push(`Altitude: ${photo.exif.GPSAltitude.toFixed(1)}m`);
    }

    return metadata;
  };

  const renderPhotoSection = (photo: typeof rawPhoto, title: string) => {
    if (!photo) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No {title.toLowerCase()} available</Text>
          </View>
        </View>
      );
    }

    const metadata = formatMetadata(photo);

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.filename}>{photo.filename}</Text>
        </View>
        <Image source={{ uri: photo.uri }} style={styles.photo} resizeMode="contain" />
        <View style={styles.metadataContainer}>
          {metadata.map((item, index) => (
            <Text key={index} style={styles.metadata}>{item}</Text>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Split View</Text>
          <Text style={styles.pairTitle}>{pair.pairingKey}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {renderPhotoSection(rawPhoto, 'RAW')}
        {renderPhotoSection(jpegPhoto, 'JPEG')}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  pairTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  filename: {
    fontSize: 14,
    color: '#666',
  },
  photo: {
    width: '100%',
    height: 300,
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  metadataContainer: {
    padding: 16,
  },
  metadata: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default SplitView;
