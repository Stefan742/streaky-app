// src/navigation/AppNavigator.tsx
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useMedalStore } from '../store/MedalStore';

// Screens
import AchievementsScreen from '../screens/AchievementsScreen';
import HomeScreen from '../screens/HomeScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen_expo_router';

// SVG Icons
import MedalsIcon from '../../assets/icons/icon_medals.svg';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const unviewedCount = useMedalStore((state) => state.unviewedCount);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#fff',
            paddingTop: 15,
            elevation: 5,
            height: 90,
            paddingBottom: 10,
          },
          tabBarIcon: ({ focused, color }) => {
            if (route.name === 'Home') {
              return (
                <Ionicons
                  name={focused ? 'home' : 'home-outline'}
                  size={36}
                  color={color}
                />
              );
            } else if (route.name === 'Medals') {
              return (
                <View style={styles.medalIconWrapper}>
                  <MedalsIcon
                    width={80}
                    height={80}
                    fill={focused ? '#40b8a5' : '#9CA3AF'}
                  />
                  {/* Notification Badge */}
                  {unviewedCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {unviewedCount > 9 ? '9+' : unviewedCount}
                      </Text>
                    </View>
                  )}
                </View>
              );
            } else if (route.name === 'Leaderboard') {
              return (
                <Ionicons
                  name={focused ? 'trophy' : 'trophy-outline'}
                  size={34}
                  color={color}
                />
              );
            }
          },
          tabBarLabel: ({ focused, color }) => {
            let label = '';
            if (route.name === 'Home') label = 'Home';
            if (route.name === 'Medals') label = 'Medals';
            if (route.name === 'Leaderboard') label = 'Leaderboard';

            return (
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: focused ? '700' : '500',
                  color,
                  marginTop: 4,
                }}
              >
                {label}
              </Text>
            );
          },
          tabBarActiveTintColor: '#40b8a5',
          tabBarInactiveTintColor: '#9CA3AF',
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Medals" component={AchievementsScreen} />
        <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      </Tab.Navigator>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  medalIconWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
});