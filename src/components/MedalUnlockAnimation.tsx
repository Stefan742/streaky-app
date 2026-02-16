// src/components/MedalUnlockAnimation.tsx
import { useAudioPlayer } from 'expo-audio';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Modal, StyleSheet, Text, View } from 'react-native';

import { Medal } from '../store/MedalStore';

// Import all medal SVGs
import Medal100Task from '../../assets/medals/medal_100taskFinished.svg';
import Medal30Day from '../../assets/medals/medal_30dayStreak.svg';
import Medal7Day from '../../assets/medals/medal_7dayStreak.svg';
import MedalAllFeatures from '../../assets/medals/medal_allFeatures.svg';
import MedalComeback from '../../assets/medals/medal_comeback.svg';
import MedalConsistents from '../../assets/medals/medal_consistent.svg';
import MedalFirstTask from '../../assets/medals/medal_firstTask.svg';
import MedalRoyal from '../../assets/medals/medal_royal.svg';
import MedalSuperHappy from '../../assets/medals/medal_superHappy.svg';

const { width, height } = Dimensions.get('window');

type Props = {
  visible: boolean;
  medal: Medal;
  onClose: () => void;
};

const medalIcons: { [key: string]: any } = {
  '1': MedalFirstTask,
  '2': Medal7Day,
  '3': MedalAllFeatures,
  '4': MedalComeback,
  '5': MedalConsistents,
  '6': Medal30Day,
  '7': Medal100Task,
  '8': MedalRoyal,
  '9': MedalSuperHappy,
};

export default function MedalUnlockAnimation({ visible, medal, onClose }: Props) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const textSlide = useRef(new Animated.Value(50)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  const player = useAudioPlayer(require('../../assets/sounds/medal_achieved.mp3'));
  const pulseLoopRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      console.log('🎖️ Medal animation starting for:', medal.title);

      // Play sound
      try {
        player.seekTo(0);
        player.play();
      } catch (error) {
        console.log('Medal sound playback skipped:', error);
      }

      // Reset animations
      scale.setValue(0);
      opacity.setValue(0);
      pulseAnim.setValue(1);
      textSlide.setValue(50);
      textOpacity.setValue(0);

      // 1. Fade in overlay
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // 2. Scale in medal
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }).start(() => {
        // 3. Start continuous pulse after medal appears
        pulseLoopRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        );
        pulseLoopRef.current.start();
      });

      // 4. Slide up text
      Animated.parallel([
        Animated.timing(textSlide, {
          toValue: 0,
          duration: 600,
          delay: 400,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          delay: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // 5. Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);

      return () => {
        clearTimeout(timer);
        if (pulseLoopRef.current) {
          pulseLoopRef.current.stop();
        }
      };
    }
  }, [visible, medal]);

  const handleClose = () => {
    console.log('🎖️ Closing medal animation for:', medal.title);

    // Stop pulse animation
    if (pulseLoopRef.current) {
      pulseLoopRef.current.stop();
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  const MedalIcon = medalIcons[medal.id] || MedalFirstTask;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity }]}>
        <View style={styles.content}>
          {/* Medal with pulse */}
          <Animated.View
            style={[
              styles.medalContainer,
              {
                transform: [{ scale: Animated.multiply(scale, pulseAnim) }],
              },
            ]}
          >
            <MedalIcon width={280} height={280} />
          </Animated.View>

          {/* Text */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                transform: [{ translateY: textSlide }],
                opacity: textOpacity,
              },
            ]}
          >
            <Text style={styles.unlockText}>🎉 MEDAL UNLOCKED! 🎉</Text>
            <Text style={styles.medalTitle}>{medal.title}</Text>
            <Text style={styles.medalDescription}>{medal.description}</Text>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  medalContainer: {
    marginBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  unlockText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1.5,
  },
  medalTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 8,
  },
  medalDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 22,
  },
});