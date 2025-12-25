import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import PhotoService from '../services/PhotoService';
import MetadataService from '../services/MetadataService';
import CategorizationService, { CategoryGroup } from '../services/CategorizationService';
import SplitView from '../components/SplitView';
import Header from '../components/Header';
import CategoryTabs from '../components/CategoryTabs';
import PhotoPairList from '../components/PhotoPairList';
import CategoryGroupList from '../components/CategoryGroupList';
import PhotoGrid from '../components/PhotoGrid';
import EmptyState from '../components/EmptyState';
import LoadingIndicator from '../components/LoadingIndicator';
import { Photo, PhotoPair, CategoryType } from '../types/photo';

const GalleryScreen: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [pairs, setPairs] = useState<PhotoPair[]>([]);
  const [categories, setCategories] = useState<{ [key in CategoryType]: CategoryGroup[] } | null>(null);
  const [selectedPair, setSelectedPair] = useState<PhotoPair | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(CategoryType.DATE);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'split'>('list');

  useEffect(() => {
    requestPermissions();
    loadPhotos();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      if (photos.length > 0) {
        const allCategories = await CategorizationService.getAllCategories(photos);
        if (isMounted) {
          setCategories(allCategories);
        }
      }
    };
    fetchCategories();
    return () => {
      isMounted = false;
    };
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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const loadedPhotos = await PhotoService.loadPhotos();
      setPhotos(loadedPhotos);

      const photoPairs = PhotoService.generatePairs(loadedPhotos);
      setPairs(photoPairs);
    } catch (error) {
      console.error('Error refreshing photos:', error);
      Alert.alert('Error', 'Failed to refresh photos. Please try again.');
    } finally {
      setRefreshing(false);
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

  const renderContent = () => {
    if (isLoading) {
      return <LoadingIndicator />;
    }
    if (photos.length === 0) {
      return <EmptyState />;
    }
    return (
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
      >
        {pairs.length > 0 && (
          <PhotoPairList pairs={pairs} onPairPress={handlePairPress} />
        )}
        {categories && categories[selectedCategory] && categories[selectedCategory].length > 0 && (
          <CategoryGroupList
            categoryGroups={categories[selectedCategory]}
            categoryType={selectedCategory}
          />
        )}
        <PhotoGrid photos={photos} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        photoCount={photos.length}
        onImport={importPhotos}
        isLoading={isLoading}
      />
      <CategoryTabs
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      {renderContent()}
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
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

export default GalleryScreen;
