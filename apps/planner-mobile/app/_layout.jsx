import { Stack } from 'expo-router'

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Planner' }} />
      <Stack.Screen name="tasks/index" options={{ title: 'Tasks' }} />
      <Stack.Screen name="habits/index" options={{ title: 'Habits' }} />
      <Stack.Screen name="analytics/index" options={{ title: 'Analytics' }} />
    </Stack>
  )
}
