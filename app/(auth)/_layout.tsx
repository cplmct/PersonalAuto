import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        // Welcome → Sign In / Sign Up slides in from right.
        // Going back reverses naturally.
        animation: 'slide_from_right',
      }}
    >
      {/* Welcome is the entry point — no push animation from nothing */}
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
