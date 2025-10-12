import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, NasConfig } from '../types/photo';

class UserService {
  private static USER_PROFILE_KEY = '@photo_manage_user_profile';
  private static AUTH_TOKEN_KEY = '@photo_manage_auth_token';

  /**
   * Save user profile to storage
   */
  static async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(profile));
    } catch {
      console.error('Error saving user profile');
      throw new Error('Failed to save user profile');
    }
  }

  /**
   * Load user profile from storage
   */
  static async loadUserProfile(): Promise<UserProfile | null> {
    try {
      const profileData = await AsyncStorage.getItem(this.USER_PROFILE_KEY);
      if (profileData) {
        const profile: UserProfile = JSON.parse(profileData);
        return profile;
      }
    } catch {
      console.error('Error loading user profile');
    }
    return null;
  }

  /**
   * Save authentication token
   */
  static async saveAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.AUTH_TOKEN_KEY, token);
    } catch {
      console.error('Error saving auth token');
      throw new Error('Failed to save authentication token');
    }
  }

  /**
   * Get authentication token
   */
  static async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.AUTH_TOKEN_KEY);
    } catch {
      console.error('Error getting auth token');
      return null;
    }
  }

  /**
   * Clear authentication data
   */
  static async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.USER_PROFILE_KEY, this.AUTH_TOKEN_KEY]);
    } catch {
      console.error('Error during logout');
      throw new Error('Failed to logout');
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      const profile = await this.loadUserProfile();
      return !!(token && profile);
    } catch {
      return false;
    }
  }

  /**
   * Update NAS configuration for user
   */
  static async updateNasConfig(nasConfig: NasConfig): Promise<void> {
    try {
      const profile = await this.loadUserProfile();
      if (profile) {
        profile.nasConfig = nasConfig;
        await this.saveUserProfile(profile);
      } else {
        // Create new profile with NAS config (for now)
        const newProfile: UserProfile = {
          id: 'guest',
          email: 'guest@example.com',
          displayName: 'Guest User',
          nasConfig,
        };
        await this.saveUserProfile(newProfile);
      }
    } catch {
      console.error('Error updating NAS config');
      throw new Error('Failed to update NAS configuration');
    }
  }

  /**
   * Get current NAS configuration
   */
  static async getNasConfig(): Promise<NasConfig | null> {
    try {
      const profile = await this.loadUserProfile();
      return profile?.nasConfig || null;
    } catch {
      console.error('Error getting NAS config');
      return null;
    }
  }

  /**
   * Create basic profile (foundation for user creation)
   */
  static async createBasicProfile(email: string, displayName: string): Promise<UserProfile> {
    const profile: UserProfile = {
      id: `user-${Date.now()}`,
      email,
      displayName,
    };

    await this.saveUserProfile(profile);
    await this.saveAuthToken(`token-${profile.id}`); // Mock token for now

    return profile;
  }
}

export default UserService;
