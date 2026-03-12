import React, { useEffect } from "react";
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText as Text } from '@/components/ui/ThemedText';
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useWindowDimensions } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { LuxuryBackground } from "@/components/game/luxury-background";
import { ProButton } from "@/components/ui/ProButton";

export default function HomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isSmallScreen = height < 400 || width < 400; // to handle small devices in both orientations
  const titleOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0);

  useEffect(() => {
    // تحريك العنوان
    titleOpacity.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    // تحريك الزر
    buttonScale.value = withDelay(
      600,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <LuxuryBackground>
        <View
          style={[
            styles.container,
            (isLandscape || isSmallScreen) && { paddingVertical: 20 },
            { width: "100%" }
          ]}
        >
          {/* Title */}
          <Animated.View
            style={[
              styles.titleContainer,
              titleAnimatedStyle,
            ]}
          >
            <Text
              style={[
                styles.title,
                (isLandscape || isSmallScreen) && {
                  fontSize: 32,
                  marginBottom: 4,
                },
              ]}
            >
              Card Clash
            </Text>
            <Text
              style={[
                styles.subtitle,
                (isLandscape || isSmallScreen) && { fontSize: 14 },
              ]}
            >
              ربح الكروت حسب الجولة
            </Text>
          </Animated.View>

          {/* Button */}
          <Animated.View
            style={[
              styles.buttonContainer,
              buttonAnimatedStyle,
            ]}
          >
            <ProButton
              label="ابدأ المواجهة"
              onPress={() => router.push("/screens/game-mode" as any)}
              variant="primary"
              style={
                isLandscape || isSmallScreen
                  ? { minHeight: 44, width: Math.min(width * 0.8, 220) }
                  : { minHeight: 52, width: Math.min(width * 0.8, 280) }
              }
              labelStyle={
                isLandscape || isSmallScreen
                  ? { fontSize: 18 }
                  : { fontSize: 22 }
              }
            />
          </Animated.View>
        </View>
      </LuxuryBackground>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingVertical: 40,
  },
  titleContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#d4af37",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#a0a0a0",
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  startButton: {
    backgroundColor: "#d4af37",
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 32,
    elevation: 8,
    shadowColor: "#d4af37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
  },
});
