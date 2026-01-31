import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { Text as UIText } from "./text";

interface MatchAvatarProps {
  initial: string;
  size?: number;
  hasNotification?: boolean;
}

export function MatchAvatar({ initial, size = 64, hasNotification = false }: MatchAvatarProps) {
  // Generate unique gradient ID to avoid conflicts
  const gradientId = useMemo(() => `gradient-${initial}-${size}-${Math.random().toString(36).substr(2, 9)}`, [initial, size]);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.avatarContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Svg width={size} height={size} style={StyleSheet.absoluteFillObject}>
          <Defs>
            <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#b794f6" stopOpacity="1" />
              <Stop offset="100%" stopColor="#8a00c2" stopOpacity="1" />
            </RadialGradient>
          </Defs>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 1}
            fill={`url(#${gradientId})`}
            stroke="#8a00c2"
            strokeWidth="2"
          />
        </Svg>
        <View style={styles.initialContainer}>
          <UIText className="text-white font-bold" style={{ fontSize: size * 0.4 }}>
            {initial}
          </UIText>
        </View>
      </View>
      {hasNotification && (
        <View
          style={[
            styles.notificationDot,
            {
              top: size * 0.05,
              right: size * 0.05,
              width: size * 0.25,
              height: size * 0.25,
              borderRadius: size * 0.125,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  avatarContainer: {
    position: "relative",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  initialContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  notificationDot: {
    position: "absolute",
    backgroundColor: "#ef4444",
    borderWidth: 2,
    borderColor: "#ffffff",
    zIndex: 2,
  },
});
