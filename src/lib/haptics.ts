// Light haptics for tab switches, reminders and subscribing.
// Android uses performAndroidHapticsAsync (no VIBRATE permission needed); web falls back to the Vibration API.
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const run = (android: Haptics.AndroidHaptics, other: () => Promise<void>) => {
  const p = Platform.OS === 'android' ? Haptics.performAndroidHapticsAsync(android) : other();
  p.catch(() => {});
};

export const hapticSelection = () => run(Haptics.AndroidHaptics.Segment_Tick, () => Haptics.selectionAsync());
export const hapticLight = () => run(Haptics.AndroidHaptics.Confirm, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
export const hapticSuccess = () => run(Haptics.AndroidHaptics.Confirm, () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
