import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { UserProfile, NasConfig } from '../types/photo';

class UserService {
  private static USER_PROFILE_KEY = '@photo_manage_user_profile';
  private static SESSION_KEY = '@photo_manage_session';

  /**
   * Register a new user with local credentials
   */
  static async register(email: string, password: string, displayName: string): Promise<UserProfile> {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Simple hash for demo (in production, use bcrypt)
    const hashedPassword = await this.hashPassword(password);

    // Store credentials in keychain
    await Keychain.setGenericPassword(email, hashedPassword);

    // Create and save profile
    const profile: UserProfile = {
      id: `user-${Date.now()}`,
      email,
      displayName,
    };

    await this.saveUserProfile(profile);
    await this.createSession(profile.id);

    return profile;
  }

  /**
   * Login with email and password
   */
  static async login(email: string, password: string): Promise<UserProfile> {
    const credentials = await Keychain.getGenericPassword();

    if (!credentials || credentials.username !== email) {
      throw new Error('Invalid credentials');
    }

    const isValid = await this.verifyPassword(password, credentials.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const profile = await this.loadUserProfile();
    if (!profile) {
      throw new Error('Invalid credentials');
    }

    await this.createSession(profile.id);
    return profile;
  }

  /**
   * Logout - clear session but keep credentials for re-login
   */
  static async logout(): Promise<void> {
    await AsyncStorage.removeItem(this.SESSION_KEY);
  }

  /**
   * Check if user has active session
   */
  static async isLoggedIn(): Promise<boolean> {
    const session = await AsyncStorage.getItem(this.SESSION_KEY);
    return !!session;
  }

  /**
   * Check if user is authenticated (has session and profile)
   */
  static async isAuthenticated(): Promise<boolean> {
    const session = await AsyncStorage.getItem(this.SESSION_KEY);
    const profile = await this.loadUserProfile();
    return !!(session && profile);
  }

  /**
   * Delete account - remove all data including credentials
   */
  static async deleteAccount(): Promise<void> {
    await Keychain.resetGenericPassword();
    await AsyncStorage.multiRemove([this.USER_PROFILE_KEY, this.SESSION_KEY]);
  }

  /**
   * Save user profile to storage
   */
  static async saveUserProfile(profile: UserProfile): Promise<void> {
    await AsyncStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(profile));
  }

  /**
   * Load user profile from storage
   */
  static async loadUserProfile(): Promise<UserProfile | null> {
    try {
      const profileData = await AsyncStorage.getItem(this.USER_PROFILE_KEY);
      if (profileData) {
        return JSON.parse(profileData);
      }
    } catch {
      console.error('Error loading user profile');
    }
    return null;
  }

  /**
   * Update NAS configuration for user
   */
  static async updateNasConfig(nasConfig: NasConfig): Promise<void> {
    const profile = await this.loadUserProfile();
    if (profile) {
      profile.nasConfig = nasConfig;
      await this.saveUserProfile(profile);
    }
  }

  /**
   * Get current NAS configuration
   */
  static async getNasConfig(): Promise<NasConfig | null> {
    const profile = await this.loadUserProfile();
    return profile?.nasConfig || null;
  }

  // Private helpers
  private static async createSession(userId: string): Promise<void> {
    const session = { userId, createdAt: Date.now() };
    await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
  }

  private static async hashPassword(password: string): Promise<string> {
    // Simple hash for demo - in production use react-native-bcrypt
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `hash_${Math.abs(hash)}_${password.length}`;
  }

  private static async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const inputHash = await this.hashPassword(password);
    return inputHash === storedHash;
  }
}

export default UserService;
