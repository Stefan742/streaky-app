// src/navigation/RootNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';

import MedalUnlockQueue from '../components/MedalUnlockQueue';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { useMedalStore } from '../store/MedalStore';
import AppNavigator from './AppNavigator';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const initializeMedals = useMedalStore((state) => state.initializeMedals);

  // 🔥 Initialize medals при app startup
  useEffect(() => {
    console.log('🚀 RootNavigator mounted - initializing medals');
    initializeMedals();
  }, [initializeMedals]);

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator>
          {/* Main App (always accessible) */}
          <Stack.Screen
            name="Main"
            component={AppNavigator}
            options={{ headerShown: false }}
          />

          {/* Auth screens (modal) */}
          <Stack.Group screenOptions={{ presentation: 'modal' }}>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                title: 'Login',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{
                title: 'Register',
                headerShown: false,
              }}
            />
          </Stack.Group>
        </Stack.Navigator>
      </NavigationContainer>

      {/* 🔥 Global medal unlock queue - shows medals one by one */}
      <MedalUnlockQueue />
    </>
  );
}