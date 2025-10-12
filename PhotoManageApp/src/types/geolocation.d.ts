declare module 'react-native-geolocation-service' {
  export interface GeoPosition {
    coords: {
      latitude: number;
      longitude: number;
      altitude: number | null;
      accuracy: number;
      altitudeAccuracy: number | null;
      heading: number | null;
      speed: number | null;
    };
    timestamp: number;
  }

  export interface GeoError {
    code: number;
    message: string;
    PERMISSION_DENIED: number;
    POSITION_UNAVAILABLE: number;
    TIMEOUT: number;
  }

  export interface GeoOptions {
    timeout?: number;
    maximumAge?: number;
    enableHighAccuracy?: boolean;
    distanceFilter?: number;
    useSignificantChanges?: boolean;
  }

  export function getCurrentPosition(
    success: (position: GeoPosition) => void,
    error?: (error: GeoError) => void,
    options?: GeoOptions
  ): void;

  export function watchPosition(
    success: (position: GeoPosition) => void,
    error?: (error: GeoError) => void,
    options?: GeoOptions
  ): number;

  export function clearWatch(watchId: number): void;
}
