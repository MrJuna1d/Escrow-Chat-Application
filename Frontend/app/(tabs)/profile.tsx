import { useEmbeddedEthereumWallet, usePrivy } from "@privy-io/expo";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Clipboard, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Button } from "../../components/ui/button";
import { Text as UIText } from "../../components/ui/text";
import { api } from "../../convex/_generated/api";

export default function ProfileScreen() {
  const privy = usePrivy();
  const user = privy?.user;
  const router = useRouter();

  const [balance, setBalance] = useState(0)
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const {wallets} = useEmbeddedEthereumWallet();
  const wallet = wallets[0]
  const { client } = useSmartWallets();

  const smartWallet = user?.linked_accounts.find((account) => account.type === 'smart_wallet');

  const testing = async () => {
    const provider = await wallet.getProvider();

        await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{chainId: '0xaa36a7'}],
        });
        
        const balance = await provider.request({
            method: 'eth_getBalance',
            params: [wallet.address, 'latest']
        });
        const balanceInEth = parseInt(balance as string, 16) / 1e18;
        setBalance(balanceInEth)

        if (smartWallet?.address) {
        const smartBalance = await provider.request({
            method: 'eth_getBalance',
            params: [smartWallet.address, 'latest']
        });
        const smartBalanceInEth = parseInt(smartBalance as string, 16) / 1e18;
        console.log("Smart Wallet Balance:", smartBalanceInEth, "ETH");
    }
  }
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const privyId = user?.id || "";
  const userData = useQuery(api.users.getUserData, privyId ? { privyId } : "skip");
  const upsertUser = useMutation(api.users.upsertUser);

  useEffect(() => {
    if (userData) {
      setName(userData.name || "");
      setDescription(userData.description || "");
      setProfilePic(userData.profilePic || "");
    }
  }, [userData]);

  const handleUpdate = async () => {
    if (!privyId) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    setIsUpdating(true);
    try {
      await upsertUser({
        privyId,
        name: name || undefined,
        description: description || undefined,
        profilePic: profilePic || undefined,
      });
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (typeof (privy as any)?.logout === "function") {
        await (privy as any).logout();
      } else if (typeof (privy as any)?.signOut === "function") {
        await (privy as any).signOut();
      } else {
        console.warn("Privy logout method not available; falling back to navigation.");
      }
      router.replace("/(auth)/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleWithdraw = async () => {
    if (!smartWallet || !client) {
      Alert.alert('Error', 'Smart wallet not available');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(withdrawAddress)) {
      Alert.alert('Error', 'Invalid wallet address');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Invalid amount');
      return;
    }

    setIsWithdrawing(true);

    try {
      const { parseEther, createPublicClient, http } = await import('viem');
      const { sepolia } = await import('viem/chains');
      const amountInWei = parseEther(withdrawAmount);

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(),
      });

      const balanceInWei = await publicClient.getBalance({
        address: smartWallet.address as `0x${string}`
      });

      console.log('Smart Wallet Balance:', balanceInWei.toString(), 'Wei');
      console.log('Withdrawal Amount:', amountInWei.toString(), 'Wei');

      if (balanceInWei < amountInWei) {
        const balanceInEth = Number(balanceInWei) / 1e18;
        Alert.alert(
          'Insufficient Balance', 
          `Your smart wallet has ${balanceInEth.toFixed(6)} ETH but you're trying to send ${withdrawAmount} ETH.`
        );
        setIsWithdrawing(false);
        return;
      }

      const hash = await client.sendTransaction({
        account: client.account,
        chain: client.chain,
        to: withdrawAddress as `0x${string}`,
        value: amountInWei,
      });

      Alert.alert('Success', `Withdrawn ${withdrawAmount} ETH\nTx: ${hash.slice(0, 10)}...`);
      
      setWithdrawAddress('');
      setWithdrawAmount('');
      await testing();
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      Alert.alert('Error', error?.message || 'Failed to withdraw');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Overlay to close menu when clicking outside */}
      {showMenu && (
        <View 
          className="absolute inset-0 z-[9998]"
          onTouchEnd={() => setShowMenu(false)}
        />
      )}

      {/* Header Section with Green Gradient */}
      <View className="bg-[#10b981] pt-12 pb-8 px-5 rounded-b-3xl" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 }}>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-white text-3xl font-bold">Profile</Text>
          
          {/* Three Dot Menu */}
          <TouchableOpacity 
            onPress={() => setShowMenu(!showMenu)}
            className="p-2"
          >
            <Ionicons name="ellipsis-vertical" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown Menu - Rendered outside header to fix z-index */}
      {showMenu && (
        <View className="absolute right-5 top-28 bg-white rounded-lg shadow-lg border border-gray-200 w-40" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 50, zIndex: 9999 }}>
          <TouchableOpacity 
            onPress={() => {
              setShowMenu(false);
              handleLogout();
            }}
            className="px-4 py-3 flex-row items-center"
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text className="ml-3 text-base text-[#ef4444] font-semibold">Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      <View className="px-5 -mt-8">
        {/* Profile Card */}
        <View className="bg-white rounded-2xl p-6 mb-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }}>
          {/* Profile Picture */}
          <View className="items-center mb-6">
            {profilePic ? (
              <Image
                source={{ uri: profilePic }}
                className="w-32 h-32 rounded-full border-4 border-[#10b981]"
              />
            ) : (
              <View className="w-32 h-32 rounded-full bg-[#10b981] items-center justify-center border-4 border-white" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 }}>
                <Ionicons name="person" size={56} color="white" />
              </View>
            )}
          </View>

          {/* Profile Picture URL */}
          <View className="mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="image-outline" size={18} color="#10b981" />
              <Text className="text-base font-semibold ml-2 text-gray-800">Profile Picture URL</Text>
            </View>
            <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 bg-gray-50">
              <Ionicons name="link-outline" size={20} color="#64748b" />
              <TextInput
                value={profilePic}
                onChangeText={setProfilePic}
                placeholder="Enter image URL (optional)"
                className="flex-1 ml-2 text-base"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* User Name */}
          <View className="mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="person-outline" size={18} color="#10b981" />
              <Text className="text-base font-semibold ml-2 text-gray-800">User Name</Text>
            </View>
            <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 bg-gray-50">
              <Ionicons name="at-outline" size={20} color="#64748b" />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your name (optional)"
                className="flex-1 ml-2 text-base"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {/* Description */}
          <View className="mb-6">
            <View className="flex-row items-center mb-2">
              <Ionicons name="document-text-outline" size={18} color="#10b981" />
              <Text className="text-base font-semibold ml-2 text-gray-800">Description</Text>
            </View>
            <View className="border border-gray-300 rounded-xl p-4 bg-gray-50">
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Tell us about yourself (optional)"
                multiline
                numberOfLines={4}
                className="text-base"
                style={{ textAlignVertical: "top" }}
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {/* Update Button */}
          <Button 
            onPress={handleUpdate} 
            className="bg-[#10b981]"
            disabled={isUpdating}
          >
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle-outline" size={20} color="white" />
              <UIText className="text-base ml-2 font-semibold">
                {isUpdating ? "Updating..." : "Save Changes"}
              </UIText>
            </View>
          </Button>
        </View>

        {/* Wallet Management Card */}
        <View className="bg-[#10b981] rounded-2xl p-5 mb-4" style={{ shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }}>
          <View className="flex-row items-center mb-4">
            <Ionicons name="wallet" size={24} color="white" />
            <Text className="text-white text-xl font-bold ml-2">Wallet Management</Text>
          </View>
          
          {/* Balance Display */}
          <View className="mb-4 p-4 bg-white/95 rounded-xl">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm text-gray-600 font-medium">Smart Wallet Balance</Text>
              <View className="flex-row items-center">
                <Ionicons name="refresh-outline" size={16} color="#10b981" />
                <Text className="text-xs text-[#10b981] ml-1" onPress={testing}>Refresh</Text>
              </View>
            </View>
            <View className="flex-row items-center">
              {/* <Ionicons name="logo-ethereum" size={32} color="#627EEA" /> */}
              <Text className="text-3xl font-bold ml-2 text-gray-800">{balance.toFixed(4)} ETH</Text>
            </View>
            {smartWallet?.address && (
              <TouchableOpacity 
                onPress={() => {
                  Clipboard.setString(smartWallet.address);
                }}
                className="flex-row items-center mt-3 pt-3 border-t border-gray-200"
              >
                <Ionicons name="shield-checkmark" size={14} color="#10b981" />
                <Text className="text-xs text-gray-500 ml-1 flex-1" numberOfLines={1}>
                  {smartWallet.address.slice(0, 6)}...{smartWallet.address.slice(-4)}
                </Text>
                <Ionicons name="copy-outline" size={14} color="#10b981" />
              </TouchableOpacity>
            )}
          </View>

          {/* Withdraw Form */}
          <View className="mb-4">
            <Text className="text-white text-base font-semibold mb-3">Send Funds</Text>
            
            {/* Recipient Address */}
            <View className="mb-3">
              <View className="flex-row items-center bg-white/95 rounded-xl px-4 py-3">
                <Ionicons name="paper-plane-outline" size={20} color="#64748b" />
                <TextInput
                  placeholder="Recipient address (0x...)"
                  value={withdrawAddress}
                  onChangeText={setWithdrawAddress}
                  className="flex-1 ml-2 text-base"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Amount */}
            <View className="mb-3">
              <View className="flex-row items-center bg-white/95 rounded-xl px-4 py-3">
                <Ionicons name="cash-outline" size={20} color="#64748b" />
                <TextInput
                  placeholder="Amount (ETH)"
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  keyboardType="decimal-pad"
                  className="flex-1 ml-2 text-base"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* Send Button */}
            <Button 
              onPress={handleWithdraw} 
              className="bg-white "
              disabled={isWithdrawing}
            >
              <View className="flex-row items-center">
                <Ionicons name="send" size={18} color="#10b981" />
                <UIText className="text-base ml-2 font-semibold text-[#10b981]">
                  {isWithdrawing ? 'Sending...' : 'Send ETH'}
                </UIText>
              </View>
            </Button>
          </View>

          {/* Quick Actions */}
          <View className="flex-row gap-2">
            <Button 
              onPress={() => setWithdrawAmount(balance.toString())} 
              variant="outline"
              className="flex-1 border-white/30 bg-white/10"
              disabled={balance === 0}
            >
              <View className="flex-row items-center">
                <Ionicons name="wallet-outline" size={14} color="white" />
                <UIText className="text-xs ml-1 text-white font-medium">Max</UIText>
              </View>
            </Button>
            
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
