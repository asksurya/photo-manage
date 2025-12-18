import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface HeaderProps {
  photoCount: number;
  onImport: () => void;
  isLoading: boolean;
}

const Header: React.FC<HeaderProps> = ({ photoCount, onImport, isLoading }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>Photo Manage</Text>
        <Text style={styles.subtitle}>{photoCount} photo{photoCount !== 1 ? 's' : ''}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('Search')}
        >
           <Text style={styles.iconButtonText}>🔍</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('Map')}
        >
           <Text style={styles.iconButtonText}>🗺️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('Settings')}
        >
           <Text style={styles.iconButtonText}>⚙️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.importButton}
          onPress={() => navigation.navigate('Albums')}
        >
          <Text style={styles.importButtonText}>View Albums</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.importButton}
          onPress={onImport}
          disabled={isLoading}
        >
          <Text style={styles.importIcon}>📁</Text>
          <Text style={styles.importButtonText}>Import</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginLeft: 10,
  },
  importIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  importButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    backgroundColor: '#F8F9FA',
    borderRadius: 22,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  iconButtonText: {
    fontSize: 20,
  },
});

export default Header;
