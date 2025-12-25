import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import OnboardingScreen from '../screens/OnboardingScreen';
import UserService from '../services/UserService';

const AppNavigator: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
    checkOnboarding();
  }, []);

  const checkAuth = async () => {
    try {
      const authenticated = await UserService.isAuthenticated();
      setIsLoggedIn(authenticated);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsLoggedIn(false);
    }
  };

  const checkOnboarding = async () => {
    try {
      const seen = await UserService.hasSeenOnboarding();
      setHasSeenOnboarding(seen);
    } catch (error) {
      console.error('Onboarding check failed:', error);
      setHasSeenOnboarding(true); // Default to true on error
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await UserService.setOnboardingSeen();
      setHasSeenOnboarding(true);
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
      setHasSeenOnboarding(true); // Continue anyway
    }
  };

  if (isLoggedIn === null || hasSeenOnboarding === null) {
    return null; // Loading state
  }

  return (
    <NavigationContainer>
      {!hasSeenOnboarding ? (
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      ) : isLoggedIn ? (
        <MainTabs onLogout={() => setIsLoggedIn(false)} />
      ) : (
        <AuthStack onLogin={() => setIsLoggedIn(true)} />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
