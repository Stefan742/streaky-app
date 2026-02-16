// src/components/StreakUpdatePopup.tsx
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AvatarCool from '../../assets/avatars/avatar_cool.svg';

const { width, height } = Dimensions.get('window');

interface StreakUpdatePopupProps {
  visible: boolean;
  streak: number;
  onClose: () => void;
}

export default function StreakUpdatePopup({
  visible,
  streak,
  onClose,
}: StreakUpdatePopupProps) {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flameScale = useRef(new Animated.Value(0)).current;
  const flameFlicker = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0)).current;
  const dayNumberY = useRef(new Animated.Value(50)).current;
  const dayNumberOpacity = useRef(new Animated.Value(0)).current;
  const calendarY = useRef(new Animated.Value(30)).current;
  const calendarOpacity = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0)).current;

  // Sound player
  const player = useAudioPlayer(
    require('../../assets/sounds/daily.mp3')
  );

  useEffect(() => {
    if (visible) {
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Play sound
      try {
        player.seekTo(0);
        player.play();
      } catch (error) {
        console.log('Audio playback error:', error);
      }

      // Reset animations
      fadeAnim.setValue(0);
      flameScale.setValue(0);
      flameFlicker.setValue(0);
      avatarScale.setValue(0);
      dayNumberY.setValue(50);
      dayNumberOpacity.setValue(0);
      calendarY.setValue(30);
      calendarOpacity.setValue(0);
      messageOpacity.setValue(0);
      buttonScale.setValue(0);

      // Start animation sequence
      Animated.sequence([
        // 1. Fade in background
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),

        // 2. Flame appears
        Animated.spring(flameScale, {
          toValue: 1,
          friction: 5,
          tension: 50,
          useNativeDriver: true,
        }),

        // 3. Avatar appears slightly after flame
        Animated.sequence([
          Animated.delay(100),
          Animated.spring(avatarScale, {
            toValue: 1,
            friction: 6,
            tension: 50,
            useNativeDriver: true,
          }),
        ]),

        // 4. Day number swipes up
        Animated.parallel([
          Animated.spring(dayNumberY, {
            toValue: 0,
            friction: 7,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(dayNumberOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),

        // 5. Calendar and message fade in
        Animated.parallel([
          Animated.parallel([
            Animated.spring(calendarY, {
              toValue: 0,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }),
            Animated.timing(calendarOpacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(messageOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),

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

      // Continuous flame flicker
      Animated.loop(
        Animated.sequence([
          Animated.timing(flameFlicker, {
            toValue: 1,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(flameFlicker, {
            toValue: 0,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Генерирање на пораката
      const messages = [
        `🔥 ${streak} days and counting! I'm on fire with my daily journaling streak! 💪`,
        `Just hit a ${streak}-day streak! 🔥 Building consistency one day at a time!`,
        `${streak} consecutive days of journaling! 📝🔥 Who's going to join me?`,
        `Keeping the flame alive! 🔥 ${streak} days of daily journaling!`,
        `${streak}-day streak unlocked! 🎯 Consistency is key!`,
      ];

      // Случајна порака за да биде поинтересно секој пат
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];

      const result = await Share.share(
        {
          message: randomMessage,
          // За iOS можеш да додадеш и title
          ...(Platform.OS === 'ios' && { 
            title: `${streak} Day Streak! 🔥` 
          }),
        },
        {
          // Share dialog options
          dialogTitle: 'Share your streak!',
          ...(Platform.OS === 'android' && {
            subject: `${streak} Day Streak!`,
          }),
        }
      );

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Споделено преку одредена апликација (iOS)
          console.log('Shared via:', result.activityType);
        } else {
          // Споделено (Android)
          console.log('Streak shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        // Корисникот го откажа share-от
        console.log('Share dismissed');
      }
    } catch (error) {
      Alert.alert(
        'Oops!',
        'Something went wrong while trying to share. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
      console.error('Share error:', error);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Flame flicker interpolation
  const flameFlickerScale = flameFlicker.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const flameFlickerOpacity = flameFlicker.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

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

        {/* Flame behind avatar */}
        <Animated.View
          style={[
            styles.flameContainer,
            {
              transform: [
                { scale: Animated.multiply(flameScale, flameFlickerScale) },
              ],
              opacity: flameFlickerOpacity,
            },
          ]}
        >
          <View style={styles.flameShape}>
            <View style={styles.flameInner} />
          </View>
        </Animated.View>

        {/* Avatar Cool */}
        <Animated.View
          style={[
            styles.avatarContainer,
            {
              transform: [{ scale: avatarScale }],
            },
          ]}
        >
          <AvatarCool width={300} height={300} />
        </Animated.View>

        {/* Day Number */}
        <Animated.View
          style={[
            styles.dayNumberContainer,
            {
              transform: [{ translateY: dayNumberY }],
              opacity: dayNumberOpacity,
            },
          ]}
        >
          <Text style={styles.dayNumber}>{streak}</Text>
        </Animated.View>

        {/* "day streak!" text */}
        <Animated.View
          style={[
            styles.streakTextContainer,
            {
              transform: [{ translateY: dayNumberY }],
              opacity: dayNumberOpacity,
            },
          ]}
        >
          <Text style={styles.streakText}>day streak!</Text>
        </Animated.View>

        {/* Calendar */}
        <Animated.View
          style={[
            styles.calendarContainer,
            {
              transform: [{ translateY: calendarY }],
              opacity: calendarOpacity,
            },
          ]}
        >
        </Animated.View>

        {/* Message */}
        <Animated.View
          style={[
            styles.messageContainer,
            { opacity: messageOpacity },
          ]}
        >
          <Text style={styles.messageText}>
            You are on fire! Keep logging everyday to make it grow.
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
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Text style={styles.shareIcon}>↗</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.commitButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.commitButtonText}>I'm committed</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9ED',
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
    backgroundColor: 'rgba(255, 200, 100, 0.15)',
  },
  flameContainer: {
    position: 'absolute',
    top: height * 0.15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameShape: {
    width: 200,
    height: 250,
    backgroundColor: '#FFD966',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    borderBottomLeftRadius: 120,
    borderBottomRightRadius: 120,
    opacity: 0.8,
  },
  flameInner: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    width: 120,
    height: 150,
    backgroundColor: '#FFAA33',
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    opacity: 0.6,
  },
  avatarContainer: {
    position: 'absolute',
    top: height * 0.18,
    zIndex: 10,
  },
  dayNumberContainer: {
    position: 'absolute',
    top: height * 0.48,
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 120,
    fontWeight: '900',
    color: '#1A1A1A',
    lineHeight: 120,
  },
  streakTextContainer: {
    position: 'absolute',
    top: height * 0.58,
    alignItems: 'center',
  },
  streakText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  calendarContainer: {
    position: 'absolute',
    top: height * 0.67,
    width: width - 80,
  },
  calendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  calendarDay: {
    alignItems: 'center',
    gap: 8,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  calendarDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDotActive: {
    backgroundColor: '#FF9500',
    shadowColor: '#FF9500',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  messageContainer: {
    position: 'absolute',
    top: 600,
    paddingHorizontal: 40,
  },
  messageText: {
    fontSize: 19,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: height * 0.08,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  shareButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  shareIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  commitButton: {
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 28,
    backgroundColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  commitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});