import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import MapScreen from '../../src/screens/MapScreen';
import MapService from '../../src/services/MapService';
import { Photo } from '../../src/types/photo';

// Mock the SafeAreaProvider
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Sample photos for testing
const mockPhotosWithLocation: Photo[] = [
  {
    id: '1',
    uri: 'file://photo1.jpg',
    filename: 'photo1.jpg',
    type: 'image/jpeg',
    size: 1024,
    timestamp: Date.now(),
    exif: {
      GPSLatitude: 37.7749,
      GPSLongitude: -122.4194,
    },
  },
  {
    id: '2',
    uri: 'file://photo2.jpg',
    filename: 'photo2.jpg',
    type: 'image/jpeg',
    size: 2048,
    timestamp: Date.now() - 1000,
    exif: {
      GPSLatitude: 37.7850,
      GPSLongitude: -122.4094,
    },
  },
];

const mockPhotosWithoutLocation: Photo[] = [
  {
    id: '3',
    uri: 'file://photo3.jpg',
    filename: 'photo3.jpg',
    type: 'image/jpeg',
    size: 512,
    timestamp: Date.now(),
    exif: {},
  },
];

describe('MapScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders map view when photos with location exist', async () => {
    jest.spyOn(MapService, 'getPhotosWithLocation').mockResolvedValue(mockPhotosWithLocation);

    const { getByTestId, getByText } = render(<MapScreen />);

    await waitFor(() => {
      expect(getByTestId('map-view')).toBeTruthy();
    });

    expect(getByText('Photo Map')).toBeTruthy();
    expect(getByText('2 photos with location')).toBeTruthy();
  });

  it('renders empty state when no photos have location', async () => {
    jest.spyOn(MapService, 'getPhotosWithLocation').mockResolvedValue([]);

    const { getByText } = render(<MapScreen />);

    await waitFor(() => {
      expect(getByText('No Photos with Location')).toBeTruthy();
    });

    expect(getByText(/Import photos with GPS coordinates/)).toBeTruthy();
  });

  it('shows loading state initially', async () => {
    // Create a promise that doesn't resolve immediately
    let resolvePromise: (value: Photo[]) => void;
    const slowPromise = new Promise<Photo[]>((resolve) => {
      resolvePromise = resolve;
    });

    jest.spyOn(MapService, 'getPhotosWithLocation').mockReturnValue(slowPromise);

    const { getByText } = render(<MapScreen />);

    expect(getByText('Loading photo locations...')).toBeTruthy();

    // Resolve the promise to complete the test
    await act(async () => {
      resolvePromise!(mockPhotosWithLocation);
    });
  });

  it('displays correct photo count in header', async () => {
    jest.spyOn(MapService, 'getPhotosWithLocation').mockResolvedValue(mockPhotosWithLocation);

    const { getByText } = render(<MapScreen />);

    await waitFor(() => {
      expect(getByText('2 photos with location')).toBeTruthy();
    });
  });

  it('renders markers for photos with location', async () => {
    jest.spyOn(MapService, 'getPhotosWithLocation').mockResolvedValue(mockPhotosWithLocation);

    const { getAllByTestId } = render(<MapScreen />);

    await waitFor(() => {
      const markers = getAllByTestId('map-marker');
      expect(markers.length).toBeGreaterThan(0);
    });
  });

  it('filters photos correctly using MapService', () => {
    const allPhotos = [...mockPhotosWithLocation, ...mockPhotosWithoutLocation];
    const filtered = MapService.filterPhotosWithLocation(allPhotos);

    expect(filtered).toHaveLength(2);
    expect(filtered.every(p => p.exif?.GPSLatitude !== undefined)).toBe(true);
    expect(filtered.every(p => p.exif?.GPSLongitude !== undefined)).toBe(true);
  });
});

describe('MapService', () => {
  describe('filterPhotosWithLocation', () => {
    it('filters out photos without GPS coordinates', () => {
      const allPhotos = [...mockPhotosWithLocation, ...mockPhotosWithoutLocation];
      const result = MapService.filterPhotosWithLocation(allPhotos);

      expect(result).toHaveLength(2);
      expect(result.map(p => p.id)).toEqual(['1', '2']);
    });

    it('returns empty array when no photos have location', () => {
      const result = MapService.filterPhotosWithLocation(mockPhotosWithoutLocation);
      expect(result).toHaveLength(0);
    });

    it('returns all photos when all have location', () => {
      const result = MapService.filterPhotosWithLocation(mockPhotosWithLocation);
      expect(result).toHaveLength(2);
    });
  });

  describe('groupPhotosByLocation', () => {
    it('groups nearby photos into clusters', () => {
      const clusters = MapService.groupPhotosByLocation(mockPhotosWithLocation, 0.1);

      // With precision 0.1, both photos should be in the same cluster
      expect(clusters.length).toBe(1);
      expect(clusters[0].count).toBe(2);
    });

    it('separates distant photos into different clusters', () => {
      const distantPhotos: Photo[] = [
        {
          id: '1',
          uri: 'file://photo1.jpg',
          filename: 'photo1.jpg',
          type: 'image/jpeg',
          size: 1024,
          timestamp: Date.now(),
          exif: {
            GPSLatitude: 37.7749,
            GPSLongitude: -122.4194,
          },
        },
        {
          id: '2',
          uri: 'file://photo2.jpg',
          filename: 'photo2.jpg',
          type: 'image/jpeg',
          size: 2048,
          timestamp: Date.now(),
          exif: {
            GPSLatitude: 40.7128, // New York
            GPSLongitude: -74.0060,
          },
        },
      ];

      const clusters = MapService.groupPhotosByLocation(distantPhotos, 0.1);

      expect(clusters.length).toBe(2);
      expect(clusters.every(c => c.count === 1)).toBe(true);
    });

    it('returns empty array for photos without location', () => {
      const clusters = MapService.groupPhotosByLocation(mockPhotosWithoutLocation, 0.01);
      expect(clusters).toHaveLength(0);
    });
  });

  describe('calculateInitialRegion', () => {
    it('returns default region when no photos have location', () => {
      const region = MapService.calculateInitialRegion(mockPhotosWithoutLocation);

      expect(region).toEqual(MapService.DEFAULT_REGION);
    });

    it('calculates center of photos with location', () => {
      const region = MapService.calculateInitialRegion(mockPhotosWithLocation);

      // Center should be between the two photo locations
      expect(region.latitude).toBeCloseTo((37.7749 + 37.785) / 2, 2);
      expect(region.longitude).toBeCloseTo((-122.4194 + -122.4094) / 2, 2);
    });

    it('includes padding in delta calculations', () => {
      const region = MapService.calculateInitialRegion(mockPhotosWithLocation);

      // Deltas should be larger than the actual spread to add padding
      expect(region.latitudeDelta).toBeGreaterThan(0);
      expect(region.longitudeDelta).toBeGreaterThan(0);
    });
  });

  describe('getClusterPrecision', () => {
    it('returns larger precision when zoomed out', () => {
      expect(MapService.getClusterPrecision(20)).toBe(1);
      expect(MapService.getClusterPrecision(5)).toBe(0.1);
    });

    it('returns smaller precision when zoomed in', () => {
      expect(MapService.getClusterPrecision(0.05)).toBe(0.001);
      expect(MapService.getClusterPrecision(0.005)).toBe(0.0001);
    });
  });
});
