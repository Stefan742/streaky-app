// src/components/ParticleBurst.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

type Props = {
  active: boolean;
};

// Single particle with random trajectory
const Particle = ({ delay, index }: { delay: number; index: number }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Random angle for burst effect
    const angle = (index * 360) / 8; // 8 particles in circle
    const distance = 60 + Math.random() * 40;
    const radians = (angle * Math.PI) / 180;

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        // Scale in
        Animated.spring(scale, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
        // Fly outward in burst pattern
        Animated.timing(translateX, {
          toValue: Math.cos(radians) * distance,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: Math.sin(radians) * distance - 60, // also go up
          duration: 800,
          useNativeDriver: true,
        }),
        // Fade out
        Animated.timing(opacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          transform: [{ translateX }, { translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <View style={styles.star}>
        <View style={[styles.starBar, styles.starBar1]} />
        <View style={[styles.starBar, styles.starBar2]} />
      </View>
    </Animated.View>
  );
};

export default function ParticleBurst({ active }: Props) {
  if (!active) return null;

  return (
    <View style={styles.container}>
      {[...Array(8)].map((_, i) => (
        <Particle key={i} index={i} delay={i * 50} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 65,
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 998,
  },
  particle: {
    position: 'absolute',
  },
  star: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starBar: {
    position: 'absolute',
    width: 3,
    height: 16,
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  starBar1: {
    transform: [{ rotate: '0deg' }],
  },
  starBar2: {
    transform: [{ rotate: '90deg' }],
  },
});