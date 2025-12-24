import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GalleryScreen from '../screens/GalleryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { View, Text, StyleSheet } from 'react-native';

type MainTabsParamList = {
  Gallery: undefined;
  Settings: undefined;
};

type SettingsStackParamList = {
  SettingsHome: undefined;
  NasConfig: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

// Placeholder for NasConfig screen - will be implemented in Task 7
const NasConfigPlaceholder = () => (
  <View style={styles.placeholder}>
    <Text>NAS Configuration Screen Placeholder</Text>
  </View>
);

interface SettingsStackNavigatorProps {
  onLogout: () => void;
}

const SettingsStackNavigator: React.FC<SettingsStackNavigatorProps> = ({ onLogout }) => {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen
        name="SettingsHome"
        options={{ headerShown: false }}
      >
        {(props) => <SettingsScreen {...props} onLogout={onLogout} />}
      </SettingsStack.Screen>
      <SettingsStack.Screen
        name="NasConfig"
        component={NasConfigPlaceholder}
        options={{ title: 'NAS Configuration' }}
      />
    </SettingsStack.Navigator>
  );
};

interface MainTabsProps {
  onLogout: () => void;
}

const MainTabs: React.FC<MainTabsProps> = ({ onLogout }) => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tab.Screen
        name="Gallery"
        component={GalleryScreen}
        options={{
          tabBarLabel: 'Gallery',
        }}
      />
      <Tab.Screen
        name="Settings"
        options={{
          tabBarLabel: 'Settings',
        }}
      >
        {() => <SettingsStackNavigator onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
});

export default MainTabs;
export type { MainTabsParamList, SettingsStackParamList };
