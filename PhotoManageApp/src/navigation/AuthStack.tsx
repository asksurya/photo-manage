import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

interface AuthStackProps {
  onLogin: () => void;
}

const AuthStack: React.FC<AuthStackProps> = ({ onLogin }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login">
        {(props) => <LoginScreen {...props} onLogin={onLogin} />}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {(props) => <RegisterScreen {...props} onLogin={onLogin} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default AuthStack;
export type { AuthStackParamList };
