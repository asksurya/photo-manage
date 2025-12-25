import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  Button,
} from 'react-native';
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

interface TagPickerProps {
  visible: boolean;
  onClose: () => void;
  photoIds: string[];
  selectedTagIds: string[];
  onTagsUpdated: () => void;
}

const TagPicker: React.FC<TagPickerProps> = ({
  visible,
  onClose,
  photoIds,
  selectedTagIds,
  onTagsUpdated,
}) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [checkedTagIds, setCheckedTagIds] = useState<Set<string>>(new Set());
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);

  useEffect(() => {
    if (visible) {
      loadTags();
      setCheckedTagIds(new Set(selectedTagIds));
    }
  }, [visible, selectedTagIds]);

  const loadTags = async () => {
    const loadedTags = await TagService.getAllTags();
    setTags(loadedTags);
  };

  const handleToggleTag = async (tagId: string) => {
    const newCheckedTagIds = new Set(checkedTagIds);
    if (newCheckedTagIds.has(tagId)) {
      newCheckedTagIds.delete(tagId);
      await PhotoService.removeTagFromPhotos(tagId, photoIds);
    } else {
      newCheckedTagIds.add(tagId);
      await PhotoService.addTagToPhotos(tagId, photoIds);
    }
    setCheckedTagIds(newCheckedTagIds);
    onTagsUpdated();
  };

  const handleCreateTag = async () => {
    if (newTagName.trim() === '') {
      return;
    }
    const newTag = await TagService.createTag(newTagName.trim(), selectedColor);
    setNewTagName('');
    setSelectedColor(DEFAULT_COLORS[0]);
    setShowCreateTag(false);
    await loadTags();
    // Automatically add the new tag to the photos
    await PhotoService.addTagToPhotos(newTag.id, photoIds);
    setCheckedTagIds((prev) => new Set([...prev, newTag.id]));
    onTagsUpdated();
  };

  const renderColorPicker = () => (
    <View style={styles.colorPickerContainer}>
      <Text style={styles.colorPickerLabel}>Color:</Text>
      <View style={styles.colorOptions}>
        {DEFAULT_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedColor === color && styles.colorOptionSelected,
            ]}
            onPress={() => setSelectedColor(color)}
          />
        ))}
      </View>
    </View>
  );

  const renderTag = ({ item }: { item: Tag }) => {
    const isChecked = checkedTagIds.has(item.id);
    return (
      <TouchableOpacity
        style={styles.tagItem}
        onPress={() => handleToggleTag(item.id)}
      >
        <View style={styles.checkbox}>
          {isChecked && <View style={styles.checkboxChecked} />}
        </View>
        <View
          style={[
            styles.tagColorIndicator,
            { backgroundColor: item.color || DEFAULT_COLORS[0] },
          ]}
        />
        <Text style={styles.tagName}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Tags</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>Done</Text>
            </TouchableOpacity>
          </View>

          {showCreateTag ? (
            <View style={styles.createTagForm}>
              <TextInput
                style={styles.input}
                placeholder="Tag Name"
                value={newTagName}
                onChangeText={setNewTagName}
                autoFocus
              />
              {renderColorPicker()}
              <View style={styles.createTagButtons}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setShowCreateTag(false);
                    setNewTagName('');
                  }}
                  color="#6c757d"
                />
                <Button title="Create" onPress={handleCreateTag} />
              </View>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.createTagButton}
                onPress={() => setShowCreateTag(true)}
              >
                <Text style={styles.createTagButtonText}>+ Create New Tag</Text>
              </TouchableOpacity>

              {tags.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No tags yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Create a tag to get started
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={tags}
                  renderItem={renderTag}
                  keyExtractor={(item) => item.id}
                  style={styles.tagList}
                />
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  createTagButton: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderStyle: 'dashed',
  },
  createTagButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  tagList: {
    maxHeight: 300,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#adb5bd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#007bff',
  },
  tagColorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  tagName: {
    fontSize: 16,
    flex: 1,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6c757d',
  },
  createTagForm: {
    padding: 8,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  colorPickerContainer: {
    marginBottom: 16,
  },
  colorPickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#1A1A1A',
  },
  createTagButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});

export default TagPicker;
