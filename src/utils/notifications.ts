import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// On Android, we must create a notification channel for custom sounds to work.
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('reminders', {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'alarm', // Reference alarm.mp3 in android/app/src/main/res/raw/
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}

// Play alarm.mp3 when notification is received in foreground
Notifications.addNotificationReceivedListener(async notification => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/alarm.mp3'),
      { shouldPlay: true }
    );
    // Optionally, you can set volume or looping here
    // await sound.setIsLoopingAsync(true);
    // await sound.setVolumeAsync(1.0);
  } catch (e) {
    console.error('Failed to play alarm sound:', e);
  }
});

export const scheduleNotification = async (
  id: string,
  title: string,
  date: Date,
  frequency: 'One time' | 'Daily' | 'Weekly' | 'Custom'
) => {
  let trigger: Notifications.NotificationTriggerInput;

  if (frequency === 'Daily') {
    trigger = {
      hour: date.getHours(),
      minute: date.getMinutes(),
      repeats: true,
    };
  } else if (frequency === 'Weekly') {
    trigger = {
      weekday: date.getDay() + 1, // Expo weekday is 1-7 (Sun-Sat)
      hour: date.getHours(),
      minute: date.getMinutes(),
      repeats: true,
    };
  } else { // 'One time' and 'Custom' are treated as one-time for now
    trigger = date;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: "Reminder!",
      body: title,
      sound: Platform.OS === 'ios' ? 'alarm.mp3' : true,
    },
    trigger,
    channelId: 'reminders', // Required for Android channel
  });
};

export const cancelNotification = async (id: string) => {
  await Notifications.cancelScheduledNotificationAsync(id);
};

export const requestPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('You need to enable notifications in your settings.');
    return false;
  }
  // For Android, also check if the channel is enabled
  if (Platform.OS === 'android') {
    const channel = await Notifications.getNotificationChannelAsync('reminders');
    if (channel?.sound === null) {
        // The user has disabled sound for this channel.
        // You can ask them to re-enable it in settings.
    }
  }
  return true;
};
