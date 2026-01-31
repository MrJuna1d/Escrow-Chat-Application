import { Redirect } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { ActivityIndicator, View } from "react-native";
import { usePrivy, useLoginWithOAuth } from "@privy-io/expo";

export default function Index() {

  const {isReady, user} = usePrivy();

  // Redirect to tabs when logged in
  if (!user && isReady) {
    return <Redirect href="/(auth)/login" />
  }

  if (user && isReady) {
    return <Redirect href="/(tabs)" />
  }
}

