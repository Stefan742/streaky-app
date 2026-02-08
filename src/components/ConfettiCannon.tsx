// src/components/ConfettiCannon.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');

const CONFETTI_COUNT = 50;
const COLORS = ['#40b8a5', '#6ff0d1', '#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181'];

interface Confetti {
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  scale: Animated.Value;
  color: string;
  targetX: number; // target x позиција за анимација
}

const ConfettiCannon = () => {
  const confettiPieces = useRef<Confetti[]>([]);

  // Initialize confetti pieces
  if (confettiPieces.current.length === 0) {
    confettiPieces.current = Array.from({ length: CONFETTI_COUNT }, () => {
      const startX = Math.random() * width;
      return {
        x: new Animated.Value(startX),
        y: new Animated.Value(-50),
        rotate: new Animated.Value(0),
        scale: new Animated.Value(0),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        targetX: startX + (Math.random() - 0.5) * 100, // target x за drift
      };
    });
  }

  useEffect(() => {
    const animations = confettiPieces.current.map((piece) => {
      const randomDelay = Math.random() * 200;
      const randomDuration = 2000 + Math.random() * 1000;

      return Animated.parallel([
        // Scale in
        Animated.timing(piece.scale, {
          toValue: 1,
          duration: 300,
          delay: randomDelay,
          useNativeDriver: true,
        }),
        // Fall down
        Animated.timing(piece.y, {
          toValue: height + 100,
          duration: randomDuration,
          delay: randomDelay,
          useNativeDriver: true,
        }),
        // Drift sideways
        Animated.timing(piece.x, {
          toValue: piece.targetX,
          duration: randomDuration,
          delay: randomDelay,
          useNativeDriver: true,
        }),
        // Rotate
        Animated.timing(piece.rotate, {
          toValue: Math.random() * 720,
          duration: randomDuration,
          delay: randomDelay,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start();
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.current.map((piece, index) => {
        const rotation = piece.rotate.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.confetti,
              {
                backgroundColor: piece.color,
                transform: [
                  { translateX: piece.x },
                  { translateY: piece.y },
                  { rotate: rotation },
                  { scale: piece.scale },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});

export default ConfettiCannon;
