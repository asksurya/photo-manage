import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tag } from '../types/photo';

class TagService {
  private static TAG_STORAGE_KEY = '@photo_manage_tags';

  /**
   * Load tags from local storage
   */
  static async loadTags(): Promise<Tag[]> {
    try {
      const storedTags = await AsyncStorage.getItem(this.TAG_STORAGE_KEY);
      if (storedTags) {
        return JSON.parse(storedTags);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
    }
    return [];
  }

  /**
   * Save tags to local storage
   */
  static async saveTags(tags: Tag[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.TAG_STORAGE_KEY, JSON.stringify(tags));
    } catch (error) {
      console.error('Error saving tags:', error);
      throw new Error('Failed to save tags');
    }
  }

  /**
   * Get all tags
   */
  static async getAllTags(): Promise<Tag[]> {
    return this.loadTags();
  }

  /**
   * Create a new tag
   */
  static async createTag(name: string, color?: string): Promise<Tag> {
    const tags = await this.loadTags();
    const newTag: Tag = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      color,
    };
    const updatedTags = [...tags, newTag];
    await this.saveTags(updatedTags);
    return newTag;
  }

  /**
   * Delete a tag by ID
   * Note: This only removes the tag from the tag list.
   * PhotoService.removeTagFromAllPhotos should be called separately to clean up photo references.
   */
  static async deleteTag(tagId: string): Promise<void> {
    const tags = await this.loadTags();
    const updatedTags = tags.filter((tag) => tag.id !== tagId);
    await this.saveTags(updatedTags);
  }

  /**
   * Rename a tag
   */
  static async renameTag(tagId: string, newName: string): Promise<void> {
    const tags = await this.loadTags();
    const tag = tags.find((t) => t.id === tagId);
    if (tag) {
      tag.name = newName;
      await this.saveTags(tags);
    }
  }

  /**
   * Update tag color
   */
  static async updateTagColor(tagId: string, color: string): Promise<void> {
    const tags = await this.loadTags();
    const tag = tags.find((t) => t.id === tagId);
    if (tag) {
      tag.color = color;
      await this.saveTags(tags);
    }
  }

  /**
   * Get a tag by ID
   */
  static async getTagById(tagId: string): Promise<Tag | undefined> {
    const tags = await this.loadTags();
    return tags.find((t) => t.id === tagId);
  }

  /**
   * Get multiple tags by IDs
   */
  static async getTagsByIds(tagIds: string[]): Promise<Tag[]> {
    const tags = await this.loadTags();
    return tags.filter((t) => tagIds.includes(t.id));
  }
}

export default TagService;
