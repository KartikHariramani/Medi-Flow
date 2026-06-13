import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Set up how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId || "YOUR_PROJECT_ID_HERE",
    })).data;
    
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export function setupNotificationListeners(setNotification) {
  // Listener for when a notification is received while the app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    setNotification(notification);
  });

  // Listener for when the user taps on or interacts with a notification 
  // (works when app is foregrounded, backgrounded, or killed)
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log("Notification Response Received", response);
    // Future: Handle navigation based on notification type here (e.g. go to PatientHome)
  });

  return { notificationListener, responseListener };
}
