import React from 'react';
import { View, Text, FlatList, Image, Button, StyleSheet } from 'react-native';
import { Album } from '../types/album';

interface AlbumViewProps {
  album: Album;
  onRemovePhoto: (photoId: string) => void;
  onBack: () => void;
}

const AlbumView: React.FC<AlbumViewProps> = ({ album, onRemovePhoto, onBack }) => {
  return (
    <View style={styles.container}>
      <Button title="Back" onPress={onBack} />
      <Text style={styles.title}>{album.name}</Text>
      <FlatList
        data={album.photos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.photoContainer}>
            <Image source={{ uri: item.uri }} style={styles.photo} />
            <Button title="Remove" onPress={() => onRemovePhoto(item.id)} />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  photoContainer: {
    marginBottom: 10,
  },
  photo: {
    width: '100%',
    height: 200,
  },
});

export default AlbumView;
