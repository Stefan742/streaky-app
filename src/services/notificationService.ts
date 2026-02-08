// src/services/notificationService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior (FIXED: removed deprecated shouldShowAlert)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Notification identifiers (prevent duplicates)
const NOTIFICATION_IDS = {
  DAILY_REMINDER: 'daily-reminder',
  STREAK_WARNING: 'streak-warning',
};

// Storage keys
const STORAGE_KEYS = {
  LAST_DAILY_REMINDER: 'last-daily-reminder-date',
  LAST_STREAK_WARNING: 'last-streak-warning-date',
  DAILY_REMINDER_HOUR: 'daily-reminder-hour',
  NOTIFICATIONS_ENABLED: 'notifications-enabled',
};

/**
 * Get large icon URI for Android notifications
 */
async function getLargeIconUri(): Promise<string | null> {
  if (Platform.OS !== 'android') {
    return null;
  }

  try {
    const asset = Asset.fromModule(require('../../assets/icons/app_icon.png'));
    await asset.downloadAsync();
    return asset.localUri || asset.uri;
  } catch (error) {
    console.error('Failed to load large icon:', error);
    return null;
  }
}

/**
 * Request notification permissions
 * Call this on app startup or when user opts in
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted');
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, 'false');
    return false;
  }

  // Configure notification channel for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Streaky Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#40b8a5',
    });
  }

  await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, 'true');
  return true;
}

/**
 * Check if notifications are enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  const enabled = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
  return enabled === 'true';
}

/**
 * Get today's date string (YYYY-MM-DD)
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Schedule daily reminder notification
 * @param hour - Hour of day (0-23) to send notification
 * Default: 9 AM
 */
export async function scheduleDailyReminder(hour: number = 9): Promise<void> {
  const enabled = await areNotificationsEnabled();
  if (!enabled) return;

  // Cancel existing daily reminder
  await cancelDailyReminder();

  // Don't send more than once per day
  const lastSent = await AsyncStorage.getItem(STORAGE_KEYS.LAST_DAILY_REMINDER);
  const today = getTodayString();
  
  if (lastSent === today) {
    console.log('Daily reminder already sent today');
    return;
  }

  // Get large icon
  const largeIcon = await getLargeIconUri();

  // Schedule notification - Daily repeating at specific hour
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDS.DAILY_REMINDER,
    content: {
      title: "🔥 Keep Your Streak Alive!",
      body: "Time to complete today's quests and maintain your momentum.",
      data: { type: 'daily-reminder' },
      sound: true,
      ...(Platform.OS === 'android' && {
        android: {
          // FIXED: Use the notification icon from app.json
          // The small icon is set via app.json config
          ...(largeIcon && { largeIcon }), // Large icon is the colored app icon
          color: '#40b8a5',
          channelId: 'default',
        },
      }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
      repeats: true,
    } as Notifications.DailyTriggerInput,
  });

  // Save reminder hour for future reference
  await AsyncStorage.setItem(STORAGE_KEYS.DAILY_REMINDER_HOUR, hour.toString());
  
  console.log(`Daily reminder scheduled for ${hour}:00`);
}

/**
 * Cancel daily reminder notification
 */
export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.DAILY_REMINDER);
  console.log('Daily reminder cancelled');
}

/**
 * Send streak warning if user hasn't completed any quests today
 * Only sends once per day, in the evening
 * @param currentHour - Current hour (for testing, defaults to actual time)
 */
export async function checkAndSendStreakWarning(
  todayCompletedCount: number,
  currentHour?: number
): Promise<void> {
  const enabled = await areNotificationsEnabled();
  if (!enabled) return;

  // Only send if user hasn't completed any quests
  if (todayCompletedCount > 0) {
    console.log('User has completed quests today, no warning needed');
    return;
  }

  // Don't send more than once per day
  const lastSent = await AsyncStorage.getItem(STORAGE_KEYS.LAST_STREAK_WARNING);
  const today = getTodayString();
  
  if (lastSent === today) {
    console.log('Streak warning already sent today');
    return;
  }

  // Only send in the evening (6 PM - 11 PM)
  const hour = currentHour ?? new Date().getHours();
  if (hour < 18 || hour >= 23) {
    console.log('Not the right time for streak warning');
    return;
  }

  // Get large icon
  const largeIcon = await getLargeIconUri();

  // Send immediate notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "⚠️ Your Streak is at Risk!",
      body: "You haven't completed any quests today. Don't break your streak!",
      data: { type: 'streak-warning' },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      ...(Platform.OS === 'android' && {
        android: {
          ...(largeIcon && { largeIcon }),
          color: '#40b8a5',
          channelId: 'default',
        },
      }),
    },
    trigger: null, // Send immediately
  });

  // Mark as sent for today
  await AsyncStorage.setItem(STORAGE_KEYS.LAST_STREAK_WARNING, today);
  
  console.log('Streak warning sent');
}

