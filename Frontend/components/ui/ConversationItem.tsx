import React from "react";
import { TouchableOpacity, View } from "react-native";
import { MatchAvatar } from "./MatchAvatar";
import { Text as UIText } from "./text";

interface ConversationItemProps {
  initial: string;
  company: string;
  sender: string;
  message: string;
  tag: string;
  timestamp: string;
  hasNotification?: boolean;
  onPress?: () => void;
}

export function ConversationItem({
  initial,
  company,
  sender,
  message,
  tag,
  timestamp,
  hasNotification = false,
  onPress,
}: ConversationItemProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="py-4 border-b border-gray-200"
    >
      <View className="flex-row items-start">
        {/* Left: Avatar */}
        <View className="mr-4">
          <MatchAvatar initial={initial} size={56} hasNotification={false} />
        </View>

        {/* Middle: Text Content */}
        <View className="flex-1 mr-3 pr-2">
          <UIText className="text-base font-semibold mb-1">{company}</UIText>
          <UIText className="text-sm text-gray-600 mb-1">{sender}</UIText>
          <UIText className="text-sm mb-2" numberOfLines={1}>
            {message}
          </UIText>
          <View className="mt-2">
            <UIText className="text-xs text-gray-700 bg-gray-200 px-3 py-1 rounded-full">
              {tag}
            </UIText>
          </View>
        </View>

        {/* Right: Timestamp & Notification */}
        <View className="items-end justify-start" style={{ minWidth: 70 }}>
          <UIText className="text-xs text-gray-500 mb-2">{timestamp}</UIText>
          {hasNotification && (
            <View
              className="bg-red-500"
              style={{ width: 8, height: 8, borderRadius: 4, marginTop: 4 }}
            />
        )}
      </View>
    </View>
  </TouchableOpacity>
);
}
