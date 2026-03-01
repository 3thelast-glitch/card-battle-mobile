/**
 * RarityCard — Production-quality card component.
 *
 * Design system driven by CardRarityName:
 *   Common    → Blue gradient,  #4F46E5 border, no glow
 *   Rare      → Gold gradient,  #F59E0B border, soft yellow glow
 *   Epic      → Purple gradient,#8B5CF6 border, pulsing purple glow
 *   Legendary → Red gradient,   #EF4444 border, fire particles + pulse
 *
 * Animations (60fps Reanimated v4):
 *   - Tap      → scale(1.06) + rotate(2°) + 150ms spring
 *   - Summon   → slide-up + scale(1.25→1) spring
 *   - Selected → scale(1.05) hover
 *   - 3D shadow: shadowRadius 8–24 by rarity
 */

import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { Image } from 'expo-image';
import type { Card } from '@/lib/game/types';
import type { CardRarityName, CardEffectType } from '@/types/card.types';
import {
    CARD_GRADIENTS,
    CARD_BORDERS,
    CARD_GLOWS,
    CARD_BADGE_COLORS,
    CARD_SHADOWS,
    CARD_HAS_GLOW,
    CARD_HAS_PARTICLES,
    CARD_RARITY_LABELS,
} from '@/constants/cardGradients';
import {
    useCardTapAnimation,
    useCardSummonAnimation,
    useCardHoverScale,
    useGlowPulse,
} from '@/hooks/useCardAnimations';
import { FireParticles } from '@/lib/particles';

// ─── Rarity Glow Ring ─────────────────────────────────────────────────────────

function GlowRing({ color, borderRadius }: { color: string; borderRadius: number }) {
    const { animatedStyle } = useGlowPulse();
    return (
        <Animated.View
            style={[
                styles.glowRing,
                {
                    borderColor: color,
                    borderRadius: borderRadius + 8,
                    shadowColor: color,
                    top: -8, left: -8, right: -8, bottom: -8,
                },
                animatedStyle,
            ]}
            pointerEvents="none"
        />
    );
}

// ─── Effect Badge ─────────────────────────────────────────────────────────────

const EFFECT_ICON: Record<CardEffectType, string> = {
    taunt: '🛡️',
    divine_shield: '✨',
    poison: '☠️',
    stealth: '👁️',
    charge: '⚡',
    lifesteal: '🩸',
    windfury: '💨',
};

// ─── Size Presets ─────────────────────────────────────────────────────────────

