import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


//Icons Imports
import { ProfilePicIcon } from "@/components/ui/icons/profile-pic/profilePic";
import Octicons from "@expo/vector-icons/Octicons";

export default function TabsLayout() {
  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#8a00c2",
          tabBarInactiveTintColor: "#9ca3af",
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#ffffff",
            borderTopWidth: 0,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
            borderRadius: 32,
            marginHorizontal: 16,
            marginBottom: Platform.OS === "ios" ? 32 : 16,
            position: "absolute",
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
              },
              android: {
                elevation: 12,
              },
            }),
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Messages",
            tabBarLabel: "Messages",
            tabBarIcon: ({ color, size }) => (
              <Octicons name="sparkles-fill" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarLabel: "Profile",
            tabBarIcon: ({ color, size }) => (
              <ProfilePicIcon size={size} color={color} />
            ),
          }}
        />
        
      </Tabs>
    </SafeAreaView>
  );
}

