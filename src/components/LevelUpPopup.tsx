// src/components/LevelUpPopup.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

type Props = {
  visible: boolean;
  level: number;
};

export default function LevelUpPopup({ visible, level }: Props) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      // Scale + fade in + slide up
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Hold for 1.5s, then fade out
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: -30,
              duration: 500,
              useNativeDriver: true,
            }),
          ]).start();
        }, 1500);
      });
    } else {
      // Reset
      scale.setValue(0);
      opacity.setValue(0);
      translateY.setValue(20);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale }, { translateY }],
          opacity,
        },
      ]}
    >
      <Text style={styles.levelUpText}>🎉 LEVEL UP! 🎉</Text>
      <Text style={styles.levelNumber}>Level {level}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 140,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 16,
    shadowColor: '#40b8a5',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#40b8a5',
    zIndex: 999,
  },
  levelUpText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#40b8a5',
    textAlign: 'center',
    letterSpacing: 1,
  },
  levelNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    marginTop: 4,
  },
});