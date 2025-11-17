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
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
