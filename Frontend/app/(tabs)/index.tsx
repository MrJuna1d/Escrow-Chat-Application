import { api } from "@/convex/_generated/api";
import Octicons from "@expo/vector-icons/Octicons";
import { usePrivy } from "@privy-io/expo";
import { useQuery } from "convex/react";
import { Link, useRouter } from "expo-router";
import { Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { ConversationItem } from "../../components/ui/ConversationItem";
import { Text as UIText } from "../../components/ui/text";
import {createWalletClient, custom} from 'viem';



import { useState } from "react";

export default function MatchScreen() {
  // console.log("entering Match")
  // Calculate bottom padding for tab bar
  // Tab bar height (64) + marginBottom (32 iOS / 16 Android) + extra padding
  const bottomPadding = Platform.OS === "ios" ? 120 : 100;

  // const matches = useQuery(api.users.listUsers, {excludePrivyId: myUserId || ""}) || [];
  // console.log("Using the api: ", matches.map(m => m.name));

  //const [input,setInput] = useState('')
  const { user } = usePrivy();
  

  const router = useRouter();

  const [input,setInput] = useState<string>('')
  const [isFocused, setIsFocused] = useState(false);


  const myUserData = useQuery(api.users.getUserData, {
    privyId: user?.id ?? ""
  });

  const myUserId = myUserData?.privyId;
  const myUserIdAsId = myUserData?._id;

  // Get existing matches
  const matchesWithPartners = useQuery(
    api.matches.getMatchesWithPartners, 
    myUserIdAsId ? { userId: myUserIdAsId } : "skip"
  );

  const list_of_matches = useQuery(
    api.users.listUsers, 
    myUserId ? {excludePrivyId: myUserId} : "skip"
  )
    
  //console.log("list of matches: ", list_of_matches)

  const filteredMatches = list_of_matches?.filter(user =>
    user.name
    ?.toLowerCase()
    .includes(input.toLowerCase())
  )
  const showDropdown =
  isFocused &&
  input.length > 0


  // console.log("filtered matches from the input: ",filteredMatches)


  

  // if (myUserId) {
  //   return <PartnersList myUserId={myUserId} bottomPadding={bottomPadding} />;
  // }

  // const userById = useQuery(
  //   api.users.getUserById,
  //   matches ? { id: matches.map(m => m._id) } : "skip",
  // );
  // console.log("****** User matches ****** \n", matches.map(m => m._id));
  // console.log("****** User by ID ****** \n", userById);

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
      >
        <View className="p-5">
          {/* Matches Header */}
          <UIText className="text-4xl font-bold mb-2">Messages</UIText>

          {/* Search Bar */}
          <View className="mb-6 mt-4">
            <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
              <Octicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-base"
                placeholder="Search users..."
                placeholderTextColor="#9CA3AF"
                value={input}
                onChangeText={setInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
            </View>
            {showDropdown && (
              <View className="absolute top-full left-0 right-0 bg-white rounded-xl shadow-md mt-2 z-50">
                {filteredMatches?.map((match, index) => (
                  <Pressable
                    key={match._id}
                    onPress={() => {
                      //setInput(match.name ?? "");
                      setInput("")
                      setIsFocused(false);
                      router.push(`/screens/chat?partnerId=${match._id}`);
                    }}
                    className="px-4 py-3 border-b border-gray-200"
                  >
                    <UIText>{match.name}</UIText>
                  </Pressable>
                ))}
              </View>
            )}

          </View>

          {/* Divider */}
          <View className="h-px bg-gray-200 mb-6" />

          {/* Matches Section */}
          <View className="flex-row items-center gap-2 mb-4">
            <Octicons name="comment-discussion" size={20} color="#0A66C2" />
            <UIText className="text-sm font-semibold">Your Conversations</UIText>
          </View>

          {/* Display existing matches */}
          {matchesWithPartners === undefined ? (
            <UIText className="text-gray-500">Loading matches...</UIText>
          ) : matchesWithPartners.length === 0 ? (
            <View className="items-center py-8">
              <Octicons name="inbox" size={48} color="#CBD5E1" />
              <UIText className="text-gray-500 mt-4 text-center">No conversations yet</UIText>
              <UIText className="text-gray-400 text-sm text-center mt-2">
                Search for users above to start chatting
              </UIText>
            </View>
          ) : (
            <View className="px-0 -mx-5">
              {matchesWithPartners.map(({ match, partner }) => {
                if (!partner) return null;
                return (
                  <View key={match._id} className="px-5">
                    <Link href={`/screens/chat?matchId=${match._id}`} asChild>
                      <ConversationItem
                        initial={partner.name?.charAt(0) || "?"}
                        company={partner.name || "Unknown"}
                        sender={partner.name || "Unknown"}
                        message="Tap to continue conversation..."
                        tag={partner.profilePic || "User"}
                        timestamp="Active"
                        hasNotification={false}
                        onPress={() => {
                          console.log("Open conversation with:", partner.name, "matchId:", match._id);
                        }}
                      />
                    </Link>
                  </View>
                );
              })}
            </View>
          )}
          
        </View>
      </ScrollView>
    </View>
  );
}
