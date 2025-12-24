import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import UserService from '../services/UserService';
import NasSyncService from '../services/NasSyncService';
import PhotoService from '../services/PhotoService';
import { UserProfile, Photo } from '../types/photo';

interface SettingsScreenProps {
  onLogout: () => void;
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onLogout, navigation }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [userProfile, loadedPhotos, syncTime] = await Promise.all([
        UserService.loadUserProfile(),
        PhotoService.loadPhotos(),
        NasSyncService.getLastSyncTime(),
      ]);
      setProfile(userProfile);
      setPhotos(loadedPhotos);
      setLastSyncTime(syncTime);
    } catch (error) {
      console.error('Error loading settings data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await UserService.logout();
              onLogout();
            } catch {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleConfigure = () => {
    navigation.navigate('NasConfig');
  };

  const handleSyncNow = async () => {
    if (!profile?.nasConfig) {
      Alert.alert('Not Configured', 'Please configure NAS settings first.');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await NasSyncService.syncToNas(photos, profile.nasConfig);
      await NasSyncService.setLastSyncTime(new Date());
      setLastSyncTime(new Date());
      Alert.alert(
        'Sync Complete',
        `Successfully synced ${result.successful} photos.\n${result.failed > 0 ? `Failed: ${result.failed}` : ''}`
      );
    } catch {
      Alert.alert('Sync Failed', 'Failed to sync photos. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSyncTime = (date: Date | null): string => {
    if (!date) {
      return 'Never';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }
  };

  const getNasStatus = (): string => {
    if (!profile?.nasConfig) {
      return 'Not configured';
    }
    return `Connected to ${profile.nasConfig.host}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Settings</Text>

        {/* Account Section */}
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{profile?.email || 'Not available'}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <Text style={styles.label}>Display Name</Text>
            <Text style={styles.value}>{profile?.displayName || 'Not available'}</Text>
          </View>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.row} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* NAS Sync Section */}
        <Text style={styles.sectionTitle}>NAS SYNC</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.value, profile?.nasConfig && styles.connectedText]}>
              {getNasStatus()}
            </Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <Text style={styles.label}>Last Sync</Text>
            <Text style={styles.value}>{formatLastSyncTime(lastSyncTime)}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.configureButton]}
              onPress={handleConfigure}
            >
              <Text style={styles.actionButtonText}>Configure</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.syncButton,
                (!profile?.nasConfig || isSyncing) && styles.buttonDisabled,
              ]}
              onPress={handleSyncNow}
              disabled={!profile?.nasConfig || isSyncing}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.syncButtonText}>Sync Now</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Storage Section */}
        <Text style={styles.sectionTitle}>STORAGE</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Local Photos</Text>
            <Text style={styles.value}>{photos.length} photo{photos.length !== 1 ? 's' : ''}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  header: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    marginLeft: 16,
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginLeft: 16,
  },
  label: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  value: {
    fontSize: 16,
    color: '#666666',
  },
  connectedText: {
    color: '#34C759',
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  configureButton: {
    backgroundColor: '#F0F0F0',
  },
  syncButton: {
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    backgroundColor: '#A0C9FF',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  syncButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default SettingsScreen;