const SIZES = {
    small: { w: 90, h: 135, name: 8, stat: 8, badge: 6 },
    medium: { w: 160, h: 240, name: 10, stat: 10, badge: 8 },
    large: { w: 200, h: 300, name: 13, stat: 12, badge: 10 },
    landscape: { w: 200, h: 300, name: 13, stat: 12, badge: 10 },
} as const;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface RarityCardProps {
    card: Card;
    /** Rarity override (falls back to card.rarity ?? 'common') */
    rarity?: CardRarityName;
    size?: keyof typeof SIZES;
    isSelected?: boolean;
    showStats?: boolean;
    /** Trigger entrance summon animation on mount */
    playEntrance?: boolean;
    entranceDelay?: number;
    onPress?: () => void;
    onPressIn?: () => void;
    onPressOut?: () => void;
    disabled?: boolean;
    style?: ViewStyle;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RarityCard({
    card,
    rarity: rarityOverride,
    size = 'medium',
    isSelected = false,
    showStats = true,
    playEntrance = false,
    entranceDelay = 0,
    onPress,
    onPressIn: externalPressIn,
    onPressOut: externalPressOut,
    disabled = false,
    style,
}: RarityCardProps) {
    const rarity: CardRarityName = rarityOverride ?? (card.rarity as CardRarityName) ?? 'common';
    const dim = SIZES[size];
    const gradient = CARD_GRADIENTS[rarity];
    const borderColor = CARD_BORDERS[rarity];
    const glowColor = CARD_GLOWS[rarity];
    const shadowCfg = CARD_SHADOWS[rarity];
    const hasGlow = CARD_HAS_GLOW[rarity];
    const hasParticles = CARD_HAS_PARTICLES[rarity];
    const badgeColor = CARD_BADGE_COLORS[rarity];
    const rarityLabel = CARD_RARITY_LABELS[rarity];

    // ── Animations ──
    const tap = useCardTapAnimation();
    const summon = useCardSummonAnimation(entranceDelay);
    const hover = useCardHoverScale(isSelected);

    useEffect(() => {
        if (playEntrance) {
            summon.reset();
            summon.play();
        }
    }, [playEntrance, card.id]);

    // ── Styles ──
    const outerShadow: ViewStyle = {
        shadowColor: glowColor ?? '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isSelected ? shadowCfg.shadowOpacity + 0.15 : shadowCfg.shadowOpacity,
        shadowRadius: isSelected ? shadowCfg.shadowRadius + 6 : shadowCfg.shadowRadius,
        elevation: isSelected ? 24 : 12,
    };

    const borderStyle: ViewStyle = {
        borderColor: isSelected ? '#ffffff' : borderColor,
        borderWidth: isSelected ? 3 : 2.5,
    };

    return (
        <Animated.View
            style={[
                styles.outerWrapper,
                { width: dim.w, height: dim.h },
                outerShadow,
                playEntrance ? summon.animatedStyle : undefined,
                hover.animatedStyle,
                style,
            ]}
        >
            {/* Pulsing glow ring (Epic + Legendary) */}
            {hasGlow && glowColor && (
                <GlowRing color={glowColor} borderRadius={14} />
            )}

            <Pressable
                onPress={disabled ? undefined : onPress}
                onPressIn={() => {
                    if (!disabled) { tap.onPressIn(); externalPressIn?.(); }
                }}
                onPressOut={() => {
                    if (!disabled) { tap.onPressOut(); externalPressOut?.(); }
                }}
                style={styles.pressable}
                accessibilityRole="button"
                accessibilityLabel={`${card.nameAr} card, rarity: ${rarityLabel.ar}`}
            >
                <Animated.View style={[styles.card, { width: dim.w, height: dim.h }, borderStyle, tap.animatedStyle]}>

                    {/* ── Background gradient layers ── */}
                    <View style={[styles.bgBase, { backgroundColor: gradient[0] }]} />
                    <View style={[styles.bgMid, { backgroundColor: gradient[1], opacity: 0.7 }]} />
                    <View style={[styles.bgTop, { backgroundColor: gradient[2], opacity: 0.35 }]} />

                    {/* Diagonal shimmer stripe for Rare+ */}
                    {rarity !== 'common' && <View style={styles.shimmer} />}

                    {/* ── Card Art ── */}
                    <Image
                        source={card.finalImage}
                        style={styles.art}
                        contentFit="contain"
                        cachePolicy="memory-disk"
                        transition={200}
                    />

                    {/* ── Top badges ── */}
                    <View style={styles.topRow}>
                        {/* Element emoji (left) */}
                        <View style={styles.elementPill}>
                            <Text style={[styles.elementEmoji, { fontSize: dim.badge + 2 }]}>
                                {card.emoji}
                            </Text>
                        </View>

                        {/* Rarity badge (right) */}
                        <View style={[styles.rarityPill, { backgroundColor: badgeColor }]}>
                            <Text style={[styles.rarityPillText, { fontSize: dim.badge }]}>
                                {rarityLabel.en[0]}
                            </Text>
                        </View>
                    </View>

                    {/* ── Stats strip (bottom) ── */}
                    {showStats && (
                        <View style={styles.statsStrip}>
                            <View style={styles.statsRow}>
                                <StatBadge icon="⚔️" value={card.attack} fs={dim.stat} />
                                <StatBadge icon="🛡️" value={card.defense} fs={dim.stat} />
                                <StatBadge icon="❤️" value={card.hp} fs={dim.stat} />
                            </View>
                            <Text style={[styles.cardName, { fontSize: dim.name }]} numberOfLines={1}>
                                {card.nameAr}
                            </Text>
                        </View>
                    )}

                    {/* ── Effect icons (right side) ── */}
                    {card.cardEffects && card.cardEffects.length > 0 && (
                        <View style={styles.effectColumn}>
                            {card.cardEffects.slice(0, 3).map((fx) => (
                                <Text key={fx} style={styles.effectIcon}>
                                    {EFFECT_ICON[fx as CardEffectType] ?? '●'}
                                </Text>
                            ))}
                        </View>
                    )}

                    {/* ── Selected highlight overlay ── */}
                    {isSelected && <View style={styles.selectedOverlay} />}
                </Animated.View>
            </Pressable>

            {/* ── Fire particles (Legendary only, outside Pressable) ── */}
            {hasParticles && !disabled && (
                <View
                    style={[StyleSheet.absoluteFillObject, { borderRadius: 14, overflow: 'hidden' }]}
                    pointerEvents="none"
                >
                    <FireParticles width={dim.w} height={dim.h} />
                </View>
            )}
        </Animated.View>
    );
}

// ─── StatBadge ────────────────────────────────────────────────────────────────

function StatBadge({ icon, value, fs }: { icon: string; value: number; fs: number }) {
    return (
        <View style={styles.statBadge}>
            <Text style={{ fontSize: fs }}>{icon}</Text>
            <Text style={[styles.statValue, { fontSize: fs }]}>{value}</Text>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BORDER_R = 14;

const styles = StyleSheet.create({
    outerWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pressable: {
        borderRadius: BORDER_R,
    },
    card: {
        borderRadius: BORDER_R,
        overflow: 'hidden',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2.5,
    },
    bgBase: {
        ...StyleSheet.absoluteFillObject,
    },
    bgMid: {
        position: 'absolute',
        top: '30%',
        left: 0, right: 0, bottom: 0,
    },
    bgTop: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '55%',
    },
    shimmer: {
        position: 'absolute',
        top: '-20%',
        left: '-30%',
        width: '50%',
        height: '160%',
        backgroundColor: 'rgba(255,255,255,0.06)',
        transform: [{ rotate: '35deg' }],
    },
    art: {
        width: '100%',
        height: '72%',
        position: 'absolute',
        top: 0,
    },
    topRow: {
        position: 'absolute',
        top: 6,
        left: 6,
        right: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    elementPill: {
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 10,
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    elementEmoji: {
        lineHeight: 18,
    },
    rarityPill: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rarityPillText: {
        color: '#fff',
        fontWeight: '900',
        lineHeight: 13,
    },
    statsStrip: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 6,
        paddingVertical: 5,
        backgroundColor: 'rgba(0,0,0,0.68)',
        borderBottomLeftRadius: BORDER_R - 1,
        borderBottomRightRadius: BORDER_R - 1,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 3,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    statValue: {
        color: '#fff',
        fontWeight: '700',
    },
    cardName: {
        color: '#e5e7eb',
        textAlign: 'center',
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    effectColumn: {
        position: 'absolute',
        bottom: 56,
        right: 5,
        alignItems: 'center',
        gap: 2,
    },
    effectIcon: {
        fontSize: 10,
    },
    selectedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.13)',
        borderRadius: BORDER_R - 1,
    },
    glowRing: {
        position: 'absolute',
        borderWidth: 2,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 12,
        elevation: 0,
    },
});
