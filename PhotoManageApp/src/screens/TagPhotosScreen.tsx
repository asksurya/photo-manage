import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Photo } from '../types/photo';
import PhotoGrid from '../components/PhotoGrid';
import PhotoService from '../services/PhotoService';

interface TagPhotosScreenProps {
  route: {
    params: {
      tagName: string;
      tagId: string;
      photos: Photo[];
    };
  };
}

const TagPhotosScreen: React.FC<TagPhotosScreenProps> = ({ route }) => {
  const { tagName, tagId } = route.params;
  const [photos, setPhotos] = useState<Photo[]>(route.params.photos);

  useFocusEffect(
    useCallback(() => {
      const loadPhotos = async () => {
        const loadedPhotos = await PhotoService.getPhotosByTag(tagId);
        setPhotos(loadedPhotos);
      };
      loadPhotos();
    }, [tagId])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{tagName}</Text>
        <Text style={styles.photoCount}>{photos.length} photos</Text>
      </View>
      {photos.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🏷️</Text>
          <Text style={styles.emptyStateText}>No photos with this tag</Text>
        </View>
      ) : (
        <PhotoGrid photos={photos} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  photoCount: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#6c757d',
  },
});

export default TagPhotosScreen;
