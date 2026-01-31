import { Ionicons } from '@expo/vector-icons';
import { usePrivy } from "@privy-io/expo";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Abi as contractFactoryAbi } from '../../abi';
import { ContractActions } from '../../components/ContractActions';

const SEPOLIA_CONTRACT_FACTORY_ADDRESS = "0x9d97f763Df84530817560C8A4c25361284AFaEDB";

interface ContractData {
    id: number;
    address: string;
    investor: string;
    founder: string;
    dataHash: string;
    createdAt: number;
    releaseDate: number;
    amount: bigint;
    balance: bigint;
    released: boolean;
    isCreator: boolean;
    isParticipant: boolean;
}

export default function Contracts() {
    const router = useRouter();
    const { user } = usePrivy();
    const { client } = useSmartWallets();
    const [contracts, setContracts] = useState<ContractData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedContract, setExpandedContract] = useState<number | null>(null);
    const [selectedContract, setSelectedContract] = useState<ContractData | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const smartWallet = user?.linked_accounts.find((account) => account.type === 'smart_wallet');

    // Create a public client for reading contracts
    const publicClient = useMemo(async () => {
        const { createPublicClient, http } = await import('viem');
        const { sepolia } = await import('viem/chains');
        
        return createPublicClient({
            chain: sepolia,
            transport: http(),
        });
    }, []);

    const fetchContracts = async () => {
        if (!client || !smartWallet) return;

        try {
            console.log('Fetching contracts for wallet:', smartWallet.address);
            const { readContract } = await import('viem/actions');
            const pubClient = await publicClient;


            // Get total contracts count
            const totalContracts = await readContract(pubClient, {
                address: SEPOLIA_CONTRACT_FACTORY_ADDRESS as `0x${string}`,
                abi: contractFactoryAbi,
                functionName: 'getTotalContractsCount',
            }) as bigint;

            console.log('Total Contracts in Factory:', totalContracts.toString());

            const contractsList: ContractData[] = [];

            // Fetch all contracts
            for (let i = 1; i <= Number(totalContracts); i++) {
                try {
                    // Get full contract details in one call
                    const [contractAddress, investor, founder, dataHash, createdAt, releaseDate, amount, balance, released] = await readContract(pubClient, {
                        address: SEPOLIA_CONTRACT_FACTORY_ADDRESS as `0x${string}`,
                        abi: contractFactoryAbi,
                        functionName: 'getFullContractDetails',
                        args: [BigInt(i)],
                    }) as [string, string, string, string, bigint, bigint, bigint, bigint, boolean];

                    console.log(`Contract ${i}:`, { contractAddress, investor, founder, dataHash });

                    const isCreator = investor.toLowerCase() === smartWallet.address?.toLowerCase();
                    const isParticipant = founder.toLowerCase() === smartWallet.address?.toLowerCase();

                    // Only add contracts where user is creator or participant
                    if (isCreator || isParticipant) {
                        let parsedData = { title: 'N/A' };
                        try {
                            parsedData = JSON.parse(dataHash);
                        } catch (e) {
                            // If parsing fails, keep default
                        }

                        contractsList.push({
                            id: i,
                            address: contractAddress,
                            investor: investor,
                            founder: founder,
                            dataHash: parsedData.title || dataHash,
                            createdAt: Number(createdAt),
                            releaseDate: Number(releaseDate),
                            amount: amount,
                            balance: balance,
                            released: released,
                            isCreator,
                            isParticipant,
                        });
                    }
                } catch (error) {
                    console.error(`Error fetching contract ${i}:`, error);
                }
            }

            setContracts(contractsList);
        } catch (error) {
            console.error('Error fetching contracts:', error);
            Alert.alert('Error', 'Failed to load contracts');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchContracts();
    }, [client, smartWallet]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchContracts();
    };

    const handleContractPress = (contract: ContractData) => {
        console.log('Contract pressed:', {
            id: contract.id,
            released: contract.released,
            balance: contract.balance.toString(),
            releaseDate: contract.releaseDate,
            now: Math.floor(Date.now() / 1000),
            isCreator: contract.isCreator,
            isParticipant: contract.isParticipant
        });
        setSelectedContract(contract);
        setShowDetailsModal(true);
    };

    const handleRefund = async (contract: ContractData) => {
        if (!client) return;
        
        setIsProcessing(true);
        const success = await ContractActions.refund(
            client,
            {
                contractAddress: contract.address,
                balance: contract.balance,
                releaseDate: contract.releaseDate,
                released: contract.released,
                isInvestor: contract.isCreator,
                isFounder: contract.isParticipant,
            },
            () => {
                setShowDetailsModal(false);
                setTimeout(() => fetchContracts(), 2000);
            }
        );
        setIsProcessing(false);
    };

    const handleReleaseFunds = async (contract: ContractData) => {
        if (!client) return;
        
        setIsProcessing(true);
        const success = await ContractActions.releaseFunds(
            client,
            {
                contractAddress: contract.address,
                balance: contract.balance,
                releaseDate: contract.releaseDate,
                released: contract.released,
                isInvestor: contract.isCreator,
                isFounder: contract.isParticipant,
            },
            () => {
                setShowDetailsModal(false);
                setTimeout(() => fetchContracts(), 2000);
            }
        );
        setIsProcessing(false);
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatEther = (wei: bigint) => {
        const { formatEther: viemFormatEther } = require('viem');
        return viemFormatEther(wei);
    };

    const getStatusColor = (contract: ContractData) => {
        if (contract.released) return 'text-gray-500';
        const now = Math.floor(Date.now() / 1000);
        if (now >= contract.releaseDate) return 'text-green-600';
        return 'text-blue-600';
    };

    const getStatusText = (contract: ContractData) => {
        if (contract.released) return 'Released';
        const now = Math.floor(Date.now() / 1000);
        if (now >= contract.releaseDate) return 'Ready to Release';
        return 'Active';
    };

    return (
        <SafeAreaView className="flex-1 bg-[#f8fafc]">
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200 mt-14">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-[#0f172a]">My Contracts</Text>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#0A66C2" />
                    <Text className="mt-4 text-[#64748b]">Loading contracts...</Text>
                </View>
            ) : contracts.length === 0 ? (
                <View className="flex-1 items-center justify-center px-6">
                    <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
                    <Text className="mt-4 text-lg font-semibold text-[#0f172a]">No Contracts Yet</Text>
                    <Text className="mt-2 text-center text-[#64748b]">
                        Create your first contract to get started
                    </Text>
                </View>
            ) : (
                <ScrollView
                    className="flex-1"
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    <View className="p-4">
                        {contracts.map((contract) => (
                            <TouchableOpacity
                                key={contract.id}
                                onPress={() => handleContractPress(contract)}
                                className="bg-white rounded-lg p-4 mb-3 border border-gray-200"
                            >
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-lg font-bold text-[#0f172a]">
                                        {contract.dataHash}
                                    </Text>
                                    <View className={`px-2 py-1 rounded-full ${
                                        contract.released ? 'bg-gray-100' : 'bg-blue-100'
                                    }`}>
                                        <Text className={`text-xs font-semibold ${getStatusColor(contract)}`}>
                                            {getStatusText(contract)}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row items-center mb-1">
                                    <Ionicons name="cash-outline" size={16} color="#64748b" />
                                    <Text className="ml-2 text-sm text-[#64748b]">
                                        Amount: {formatEther(contract.amount)} ETH
                                    </Text>
                                </View>

                                <View className="flex-row items-center mb-1">
                                    <Ionicons name="wallet-outline" size={16} color="#64748b" />
                                    <Text className="ml-2 text-sm text-[#64748b]">
                                        Balance: {formatEther(contract.balance)} ETH
                                    </Text>
                                </View>

                                <View className="flex-row items-center mb-1">
                                    <Ionicons name="calendar-outline" size={16} color="#64748b" />
                                    <Text className="ml-2 text-sm text-[#64748b]">
                                        Deadline: {formatDate(contract.releaseDate)}
                                    </Text>
                                </View>

                                <View className="flex-row items-center">
                                    <Ionicons 
                                        name={contract.isCreator ? "arrow-up-circle" : "arrow-down-circle"} 
                                        size={16} 
                                        color="#64748b" 
                                    />
                                    <Text className="ml-2 text-sm text-[#64748b]">
                                        Role: {contract.isCreator ? 'Creator' : 'Participant'}
                                    </Text>
                                </View>

                                <View className="mt-2 pt-2 border-t border-gray-100">
                                    <Text className="text-xs text-[#94a3b8]">
                                        Tap to view details and actions
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            )}

            {/* Contract Details Modal */}
            <Modal
                visible={showDetailsModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDetailsModal(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
                        <View className="flex-row items-center justify-between mb-6">
                            <Text className="text-2xl font-bold text-[#0f172a]">Contract Details</Text>
                            <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                                <Ionicons name="close" size={28} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {selectedContract && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Title */}
                                <View className="mb-4">
                                    <Text className="text-sm font-semibold text-[#64748b] mb-1">Title</Text>
                                    <Text className="text-lg text-[#0f172a]">{selectedContract.dataHash}</Text>
                                </View>

                                {/* Status */}
                                <View className="mb-4">
                                    <Text className="text-sm font-semibold text-[#64748b] mb-1">Status</Text>
                                    <Text className={`text-lg font-semibold ${getStatusColor(selectedContract)}`}>
                                        {getStatusText(selectedContract)}
                                    </Text>
                                </View>

                                {/* Role */}
                                <View className="mb-4">
                                    <Text className="text-sm font-semibold text-[#64748b] mb-1">Your Role</Text>
                                    <Text className="text-lg text-[#0f172a]">
                                        {selectedContract.isCreator ? 'Creator' : 'Participant'}
                                    </Text>
                                </View>

                                {/* Amount */}
                                <View className="mb-4">
                                    <Text className="text-sm font-semibold text-[#64748b] mb-1">Contract Amount</Text>
                                    <Text className="text-lg text-[#0f172a]">
                                        {formatEther(selectedContract.amount)} ETH
                                    </Text>
                                </View>

                                {/* Balance */}
                                <View className="mb-4">
                                    <Text className="text-sm font-semibold text-[#64748b] mb-1">Current Balance</Text>
                                    <Text className="text-lg text-[#0f172a]">
                                        {formatEther(selectedContract.balance)} ETH
                                    </Text>
                                </View>

                                {/* Addresses */}
                                <View className="mb-4">
                                    <Text className="text-sm font-semibold text-[#64748b] mb-1">Contract Address</Text>
                                    <Text className="text-xs text-[#0f172a] font-mono">
                                        {selectedContract.address}
                                    </Text>
                                </View>

                                <View className="mb-4">
                                    <Text className="text-sm font-semibold text-[#64748b] mb-1">Creator</Text>
                                    <Text className="text-xs text-[#0f172a] font-mono">
                                        {selectedContract.investor}
                                    </Text>
                                </View>

                                <View className="mb-4">
                                    <Text className="text-sm font-semibold text-[#64748b] mb-1">Particiapnt</Text>
                                    <Text className="text-xs text-[#0f172a] font-mono">
                                        {selectedContract.founder}
                                    </Text>
                                </View>

                                {/* Dates */}
                                <View className="mb-4">
                                    <Text className="text-sm font-semibold text-[#64748b] mb-1">Created</Text>
                                    <Text className="text-lg text-[#0f172a]">
                                        {formatDate(selectedContract.createdAt)}
                                    </Text>
                                </View>

                                <View className="mb-6">
                                    <Text className="text-sm font-semibold text-[#64748b] mb-1">Release Date</Text>
                                    <Text className="text-lg text-[#0f172a]">
                                        {formatDate(selectedContract.releaseDate)}
                                    </Text>
                                </View>

                                {/* Debug Info */}
                                <View className="mb-4 p-3 bg-gray-50 rounded-lg">
                                    <Text className="text-xs font-semibold text-[#64748b] mb-2">Action Status:</Text>
                                    <Text className="text-xs text-[#0f172a]">Released: {selectedContract.released ? 'Yes' : 'No'}</Text>
                                    <Text className="text-xs text-[#0f172a]">Balance: {formatEther(selectedContract.balance)} ETH</Text>
                                    <Text className="text-xs text-[#0f172a]">Is Creator: {selectedContract.isCreator ? 'Yes' : 'No'}</Text>
                                    <Text className="text-xs text-[#0f172a]">Is Participant: {selectedContract.isParticipant ? 'Yes' : 'No'}</Text>
                                    <Text className="text-xs text-[#0f172a]">Deadline Passed: {Math.floor(Date.now() / 1000) >= selectedContract.releaseDate ? 'Yes' : 'No'}</Text>
                                </View>

                                {/* Action Buttons */}
                                {!selectedContract.released && selectedContract.balance > BigInt(0) ? (
                                    <View className="mb-4">
                                        {selectedContract.isParticipant && 
                                         Math.floor(Date.now() / 1000) >= selectedContract.releaseDate && (
                                            <TouchableOpacity
                                                onPress={() => handleReleaseFunds(selectedContract)}
                                                disabled={isProcessing}
                                                className={`rounded-lg py-4 items-center ${
                                                    isProcessing ? 'bg-gray-400' : 'bg-green-600'
                                                }`}
                                            >
                                                <Text className="text-white font-semibold text-lg">
                                                    {isProcessing ? 'Processing...' : 'Release Funds'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}

                                        {!selectedContract.isCreator && !selectedContract.isParticipant && (
                                            <View className="bg-yellow-50 rounded-lg p-4">
                                                <Text className="text-center text-yellow-800">
                                                    You are not a party to this contract
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    <View className="mb-4">
                                        {selectedContract.released ? (
                                            <View className="bg-gray-100 rounded-lg p-4">
                                                <Text className="text-center text-gray-600">
                                                    This contract has been completed
                                                </Text>
                                            </View>
                                        ) : (
                                            <View className="bg-yellow-50 rounded-lg p-4">
                                                <Text className="text-center text-yellow-800">
                                                    No funds available for action
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
