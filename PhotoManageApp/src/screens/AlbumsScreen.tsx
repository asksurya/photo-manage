import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Modal, TextInput, Button, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import PhotoService from '../services/PhotoService';
import { Album } from '../types/photo';

const AlbumsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedAlbumName, setEditedAlbumName] = useState('');

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    const loadedAlbums = await PhotoService.getAlbums();
    setAlbums(loadedAlbums);
  };

  const handleCreateAlbum = async () => {
    if (newAlbumName.trim() === '') {
      return;
    }
    await PhotoService.createAlbum(newAlbumName);
    setNewAlbumName('');
    setModalVisible(false);
    loadAlbums();
  };

  const handleAlbumPress = async (album: Album) => {
    const photos = await PhotoService.getPhotosForAlbum(album.id);
    navigation.navigate('AlbumPhotos', { albumName: album.name, photos });
  };

  const handleEditAlbum = (album: Album) => {
    setEditingAlbum(album);
    setEditedAlbumName(album.name);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (editingAlbum && editedAlbumName.trim() !== '') {
      await PhotoService.renameAlbum(editingAlbum.id, editedAlbumName.trim());
      setEditModalVisible(false);
      setEditingAlbum(null);
      setEditedAlbumName('');
      loadAlbums();
    }
  };

  const handleDeleteAlbum = (album: Album) => {
    Alert.alert(
      'Delete Album',
      `Are you sure you want to delete "${album.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await PhotoService.deleteAlbum(album.id);
            loadAlbums();
          },
        },
      ],
    );
  };

  const renderAlbum = ({ item }) => (
    <View style={styles.albumItem}>
      <TouchableOpacity style={styles.albumContent} onPress={() => handleAlbumPress(item)}>
        <View>
          <Text style={styles.albumName}>{item.name}</Text>
          <Text style={styles.albumPhotoCount}>{item.photoIds.length} photos</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.albumActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleEditAlbum(item)}>
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteAlbum(item)}>
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header photoCount={0} onImport={() => {}} isLoading={false} />
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Albums</Text>
          <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.createButtonText}>Create New Album</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={albums}
          renderItem={renderAlbum}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.albumList}
        />
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Create New Album</Text>
            <TextInput
              style={styles.input}
              placeholder="Album Name"
              value={newAlbumName}
              onChangeText={setNewAlbumName}
            />
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} color="#6c757d" />
              <Button title="Create" onPress={handleCreateAlbum} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Edit Album</Text>
            <TextInput
              style={styles.input}
              placeholder="Album Name"
              value={editedAlbumName}
              onChangeText={setEditedAlbumName}
            />
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setEditModalVisible(false)} color="#6c757d" />
              <Button title="Save" onPress={handleSaveEdit} />
            </View>
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
  content: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  albumList: {
    paddingBottom: 20,
  },
  albumItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  albumContent: {
    flex: 1,
    padding: 16,
  },
  albumActions: {
    flexDirection: 'row',
    paddingRight: 8,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  actionIcon: {
    fontSize: 20,
  },
  albumName: {
    fontSize: 18,
    fontWeight: '600',
  },
  albumPhotoCount: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
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
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
});

export default AlbumsScreen;
