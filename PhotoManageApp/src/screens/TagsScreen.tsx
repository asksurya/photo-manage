import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Header from '../components/Header';
import TagService from '../services/TagService';
import PhotoService from '../services/PhotoService';
import { Tag } from '../types/photo';

const DEFAULT_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Purple
  '#85C1E9', // Light Blue
];

const TagsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [tags, setTags] = useState<Tag[]>([]);
  const [photoCounts, setPhotoCounts] = useState<Map<string, number>>(new Map());
  const [modalVisible, setModalVisible] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedTagName, setEditedTagName] = useState('');
  const [editedTagColor, setEditedTagColor] = useState('');

  const loadData = async () => {
    const loadedTags = await TagService.getAllTags();
    setTags(loadedTags);
    const counts = await PhotoService.getPhotoCountByTags();
    setPhotoCounts(counts);
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleCreateTag = async () => {
    if (newTagName.trim() === '') {
      return;
    }
    await TagService.createTag(newTagName.trim(), selectedColor);
    setNewTagName('');
    setSelectedColor(DEFAULT_COLORS[0]);
    setModalVisible(false);
    loadData();
  };

  const handleTagPress = async (tag: Tag) => {
    const photos = await PhotoService.getPhotosByTag(tag.id);
    (navigation as any).navigate('TagPhotos', { tagName: tag.name, tagId: tag.id, photos });
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setEditedTagName(tag.name);
    setEditedTagColor(tag.color || DEFAULT_COLORS[0]);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (editingTag && editedTagName.trim() !== '') {
      await TagService.renameTag(editingTag.id, editedTagName.trim());
      if (editedTagColor !== editingTag.color) {
        await TagService.updateTagColor(editingTag.id, editedTagColor);
      }
      setEditModalVisible(false);
      setEditingTag(null);
      setEditedTagName('');
      setEditedTagColor('');
      loadData();
    }
  };

  const handleDeleteTag = (tag: Tag) => {
    Alert.alert(
      'Delete Tag',
      `Are you sure you want to delete "${tag.name}"? This will remove the tag from all photos.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await PhotoService.removeTagFromAllPhotos(tag.id);
            await TagService.deleteTag(tag.id);
            loadData();
          },
        },
      ]
    );
  };

  const renderColorPicker = (currentColor: string, onSelectColor: (color: string) => void) => (
    <View style={styles.colorPickerContainer}>
      <Text style={styles.colorPickerLabel}>Color:</Text>
      <View style={styles.colorOptions}>
        {DEFAULT_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              currentColor === color && styles.colorOptionSelected,
            ]}
            onPress={() => onSelectColor(color)}
          />
        ))}
      </View>
    </View>
  );

  const renderTag = ({ item }: { item: Tag }) => (
    <View style={styles.tagItem}>
      <TouchableOpacity style={styles.tagContent} onPress={() => handleTagPress(item)}>
        <View style={[styles.tagColorIndicator, { backgroundColor: item.color || DEFAULT_COLORS[0] }]} />
        <View style={styles.tagInfo}>
          <Text style={styles.tagName}>{item.name}</Text>
          <Text style={styles.tagPhotoCount}>{photoCounts.get(item.id) || 0} photos</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.tagActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleEditTag(item)}>
          <Text style={styles.actionIcon}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteTag(item)}>
          <Text style={[styles.actionIcon, styles.deleteIcon]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header photoCount={0} onImport={() => {}} isLoading={false} />
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Tags</Text>
          <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.createButtonText}>Create New Tag</Text>
          </TouchableOpacity>
        </View>
        {tags.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🏷️</Text>
            <Text style={styles.emptyStateText}>No tags yet</Text>
            <Text style={styles.emptyStateSubtext}>Create tags to organize your photos</Text>
          </View>
        ) : (
          <FlatList
            data={tags}
            renderItem={renderTag}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.tagList}
          />
        )}
      </View>

      {/* Create Tag Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Create New Tag</Text>
            <TextInput
              style={styles.input}
              placeholder="Tag Name"
              value={newTagName}
              onChangeText={setNewTagName}
            />
            {renderColorPicker(selectedColor, setSelectedColor)}
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} color="#6c757d" />
              <Button title="Create" onPress={handleCreateTag} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Tag Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Edit Tag</Text>
            <TextInput
              style={styles.input}
              placeholder="Tag Name"
              value={editedTagName}
              onChangeText={setEditedTagName}
            />
            {renderColorPicker(editedTagColor, setEditedTagColor)}
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
  tagList: {
    paddingBottom: 20,
  },
  tagItem: {
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
  tagContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  tagColorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  tagInfo: {
    flex: 1,
  },
  tagName: {
    fontSize: 18,
    fontWeight: '600',
  },
  tagPhotoCount: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  tagActions: {
    flexDirection: 'row',
    paddingRight: 8,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  actionIcon: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '600',
  },
  deleteIcon: {
    color: '#dc3545',
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
    fontSize: 20,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#6c757d',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '85%',
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
  colorPickerContainer: {
    width: '100%',
    marginBottom: 20,
  },
  colorPickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#1A1A1A',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
});

export default TagsScreen;
