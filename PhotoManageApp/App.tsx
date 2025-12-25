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
import AppNavigator from './src/navigation/AppNavigator';
import { SelectionProvider } from './src/contexts/SelectionContext';
import NetworkBanner from './src/components/NetworkBanner';

const App: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <SelectionProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <NetworkBanner />
        <AppNavigator />
      </SelectionProvider>
    </SafeAreaProvider>
  );
};

export default App;
