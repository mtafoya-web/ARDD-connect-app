import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

const notificationSound = require('../assets/sounds/notification.wav');

let configured = false;

const configureAudio = async () => {
  if (configured) return;
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
  });
  configured = true;
};

export async function playNotificationSound() {
  try {
    await configureAudio();
    const { sound } = await Audio.Sound.createAsync(notificationSound, {
      shouldPlay: true,
      volume: 0.7,
    });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => undefined);
      }
    });
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }
}
