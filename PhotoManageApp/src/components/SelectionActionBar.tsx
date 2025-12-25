import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSelection } from '../contexts/SelectionContext';

interface SelectionActionBarProps {
  onDelete: (ids: string[]) => void;
  onAddToAlbum: (ids: string[]) => void;
}

const SelectionActionBar: React.FC<SelectionActionBarProps> = ({
  onDelete,
  onAddToAlbum,
}) => {
  const { selectedIds, exitSelectionMode } = useSelection();

  const handleDelete = () => {
    Alert.alert(
      'Delete Photos',
      `Are you sure you want to delete ${selectedIds.length} photo(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(selectedIds);
            exitSelectionMode();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={exitSelectionMode}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>

      <Text style={styles.countText}>{selectedIds.length} selected</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, selectedIds.length === 0 && styles.disabled]}
          onPress={() => onAddToAlbum(selectedIds)}
          disabled={selectedIds.length === 0}
        >
          <Text style={styles.actionText}>Album</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton, selectedIds.length === 0 && styles.disabled]}
          onPress={handleDelete}
          disabled={selectedIds.length === 0}
        >
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: { padding: 8 },
  cancelText: { color: '#007AFF', fontSize: 16 },
  countText: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  actions: { flexDirection: 'row', gap: 12 },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  deleteButton: { backgroundColor: '#FFEBEE' },
  actionText: { fontSize: 14, fontWeight: '600', color: '#007AFF' },
  deleteText: { color: '#FF3B30' },
  disabled: { opacity: 0.5 },
});

export default SelectionActionBar;
