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
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { launchImageLibrary } from 'react-native-image-picker';
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
        Alert.alert('Permission Required', 'Photo library access is needed to manage your photos');
      }
      if (locationResult !== RESULTS.GRANTED) {
        console.warn('Location permission denied - geotagging will not be available');
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
          Alert.alert('Permission Required', 'Storage access is needed to manage your photos');
        }
        if (locationGranted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('Location permission denied - geotagging will not be available');
        }
      } catch (err) {
        console.warn('Permission error:', err);
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
      Alert.alert('Error', 'Failed to load photos. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const importPhotos = () => {
    const options = {
      mediaType: 'photo' as const,
      selectionLimit: 0,
      includeBase64: false,
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorMessage) {
        console.error('ImagePicker Error:', response.errorMessage);
        Alert.alert('Error', 'Failed to select photos. Please try again.');
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
          
          Alert.alert('Success', `Imported ${importedPhotos.length} photo(s) successfully!`);
        } catch (error) {
          console.error('Error importing photos:', error);
          Alert.alert('Error', 'Failed to import photos. Please try again.');
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
    <View style={styles.photoCard}>
      <Image source={{ uri: item.uri }} style={styles.photoImage} />
      <View style={styles.photoInfo}>
        <Text style={styles.photoName} numberOfLines={1}>
          {item.filename}
        </Text>
        <View style={styles.photoMetaRow}>
          <Text style={styles.photoMeta}>
            {item.width}×{item.height}
          </Text>
          <Text style={styles.photoDot}>•</Text>
          <Text style={styles.photoMeta}>
            {new Date(item.timestamp).toLocaleDateString()}
          </Text>
        </View>
        {item.exif?.GPSLatitude && item.exif?.GPSLongitude && (
          <View style={styles.locationBadge}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>
              {item.exif.GPSLatitude.toFixed(4)}, {item.exif.GPSLongitude.toFixed(4)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderPairItem = ({ item }: { item: PhotoPair }) => (
    <TouchableOpacity 
      style={styles.pairCard} 
      onPress={() => handlePairPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.pairHeader}>
        <Text style={styles.pairTitle} numberOfLines={1}>{item.pairingKey}</Text>
        <View style={styles.tapBadge}>
          <Text style={styles.tapText}>👆 Tap to compare</Text>
        </View>
      </View>
      <View style={styles.pairImagesContainer}>
        {item.raw && (
          <View style={styles.pairImageWrapper}>
            <Image source={{ uri: item.raw.uri }} style={styles.pairThumb} />
            <View style={styles.pairBadge}>
              <Text style={styles.pairBadgeText}>RAW</Text>
            </View>
          </View>
        )}
        {item.jpeg && (
          <View style={styles.pairImageWrapper}>
            <Image source={{ uri: item.jpeg.uri }} style={styles.pairThumb} />
            <View style={[styles.pairBadge, styles.jpegBadge]}>
              <Text style={styles.pairBadgeText}>JPEG</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderCategoryGroup = ({ item }: { item: CategoryGroup }) => (
    <View style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryLabel}>{item.title}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{item.photos.length}</Text>
        </View>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {item.photos.map((photo) => (
          <View key={photo.id} style={styles.categoryPhotoItem}>
            <Image source={{ uri: photo.uri }} style={styles.categoryPhotoThumb} />
            <Text style={styles.categoryPhotoName} numberOfLines={1}>
              {photo.filename}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📷</Text>
      <Text style={styles.emptyTitle}>No Photos Yet</Text>
      <Text style={styles.emptyText}>
        Tap the Import button to add photos{'\n'}and start organizing them
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Photo Manage</Text>
          <Text style={styles.subtitle}>{photos.length} photo{photos.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity 
          style={styles.importButton} 
          onPress={importPhotos}
          disabled={isLoading}
        >
          <Text style={styles.importIcon}>📁</Text>
          <Text style={styles.importButtonText}>Import</Text>
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          <TouchableOpacity
            style={[styles.tab, selectedCategory === CategoryType.DATE && styles.activeTab]}
            onPress={() => setSelectedCategory(CategoryType.DATE)}
          >
            <Text style={[styles.tabIcon, selectedCategory === CategoryType.DATE && styles.activeTabIcon]}>
              📅
            </Text>
            <Text style={[styles.tabText, selectedCategory === CategoryType.DATE && styles.activeTabText]}>
              By Date
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedCategory === CategoryType.LOCATION && styles.activeTab]}
            onPress={() => setSelectedCategory(CategoryType.LOCATION)}
          >
            <Text style={[styles.tabIcon, selectedCategory === CategoryType.LOCATION && styles.activeTabIcon]}>
              📍
            </Text>
            <Text style={[styles.tabText, selectedCategory === CategoryType.LOCATION && styles.activeTabText]}>
              By Location
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedCategory === CategoryType.CONTENT && styles.activeTab]}
            onPress={() => setSelectedCategory(CategoryType.CONTENT)}
          >
            <Text style={[styles.tabIcon, selectedCategory === CategoryType.CONTENT && styles.activeTabIcon]}>
              🏷️
            </Text>
            <Text style={[styles.tabText, selectedCategory === CategoryType.CONTENT && styles.activeTabText]}>
              By Content
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Processing photos...</Text>
        </View>
      ) : photos.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Photo Pairs Section */}
          {pairs.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Photo Pairs</Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{pairs.length}</Text>
                </View>
              </View>
              <FlatList
                data={pairs}
                renderItem={renderPairItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.pairsList}
              />
            </View>
          )}

          {/* Categories Section */}
          {categories && categories[selectedCategory] && categories[selectedCategory].length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} View
                </Text>
              </View>
              <FlatList
                data={categories[selectedCategory]}
                renderItem={renderCategoryGroup}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* All Photos Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Photos</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{photos.length}</Text>
              </View>
            </View>
            <FlatList
              data={photos}
              renderItem={renderPhotoItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.photosList}
            />
          </View>
        </ScrollView>
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
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  tabsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
  },
  activeTab: {
    backgroundColor: '#4A90E2',
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  activeTabIcon: {
    opacity: 1,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6C757D',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6C757D',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  sectionBadge: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  pairsList: {
    paddingHorizontal: 16,
  },
  pairCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pairHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pairTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginRight: 12,
  },
  tapBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tapText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
  },
  pairImagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  pairImageWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  pairThumb: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  pairBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  jpegBadge: {
    backgroundColor: '#51CF66',
  },
  pairBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  photosList: {
    paddingHorizontal: 16,
  },
  photoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  photoImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  photoInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  photoName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  photoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  photoMeta: {
    fontSize: 13,
    color: '#6C757D',
  },
  photoDot: {
    fontSize: 13,
    color: '#DEE2E6',
    marginHorizontal: 6,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  locationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#4A90E2',
    fontWeight: '500',
  },
  categorySection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  countBadge: {
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
  },
  categoryPhotoItem: {
    width: 100,
    marginRight: 12,
  },
  categoryPhotoThumb: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    marginBottom: 8,
  },
  categoryPhotoName: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
  },
});

export default PhotoGallery;
