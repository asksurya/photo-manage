import { Photo } from './photo';

export type RootStackParamList = {
  Gallery: undefined;
  Albums: undefined;
  AlbumPhotos: {
    albumName: string;
    photos: Photo[];
  };
  Search: undefined;
  Map: undefined;
  Settings: undefined;
};
