import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import MapView, { Region } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';

import MapService, { PhotoCluster, Region as MapRegion } from '../services/MapService';
import PhotoMapMarker from '../components/PhotoMapMarker';
import { Photo } from '../types/photo';

const MapScreen: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [clusters, setClusters] = useState<PhotoCluster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [region, setRegion] = useState<MapRegion>(MapService.DEFAULT_REGION);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    loadPhotosWithLocation();
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'ios') {
        const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        setHasLocationPermission(result === RESULTS.GRANTED);
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        setHasLocationPermission(
          granted === PermissionsAndroid.RESULTS.GRANTED
        );
      }
    } catch (error) {
      console.warn('Location permission error:', error);
    }
  };

  const loadPhotosWithLocation = async () => {
    setIsLoading(true);
    try {
      const photosWithGps = await MapService.getPhotosWithLocation();
      setPhotos(photosWithGps);

      if (photosWithGps.length > 0) {
        const initialRegion = MapService.calculateInitialRegion(photosWithGps);
        setRegion(initialRegion);

        const precision = MapService.getClusterPrecision(initialRegion.latitudeDelta);
        const photoClusters = MapService.groupPhotosByLocation(photosWithGps, precision);
        setClusters(photoClusters);
      }
    } catch (error) {
      console.error('Error loading photos with location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegionChange = useCallback((newRegion: Region) => {
    if (photos.length === 0) {
      return;
    }

    const precision = MapService.getClusterPrecision(newRegion.latitudeDelta);
    const newClusters = MapService.groupPhotosByLocation(photos, precision);
    setClusters(newClusters);
  }, [photos]);

  const handleClusterPress = useCallback((cluster: PhotoCluster) => {
    if (cluster.count > 1 && mapRef.current) {
      // Zoom in on the cluster
      const newRegion: Region = {
        latitude: cluster.latitude,
        longitude: cluster.longitude,
        latitudeDelta: region.latitudeDelta / 2,
        longitudeDelta: region.longitudeDelta / 2,
      };
      mapRef.current.animateToRegion(newRegion, 300);
    }
  }, [region]);

  const centerOnUserLocation = useCallback(() => {
    if (!hasLocationPermission) {
      return;
    }

    Geolocation.getCurrentPosition(
      (position) => {
        const newRegion: Region = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 300);
        }
      },
      (error) => {
        console.warn('Error getting current position:', error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, [hasLocationPermission]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading photo locations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (photos.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptyTitle}>No Photos with Location</Text>
          <Text style={styles.emptySubtitle}>
            Import photos with GPS coordinates to see them on the map.
            Enable location when taking photos to automatically add GPS data.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Photo Map</Text>
        <Text style={styles.headerSubtitle}>
          {photos.length} photo{photos.length !== 1 ? 's' : ''} with location
        </Text>
      </View>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={hasLocationPermission}
        showsCompass={true}
        testID="map-view"
      >
        {clusters.map((cluster) => (
          <PhotoMapMarker
            key={cluster.id}
            cluster={cluster}
            onPress={handleClusterPress}
          />
        ))}
      </MapView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MapScreen;
