import { api } from "@/convex/_generated/api";
import { Ionicons } from '@expo/vector-icons';
import { usePrivy } from "@privy-io/expo";
import { useMutation, useQuery } from "convex/react";
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';


import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Abi as contractFactoryAbi } from '../../abi';
import type { Id } from "../../convex/_generated/dataModel";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";

// Replace with your deployed ContractFactory address on Sepolia
const SEPOLIA_CONTRACT_FACTORY_ADDRESS = "0x9d97f763Df84530817560C8A4c25361284AFaEDB";

export default function Chat() {
    const [input, setInput] = useState('');
    const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [showContractModal, setShowContractModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [contractTitle, setContractTitle] = useState('');
    //const [contractDescription, setContractDescription] = useState('');
    const [contractAmount, setContractAmount] = useState('');
    const [contractDeadline, setContractDeadline] = useState('');
    const [partnerWalletAddress, setPartnerWalletAddress] = useState('');
    const [isCreatingContract, setIsCreatingContract] = useState(false);
    const { user } = usePrivy();
    const { client } = useSmartWallets();

    
    const smartWallet = user?.linked_accounts.find((account) => account.type === 'smart_wallet');

    console.log("smartWallet: ", smartWallet?.verified_at)

     
    
    const { matchId, partnerId } = useLocalSearchParams<{ matchId?: string; partnerId?: string }>();

    // Get current user data
    const myUserData = useQuery(api.users.getUserData, {
        privyId: user?.id ?? ""
    });

    // If we have partnerId, check for existing match
    const existingMatches = useQuery(
        api.matches.getMatchesWithPartners,
        myUserData?._id ? { userId: myUserData._id } : "skip"
    );

    // Get partner information
    const partnerData = useQuery(
        api.users.getUserById,
        partnerId ? { id: partnerId as Id<"users"> } : "skip"
    );

    // Get partner from existing match
    const partnerFromMatch = existingMatches?.find(
        ({ match }) => match._id === matchId
    )?.partner;

    const partner = partnerFromMatch || partnerData;

    // Set active matchId
    useEffect(() => {
        if (matchId) {
            setActiveMatchId(matchId);
        } else if (partnerId && existingMatches) {
            const existingMatch = existingMatches.find(
                ({ partner }) => partner?._id === partnerId
            );
            if (existingMatch) {
                setActiveMatchId(existingMatch.match._id);
            }
        }
    }, [matchId, partnerId, existingMatches]);

    // Fetch messages for this match
    const messagesData = useQuery(
        api.messages.getMessages, 
        activeMatchId ? { matchId: activeMatchId } : "skip"
    ) ?? [];
    
    // Sort messages in chronological order (oldest first)
    const messages = [...messagesData].sort((a, b) => a.createdAt - b.createdAt);
    
    // Mutations
    const sendMessageMutation = useMutation(api.messages.sendMessage);
    const getOrCreateMatchMutation = useMutation(api.matches.getOrCreateMatch);

    const checkBalance = async () => {
    if (!client || !smartWallet) return;
    
    const { createPublicClient, http } = await import('viem');
    const { sepolia } = await import('viem/chains');
    
    const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(),
    });
    
    const balance = await publicClient.getBalance({
        address: smartWallet.address as `0x${string}`
    });
    
    console.log('Smart Wallet Balance:', balance);
    return balance;
};

    const handleCreateContract = async () => {
    if (!client) {
        Alert.alert('Error', 'Smart wallet not initialized');
        return;
    }

    if (!smartWallet) {
        Alert.alert('Error', 'Smart wallet not found. Please wait for wallet creation.');
        return;
    }

    if (!partnerWalletAddress || !contractTitle || !contractAmount || !contractDeadline) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(partnerWalletAddress)) {
        Alert.alert('Error', 'Invalid wallet address format');
        return;
    }

    // Validate amount
    const amountInEth = parseFloat(contractAmount);
    if (isNaN(amountInEth) || amountInEth <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
    }

    // Convert deadline to Unix timestamp
    const deadlineDate = new Date(contractDeadline);
    if (isNaN(deadlineDate.getTime())) {
        Alert.alert('Error', 'Please enter a valid deadline date (e.g., 2026-01-31)');
        return;
    }
    const releaseTimestamp = Math.floor(deadlineDate.getTime() / 1000);

    // Check if deadline is in the future
    if (releaseTimestamp <= Math.floor(Date.now() / 1000)) {
        Alert.alert('Error', 'Deadline must be in the future');
        return;
    }

    setIsCreatingContract(true);

    try {
        // Import viem utilities
        const { encodeFunctionData, parseEther } = await import('viem');

        //console.log("partner wallet address: ", partner?.walletAddress)

        // Convert ETH to wei
        const amountInWei = parseEther(contractAmount);

        const balance = await checkBalance();
        if (balance !== undefined && balance < amountInWei) {
            Alert.alert(
                'Insufficient Balance', 
                `Your wallet has ${balance} ETH but you need ${contractAmount} ETH + gas fees. Please fund your wallet first.`
            );
            setIsCreatingContract(false);
            return;
        }

        // Prepare contract data as JSON string
        const contractData = JSON.stringify({
            title: contractTitle,
        });

        console.log('Creating contract with data:', {
            investor: smartWallet.address,
            founder: partnerWalletAddress,
            data: contractData,
            releaseDate: releaseTimestamp,
            amount: amountInWei.toString()
        });

        // Encode the function call
        const data = encodeFunctionData({
            abi: contractFactoryAbi,
            functionName: 'createContract',
            args: [
                smartWallet.address as `0x${string}`,
                partnerWalletAddress as `0x${string}`,
                contractData,
                BigInt(releaseTimestamp),
                amountInWei
            ]
        });
        console.log('Encoded function data:', data);
        // Send transaction using Privy's smart wallet client
        // This automatically handles gas sponsorship if configured in Privy dashboard
        // Include value to deposit funds during contract creation
        const hash = await client.sendTransaction({
            account: client.account,
            chain: client.chain,
            to: SEPOLIA_CONTRACT_FACTORY_ADDRESS as `0x${string}`,
            data: data,
            value: amountInWei, // Send ETH with the transaction
        });


        console.log('Transaction hash:', hash);
        Alert.alert('Success', `Contract created successfully!\nTx: ${hash.slice(0, 10)}...`);

        // Reset form and close modal
        setContractTitle('');
        setContractAmount('');
        setContractDeadline('');
        setPartnerWalletAddress('');
        setShowContractModal(false);

    } catch (error: any) {
        console.error('Error creating contract:', error);
        Alert.alert(
            'Error', 
            error?.message || 'Failed to create contract. Please try again.'
        );
    } finally {
        setIsCreatingContract(false);
    }
};

    const handleSend = async () => {
        if (!input.trim() || !user?.id || !myUserData?._id) {
            console.log('❌ Validation failed:', {
                hasInput: !!input.trim(),
                hasUserId: !!user?.id,
                hasMyUserData: !!myUserData?._id
            });
            return;
        }
        
        try {
            let finalMatchId = activeMatchId;

            // If no match exists yet, create it
            if (!finalMatchId && partnerId) {
                console.log(' Creating new match...');
                finalMatchId = await getOrCreateMatchMutation({
                    userAId: myUserData._id,
                    userBId: partnerId as Id<"users">
                });
                setActiveMatchId(finalMatchId);
                // console.log('✅ Match created:', finalMatchId);
            }

            if (!finalMatchId) {
                console.log('❌ No matchId available');
                return;
            }
            
            // console.log('🟢 Sending message...');
            await sendMessageMutation({ 
                matchId: finalMatchId, 
                senderId: user.id, 
                content: input 
            });
            // console.log('✅ Message sent successfully');
            setInput(''); // Clear input after sending
        } catch (error) {
            console.error('❌ Error sending message:', error);
        }
    };
    

    return (
        <SafeAreaView className="flex-1 bg-[#f8fafc]">
            {/* Overlay to close menu when clicking outside */}
            {showMenu && (
                <Pressable 
                    className="absolute inset-0 z-40"
                    onPress={() => setShowMenu(false)}
                />
            )}
            
            <KeyboardAvoidingView
                className="flex-1 p-3 mt-14"
                behavior={Platform.select({ ios: 'padding', android: undefined })}
            >
                {/* Header with Profile Picture, Name, and Menu */}
                <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200 z-50">
                    <View className="flex-row items-center flex-1">
                        {/* Profile Picture Circle - Touchable */}
                        <TouchableOpacity 
                            className="w-10 h-10 rounded-full bg-[#10b981] items-center justify-center mr-3"
                            onPress={() => setShowProfileModal(true)}
                        >
                            <Text className="text-white font-bold text-lg">
                                {partner?.name?.charAt(0).toUpperCase() || "?"}
                            </Text>
                        </TouchableOpacity>
                        
                        {/* Name */}
                        <View className="flex-1">
                            <Text className="text-base font-semibold text-[#0f172a]">
                                {partner?.name || "Loading..."}
                            </Text>
                            <Text className="text-xs text-[#64748b]">Active now</Text>
                        </View>
                    </View>

                    {/* Three Dot Menu */}
                    <View>
                        <TouchableOpacity 
                            className="p-2" 
                            onPress={() => setShowMenu(!showMenu)}
                        >
                            <Ionicons name="ellipsis-vertical" size={20} color="#64748b" />
                        </TouchableOpacity>

                        {/* Dropdown Menu */}
                        {showMenu && (
                            <View className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border border-gray-200 w-48 z-50">
                                <Pressable 
                                    className="px-4 py-3 border-b border-gray-200"
                                    onPress={() => {
                                        setShowMenu(false);
                                        setTimeout(() => setShowContractModal(true), 100);
                                    }}
                                >
                                    <View className="flex-row items-center">
                                        <Ionicons name="document-text-outline" size={20} color="#10b981" />
                                        <Text className="ml-3 text-base text-[#0f172a]">Create Contract</Text>
                                    </View>
                                </Pressable>
                                
                                <Link 
                                    href="/screens/contracts"
                                    asChild
                                    onPress={() => setShowMenu(false)}
                                >
                                    <Pressable className="px-4 py-3">
                                        <View className="flex-row items-center">
                                            <Ionicons name="folder-open-outline" size={20} color="#10b981" />
                                            <Text className="ml-3 text-base text-[#0f172a]">View Contracts</Text>
                                        </View>
                                    </Pressable>
                                </Link>
                            </View>
                        )}
                    </View>
                </View>

                <FlatList
                    data={messages}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 12 }}
                    renderItem={({ item }) => {
                        const isMyMessage = item.senderId === user?.id;
                        return (
                            <View 
                                className={`p-3 rounded-lg mb-2 mx-2 ${
                                    isMyMessage ? 'bg-[#10b981] self-end' : 'bg-white self-start'
                                }`}
                                style={{ maxWidth: '80%' }}
                            >
                                <Text className={`text-[#475569] mt-1 ${isMyMessage ? 'text-white' : ''}`}>
                                    {item.content}
                                </Text>
                                <Text className={`text-xs mt-1 ${isMyMessage ? 'text-white/70' : 'text-[#94a3b8]'}`}>
                                    {formatTime(item.createdAt)}
                                </Text>
                            </View>
                        );
                    }}
                />

                <View className="flex-row items-center p-2 mb-8 border-t border-[#e6eef8]">
                    <TextInput
                        value={input}
                        onChangeText={setInput}
                        placeholder="Type a message..."
                        placeholderTextColor="#94a3b8"
                        className="flex-1 h-11 px-3 bg-white rounded-lg mr-2 text-base"
                        onSubmitEditing={handleSend}
                        returnKeyType="send"
                    />
                    <TouchableOpacity 
                        className="w-11 h-11 rounded-lg bg-[#10b981] items-center justify-center" 
                        onPress={handleSend}
                    >
                        <Ionicons name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Create Contract Modal */}
            <Modal
                visible={showContractModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowContractModal(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
                        <View className="flex-row items-center justify-between mb-6">
                            <Text className="text-2xl font-bold text-[#0f172a]">Create Contract</Text>
                            <TouchableOpacity onPress={() => setShowContractModal(false)}>
                                <Ionicons name="close" size={28} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Contract Title */}
                            <View className="mb-4">
                                <Text className="text-sm font-semibold text-[#0f172a] mb-2">Contract Title</Text>
                                <TextInput
                                    value={contractTitle}
                                    onChangeText={setContractTitle}
                                    placeholder="Enter contract title"
                                    placeholderTextColor="#94a3b8"
                                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                                />
                            </View>

                            {/* Contract Description */}
                            {/* <View className="mb-4">
                                <Text className="text-sm font-semibold text-[#0f172a] mb-2">Description</Text>
                                <TextInput
                                    value={contractDescription}
                                    onChangeText={setContractDescription}
                                    placeholder="Enter contract description"
                                    placeholderTextColor="#94a3b8"
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                                />
                            </View> */}

                            {/* Partner Wallet Address */}
                            <View className="mb-4">
                                <Text className="text-sm font-semibold text-[#0f172a] mb-2">Partner Wallet Address</Text>
                                <TextInput
                                    value={partnerWalletAddress}
                                    onChangeText={setPartnerWalletAddress}
                                    placeholder="0x..."
                                    placeholderTextColor="#94a3b8"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                                />
                            </View>

                            {/* Contract Amount */}
                            <View className="mb-4">
                                <Text className="text-sm font-semibold text-[#0f172a] mb-2">Amount (ETH)</Text>
                                <TextInput
                                    value={contractAmount}
                                    onChangeText={setContractAmount}
                                    placeholder="0.00"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="decimal-pad"
                                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                                />
                            </View>

                            {/* Contract Deadline */}
                            <View className="mb-6">
                                <Text className="text-sm font-semibold text-[#0f172a] mb-2">Deadline</Text>
                                <TextInput
                                    value={contractDeadline}
                                    onChangeText={setContractDeadline}
                                    placeholder="e.g., 2026-01-31"
                                    placeholderTextColor="#94a3b8"
                                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                                />
                            </View>

                            {/* Create Button */}
                            <TouchableOpacity
                                onPress={handleCreateContract}
                                disabled={isCreatingContract}
                                className={`rounded-lg py-4 items-center ${isCreatingContract ? 'bg-gray-400' : 'bg-[#10b981]'}`}
                            >
                                <Text className="text-white font-semibold text-lg">
                                    {isCreatingContract ? 'Creating Contract...' : 'Create Contract'}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Profile Modal */}
            <Modal
                visible={showProfileModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowProfileModal(false)}
            >
                <Pressable 
                    className="flex-1 bg-black/50 justify-center items-center"
                    onPress={() => setShowProfileModal(false)}
                >
                    <Pressable className="bg-white rounded-2xl p-6 mx-6 w-4/5 max-w-md">
                        {/* Profile Header */}
                        <View className="items-center mb-6">
                            <View className="w-20 h-20 rounded-full bg-[#10b981] items-center justify-center mb-3">
                                <Text className="text-white font-bold text-3xl">
                                    {partner?.name?.charAt(0).toUpperCase() || "?"}
                                </Text>
                            </View>
                            <Text className="text-2xl font-bold text-[#0f172a]">
                                {partner?.name || "N/A"}
                            </Text>
                        </View>

                        {/* Description Section */}
                        <View className="mb-6">
                            <Text className="text-sm font-semibold text-[#64748b] mb-2">Description</Text>
                            <Text className="text-base text-[#0f172a]">
                                {partner?.description || "N/A"}
                            </Text>
                        </View>

                        {/* Close Button */}
                        <TouchableOpacity
                            onPress={() => setShowProfileModal(false)}
                            className="bg-[#10b981] rounded-lg py-3 items-center"
                        >
                            <Text className="text-white font-semibold text-base">Close</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}



function formatTime(ts: number) {
    const d = new Date(ts);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}
