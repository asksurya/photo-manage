import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import UserService from '../services/UserService';
import NasSyncService from '../services/NasSyncService';
import { NasConfig } from '../types/photo';

interface NasConfigScreenProps {
  navigation: any;
}

const NasConfigScreen: React.FC<NasConfigScreenProps> = ({ navigation }) => {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('5005');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remotePath, setRemotePath] = useState('/photos');
  const [useHttps, setUseHttps] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadExistingConfig();
  }, []);

  const loadExistingConfig = async () => {
    try {
      const config = await UserService.getNasConfig();
      if (config) {
        setHost(config.host || '');
        setPort(config.port?.toString() || '5005');
        setUsername(config.username || '');
        setPassword(config.password || '');
        setRemotePath(config.remotePath || '/photos');
        setUseHttps(config.useHttps ?? true);
      }
    } catch (error) {
      console.error('Error loading NAS config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!host.trim()) {
      Alert.alert('Validation Error', 'Host is required');
      return false;
    }
    if (!username.trim()) {
      Alert.alert('Validation Error', 'Username is required');
      return false;
    }
    if (!password.trim()) {
      Alert.alert('Validation Error', 'Password is required');
      return false;
    }
    return true;
  };

  const buildConfig = (): NasConfig => {
    return {
      host: host.trim(),
      port: parseInt(port, 10) || 5005,
      username: username.trim(),
      password: password,
      remotePath: remotePath.trim() || '/photos',
      useHttps,
    };
  };

  const handleTestConnection = async () => {
    if (!validateForm()) {
      return;
    }

    setIsTesting(true);
    try {
      const config = buildConfig();
      const success = await NasSyncService.testConnection(config);
      if (success) {
        Alert.alert('Success', 'Connection test successful!');
      } else {
        Alert.alert('Connection Failed', 'Could not connect to NAS. Please check your settings.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection test failed';
      Alert.alert('Connection Error', message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const config = buildConfig();
      await UserService.updateNasConfig(config);
      Alert.alert('Saved', 'NAS configuration saved successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save configuration';
      Alert.alert('Error', message);
    } finally {
      setIsSaving(false);
    }
  };

  const isFormDisabled = isTesting || isSaving;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Host</Text>
            <TextInput
              style={styles.input}
              value={host}
              onChangeText={setHost}
              placeholder="192.168.1.100 or nas.local"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isFormDisabled}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Port</Text>
            <TextInput
              style={styles.input}
              value={port}
              onChangeText={setPort}
              placeholder="5005"
              placeholderTextColor="#999"
              keyboardType="numeric"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isFormDisabled}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="admin"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isFormDisabled}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
              editable={!isFormDisabled}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Remote Path</Text>
            <TextInput
              style={styles.input}
              value={remotePath}
              onChangeText={setRemotePath}
              placeholder="/photos"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isFormDisabled}
            />
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.label}>Use HTTPS</Text>
            <Switch
              value={useHttps}
              onValueChange={setUseHttps}
              disabled={isFormDisabled}
              trackColor={{ false: '#E0E0E0', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity
            style={[styles.testButton, isTesting && styles.buttonDisabled]}
            onPress={handleTestConnection}
            disabled={isFormDisabled}
          >
            {isTesting ? (
              <ActivityIndicator color="#007AFF" />
            ) : (
              <Text style={styles.testButtonText}>Test Connection</Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isFormDisabled}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Configuration</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  testButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  buttonDisabled: {
    borderColor: '#A0C9FF',
  },
  testButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#A0C9FF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NasConfigScreen;
