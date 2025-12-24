import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import GalleryScreen from '../screens/GalleryScreen';
import { View, Text, StyleSheet } from 'react-native';

type MainTabsParamList = {
  Gallery: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

// Placeholder - will be replaced in Task 6
const SettingsPlaceholder = () => (
  <View style={styles.container}>
    <Text>Settings Screen Placeholder</Text>
  </View>
);

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
        component={SettingsPlaceholder}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default MainTabs;
export type { MainTabsParamList };
