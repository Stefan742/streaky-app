// src/components/LostStreakPopup.tsx
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import AvatarSad from '../../assets/avatars/avatar_sad.svg';

const { width, height } = Dimensions.get('window');

interface LostStreakPopupProps {
  visible: boolean;
  lostStreak: number;
  onClose: () => void;
}

export default function LostStreakPopup({
  visible,
  lostStreak,
  onClose,
}: LostStreakPopupProps) {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const brokenFlameScale = useRef(new Animated.Value(0)).current;
  const brokenFlameDrop = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0)).current;
  const avatarShake = useRef(new Animated.Value(0)).current;
  const dayNumberY = useRef(new Animated.Value(50)).current;
  const dayNumberOpacity = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0)).current;

  // Sound player
  const player = useAudioPlayer(
    require('../../assets/sounds/lost.mp3')
  );

  useEffect(() => {
    if (visible) {
      // Haptic feedback - error pattern
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Play sad sound
      try {
        player.seekTo(0);
        player.play();
      } catch (error) {
        console.log('Audio playback error:', error);
      }

      // Reset animations
      fadeAnim.setValue(0);
      brokenFlameScale.setValue(0);
      brokenFlameDrop.setValue(0);
      avatarScale.setValue(0);
      avatarShake.setValue(0);
      dayNumberY.setValue(50);
      dayNumberOpacity.setValue(0);
      messageOpacity.setValue(0);
      buttonScale.setValue(0);

      // Start animation sequence
      Animated.sequence([
        // 1. Fade in background
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),

        // 2. Broken flame appears and drops
        Animated.parallel([
          Animated.spring(brokenFlameScale, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(brokenFlameDrop, {
            toValue: 50,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),

        // 3. Avatar appears with shake
        Animated.parallel([
          Animated.spring(avatarScale, {
            toValue: 1,
            friction: 7,
            tension: 50,
            useNativeDriver: true,
          }),
          // Sad shake animation
          Animated.sequence([
            Animated.timing(avatarShake, {
              toValue: -5,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(avatarShake, {
              toValue: 5,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(avatarShake, {
              toValue: -5,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(avatarShake, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            }),
          ]),
        ]),

        // 4. Lost streak number swipes up
        Animated.parallel([
          Animated.spring(dayNumberY, {
            toValue: 0,
            friction: 7,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(dayNumberOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),

        // 5. Message fades in
        Animated.timing(messageOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),

        // 6. Button pops in
        Animated.sequence([
          Animated.delay(200),
          Animated.spring(buttonScale, {
            toValue: 1,
            friction: 4,
            tension: 50,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View
        style={[
          styles.container,
          { opacity: fadeAnim },
        ]}
      >
        {/* Diagonal lines background pattern */}
        <View style={styles.backgroundPattern}>
          {[...Array(12)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.diagonalLine,
                {
                  left: i * 60 - 100,
                  transform: [{ rotate: '45deg' }],
                },
              ]}
            />
          ))}
        </View>

        {/* Broken Flame (falling effect) */}
        <Animated.View
          style={[
            styles.brokenFlameContainer,
            {
              transform: [
                { scale: brokenFlameScale },
                { translateY: brokenFlameDrop },
              ],
              opacity: brokenFlameScale,
            },
          ]}
        >
          <View style={styles.brokenFlameShape}>
            <Text style={styles.brokenFlameEmoji}>💔</Text>
          </View>
        </Animated.View>

        {/* Avatar Sad */}
        <Animated.View
          style={[
            styles.avatarContainer,
            {
              transform: [
                { scale: avatarScale },
                { translateX: avatarShake },
              ],
            },
          ]}
        >
          <AvatarSad width={250} height={250} />
        </Animated.View>

        {/* Lost Streak Number */}
        <Animated.View
          style={[
            styles.dayNumberContainer,
            {
              transform: [{ translateY: dayNumberY }],
              opacity: dayNumberOpacity,
            },
          ]}
        >
          <Text style={styles.lostLabel}>Lost</Text>
          <Text style={styles.dayNumber}>{lostStreak}</Text>
          <Text style={styles.streakText}>day streak</Text>
        </Animated.View>

        {/* Message */}
        <Animated.View
          style={[
            styles.messageContainer,
            { opacity: messageOpacity },
          ]}
        >
          <Text style={styles.messageSubtitle}>
            Every journey has setbacks. What matters is starting again. You've got this!
          </Text>
        </Animated.View>

        {/* Buttons */}
        <Animated.View
          style={[
            styles.buttonsContainer,
            { transform: [{ scale: buttonScale }] },
          ]}
        >
          <TouchableOpacity
            style={styles.restartButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.restartButtonText}>Start New Streak 🔥</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E6E8', // Light sad pink
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  diagonalLine: {
    position: 'absolute',
    width: 2,
    height: height * 1.5,
    backgroundColor: 'rgba(180, 180, 180, 0.08)',
  },
  brokenFlameContainer: {
    position: 'absolute',
    top: 100,
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brokenFlameShape: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  },
  brokenFlameEmoji: {
    left: 75,
    top: 30,
    fontSize: 50,
  },
  avatarContainer: {
    position: 'absolute',
    top: height * 0.22,
    zIndex: 10,
  },
  dayNumberContainer: {
    position: 'absolute',
    top: height * 0.50,
    alignItems: 'center',
  },
  lostLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  dayNumber: {
    fontSize: 100,
    fontWeight: '900',
    color: '#EF4444', // Red for lost
    lineHeight: 100,
  },
  streakText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 0,
  },
  messageContainer: {
    position: 'absolute',
    top: height * 0.70,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  messageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  messageSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: height * 0.08,
    width: width - 60,
  },
  restartButton: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 28,
    backgroundColor: '#EF4444', // Bold red
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  restartButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});