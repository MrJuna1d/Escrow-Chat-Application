import { LoginWithOAuthInput, useLoginWithOAuth, usePrivy } from '@privy-io/expo';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { api } from '@/convex/_generated/api';
import { useMutation } from "convex/react";


export default function LoginScreen() {
  const router = useRouter();
  const { user } = usePrivy();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState("");

  const addUser = useMutation(api.users.upsertUser);


  const oauth = useLoginWithOAuth({
    onError: (err) => {
      setError(err.message || JSON.stringify(err));
      setIsLoggingIn(false);
    },
  });

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      // console.log('Starting OAuth login with Google...');
      // console.log('OAuth hook state before:', oauth.state);
      await oauth.login({ provider: 'google' } as LoginWithOAuthInput);
      // console.log('OAuth login result:', oauth.state);
    } catch (err: any) {
      Alert.alert('Login failed', String(err));
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    if (user) {
      addUser({
        privyId: user.id,
      });
    }
  }, [user,addUser]);

  // Redirect if user is already logged in (page refresh/reload)
  useEffect(() => {
    if (user) {
      // console.log('User already logged in, redirecting to tabs...');
      router.replace('/(tabs)');
    }
  }, [user, router]);

  return (
    <View className="flex-1 items-center justify-center bg-gradient-to-r from-pink-50 via-indigo-50 to-yellow-50">
      <View className="w-11/12 max-w-md bg-white rounded-xl p-6 shadow-lg">
        <View className="h-1 rounded-t-md bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 mb-4" />

        <Text className="text-2xl font-extrabold text-center mb-2 text-gray-800">Welcome</Text>
        <Text className="text-center text-gray-500 mb-6">Continue with your email or use a social account.</Text>

        <View className="space-y-4">
          {/* Google OAuth button */}
          <Pressable
            onPress={handleLogin}
            disabled={isLoggingIn}
            className={`flex-row items-center justify-center p-3 rounded-lg ${isLoggingIn ? 'bg-gray-200' : 'bg-white'} border border-gray-200`}
          >
            <View className="w-8 h-8 rounded-full mr-3 flex items-center justify-center" style={{ backgroundColor: '#fff' }}>
              <Text className="text-lg font-bold text-red-500">G</Text>
            </View>
            {isLoggingIn ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text className="text-gray-800 font-medium">Sign in with Google</Text>
            )}
          </Pressable>

          {/* provider state info (optional) */}
          {oauth.state?.status && (
            <Text className="text-sm text-gray-500 text-center">Auth state: {oauth.state.status}</Text>
          )}
          {error && (
            <Text className="text-sm text-red-600 text-center">Error: {error}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

