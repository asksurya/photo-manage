export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface Photo {
  id: string;
  uri: string;
  filename: string;
  type: string;
  size: number;
  width?: number;
  height?: number;
  timestamp: number;
  deletedAt?: number;
  isFavorite?: boolean;
  mediaType?: 'photo' | 'video';
  duration?: number;
  thumbnailUri?: string;
  tagIds?: string[];
  exif?: {
    DateTimeOriginal?: string;
    GPSLatitude?: number;
    GPSLongitude?: number;
    GPSAltitude?: number;
    Make?: string;
    Model?: string;
    [key: string]: any;
  };
}

export interface PhotoPair {
  id: string;
  raw?: Photo;
  jpeg?: Photo;
  pairingKey: string; // Key used to identify matching RAW/JPEG pairs
}

export interface GalleryState {
  photos: Photo[];
  pairs: PhotoPair[];
  selectedPhoto: Photo | null;
  selectedPair: PhotoPair | null;
  filters: {
    category: 'all' | 'date' | 'location' | 'content';
    viewMode: 'list' | 'split';
  };
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  nasConfig?: NasConfig;
  biometricsEnabled?: boolean;
}

export interface NasConfig {
  host: string;
  port?: number;
  username: string;
  password: string;
  useHttps?: boolean;
  remotePath?: string;
}

export enum CategoryType {
  DATE = 'date',
  LOCATION = 'location',
  CONTENT = 'content',
  FAVORITES = 'favorites',
}

export interface Album {
  id: string;
  name: string;
  photoIds: string[];
}
