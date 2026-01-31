import { Alert } from 'react-native';
import { encodeFunctionData } from 'viem';

// Minimal Contract ABI for write operations
const contractAbi = [
    {
        "inputs": [],
        "name": "refund",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "releaseFunds",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

export interface ContractActionParams {
    contractAddress: string;
    balance: bigint;
    releaseDate: number;
    released: boolean;
    isInvestor: boolean;
    isFounder: boolean;
}

export class ContractActions {
    /**
     * Release funds to founder after deadline
     */
    static async releaseFunds(
        client: any,
        contract: ContractActionParams,
        onSuccess?: () => void
    ): Promise<boolean> {
        // Validate founder permission
        if (!contract.isFounder) {
            Alert.alert('Error', 'Only the founder can release funds');
            return false;
        }

        // Check deadline
        const now = Math.floor(Date.now() / 1000);
        if (now < contract.releaseDate) {
            Alert.alert('Error', 'Deadline has not been reached yet');
            return false;
        }

        // Check if already released
        if (contract.released) {
            Alert.alert('Error', 'Funds have already been released');
            return false;
        }

        // Check balance
        if (contract.balance === BigInt(0)) {
            Alert.alert('Error', 'No funds to release');
            return false;
        }

        return new Promise((resolve) => {
            const formatEther = (wei: bigint) => {
                return (Number(wei) / 1e18).toFixed(4);
            };

            Alert.alert(
                'Confirm Release',
                `Are you sure you want to release ${formatEther(contract.balance)} ETH?`,
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => resolve(false)
                    },
                    {
                        text: 'Release',
                        onPress: async () => {
                            try {
                                const data = encodeFunctionData({
                                    abi: contractAbi,
                                    functionName: 'releaseFunds',
                                });

                                const hash = await client.sendTransaction({
                                    account: client.account,
                                    chain: client.chain,
                                    to: contract.contractAddress as `0x${string}`,
                                    data: data,
                                });

                                Alert.alert(
                                    'Success',
                                    `Funds released successfully!\n\nTransaction: ${hash.slice(0, 10)}...${hash.slice(-8)}`
                                );

                                onSuccess?.();
                                resolve(true);
                            } catch (error: any) {
                                console.error('Release error:', error);
                                Alert.alert(
                                    'Error',
                                    error?.message || 'Failed to release funds'
                                );
                                resolve(false);
                            }
                        }
                    }
                ]
            );
        });
    }

    /**
     * Refund to investor before deadline
     */
    static async refund(
        client: any,
        contract: ContractActionParams,
        onSuccess?: () => void
    ): Promise<boolean> {
        // Validate investor permission
        if (!contract.isInvestor) {
            Alert.alert('Error', 'Only the investor can request a refund');
            return false;
        }

        // Check deadline
        const now = Math.floor(Date.now() / 1000);
        if (now >= contract.releaseDate) {
            Alert.alert('Error', 'Deadline has passed. Cannot refund after deadline.');
            return false;
        }

        // Check if already released
        if (contract.released) {
            Alert.alert('Error', 'Funds have already been released');
            return false;
        }

        // Check balance
        if (contract.balance === BigInt(0)) {
            Alert.alert('Error', 'No funds to refund');
            return false;
        }

        return new Promise((resolve) => {
            const formatEther = (wei: bigint) => {
                return (Number(wei) / 1e18).toFixed(4);
            };

            Alert.alert(
                'Confirm Refund',
                `Are you sure you want to refund ${formatEther(contract.balance)} ETH?`,
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => resolve(false)
                    },
                    {
                        text: 'Refund',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                const data = encodeFunctionData({
                                    abi: contractAbi,
                                    functionName: 'refund',
                                });

                                const hash = await client.sendTransaction({
                                    account: client.account,
                                    chain: client.chain,
                                    to: contract.contractAddress as `0x${string}`,
                                    data: data,
                                });

                                Alert.alert(
                                    'Success',
                                    `Refund processed successfully!\n\nTransaction: ${hash.slice(0, 10)}...${hash.slice(-8)}`
                                );

                                onSuccess?.();
                                resolve(true);
                            } catch (error: any) {
                                console.error('Refund error:', error);
                                Alert.alert(
                                    'Error',
                                    error?.message || 'Failed to process refund'
                                );
                                resolve(false);
                            }
                        }
                    }
                ]
            );
        });
    }
}
