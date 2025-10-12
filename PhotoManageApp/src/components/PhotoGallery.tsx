import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import ImagePicker from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import PhotoService from '../services/PhotoService';
import MetadataService from '../services/MetadataService';
import CategorizationService, { CategoryGroup } from '../services/CategorizationService';
import SplitView from './SplitView';
import { Photo, PhotoPair, CategoryType } from '../types/photo';

const PhotoGallery: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [pairs, setPairs] = useState<PhotoPair[]>([]);
  const [categories, setCategories] = useState<{ [key in CategoryType]: CategoryGroup[] } | null>(null);
  const [selectedPair, setSelectedPair] = useState<PhotoPair | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(CategoryType.DATE);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'split'>('list');

  useEffect(() => {
    requestPermissions();
    loadPhotos();
  }, []);

  useEffect(() => {
    if (photos.length > 0) {
      const allCategories = CategorizationService.getAllCategories(photos);
      setCategories(allCategories);
    }
  }, [photos]);

  const requestPermissions = async () => {
    if (Platform.OS === 'ios') {
      const libraryResult = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
      const locationResult = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      if (libraryResult !== RESULTS.GRANTED) {
        Alert.alert('Permission Denied', 'Photo library access is required');
      }
      if (locationResult !== RESULTS.GRANTED) {
        console.warn('Location permission denied');
      }
    } else {
      try {
        const libraryGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
        const locationGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        if (libraryGranted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Storage access is required');
        }
        if (locationGranted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('Location permission denied');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const loadPhotos = async () => {
    setIsLoading(true);
    try {
      const loadedPhotos = await PhotoService.loadPhotos();
      setPhotos(loadedPhotos);

      const photoPairs = PhotoService.generatePairs(loadedPhotos);
      setPairs(photoPairs);
    } catch (error) {
      console.error('Error loading photos:', error);
      Alert.alert('Error', 'Failed to load photos');
    } finally {
      setIsLoading(false);
    }
  };

  const importPhotos = () => {
    const options = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };

    ImagePicker.launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', response.errorMessage);
        return;
      }

      if (response.assets && response.assets.length > 0) {
        setIsLoading(true);
        try {
          // Geotag photos during import
          const photosWithLocation = await Promise.all(
            response.assets.map(asset => MetadataService.geotagPhoto(asset as any))
          );

          const importedPhotos = await PhotoService.importPhotos(photosWithLocation);
          const updatedPhotos = [...photos, ...importedPhotos];
          setPhotos(updatedPhotos);

          const updatedPairs = PhotoService.generatePairs(updatedPhotos);
          setPairs(updatedPairs);
        } catch (error) {
          console.error('Error importing photos:', error);
          Alert.alert('Error', 'Failed to import photos');
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handlePairPress = (pair: PhotoPair) => {
    setSelectedPair(pair);
    setViewMode('split');
  };

  const handleBackFromSplitView = () => {
    setSelectedPair(null);
    setViewMode('list');
  };

  if (viewMode === 'split' && selectedPair) {
    return <SplitView pair={selectedPair} onBack={handleBackFromSplitView} />;
  }

  const renderPhotoItem = ({ item }: { item: Photo }) => (
    <TouchableOpacity style={styles.photoItem}>
      <Image source={{ uri: item.uri }} style={styles.photoImage} />
      <View style={styles.photoInfo}>
        <Text style={styles.photoName} numberOfLines={1}>
          {item.filename}
        </Text>
        <Text style={styles.photoDetails}>
          {item.width}x{item.height} • {new Date(item.timestamp).toLocaleDateString()}
        </Text>
        {item.exif?.GPSLatitude && item.exif?.GPSLongitude && (
          <Text style={styles.locationText}>
            📍 {item.exif.GPSLatitude.toFixed(4)}, {item.exif.GPSLongitude.toFixed(4)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderPairItem = ({ item }: { item: PhotoPair }) => (
    <TouchableOpacity style={styles.pairItem} onPress={() => handlePairPress(item)}>
      <View style={styles.pairHeader}>
        <Text style={styles.pairTitle}>{item.pairingKey}</Text>
        <Text style={styles.tapHint}>Tap to view in split-view</Text>
      </View>
      <View style={styles.pairContainer}>
        {item.raw && (
          <View style={styles.pairSide}>
            <Text style={styles.pairLabel}>RAW</Text>
            <Image source={{ uri: item.raw.uri }} style={styles.pairImage} />
          </View>
        )}
        {item.jpeg && (
          <View style={styles.pairSide}>
            <Text style={styles.pairLabel}>JPEG</Text>
            <Image source={{ uri: item.jpeg.uri }} style={styles.pairImage} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderCategoryGroup = ({ item }: { item: CategoryGroup }) => (
    <View style={styles.categoryGroup}>
      <Text style={styles.categoryTitle}>{item.title} ({item.photos.length})</Text>
      <FlatList
        horizontal
        data={item.photos}
        renderItem={renderPhotoItem}
        keyExtractor={(photo) => photo.id}
        showsHorizontalScrollIndicator={false}
        style={styles.categoryList}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Photo Manage</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.categoryButton, selectedCategory === CategoryType.DATE && styles.activeCategoryButton]}
            onPress={() => setSelectedCategory(CategoryType.DATE)}
          >
            <Text style={[styles.categoryButtonText, selectedCategory === CategoryType.DATE && styles.activeCategoryButtonText]}>
              Date
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.categoryButton, selectedCategory === CategoryType.LOCATION && styles.activeCategoryButton]}
            onPress={() => setSelectedCategory(CategoryType.LOCATION)}
          >
            <Text style={[styles.categoryButtonText, selectedCategory === CategoryType.LOCATION && styles.activeCategoryButtonText]}>
              Location
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.categoryButton, selectedCategory === CategoryType.CONTENT && styles.activeCategoryButton]}
            onPress={() => setSelectedCategory(CategoryType.CONTENT)}
          >
            <Text style={[styles.categoryButtonText, selectedCategory === CategoryType.CONTENT && styles.activeCategoryButtonText]}>
              Content
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.importButton} onPress={importPhotos}>
            <Text style={styles.importButtonText}>Import</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text>Processing photos...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photo Pairs ({pairs.length})</Text>
            <FlatList
              data={pairs}
              renderItem={renderPairItem}
              keyExtractor={(item) => item.id}
              horizontal={false}
              style={styles.list}
            />
          </View>

          {categories && categories[selectedCategory] && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Categories
              </Text>
              <FlatList
                data={categories[selectedCategory]}
                renderItem={renderCategoryGroup}
                keyExtractor={(item) => item.id}
                style={styles.categoriesList}
              />
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Photos ({photos.length})</Text>
            <FlatList
              data={photos}
              renderItem={renderPhotoItem}
              keyExtractor={(item) => item.id}
              horizontal={false}
              style={styles.list}
            />
          </View>
        </View>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeCategoryButton: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activeCategoryButtonText: {
    color: '#fff',
  },
  importButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  list: {
    backgroundColor: '#fff',
  },
  categoriesList: {
    backgroundColor: '#fff',
  },
  photoItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  photoImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
  },
  photoInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  photoName: {
    fontSize: 16,
    fontWeight: '500',
  },
  photoDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  pairItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pairHeader: {
    marginBottom: 8,
  },
  pairTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  tapHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  pairContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  pairSide: {
    flex: 1,
    alignItems: 'center',
  },
  pairLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  pairImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
  categoryGroup: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryList: {
    backgroundColor: '#fff',
  },
});

export default PhotoGallery;
