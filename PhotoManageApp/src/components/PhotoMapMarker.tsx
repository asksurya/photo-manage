import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { Photo } from '../types/photo';
import { PhotoCluster } from '../services/MapService';

interface PhotoMapMarkerProps {
  cluster: PhotoCluster;
  onPress?: (cluster: PhotoCluster) => void;
}

const PhotoMapMarker: React.FC<PhotoMapMarkerProps> = ({ cluster, onPress }) => {
  const isCluster = cluster.count > 1;
  const firstPhoto = cluster.photos[0];

  const handlePress = () => {
    if (onPress) {
      onPress(cluster);
    }
  };

  return (
    <Marker
      coordinate={{
        latitude: cluster.latitude,
        longitude: cluster.longitude,
      }}
      onPress={handlePress}
    >
      <View style={styles.markerContainer}>
        {isCluster ? (
          <View style={styles.clusterMarker}>
            <Text style={styles.clusterCount}>{cluster.count}</Text>
          </View>
        ) : (
          <View style={styles.photoMarker}>
            <Image
              source={{ uri: firstPhoto.uri }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          </View>
        )}
      </View>

      <Callout tooltip style={styles.calloutContainer}>
        <View style={styles.callout}>
          {isCluster ? (
            <View style={styles.clusterCallout}>
              <Text style={styles.calloutTitle}>
                {cluster.count} Photos
              </Text>
              <View style={styles.clusterThumbnails}>
                {cluster.photos.slice(0, 4).map((photo, index) => (
                  <Image
                    key={photo.id}
                    source={{ uri: photo.uri }}
                    style={styles.calloutThumbnail}
                    resizeMode="cover"
                  />
                ))}
                {cluster.count > 4 && (
                  <View style={styles.morePhotos}>
                    <Text style={styles.morePhotosText}>
                      +{cluster.count - 4}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.calloutHint}>Tap to zoom in</Text>
            </View>
          ) : (
            <View style={styles.singleCallout}>
              <Image
                source={{ uri: firstPhoto.uri }}
                style={styles.calloutImage}
                resizeMode="cover"
              />
              <Text style={styles.calloutFilename} numberOfLines={1}>
                {firstPhoto.filename}
              </Text>
              {firstPhoto.exif?.DateTimeOriginal && (
                <Text style={styles.calloutDate}>
                  {new Date(firstPhoto.timestamp).toLocaleDateString()}
                </Text>
              )}
            </View>
          )}
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clusterCount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  photoMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  calloutContainer: {
    width: 200,
  },
  callout: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clusterCallout: {
    alignItems: 'center',
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  clusterThumbnails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 8,
  },
  calloutThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  morePhotos: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  morePhotosText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  calloutHint: {
    fontSize: 12,
    color: '#8E8E93',
  },
  singleCallout: {
    alignItems: 'center',
  },
  calloutImage: {
    width: 160,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  calloutFilename: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  calloutDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
});

export default PhotoMapMarker;
