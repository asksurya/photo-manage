import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NasConfig, UserProfile } from '../types/photo';
import NasSyncService from '../services/NasSyncService';
import PhotoService from '../services/PhotoService';

const SETTINGS_KEY = '@photo_manage_user_profile';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [syncFavoritesOnly, setSyncFavoritesOnly] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storedProfile = await AsyncStorage.getItem(SETTINGS_KEY);
      if (storedProfile) {
        const profile: UserProfile = JSON.parse(storedProfile);
        setUserProfile(profile);
        if (profile.nasConfig) {
          setSyncFavoritesOnly(!!profile.nasConfig.syncFavoritesOnly);
        }
      }
    } catch (error) {
      console.error('Failed to load settings', error);
    }
  };

  const handleSyncNow = async () => {
    if (!userProfile || !userProfile.nasConfig) {
      Alert.alert('Configuration Missing', 'Please configure NAS settings first.');
      return;
    }

    setIsSyncing(true);
    try {
      const photos = await PhotoService.loadPhotos();
      const result = await NasSyncService.syncToNas(photos, userProfile.nasConfig);

      Alert.alert(
        'Sync Complete',
        `Successfully synced: ${result.successful}\nFailed: ${result.failed}`
      );

      await NasSyncService.setLastSyncTime(Date.now());
    } catch (error) {
      console.error('Sync failed:', error);
      Alert.alert('Sync Error', 'An error occurred during synchronization.');
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleSyncFavorites = async (value: boolean) => {
    setSyncFavoritesOnly(value);
    if (userProfile && userProfile.nasConfig) {
      const updatedProfile: UserProfile = {
        ...userProfile,
        nasConfig: {
          ...userProfile.nasConfig,
          syncFavoritesOnly: value,
        },
      };

      try {
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedProfile));
        setUserProfile(updatedProfile);
      } catch (error) {
        console.error('Failed to save settings', error);
        Alert.alert('Error', 'Failed to save settings');
      }
    } else {
        Alert.alert('Configuration Missing', 'Please set up NAS configuration first (Login/Register flow pending)');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Synchronization</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Sync Favorites Only</Text>
          <Switch
            value={syncFavoritesOnly}
            onValueChange={toggleSyncFavorites}
            trackColor={{ false: "#767577", true: "#4A90E2" }}
            thumbColor={syncFavoritesOnly ? "#f4f3f4" : "#f4f3f4"}
          />
        </View>
        <Text style={styles.helperText}>
          If enabled, only photos marked as favorites will be uploaded to your NAS.
        </Text>

        <View style={styles.syncButtonContainer}>
          {isSyncing ? (
            <ActivityIndicator color="#4A90E2" />
          ) : (
            <Button title="Sync Now" onPress={handleSyncNow} />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    fontSize: 16,
    color: '#4A90E2',
    marginRight: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E9ECEF',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C757D',
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  helperText: {
    fontSize: 13,
    color: '#ADB5BD',
    marginTop: 4,
  },
  syncButtonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
});

export default SettingsScreen;
