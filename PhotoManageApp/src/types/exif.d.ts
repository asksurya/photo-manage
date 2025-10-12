declare module 'react-native-exif' {
  export interface ExifData {
    DateTimeOriginal?: string;
    GPSLatitude?: number;
    GPSLongitude?: number;
    GPSAltitude?: number;
    Make?: string;
    Model?: string;
    [key: string]: any;
  }

  export function getExif(uri: string): Promise<ExifData>;
}
