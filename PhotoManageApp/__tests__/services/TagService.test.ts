import TagService from '../../src/services/TagService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tag } from '../../src/types/photo';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('TagService', () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockClear();
    (AsyncStorage.setItem as jest.Mock).mockClear();
  });

  describe('getAllTags', () => {
    it('should return tags from storage', async () => {
      const tags: Tag[] = [
        { id: '1', name: 'Nature', color: '#4ECDC4' },
        { id: '2', name: 'Portrait', color: '#FF6B6B' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(tags));

      const result = await TagService.getAllTags();

      expect(result).toEqual(tags);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@photo_manage_tags');
    });

    it('should return empty array when no tags exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await TagService.getAllTags();

      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const result = await TagService.getAllTags();

      expect(result).toEqual([]);
    });
  });

  describe('createTag', () => {
    it('should create a new tag with name only', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify([]));

      const newTag = await TagService.createTag('Landscape');

      expect(newTag.name).toBe('Landscape');
      expect(newTag.id).toBeDefined();
      expect(newTag.color).toBeUndefined();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_tags',
        JSON.stringify([newTag])
      );
    });

    it('should create a new tag with name and color', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify([]));

      const newTag = await TagService.createTag('Wildlife', '#45B7D1');

      expect(newTag.name).toBe('Wildlife');
      expect(newTag.color).toBe('#45B7D1');
      expect(newTag.id).toBeDefined();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_tags',
        JSON.stringify([newTag])
      );
    });

    it('should add new tag to existing tags', async () => {
      const existingTags: Tag[] = [
        { id: '1', name: 'Existing Tag', color: '#FF6B6B' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingTags));

      const newTag = await TagService.createTag('New Tag', '#4ECDC4');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_tags',
        JSON.stringify([...existingTags, newTag])
      );
    });
  });

  describe('deleteTag', () => {
    it('should delete a tag by id', async () => {
      const tags: Tag[] = [
        { id: '1', name: 'Tag 1', color: '#FF6B6B' },
        { id: '2', name: 'Tag 2', color: '#4ECDC4' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(tags));

      await TagService.deleteTag('1');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_tags',
        JSON.stringify([{ id: '2', name: 'Tag 2', color: '#4ECDC4' }])
      );
    });

    it('should handle deleting non-existent tag', async () => {
      const tags: Tag[] = [
        { id: '1', name: 'Tag 1', color: '#FF6B6B' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(tags));

      await TagService.deleteTag('999');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_tags',
        JSON.stringify(tags)
      );
    });
  });

  describe('renameTag', () => {
    it('should rename an existing tag', async () => {
      const tags: Tag[] = [
        { id: '1', name: 'Old Name', color: '#FF6B6B' },
        { id: '2', name: 'Another Tag', color: '#4ECDC4' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(tags));
      (AsyncStorage.setItem as jest.Mock).mockClear();

      await TagService.renameTag('1', 'New Name');

      const expectedTags = [
        { id: '1', name: 'New Name', color: '#FF6B6B' },
        { id: '2', name: 'Another Tag', color: '#4ECDC4' },
      ];
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_tags',
        JSON.stringify(expectedTags)
      );
    });

    it('should not call setItem when tag does not exist', async () => {
      const tags: Tag[] = [
        { id: '1', name: 'Tag 1', color: '#FF6B6B' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(tags));
      (AsyncStorage.setItem as jest.Mock).mockClear();

      await TagService.renameTag('999', 'New Name');

      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should preserve tag color when renaming', async () => {
      const tags: Tag[] = [
        { id: '1', name: 'Old Name', color: '#45B7D1' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(tags));
      (AsyncStorage.setItem as jest.Mock).mockClear();

      await TagService.renameTag('1', 'New Name');

      const expectedTags = [
        { id: '1', name: 'New Name', color: '#45B7D1' },
      ];
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_tags',
        JSON.stringify(expectedTags)
      );
    });
  });

  describe('updateTagColor', () => {
    it('should update tag color', async () => {
      const tags: Tag[] = [
        { id: '1', name: 'Tag 1', color: '#FF6B6B' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(tags));
      (AsyncStorage.setItem as jest.Mock).mockClear();

      await TagService.updateTagColor('1', '#4ECDC4');

      const expectedTags = [
        { id: '1', name: 'Tag 1', color: '#4ECDC4' },
      ];
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_tags',
        JSON.stringify(expectedTags)
      );
    });

    it('should not call setItem when tag does not exist', async () => {
      const tags: Tag[] = [
        { id: '1', name: 'Tag 1', color: '#FF6B6B' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(tags));
      (AsyncStorage.setItem as jest.Mock).mockClear();

      await TagService.updateTagColor('999', '#4ECDC4');

      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('getTagById', () => {
    it('should return a tag by id', async () => {
      const tags: Tag[] = [
        { id: '1', name: 'Tag 1', color: '#FF6B6B' },
        { id: '2', name: 'Tag 2', color: '#4ECDC4' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(tags));

      const result = await TagService.getTagById('2');

      expect(result).toEqual({ id: '2', name: 'Tag 2', color: '#4ECDC4' });
    });

    it('should return undefined for non-existent tag', async () => {
      const tags: Tag[] = [
        { id: '1', name: 'Tag 1', color: '#FF6B6B' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(tags));

      const result = await TagService.getTagById('999');

      expect(result).toBeUndefined();
    });
  });

  describe('getTagsByIds', () => {
    it('should return multiple tags by ids', async () => {
      const tags: Tag[] = [
        { id: '1', name: 'Tag 1', color: '#FF6B6B' },
        { id: '2', name: 'Tag 2', color: '#4ECDC4' },
        { id: '3', name: 'Tag 3', color: '#45B7D1' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(tags));

      const result = await TagService.getTagsByIds(['1', '3']);

      expect(result).toEqual([
        { id: '1', name: 'Tag 1', color: '#FF6B6B' },
        { id: '3', name: 'Tag 3', color: '#45B7D1' },
      ]);
    });

    it('should return empty array when no ids match', async () => {
      const tags: Tag[] = [
        { id: '1', name: 'Tag 1', color: '#FF6B6B' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(tags));

      const result = await TagService.getTagsByIds(['999', '888']);

      expect(result).toEqual([]);
    });

    it('should return partial results when some ids match', async () => {
      const tags: Tag[] = [
        { id: '1', name: 'Tag 1', color: '#FF6B6B' },
        { id: '2', name: 'Tag 2', color: '#4ECDC4' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(tags));

      const result = await TagService.getTagsByIds(['1', '999']);

      expect(result).toEqual([
        { id: '1', name: 'Tag 1', color: '#FF6B6B' },
      ]);
    });
  });
});
