// Reminder demo: setting a reminder schedules a local "Live now" notification 10 seconds later.
// Tapping it opens wsoptvdemo://live/{id}. Permission is asked the first time a reminder is set.
// Local notifications are native only; on web the app shows an in-app "Live now" toast instead.
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

export const REMINDER_DELAY_SECONDS = 10;
const CHANNEL_ID = 'live-reminders';

export const notificationsSupported = Platform.OS !== 'web';

if (notificationsSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

let channelReady = false;
async function ensureChannel() {
  if (channelReady || Platform.OS !== 'android') return;
  // Android 13+ only shows the permission prompt once a channel exists.
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Live reminders',
    importance: AndroidImportance.HIGH,
  });
  channelReady = true;
}

/** Asks for permission if needed. Returns whether notifications can be shown. */
export async function ensurePermission(): Promise<boolean> {
  if (!notificationsSupported) return false;
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

/** Schedules the "Live now" notification. `path` is the in-app route to open, e.g. `/live/sc-09`. */
export async function scheduleLiveNow(title: string, path: string): Promise<boolean> {
  if (!(await ensurePermission())) return false;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Live now',
      body: title,
      data: { url: path },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: REMINDER_DELAY_SECONDS,
      channelId: CHANNEL_ID,
    },
  });
  return true;
}
