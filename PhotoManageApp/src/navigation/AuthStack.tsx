import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

// Placeholder screens - will be replaced in Task 4
const LoginPlaceholder = () => (
  <View style={styles.container}>
    <Text>Login Screen Placeholder</Text>
  </View>
);

const RegisterPlaceholder = () => (
  <View style={styles.container}>
    <Text>Register Screen Placeholder</Text>
  </View>
);

interface AuthStackProps {
  onLogin: () => void;
}

const AuthStack: React.FC<AuthStackProps> = ({ onLogin }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginPlaceholder} />
      <Stack.Screen name="Register" component={RegisterPlaceholder} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default AuthStack;
export type { AuthStackParamList };
