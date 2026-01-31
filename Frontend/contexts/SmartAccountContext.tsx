import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useEmbeddedEthereumWallet } from '@privy-io/expo';
import { createSmartAccountClient } from 'permissionless';
import { toSimpleSmartAccount } from 'permissionless/accounts';
import { createPimlicoClient } from 'permissionless/clients/pimlico';
import { createPublicClient, http, type Address, type Hex } from 'viem';
import { sepolia } from 'viem/chains';
import { entryPoint07Address } from 'viem/account-abstraction';

// Get your Pimlico API key from: https://dashboard.pimlico.io
const PIMLICO_API_KEY = ''; // Replace with your key
const CHAIN = sepolia; // Replace with your chain

type SmartAccountClient = Awaited<ReturnType<typeof createSmartAccountClient>>;

interface SmartAccountContextType {
  smartAccountClient: SmartAccountClient | null;
  smartAccountAddress: Address | null;
  isLoading: boolean;
  sendTransaction: (params: {
    to: Address;
    data?: Hex;
    value?: bigint;
  }) => Promise<Hex>;
}

const SmartAccountContext = createContext<SmartAccountContextType | undefined>(undefined);

export const SmartAccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { wallets } = useEmbeddedEthereumWallet();
  const [smartAccountClient, setSmartAccountClient] = useState<SmartAccountClient | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(false);


  const initializeSmartAccount = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get the embedded wallet
      const embeddedWallet = wallets[0];
      if (!embeddedWallet) {
        console.error('No embedded wallet found');
        return;
      }

      // Get the EIP1193 provider from the embedded wallet
      const provider = await embeddedWallet.getProvider();

      // Create a public client for RPC calls
      const publicClient = createPublicClient({
        chain: CHAIN,
        transport: http(),
      });

      // Create the simple smart account using the embedded wallet as owner
      const simpleSmartAccount = await toSimpleSmartAccount({
        client: publicClient,
        owner: { request: provider.request.bind(provider) },
        entryPoint: {
          address: entryPoint07Address,
          version: '0.7',
        },
      });

      console.log('Smart Account Address:', simpleSmartAccount.address);
      setSmartAccountAddress(simpleSmartAccount.address);

      // Create Pimlico paymaster client for gas sponsorship
      const pimlicoUrl = `https://api.pimlico.io/v2/11155111/rpc?apikey=${PIMLICO_API_KEY}`;
      const pimlicoPaymaster = createPimlicoClient({
        transport: http(pimlicoUrl),
        entryPoint: {
          address: entryPoint07Address,
          version: '0.7',
        },
      });

      // Create the smart account client
      const bundlerUrl = `https://api.pimlico.io/v1/${CHAIN.id}/rpc?apikey=${PIMLICO_API_KEY}`;
      const client = createSmartAccountClient({
        account: simpleSmartAccount,
        chain: CHAIN,
        bundlerTransport: http(bundlerUrl),
        paymaster: pimlicoPaymaster,
        userOperation: {
          estimateFeesPerGas: async () => {
            return (await pimlicoPaymaster.getUserOperationGasPrice()).fast;
          },
        },
      });

      setSmartAccountClient(client);
      console.log('Smart account initialized successfully');
    } catch (error) {
      console.error('Error initializing smart account:', error);
    } finally {
      setIsLoading(false);
    }
  }, [wallets]);

    useEffect(() => {
    if (!wallets || wallets.length === 0) {
      setSmartAccountClient(null);
      setSmartAccountAddress(null);
      return;
    }

    initializeSmartAccount();
  }, [wallets, initializeSmartAccount]);

  const sendTransaction = async (params: {
    to: Address;
    data?: Hex;
    value?: bigint;
  }): Promise<Hex> => {
    if (!smartAccountClient || !smartAccountClient.account) {
      throw new Error('Smart account not initialized');
    }

    try {
      // @ts-ignore - permissionless types are complex
      const txHash = await smartAccountClient.sendTransaction({
        to: params.to,
        data: params.data || '0x',
        value: params.value || BigInt(0),
      });

      console.log('Transaction sent:', txHash);
      return txHash;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  };

  return (
    <SmartAccountContext.Provider
      value={{
        smartAccountClient,
        smartAccountAddress,
        isLoading,
        sendTransaction,
      }}
    >
      {children}
    </SmartAccountContext.Provider>
  );
};

export function useSmartAccount() {
  const context = useContext(SmartAccountContext);
  if (context === undefined) {
    throw new Error('useSmartAccount must be used within a SmartAccountProvider');
  }
  return context;
}