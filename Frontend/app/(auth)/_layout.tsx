import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Auth screens typically don't show headers
      }}
    >
      <Stack.Screen name="login" />
    </Stack>
  );
}

