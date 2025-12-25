import AsyncStorage from '@react-native-async-storage/async-storage';
import PhotoService from '../../src/services/PhotoService';

describe('PhotoService - Video Support', () => {
  afterEach(() => {
    AsyncStorage.clear();
  });

  describe('isVideoFile', () => {
    it('should detect .mp4 files as video', () => {
      expect(PhotoService.isVideoFile('video.mp4')).toBe(true);
      expect(PhotoService.isVideoFile('video.MP4')).toBe(true);
    });

    it('should detect .mov files as video', () => {
      expect(PhotoService.isVideoFile('video.mov')).toBe(true);
      expect(PhotoService.isVideoFile('video.MOV')).toBe(true);
    });

    it('should detect .m4v files as video', () => {
      expect(PhotoService.isVideoFile('video.m4v')).toBe(true);
      expect(PhotoService.isVideoFile('video.M4V')).toBe(true);
    });

    it('should return false for non-video files', () => {
      expect(PhotoService.isVideoFile('photo.jpg')).toBe(false);
      expect(PhotoService.isVideoFile('photo.jpeg')).toBe(false);
      expect(PhotoService.isVideoFile('photo.png')).toBe(false);
      expect(PhotoService.isVideoFile('photo.raw')).toBe(false);
      expect(PhotoService.isVideoFile('photo.cr2')).toBe(false);
    });

    it('should handle filenames with multiple dots', () => {
      expect(PhotoService.isVideoFile('my.vacation.video.mp4')).toBe(true);
      expect(PhotoService.isVideoFile('my.photo.file.jpg')).toBe(false);
    });
  });

  describe('importPhotos with videos', () => {
    it('should set mediaType to video for video files', async () => {
      const assets: any[] = [
        {
          uri: 'file:///test.mp4',
          fileName: 'test.mp4',
          type: 'video/mp4',
          fileSize: 5000000,
          width: 1920,
          height: 1080,
          duration: 30,
        },
      ];

      const importedPhotos = await PhotoService.importPhotos(assets);

      expect(importedPhotos.length).toBe(1);
      expect(importedPhotos[0].mediaType).toBe('video');
      expect(importedPhotos[0].filename).toBe('test.mp4');
    });

    it('should set mediaType to photo for photo files', async () => {
      const assets: any[] = [
        {
          uri: 'file:///test.jpg',
          fileName: 'test.jpg',
          type: 'image/jpeg',
          fileSize: 1234,
          width: 100,
          height: 100,
        },
      ];

      const importedPhotos = await PhotoService.importPhotos(assets);

      expect(importedPhotos.length).toBe(1);
      expect(importedPhotos[0].mediaType).toBe('photo');
    });

    it('should set duration for video files', async () => {
      const assets: any[] = [
        {
          uri: 'file:///test.mov',
          fileName: 'test.mov',
          type: 'video/quicktime',
          fileSize: 10000000,
          width: 1920,
          height: 1080,
          duration: 120.5,
        },
      ];

      const importedPhotos = await PhotoService.importPhotos(assets);

      expect(importedPhotos.length).toBe(1);
      expect(importedPhotos[0].duration).toBe(120.5);
    });

    it('should set duration to 0 if not provided for video', async () => {
      const assets: any[] = [
        {
          uri: 'file:///test.mp4',
          fileName: 'test.mp4',
          type: 'video/mp4',
          fileSize: 5000000,
          width: 1920,
          height: 1080,
          // no duration provided
        },
      ];

      const importedPhotos = await PhotoService.importPhotos(assets);

      expect(importedPhotos.length).toBe(1);
      expect(importedPhotos[0].duration).toBe(0);
    });

    it('should not set duration for photo files', async () => {
      const assets: any[] = [
        {
          uri: 'file:///test.jpg',
          fileName: 'test.jpg',
          type: 'image/jpeg',
          fileSize: 1234,
          width: 100,
          height: 100,
        },
      ];

      const importedPhotos = await PhotoService.importPhotos(assets);

      expect(importedPhotos.length).toBe(1);
      expect(importedPhotos[0].duration).toBeUndefined();
    });

    it('should set thumbnailUri for video files', async () => {
      const assets: any[] = [
        {
          uri: 'file:///test.mp4',
          fileName: 'test.mp4',
          type: 'video/mp4',
          fileSize: 5000000,
          width: 1920,
          height: 1080,
        },
      ];

      const importedPhotos = await PhotoService.importPhotos(assets);

      expect(importedPhotos.length).toBe(1);
      // Thumbnail uses same URI as placeholder
      expect(importedPhotos[0].thumbnailUri).toBe('file:///test.mp4');
    });

    it('should handle mixed photo and video imports', async () => {
      const assets: any[] = [
        {
          uri: 'file:///photo1.jpg',
          fileName: 'photo1.jpg',
          type: 'image/jpeg',
          fileSize: 1234,
          width: 100,
          height: 100,
        },
        {
          uri: 'file:///video1.mp4',
          fileName: 'video1.mp4',
          type: 'video/mp4',
          fileSize: 5000000,
          width: 1920,
          height: 1080,
          duration: 60,
        },
        {
          uri: 'file:///photo2.raw',
          fileName: 'photo2.raw',
          type: 'image/raw',
          fileSize: 25000000,
          width: 4000,
          height: 3000,
        },
      ];

      const importedPhotos = await PhotoService.importPhotos(assets);

      expect(importedPhotos.length).toBe(3);

      // Check photo1
      expect(importedPhotos[0].mediaType).toBe('photo');
      expect(importedPhotos[0].duration).toBeUndefined();

      // Check video1
      expect(importedPhotos[1].mediaType).toBe('video');
      expect(importedPhotos[1].duration).toBe(60);

      // Check photo2 (raw)
      expect(importedPhotos[2].mediaType).toBe('photo');
      expect(importedPhotos[2].duration).toBeUndefined();
    });
  });

  describe('video type detection', () => {
    it('should set correct type for video when not provided', async () => {
      const assets: any[] = [
        {
          uri: 'file:///test.mp4',
          fileName: 'test.mp4',
          fileSize: 5000000,
          width: 1920,
          height: 1080,
          // type not provided
        },
      ];

      const importedPhotos = await PhotoService.importPhotos(assets);

      expect(importedPhotos[0].type).toBe('video/mp4');
    });
  });
});
