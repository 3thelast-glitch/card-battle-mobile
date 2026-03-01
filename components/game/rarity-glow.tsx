/**
 * RarityGlow — animated border glow ring for Epic & Legendary cards.
 * Uses Reanimated v3 withRepeat for infinite pulsing.
 */

import React from 'react';
import Animated from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { useGlowPulseAnimation } from '@/lib/animations';

interface RarityGlowProps {
    color: string;
    borderRadius: number;
    /** Larger = wider glow ring around the card */
    spread?: number;
}

export function RarityGlow({ color, borderRadius, spread = 8 }: RarityGlowProps) {
    const { animatedStyle } = useGlowPulseAnimation();

    return (
        <Animated.View
            style={[
                styles.glow,
                {
                    borderColor: color,
                    borderRadius: borderRadius + spread,
                    shadowColor: color,
                    top: -spread,
                    left: -spread,
                    right: -spread,
                    bottom: -spread,
                },
                animatedStyle,
            ]}
            pointerEvents="none"
        />
    );
}

const styles = StyleSheet.create({
    glow: {
        position: 'absolute',
        borderWidth: 2,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 12,
        elevation: 0,
    },
});
