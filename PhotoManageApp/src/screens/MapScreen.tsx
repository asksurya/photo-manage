import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, Platform, PermissionsAndroid, Alert } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import PhotoService from '../services/PhotoService';
import { Photo } from '../types/photo';

const MapScreen: React.FC = () => {
  const navigation = useNavigation();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [initialRegion, setInitialRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  useEffect(() => {
    requestLocationPermission();
    loadPhotos();
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasLocationPermission(true);
        } else {
          Alert.alert('Permission Denied', 'Location permission is required to show your location on the map.');
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
        const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        if (result === RESULTS.GRANTED) {
            setHasLocationPermission(true);
        }
    }
  };

  const loadPhotos = async () => {
    const allPhotos = await PhotoService.loadPhotos();
    const photosWithLocation = allPhotos.filter(
      p => p.exif?.GPSLatitude && p.exif?.GPSLongitude
    );
    setPhotos(photosWithLocation);

    if (photosWithLocation.length > 0) {
      // Center map on the first photo
      const first = photosWithLocation[0];
      setInitialRegion({
        latitude: first.exif!.GPSLatitude!,
        longitude: first.exif!.GPSLongitude!,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  };

  return (
    <View style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
        </View>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={hasLocationPermission}
      >
        {photos.map(photo => (
          <Marker
            key={photo.id}
            coordinate={{
              latitude: photo.exif!.GPSLatitude!,
              longitude: photo.exif!.GPSLongitude!,
            }}
          >
            <Callout>
                <View style={styles.callout}>
                    <Text>{photo.filename}</Text>
                </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
      position: 'absolute',
      top: 50,
      left: 20,
      zIndex: 1,
      backgroundColor: 'white',
      padding: 8,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
  },
  backButton: {

  },
  backButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: 'black',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  callout: {
      width: 150,
      alignItems: 'center',
  }
});

export default MapScreen;
