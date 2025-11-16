export interface Album {
  id: string;
  name: string;
  photos: AlbumPhoto[];
}

export interface AlbumPhoto {
  id: string;
  uri: string;
}
