// Deep link wsoptvdemo://live/{dayId} (the "Live now" notification) → the broadcast's player.
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function LiveDeepLink() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={{ pathname: '/watch/[dayId]', params: { dayId: id, reminder: '1' } }} />;
}
