import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Text as UIText } from "./ui/text";

export default function WalletHeader() {
  const { walletAddress, signOut } = useAuth();
  const router = useRouter();

  const handleDisconnect = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  if (!walletAddress) return null;

  const shortAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  return (
    <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
        <Text className="text-sm text-gray-700 font-mono" numberOfLines={1}>
          {shortAddress}
        </Text>
      </View>
      
      <Button className="rounded-lg" variant="destructive" size="sm" onPress={handleDisconnect}>
        <UIText className="text-xs">Disconnect</UIText>
      </Button>
    </View>
  );
}

