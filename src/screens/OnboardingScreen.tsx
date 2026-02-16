// src/screens/OnboardingScreen.tsx
import MaskedView from '@react-native-masked-view/masked-view';
import { ResizeMode, Video } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import avatars
import AvatarCool from '../../assets/avatars/avatar_cool.svg';
import AvatarHappy from '../../assets/avatars/avatar_happy.svg';
import AvatarNormal from '../../assets/avatars/avatar_normal.svg';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    title: 'Introducing Streaky ✨',
    description: 'Your personal habit-building companion powered by the magic of consistency',
    type: 'star' as const,
    gradient: ['#221944', '#613851', '#d49a51'] as const,
  },
  {
    id: 2,
    title: 'Complete Daily Quests',
    description: 'Add quests in Health, Study, or Work categories. Complete them to earn 50 XP each!',
    Avatar: AvatarCool,
    gradient: ['#FF6B9D', '#FFA06B'] as const,
  },
  {
    id: 3,
    title: 'Level Up & Earn Medals',
    description: 'Every 500 XP you gain a level. Unlock special medals by completing challenges!',
    Avatar: AvatarNormal,
    gradient: ['#667eea', '#764ba2'] as const,
  },
  {
    id: 4,
    title: 'Maintain Your Streak 🔥',
    description: 'Complete at least one quest daily to keep your streak alive. The longer, the better!',
    Avatar: AvatarHappy,
    gradient: ['#f093fb', '#f5576c'] as const,
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const introTextOpacity = useRef(new Animated.Value(0)).current;
  const introTextY = useRef(new Animated.Value(30)).current;
  const videoScale = useRef(new Animated.Value(0.85)).current;
  const videoOpacity = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    // Entrance animation sequence
    Animated.sequence([
      // 1. Fade in screen
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      
      // 2. Video appears with scale + fade
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(videoScale, {
          toValue: 1.2, // Zoom in larger to hide edges
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(videoOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      
      // 3. Text swipes up
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(introTextY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(introTextOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Stop video when leaving first slide
      if (index !== 0 && videoRef.current) {
        videoRef.current.pauseAsync();
      }
      // Resume video when returning to first slide
      if (index === 0 && videoRef.current) {
        videoRef.current.playAsync();
      }
    }
  };

  const scrollToNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      scrollViewRef.current?.scrollTo({
        x: width * (currentIndex + 1),
        animated: true,
      });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleComplete();
  };

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onComplete();
    });
  };

  const currentSlide = SLIDES[currentIndex];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={currentSlide.gradient}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Skip Button */}
        {currentIndex < SLIDES.length - 1 && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}

        {/* Slides */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {SLIDES.map((slide) => (
            <View key={slide.id} style={styles.slide}>
              {slide.type === 'star' ? (
                // ⭐ Star Animation Slide
                <>
                  {currentIndex === 0 && (
                    <Animated.View
                      style={[
                        styles.starVideoContainer,
                        {
                          opacity: videoOpacity,
                          transform: [{ scale: videoScale }],
                        },
                      ]}
                    >
                      {/* Masked Video with Gradient Fade */}
                      <MaskedView
                        style={styles.maskedView}
                        maskElement={
                          <LinearGradient
                            colors={[
                              'transparent',
                              'rgba(255,255,255,0.3)',
                              'rgba(255,255,255,1)',
                              'rgba(255,255,255,1)',
                              'rgba(255,255,255,1)',
                              'rgba(255,255,255,0.3)',
                              'transparent',
                            ]}
                            locations={[0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]}
                            style={styles.maskGradient}
                          />
                        }
                      >
                        <Video
                          ref={videoRef}
                          source={require('../../assets/avatars/star_animate.mp4')}
                          style={styles.starVideo}
                          resizeMode={ResizeMode.COVER}
                          shouldPlay
                          isLooping
                          isMuted
                        />
                      </MaskedView>
                    </Animated.View>
                  )}

                  <Animated.View
                    style={[
                      styles.starTextContainer,
                      {
                        opacity: introTextOpacity,
                        transform: [{ translateY: introTextY }],
                      },
                    ]}
                  >
                    <Text style={styles.starTitle}>{slide.title}</Text>
                    <Text style={styles.starDescription}>{slide.description}</Text>
                  </Animated.View>
                </>
              ) : (
                // 👾 Regular Avatar Slides
                <>
                  <View style={styles.avatarContainer}>
                    {slide.Avatar && <slide.Avatar width={300} height={300} />}
                  </View>

                  <View style={styles.textContainer}>
                    <Text style={styles.title}>{slide.title}</Text>
                    <Text style={styles.description}>{slide.description}</Text>
                  </View>
                </>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Next/Get Started Button */}
        <TouchableOpacity
          style={styles.buttonWrapper}
          onPress={scrollToNext}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#fff', '#fff']}
            style={styles.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text
              style={[
                styles.buttonText,
                currentIndex === 0 && styles.buttonTextDark,
              ]}
            >
              {currentIndex === SLIDES.length - 1 ? "Let's Go! 🚀" : 'Next'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#221944',
  },
  safeArea: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
  },
  skipText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  // ⭐ Star Animation Styles
  starVideoContainer: {
    width: width,
    height: height * 0.55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  maskedView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  maskGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  starVideo: {
    width: '100%',
    height: '100%',
  },
  starTextContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  starTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  starDescription: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  // 👾 Regular Avatar Styles
  avatarContainer: {
    marginBottom: -20,
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.95,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#fff',
  },
  buttonWrapper: {
    marginHorizontal: 40,
    marginBottom: 40,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  button: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FF6B9D',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonTextDark: {
    color: '#221944',
  },
});