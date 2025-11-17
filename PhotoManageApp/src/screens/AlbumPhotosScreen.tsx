import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Photo } from '../types/photo';
import PhotoGrid from '../components/PhotoGrid';

interface AlbumPhotosScreenProps {
  route: {
    params: {
      albumName: string;
      photos: Photo[];
    };
  };
}

const AlbumPhotosScreen: React.FC<AlbumPhotosScreenProps> = ({ route }) => {
  const { albumName, photos } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{albumName}</Text>
      </View>
      <PhotoGrid photos={photos} />
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
});

export default AlbumPhotosScreen;
