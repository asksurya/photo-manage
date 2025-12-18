import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, NasConfig } from '../types/photo';
import { AuthToken } from '../types/auth';

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
  static async saveAuthToken(token: AuthToken): Promise<void> {
    try {
      await AsyncStorage.setItem(this.AUTH_TOKEN_KEY, JSON.stringify(token));
    } catch {
      console.error('Error saving auth token');
      throw new Error('Failed to save authentication token');
    }
  }

  /**
   * Get authentication session (full token object)
   */
  static async getAuthSession(): Promise<AuthToken | null> {
    try {
      const tokenData = await AsyncStorage.getItem(this.AUTH_TOKEN_KEY);
      if (tokenData) {
        return JSON.parse(tokenData);
      }
      return null;
    } catch {
      console.error('Error getting auth session');
      return null;
    }
  }

  /**
   * Get authentication access token string
   */
  static async getAuthToken(): Promise<string | null> {
    try {
      const session = await this.getAuthSession();
      return session ? session.accessToken : null;
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
      const token = await this.getAuthSession();
      if (!token) return false;

      // Check if token is expired
      const expirationTime = token.issuedAt + (token.expiresIn * 1000);
      if (Date.now() >= expirationTime) {
        // Here we would typically try to refresh the token using refreshToken
        // For now, we consider it not authenticated if access token is expired
        return false;
      }

      const profile = await this.loadUserProfile();
      return !!profile;
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
   * Generate a secure-looking token (Simulation)
   */
  private static generateAuthToken(userId: string): AuthToken {
    const now = Date.now();
    // Simulate a JWT structure or just random strings
    // In a real app, this would come from the auth provider
    const randomString = (length: number) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    return {
      accessToken: `ey${randomString(20)}.${randomString(50)}.${randomString(40)}`, // Simulate JWT format
      refreshToken: randomString(64),
      expiresIn: 3600, // 1 hour
      issuedAt: now,
      tokenType: 'Bearer'
    };
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

    // Generate a structured auth token instead of a mock string
    const token = this.generateAuthToken(profile.id);
    await this.saveAuthToken(token);

    return profile;
  }
}

export default UserService;