/**
 * Send a celebration notification when user completes a milestone
 * This is immediate, not scheduled
 */
export async function sendCelebrationNotification(
  title: string,
  message: string
): Promise<void> {
  const enabled = await areNotificationsEnabled();
  if (!enabled) return;

  // Get large icon
  const largeIcon = await getLargeIconUri();

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: message,
      data: { type: 'celebration' },
      sound: true,
      ...(Platform.OS === 'android' && {
        android: {
          ...(largeIcon && { largeIcon }),
          color: '#40b8a5',
          channelId: 'default',
        },
      }),
    },
    trigger: null, // Send immediately
  });
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('All notifications cancelled');
}

/**
 * Get all scheduled notifications (for debugging)
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Update daily reminder time
 */
export async function updateDailyReminderTime(hour: number): Promise<void> {
  if (hour < 0 || hour > 23) {
    throw new Error('Hour must be between 0 and 23');
  }
  
  await scheduleDailyReminder(hour);
  console.log(`Daily reminder updated to ${hour}:00`);
}

/**
 * Get saved daily reminder hour
 */
export async function getDailyReminderHour(): Promise<number> {
  const saved = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_REMINDER_HOUR);
  return saved ? parseInt(saved, 10) : 9; // Default 9 AM
}

/**
 * Disable notifications completely
 */
export async function disableNotifications(): Promise<void> {
  await cancelAllNotifications();
  await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, 'false');
  console.log('Notifications disabled');
}

/**
 * Enable notifications
 */
export async function enableNotifications(): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  if (hasPermission) {
    const hour = await getDailyReminderHour();
    await scheduleDailyReminder(hour);
    console.log('Notifications enabled');
  }
}

/**
 * Initialize notifications on app startup
 * Call this in your root layout
 */
export async function initializeNotifications(): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  
  if (hasPermission) {
    const enabled = await areNotificationsEnabled();
    
    if (enabled) {
      // Reschedule daily reminder if needed
      const hour = await getDailyReminderHour();
      await scheduleDailyReminder(hour);
      console.log('Notifications initialized');
    }
  }
}

/**
 * TEST FUNCTION: Send immediate test notification
 * Use this to test notifications in development
 */
export async function sendTestNotification(): Promise<void> {
  // Get large icon
  const largeIcon = await getLargeIconUri();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🧪 Test Notification",
      body: "This is a test notification from Streaky!",
      data: { type: 'test' },
      sound: true,
      ...(Platform.OS === 'android' && {
        android: {
          ...(largeIcon && { largeIcon }),
          color: '#40b8a5',
          channelId: 'default',
        },
      }),
    },
    trigger: { 
      type: 'timeInterval',
      seconds: 2 
    } as Notifications.TimeIntervalTriggerInput,
  });
  console.log('Test notification scheduled in 2 seconds');
}

/**
 * TEST FUNCTION: Schedule a notification for 1 minute from now
 */
export async function scheduleTestReminderSoon(): Promise<void> {
  const now = new Date();
  const testTime = new Date(now.getTime() + 60 * 1000); // 1 minute from now
  
  // Get large icon
  const largeIcon = await getLargeIconUri();
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🔥 Keep Your Streak Alive!",
      body: "Time to complete today's quests and maintain your momentum.",
      data: { type: 'daily-reminder-test' },
      sound: true,
      ...(Platform.OS === 'android' && {
        android: {
          ...(largeIcon && { largeIcon }),
          color: '#40b8a5',
          channelId: 'default',
        },
      }),
    },
    trigger: { 
      seconds: 60 
    } as Notifications.TimeIntervalTriggerInput,
  });
  
  console.log(`Test reminder scheduled for ${testTime.toLocaleTimeString()}`);
}