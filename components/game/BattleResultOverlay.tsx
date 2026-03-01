/**
 * BattleResultOverlay — Cinematic win/lose/draw result screen.
 *
 * Slides in from below, shows result + stats, auto-dismisses or
 * waits for user tap.
 *
 * Animations:
 *   - Container slides up + fades in (350ms)
 *   - Icon scales in with spring bounce
 *   - Text fades in delayed
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withDelay,
    withSequence,
    runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { ANIM_DURATION } from '@/constants/animationConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

type RoundOutcome = 'player' | 'bot' | 'draw';

interface BattleResultOverlayProps {
    visible: boolean;
    winner: RoundOutcome | null;
    playerDamage?: number;
    botDamage?: number;
    isLastRound?: boolean;
    onNext: () => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const OUTCOME_CONFIG: Record<RoundOutcome, {
    icon: string;
    titleAr: string;
    color: string;
    bgColor: string;
}> = {
    player: {
        icon: '🎉',
        titleAr: 'أنت الفائز!',
        color: '#4ade80',
        bgColor: 'rgba(34,197,94,0.15)',
    },
    bot: {
        icon: '😢',
        titleAr: 'البوت يفوز!',
        color: '#f87171',
        bgColor: 'rgba(239,68,68,0.15)',
    },
    draw: {
        icon: '🤝',
        titleAr: 'تعادل!',
        color: '#fbbf24',
        bgColor: 'rgba(251,191,36,0.15)',
    },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function BattleResultOverlay({
    visible,
    winner,
    playerDamage,
    botDamage,
    isLastRound = false,
    onNext,
}: BattleResultOverlayProps) {
    const translateY = useSharedValue(200);
    const opacity = useSharedValue(0);
    const iconScale = useSharedValue(0);
    const textOpacity = useSharedValue(0);

    useEffect(() => {
        if (visible && winner) {
            // Slide up container
            translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
            opacity.value = withTiming(1, { duration: ANIM_DURATION.CINEMATIC });

            // Spring pop icon
            iconScale.value = withDelay(
                100,
                withSequence(
                    withSpring(1.3, { damping: 8, stiffness: 300 }),
                    withSpring(1.0, { damping: 12, stiffness: 200 })
                )
            );

            // Fade text after icon
            textOpacity.value = withDelay(200, withTiming(1, { duration: 200 }));

            // Haptics
            if (Platform.OS !== 'web') {
                if (winner === 'player') {
                    runOnJS(triggerHaptic)('success');
                } else if (winner === 'bot') {
                    runOnJS(triggerHaptic)('error');
                } else {
                    runOnJS(triggerHaptic)('warning');
                }
            }
        } else {
            translateY.value = withTiming(200, { duration: 200 });
            opacity.value = withTiming(0, { duration: 150 });
            iconScale.value = 0;
            textOpacity.value = 0;
        }
    }, [visible, winner]);

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: iconScale.value }],
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
    }));

    if (!winner) return null;

    const cfg = OUTCOME_CONFIG[winner];

    return (
        <Animated.View style={[styles.overlay, containerStyle]}>
            <View style={[styles.card, { backgroundColor: cfg.bgColor, borderColor: cfg.color }]}>

                {/* Icon */}
                <Animated.Text style={[styles.icon, iconStyle]}>
                    {cfg.icon}
                </Animated.Text>

                {/* Title */}
                <Animated.View style={textStyle}>
                    <Text style={[styles.title, { color: cfg.color }]}>
                        {cfg.titleAr}
                    </Text>
                </Animated.View>

                {/* Damage stats */}
                {(playerDamage !== undefined || botDamage !== undefined) && (
                    <Animated.View style={[styles.statsRow, textStyle]}>
                        {playerDamage !== undefined && (
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>ضرر اللاعب</Text>
                                <Text style={[styles.statValue, { color: '#ef4444' }]}>{playerDamage}</Text>
                            </View>
                        )}
                        {botDamage !== undefined && (
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>ضرر البوت</Text>
                                <Text style={[styles.statValue, { color: '#ef4444' }]}>{botDamage}</Text>
                            </View>
                        )}
                    </Animated.View>
                )}

                {/* CTA Button */}
                <Animated.View style={textStyle}>
                    <Pressable
                        style={[styles.nextButton, { backgroundColor: cfg.color }]}
                        onPress={onNext}
                        accessibilityRole="button"
                    >
                        <Text style={styles.nextButtonText}>
                            {isLastRound ? '🏆 النتيجة النهائية' : '▶ الجولة التالية'}
                        </Text>
                    </Pressable>
                </Animated.View>
            </View>
        </Animated.View>
    );
}

function triggerHaptic(type: 'success' | 'error' | 'warning') {
    const map = {
        success: Haptics.NotificationFeedbackType.Success,
        error: Haptics.NotificationFeedbackType.Error,
        warning: Haptics.NotificationFeedbackType.Warning,
    };
    Haptics.notificationAsync(map[type]).catch(() => { });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        zIndex: 1000,
        alignItems: 'center',
    },
    card: {
        width: '100%',
        borderRadius: 20,
        borderWidth: 1.5,
        paddingVertical: 20,
        paddingHorizontal: 24,
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(0,0,0,0.75)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
    },
    icon: {
        fontSize: 52,
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 24,
    },
    statItem: {
        alignItems: 'center',
        gap: 2,
    },
    statLabel: {
        color: '#9ca3af',
        fontSize: 11,
        fontWeight: '600',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '900',
    },
    nextButton: {
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 14,
        marginTop: 4,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
});
