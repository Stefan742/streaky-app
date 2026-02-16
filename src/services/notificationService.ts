// src/services/notificationService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Notification identifiers
const NOTIFICATION_IDS = {
  MORNING_REMINDER: 'morning-reminder',
  AFTERNOON_REMINDER: 'afternoon-reminder',
  EVENING_REMINDER: 'evening-reminder',
  STREAK_WARNING: 'streak-warning',
};

// Storage keys
const STORAGE_KEYS = {
  LAST_STREAK_WARNING: 'last-streak-warning-date',
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
 * 🆕 Schedule multiple daily reminders throughout the day
 * Morning (9 AM), Afternoon (2 PM), Evening (7 PM)
 */
export async function scheduleDailyReminders(): Promise<void> {
  const enabled = await areNotificationsEnabled();
  if (!enabled) return;

  // Cancel existing reminders
  await cancelDailyReminders();

  const largeIcon = await getLargeIconUri();

  const reminders = [
    {
      id: NOTIFICATION_IDS.MORNING_REMINDER,
      hour: 9,
      minute: 0,
      title: "☀️ Good Morning!",
      body: "Start your day strong! Complete your morning quests.",
    },
    {
      id: NOTIFICATION_IDS.AFTERNOON_REMINDER,
      hour: 14,
      minute: 0,
      title: "🔥 Afternoon Check-In",
      body: "How's your day going? Don't forget to complete your quests!",
    },
    {
      id: NOTIFICATION_IDS.EVENING_REMINDER,
      hour: 19,
      minute: 0,
      title: "🌙 Evening Reminder",
      body: "Your streak is counting on you! Complete at least one quest today.",
    },
  ];

  for (const reminder of reminders) {
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: {
        title: reminder.title,
        body: reminder.body,
        data: { type: 'daily-reminder' },
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
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: reminder.hour,
        minute: reminder.minute,
        repeats: true,
      } as Notifications.DailyTriggerInput,
    });

    console.log(`Reminder scheduled for ${reminder.hour}:${reminder.minute.toString().padStart(2, '0')}`);
  }
}

/**
 * Cancel all daily reminders
 */
export async function cancelDailyReminders(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.MORNING_REMINDER);
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.AFTERNOON_REMINDER);
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.EVENING_REMINDER);
  console.log('Daily reminders cancelled');
}

/**
 * 🆕 SMART REMINDER: Проверува дали има завршени quests
 * Ако нема → испраќа reminder
 * Повикај ја секој час преку background task (опционо)
 */
export async function checkAndSendSmartReminder(
  todayCompletedCount: number
): Promise<void> {
  const enabled = await areNotificationsEnabled();
  if (!enabled) return;

  // Ако има завршени quests → не праќај reminder
  if (todayCompletedCount > 0) {
    console.log('User has completed quests today, no reminder needed');
    return;
  }

  const hour = new Date().getHours();

  // Праќај само во работно време (9 AM - 10 PM)
  if (hour < 10 || hour >= 22) {
    return;
  }

  const largeIcon = await getLargeIconUri();

  // Send immediate notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🔥 Keep Your Streak Alive!",
      body: "You haven't completed any quests today. Start now!",
      data: { type: 'smart-reminder' },
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

  console.log('Smart reminder sent');
}

/**
 * Send streak warning if user hasn't completed any quests today
 * Only sends once per day, in the evening
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

  // Only send in the evening (8 PM - 11 PM)
  const hour = currentHour ?? new Date().getHours();
  if (hour < 20 || hour >= 23) {
    console.log('Not the right time for streak warning');
    return;
  }

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
          color: '#FF3B30', // Црвена за warning
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
 */
export async function sendCelebrationNotification(
  title: string,
  message: string
): Promise<void> {
  const enabled = await areNotificationsEnabled();
  if (!enabled) return;

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
    await scheduleDailyReminders();
    console.log('Notifications enabled');
  }
}

/**
 * Initialize notifications on app startup
 */
export async function initializeNotifications(): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  
  if (hasPermission) {
    const enabled = await areNotificationsEnabled();
    
    if (enabled) {
      // Schedule daily reminders
      await scheduleDailyReminders();
      console.log('Notifications initialized');
    }
  }
}

/**
 * TEST FUNCTION: Send immediate test notification
 */
export async function sendTestNotification(): Promise<void> {
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

// 🆕 BACKWARD COMPATIBILITY
// Стари функции за да не се скрши постоечкиот код
export const scheduleDailyReminder = scheduleDailyReminders;
export const cancelDailyReminder = cancelDailyReminders;
export const getDailyReminderHour = async () => 9; // Deprecated
export const updateDailyReminderTime = async (hour: number) => {
  console.warn('updateDailyReminderTime is deprecated. Use scheduleDailyReminders instead.');
};