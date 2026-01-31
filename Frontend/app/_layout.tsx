import './global.css';
import { ConvexProvider,ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {PrivyProvider} from '@privy-io/expo';
import { PrivyElements } from "@privy-io/expo/ui";
import { SmartWalletsProvider } from '@privy-io/expo/smart-wallets';
import { scrollSepolia, sepolia } from 'viem/chains';




const convex = new ConvexReactClient("", {
  unsavedChangesWarning: false,
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <PrivyProvider 
          appId="" 
          clientId=""
          supportedChains={[scrollSepolia, sepolia]}
          config={{
            embedded: {
              ethereum: {
                createOnLogin: 'all-users',
              },
            }
          }}
        >
          <SmartWalletsProvider>
            <ConvexProvider client={convex} >
              <PrivyElements />
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
            </ConvexProvider>
          </SmartWalletsProvider>
        </PrivyProvider>
    </GestureHandlerRootView>
  );
}
