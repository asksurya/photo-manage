import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import UserService from '../services/UserService';

const AppNavigator: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const authenticated = await UserService.isAuthenticated();
    setIsLoggedIn(authenticated);
  };

  if (isLoggedIn === null) {
    return null; // Loading state
  }

  return (
    <NavigationContainer>
      {isLoggedIn ? (
        <MainTabs onLogout={() => setIsLoggedIn(false)} />
      ) : (
        <AuthStack onLogin={() => setIsLoggedIn(true)} />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
