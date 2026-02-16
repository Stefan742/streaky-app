// src/services/hapticService.ts
import * as Haptics from 'expo-haptics';

/**
 * Haptic Feedback Service
 * Wrapper за haptic feedback низ app
 */

export const HapticFeedback = {
  /**
   * Light impact - За subtle interactions
   * Usage: Button taps, toggles
   */
  light: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /**
   * Medium impact - За important actions
   * Usage: Quest complete, navigation
   */
  medium: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /**
   * Heavy impact - За significant actions
   * Usage: Delete, important confirmations
   */
  heavy: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  /**
   * Success notification - За successful actions
   * Usage: Quest complete, level up, medal unlock
   */
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /**
   * Warning notification - За warnings
   * Usage: Streak about to break
   */
  warning: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  /**
   * Error notification - За errors
   * Usage: Failed actions
   */
  error: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  /**
   * Selection - За picker/selection changes
   * Usage: Swipe between slides, category selection
   */
  selection: () => {
    Haptics.selectionAsync();
  },
};