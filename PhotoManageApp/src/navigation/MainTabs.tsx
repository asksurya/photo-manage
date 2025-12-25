import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GalleryScreen from '../screens/GalleryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NasConfigScreen from '../screens/NasConfigScreen';
import TrashScreen from '../screens/TrashScreen';

type MainTabsParamList = {
  Gallery: undefined;
  Settings: undefined;
};

type SettingsStackParamList = {
  SettingsHome: undefined;
  NasConfig: undefined;
  Trash: undefined;
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
      <SettingsStack.Screen
        name="Trash"
        component={TrashScreen}
        options={{ headerShown: false }}
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

export default MainTabs;
export type { MainTabsParamList, SettingsStackParamList };
