import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  walletAddress: string | null;
  signIn: (address: string, signature: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const address = await SecureStore.getItemAsync("walletAddress");
      const signature = await SecureStore.getItemAsync("walletSignature");
      
      if (address && signature) {
        // Verify signature with backend (you'll implement this)
        // For now, just restore the session
        setWalletAddress(address);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (address: string, signature: string) => {
    try {
      // TODO: Verify signature with your backend API
      // const response = await fetch('YOUR_API_ENDPOINT/verify-siwe', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ address, signature, message })
      // });
      // if (!response.ok) throw new Error('Verification failed');

      // Store credentials securely
      await SecureStore.setItemAsync("walletAddress", address);
      await SecureStore.setItemAsync("walletSignature", signature);

      setWalletAddress(address);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await SecureStore.deleteItemAsync("walletAddress");
      await SecureStore.deleteItemAsync("walletSignature");
      
      setWalletAddress(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        walletAddress,
        signIn,
        signOut,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

