import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import GalleryScreen from '../screens/GalleryScreen';
import MapScreen from '../screens/MapScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NasConfigScreen from '../screens/NasConfigScreen';

type MainTabsParamList = {
  Gallery: undefined;
  Map: undefined;
  Settings: undefined;
};

type SettingsStackParamList = {
  SettingsHome: undefined;
  NasConfig: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();


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
        component={NasConfigScreen}
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
          tabBarIcon: ({ color, size }) => (
            <Icon name="images-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Icon name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Icon name="settings-outline" size={size} color={color} />
          ),
        }}
      >
        {() => <SettingsStackNavigator onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default MainTabs;
export type { MainTabsParamList, SettingsStackParamList };
