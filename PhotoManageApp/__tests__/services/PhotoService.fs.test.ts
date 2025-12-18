import RNFS from 'react-native-fs';
import PhotoService from '../../src/services/PhotoService';

describe('PhotoService File Operations', () => {
  const sourcePath = '/path/to/source.jpg';
  const destPath = '/path/to/dest.jpg';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(true);
      const exists = await PhotoService.fileExists(sourcePath);
      expect(exists).toBe(true);
      expect(RNFS.exists).toHaveBeenCalledWith(sourcePath);
    });

    it('should return false if file does not exist', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(false);
      const exists = await PhotoService.fileExists(sourcePath);
      expect(exists).toBe(false);
      expect(RNFS.exists).toHaveBeenCalledWith(sourcePath);
    });

    it('should return false on error', async () => {
      (RNFS.exists as jest.Mock).mockRejectedValue(new Error('Test error'));
      const exists = await PhotoService.fileExists(sourcePath);
      expect(exists).toBe(false);
    });
  });

  describe('deleteFile', () => {
    it('should delete file if it exists', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(true);
      (RNFS.unlink as jest.Mock).mockResolvedValue(undefined);

      await PhotoService.deleteFile(sourcePath);

      expect(RNFS.exists).toHaveBeenCalledWith(sourcePath);
      expect(RNFS.unlink).toHaveBeenCalledWith(sourcePath);
    });

    it('should not try to delete file if it does not exist', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(false);

      await PhotoService.deleteFile(sourcePath);

      expect(RNFS.exists).toHaveBeenCalledWith(sourcePath);
      expect(RNFS.unlink).not.toHaveBeenCalled();
    });

    it('should throw error if deletion fails', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(true);
      (RNFS.unlink as jest.Mock).mockRejectedValue(new Error('Test error'));

      await expect(PhotoService.deleteFile(sourcePath)).rejects.toThrow('Failed to delete file');
    });
  });

  describe('moveFile', () => {
    it('should move file', async () => {
      (RNFS.moveFile as jest.Mock).mockResolvedValue(undefined);

      await PhotoService.moveFile(sourcePath, destPath);

      expect(RNFS.moveFile).toHaveBeenCalledWith(sourcePath, destPath);
    });

    it('should throw error if move fails', async () => {
      (RNFS.moveFile as jest.Mock).mockRejectedValue(new Error('Test error'));

      await expect(PhotoService.moveFile(sourcePath, destPath)).rejects.toThrow('Failed to move file');
    });
  });

  describe('copyFile', () => {
    it('should copy file', async () => {
      (RNFS.copyFile as jest.Mock).mockResolvedValue(undefined);

      await PhotoService.copyFile(sourcePath, destPath);

      expect(RNFS.copyFile).toHaveBeenCalledWith(sourcePath, destPath);
    });

    it('should throw error if copy fails', async () => {
      (RNFS.copyFile as jest.Mock).mockRejectedValue(new Error('Test error'));

      await expect(PhotoService.copyFile(sourcePath, destPath)).rejects.toThrow('Failed to copy file');
    });
  });
});
