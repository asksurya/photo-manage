/**
 * Photo Manage App
 * A mobile app for managing RAW and JPEG photo pairs
 *
 * @format
 */

import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { navigationRef } from './src/services/NavigationService';
import { RootStackParamList } from './src/types/navigation';
import GalleryScreen from './src/screens/GalleryScreen';
import AlbumsScreen from './src/screens/AlbumsScreen';
import AlbumPhotosScreen from './src/screens/AlbumPhotosScreen';
import SearchScreen from './src/screens/SearchScreen';
import MapScreen from './src/screens/MapScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator<RootStackParamList>();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator initialRouteName="Gallery">
          <Stack.Screen name="Gallery" component={GalleryScreen} />
          <Stack.Screen name="Albums" component={AlbumsScreen} />
          <Stack.Screen name="AlbumPhotos" component={AlbumPhotosScreen} />
          <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Map" component={MapScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
