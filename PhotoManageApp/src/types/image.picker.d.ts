declare module 'react-native-image-picker' {
  export interface ImageLibraryOptions {
    mediaType?: 'photo' | 'video' | 'mixed';
    includeBase64?: boolean;
    maxHeight?: number;
    maxWidth?: number;
    quality?: number;
    storageOptions?: {
      skipBackup?: boolean;
      path?: string;
    };
  }

  export interface Asset {
    uri?: string;
    fileName?: string;
    type?: string;
    fileSize?: number;
    width?: number;
    height?: number;
    base64?: string;
  }

  export interface ImagePickerResponse {
    didCancel?: boolean;
    errorMessage?: string;
    assets?: Asset[];
  }

  export function launchImageLibrary(
    options: ImageLibraryOptions,
    callback: (response: ImagePickerResponse) => void
  ): void;
}
