import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';

import PatientHome from './src/screens/PatientHome';
import DoctorDashboard from './src/screens/DoctorDashboard';
import { theme } from './src/theme/theme';
import { registerForPushNotificationsAsync, setupNotificationListeners } from './src/lib/notifications';

const Stack = createNativeStackNavigator();

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    const listeners = setupNotificationListeners(setNotification);
    notificationListener.current = listeners.notificationListener;
    responseListener.current = listeners.responseListener;

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={{
          colors: {
            background: theme.colors.background.primary,
            card: theme.colors.surface,
            text: theme.colors.text.primary,
            border: theme.colors.border,
            primary: theme.colors.accent.primary,
          }
        }}>
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="PatientHome">
            <Stack.Screen name="PatientHome" component={PatientHome} />
            <Stack.Screen name="DoctorDashboard" component={DoctorDashboard} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
