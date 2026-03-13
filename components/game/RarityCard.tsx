/**
 * RarityCard – Premium game card component with high-end visual effects.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ 5 ANIMATED VISUAL LAYERS (applied conditionally by rarity):          │
 * │                                                                      │
 * │ LAYER 1 → Holo-Foil Sweep          (Epic + Legendary)                │
 * │   - Animated diagonal LinearGradient sweep across card surface       │
 * │   - Creates iridescent shimmer / rainbow-foil effect                 │
 * │   - Duration: Epic 7 000 ms · Legendary 3 500 ms                    │
 * │   - Opacity:  Epic 0.40  · Legendary 0.65                           │
 * │                                                                      │
 * │ LAYER 2 → Rotating Magic Circles behind stat orbs                    │
 * │           (Epic + Legendary)                                         │
 * │   - Concentric dashed rings + spoke lines + gem diamonds             │
 * │   - Two counter-rotating rings per stat orb                          │
 * │   - Speed: Epic 8 000 ms · Legendary 5 000 ms                       │
 * │   - SVG-based for crisp rendering at all DPIs                        │
 * │                                                                      │
 * │ LAYER 3 → Breathing Aura / Pulsing Border  (Legendary ONLY)         │
 * │   - Animated borderColor oscillation (#7C5B1A ↔ #FFE087)            │
 * │   - Shadow opacity + radius breathe (0.3→0.85 / 8→28)              │
 * │   - Subtle scale pulse (0.995 → 1.008)                              │
 * │                                                                      │
 * │ LAYER 4 → Static SVG Filigree Corners                                │
 * │           (Rare + Epic + Legendary)                                  │
 * │   - Ornate corner branches with decorative leaves                    │
 * │   - Corner rose ornament with spoke lines + gem highlight            │
 * │   - Chain-link details along arms                                    │
 * │   - 4 corners for Legendary, 2 (top) for Rare/Epic                  │
 * │                                                                      │
 * │ LAYER 5 → Premium Stat Orbs         (Epic + Legendary)               │
 * │   - Circular glass-like orbs replacing flat stat badges              │
 * │   - Magic Circle rings rotate behind each orb                        │
 * │   - Rarity-colored border + glow shadow                              │
 * │   - Center name block with decorative star row                       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * CORE ANIMATIONS (60 fps · Reanimated v3/v4):
 *   - Tap     → scale(1.06) + rotate(2°) + 150 ms spring
 *   - Summon  → slide-up + scale(1.25→1) spring entrance
 *   - Selected → scale(1.05) hover
 *   - 3D shadow: shadowRadius 8–24 scaled by rarity
 */

import React, { JSX, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ViewStyle,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    interpolate,
    interpolateColor,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Svg,
    Circle,
    Path,
    Defs,
    LinearGradient as SvgLinearGradient,
    Stop,
    Line,
    Polygon,
    Ellipse,
    G,
} from 'react-native-svg';
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

// ─── Rarity Configuration ────────────────────────────────────────────────────

const ELVEN = {
    bg: '#06150A',
    bgMid: '#0A1F0F',
    forest: '#0d2315',
    gold: '#FFD700',
    goldMid: '#C8A84B',
    goldDim: 'rgba(200,168,75,0.35)',
    goldGlow: 'rgba(200,168,75,0.55)',
    leaf: '#3FA66A',
    leafFade: 'rgba(63,166,106,0.25)',
    vine: '#2D6E45',
    mist: 'rgba(0,140,60,0.4)',
} as const;

// gradient colors بديل لـ CARD_GRADIENTS عند theme=elven
const ELVEN_GRADIENTS: Record<CardRarityName, string[]> = {
    common: [ELVEN.bg, ELVEN.bgMid],
    rare: [ELVEN.bgMid, '#071A0C', ELVEN.forest],
    epic: ['#080F06', '#0E2610', '#0A1A08'],
    legendary: ['#050F04', '#0C1E0A', '#112510', '#050F04'],
};

const ELVEN_BORDERS: Record<CardRarityName, string> = {
    common: 'rgba(200,168,75,0.25)',
    rare: 'rgba(200,168,75,0.45)',
    epic: 'rgba(200,168,75,0.65)',
    legendary: ELVEN.goldMid,
};

const ELVEN_GLOW: Record<CardRarityName, string> = {
    common: 'transparent',
    rare: ELVEN.leaf,
    epic: ELVEN.goldMid,
    legendary: ELVEN.gold,
};

const RARITY_CONFIG = {
    common: {
        borderColor: '#374151',
        borderWidth: 1.5,
        glowColor: null,
        filigree: false,
        foilSweep: false,
        magicCircles: false,
        breathingAura: false,
        foilDuration: 0,
        foilOpacity: 0,
        circleColor: null,
        circleSpeed: 0,
    },
    rare: {
        borderColor: '#B87333',
        borderWidth: 2,
        glowColor: '#CD7F32',
        filigree: true,
        foilSweep: false,
        magicCircles: false,
        breathingAura: false,
        foilDuration: 0,
        foilOpacity: 0,
        circleColor: '#B87333',
        circleSpeed: 0,
    },
    epic: {
        borderColor: '#7C3AED',
        borderWidth: 2.5,
        glowColor: '#A855F7',
        filigree: true,
        foilSweep: true,
        magicCircles: true,
        breathingAura: false,
        foilDuration: 7000,
        foilOpacity: 0.40,
        circleColor: '#A855F7',
        circleSpeed: 8000,
    },
    legendary: {
        borderColor: '#D97706',
        borderWidth: 3,
        glowColor: '#FFD700',
        filigree: true,
        foilSweep: true,
        magicCircles: true,
        breathingAura: true,
        foilDuration: 3500,
        foilOpacity: 0.65,
        circleColor: '#FFD700',
        circleSpeed: 5000,
    },
} as const;


// ─── Rarity Glow Ring ────────────────────────────────────────────────────────

function GlowRing({
    color,
    borderRadius,
}: {
    color: string;
    borderRadius: number;
}): JSX.Element {
    const { animatedStyle } = useGlowPulse();
    return (
        <Animated.View
            style={[
                styles.glowRing,
                { borderColor: color, borderRadius, shadowColor: color },
                animatedStyle,
            ]}
            pointerEvents="none"
        />
    );
}

// ─── Effect Icons ────────────────────────────────────────────────────────────

const EFFECT_ICON: Record<CardEffectType, string> = {
    taunt: '🛡️',
    divine_shield: '✨',
    poison: '☠️',
    stealth: '👁️',
    charge: '⚡',
    lifesteal: '🩸',
    windfury: '💨',
};

// ─── Size Presets ────────────────────────────────────────────────────────────

const SIZES = {
    small: { w: 90, h: 135, name: 8, stat: 8, badge: 6 },
    medium: { w: 160, h: 240, name: 11, stat: 10, badge: 8 },
    large: { w: 200, h: 300, name: 13, stat: 13, badge: 10 },
    landscape: { w: 220, h: 310, name: 14, stat: 13, badge: 10 },
} as const;

// ─── Props ───────────────────────────────────────────────────────────────────

export interface RarityCardProps {
    card: Card;
    rarity?: CardRarityName;
    size?: keyof typeof SIZES;
    theme?: 'default' | 'elven';   // ← أضف هذا فقط
    isSelected?: boolean;
    showStats?: boolean;
    playEntrance?: boolean;
    entranceDelay?: number;
    onPress?: () => void;
    onPressIn?: () => void;
    onPressOut?: () => void;
    disabled?: boolean;
    style?: ViewStyle;
}

// ─── SUB-COMPONENT A: Holo-Foil Sweep (Epic + Legendary) ────────────────────

function HoloFoilSweep({
    cardWidth,
    cardHeight,
    duration,
    opacity,
}: {
    cardWidth: number;
    cardHeight: number;
    duration: number;
    opacity: number;
}): JSX.Element {
    const sweepX = useSharedValue(-cardWidth);

    useEffect(() => {
        sweepX.value = withRepeat(
            withTiming(cardWidth * 1.5, {
                duration,
                easing: Easing.inOut(Easing.quad),
            }),
            -1,
            false
        );
    }, [cardWidth, duration]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: sweepX.value }],
    }));

    return (
        <View style={styles.holoFoilContainer} pointerEvents="none">
            <Animated.View style={animatedStyle}>
                <LinearGradient
                    colors={[
                        'transparent',
                        `rgba(255,255,255,${opacity * 0.3})`,
                        `rgba(180,120,255,${opacity * 0.5})`,
                        `rgba(100,200,255,${opacity * 0.5})`,
                        `rgba(255,220,80,${opacity * 0.4})`,
                        `rgba(255,255,255,${opacity * 0.3})`,
                        'transparent',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.holoFoilGradient,
                        { width: cardWidth * 0.8, height: cardHeight * 1.5 },
                    ]}
                />
            </Animated.View>
        </View>
    );
}

// ─── SUB-COMPONENT B: Magic Circle Ring (Epic + Legendary) ──────────────────

function MagicCircleRing({
    size,
    color,
    speed,
    reverse,
}: {
    size: number;
    color: string;
    speed: number;
    reverse: boolean;
}): JSX.Element {
    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(reverse ? -360 : 360, {
                duration: speed,
                easing: Easing.linear,
            }),
            -1,
            false
        );
    }, [speed, reverse]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    const spokeLines = Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 45 * Math.PI) / 180;
        const x1 = 50 + 30 * Math.cos(angle);
        const y1 = 50 + 30 * Math.sin(angle);
        const x2 = 50 + 44 * Math.cos(angle);
        const y2 = 50 + 44 * Math.sin(angle);
        return (
            <Line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={color} strokeWidth={0.6} opacity={0.6}
            />
        );
    });

    const diamonds = [0, 90, 180, 270].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 50 + 46 * Math.cos(rad);
        const cy = 50 + 46 * Math.sin(rad);
        const dSize = 3;
        return (
            <Polygon
                key={i}
                points={`${cx},${cy - dSize} ${cx + dSize},${cy} ${cx},${cy + dSize} ${cx - dSize},${cy}`}
                fill={color} opacity={0.9}
            />
        );
    });

    return (
        <Animated.View
            style={[styles.magicCircleContainer, { width: size, height: size }, animatedStyle]}
            pointerEvents="none"
        >
            <Svg width={size} height={size} viewBox="0 0 100 100">
                <Circle cx={50} cy={50} r={46} stroke={color} strokeWidth={0.8} strokeDasharray="4 3" fill="none" opacity={0.5} />
                <Circle cx={50} cy={50} r={38} stroke={color} strokeWidth={0.5} fill="none" opacity={0.4} />
                <Circle cx={50} cy={50} r={30} stroke={color} strokeWidth={0.8} strokeDasharray="3 4" fill="none" opacity={0.35} />
                {spokeLines}
                {diamonds}
                <Circle cx={50} cy={50} r={2} fill={color} opacity={0.8} />
            </Svg>
        </Animated.View>
    );
}

// ─── SUB-COMPONENT C: Premium Stat Orb (Epic + Legendary) ───────────────────

function PremiumStatOrb({
    icon,
    value,
    color,
    glowColor,
    orbSize,
    fontSize,
    circleColor,
    circleSpeed,
    showMagicCircle,
}: {
    icon: string;
    value: number;
    color: string;
    glowColor: string;
    orbSize: number;
    fontSize: number;
    circleColor: string | null;
    circleSpeed: number;
    showMagicCircle: boolean;
}): JSX.Element {
    const bgColor = color === '#FFD700' ? '#0A0800' : '#0D0A1A';

    return (
        <View style={styles.premiumOrbWrapper}>
            {showMagicCircle && circleColor && (
                <>
                    <MagicCircleRing size={orbSize * 2.2} color={circleColor} speed={circleSpeed} reverse={false} />
                    <MagicCircleRing size={orbSize * 1.7} color={circleColor} speed={circleSpeed * 0.75} reverse={true} />
                </>
            )}
            <View
                style={[
                    styles.premiumOrb,
                    {
                        width: orbSize,
                        height: orbSize,
                        borderRadius: orbSize / 2,
                        backgroundColor: bgColor,
                        borderColor: color,
                        shadowColor: glowColor,
                        shadowOpacity: 0.8,
                        shadowRadius: 8,
                        elevation: 6,
                    },
                ]}
            >
                <Text style={[styles.premiumOrbIcon, { fontSize: fontSize * 0.9 }]}>{icon}</Text>
                <Text style={[styles.premiumOrbValue, { fontSize: fontSize * 0.95, color }]}>{value}</Text>
            </View>
        </View>
    );
}

// ─── SUB-COMPONENT D: Filigree SVG Corner (Rare + Epic + Legendary) ─────────

type FiligreePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface FiligreeSVGCornerProps {
    position: FiligreePosition;
    rarity: CardRarityName;
    size?: number;
}

function FiligreeSVGCorner({ position, rarity, size = 80 }: FiligreeSVGCornerProps): JSX.Element {
    const colorMap: Record<string, { stroke: string; gemFill: string }> = {
        legendary: { stroke: '#FFD700', gemFill: '#FFD700' },
        epic: { stroke: '#A855F7', gemFill: '#C084FC' },
        rare: { stroke: '#B87333', gemFill: '#CD7F32' },
    };

    const { stroke, gemFill } = colorMap[rarity] ?? { stroke: '#FFF', gemFill: '#FFF' };

    const transformMap: Record<FiligreePosition, string | undefined> = {
        'top-left': undefined,
        'top-right': `translate(${size}, 0) scale(-1, 1)`,
        'bottom-left': `translate(0, ${size}) scale(1, -1)`,
        'bottom-right': `translate(${size}, ${size}) scale(-1, -1)`,
    };

    const posStyleMap: Record<FiligreePosition, ViewStyle> = {
        'top-left': { top: 2, left: 2 },
        'top-right': { top: 2, right: 2 },
        'bottom-left': { bottom: 2, left: 2 },
        'bottom-right': { bottom: 2, right: 2 },
    };

    const transformProps = transformMap[position];
    const posStyle = posStyleMap[position] ?? {};

    const spokeLines = Array.from({ length: 8 }).map((_, i) => {
        const a = (i * 45 * Math.PI) / 180;
        const x1 = 14 + 5 * Math.cos(a);
        const y1 = 14 + 5 * Math.sin(a);
        const x2 = 14 + 10 * Math.cos(a);
        const y2 = 14 + 10 * Math.sin(a);
        return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={0.6} opacity={0.7} />;
    });

    return (
        <View style={[styles.filigreeCorner, posStyle]} pointerEvents="none">
            <Svg width={size} height={size} viewBox="0 0 80 80">
                <G transform={transformProps}>
                    <Path d="M 10 14 Q 30 10 60 12" stroke={stroke} strokeWidth={1.2} fill="none" opacity={0.85} />
                    <Path d="M 14 10 Q 10 30 12 60" stroke={stroke} strokeWidth={1.2} fill="none" opacity={0.85} />
                    {[32, 42, 52].map((x, i) => (
                        <Ellipse key={`hx-${i}`} cx={x} cy={11} rx={3} ry={1.5} fill={stroke} opacity={0.55} />
                    ))}
                    {[32, 42, 52].map((y, i) => (
                        <Ellipse key={`vy-${i}`} cx={11} cy={y} rx={1.5} ry={3} fill={stroke} opacity={0.55} />
                    ))}
                    <Circle cx={14} cy={14} r={7} stroke={stroke} strokeWidth={1} fill="none" opacity={0.8} />
                    <Circle cx={14} cy={14} r={4} fill={gemFill} opacity={0.9} />
                    {spokeLines}
                    <Circle cx={12.5} cy={12.5} r={1} fill="#fff" opacity={0.7} />
                    {[20, 28, 36, 44].map((x, i) => (
                        <Circle key={`ch-${i}`} cx={x} cy={13} r={0.8} fill={stroke} opacity={0.5} />
                    ))}
                    {[20, 28, 36, 44].map((y, i) => (
                        <Circle key={`cv-${i}`} cx={13} cy={y} r={0.8} fill={stroke} opacity={0.5} />
                    ))}
                </G>
            </Svg>
        </View>
    );
}

// ─── SUB-COMPONENT E: Breathing Border (Legendary ONLY) ─────────────────────

function BreathingBorder({
    width,
    height,
    borderRadius,
}: {
    width: number;
    height: number;
    borderRadius: number;
}): JSX.Element {
    const pulse = useSharedValue(0);

    useEffect(() => {
        pulse.value = withRepeat(
            withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        borderColor: interpolateColor(pulse.value, [0, 1], ['#7C5B1A', '#FFE087']),
        shadowOpacity: interpolate(pulse.value, [0, 1], [0.3, 0.85]),
        shadowRadius: interpolate(pulse.value, [0, 1], [8, 28]),
        transform: [{ scale: interpolate(pulse.value, [0, 1], [0.995, 1.008]) }],
    }));

    return (
        <Animated.View
            style={[
                styles.breathingBorder,
                { width: width + 6, height: height + 6, borderRadius: borderRadius + 2 },
                animatedStyle,
            ]}
            pointerEvents="none"
        />
    );
}

// ─── StatBadge ───────────────────────────────────────────────────────────────

function StatBadge({ icon, value, fs }: { icon: string; value: number; fs: number }): JSX.Element {
    return (
        <View style={styles.statBadge}>
            <Text style={{ fontSize: fs }}>{icon}</Text>
            <Text style={[styles.statValue, { fontSize: fs }]}>{value}</Text>
        </View>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function RarityCard({
    card,
    rarity: rarityOverride,
    size = 'medium',
    theme = 'default',
    isSelected = false,
    showStats = true,
    playEntrance = false,
    entranceDelay = 0,
    onPress,
    onPressIn: externalPressIn,
    onPressOut: externalPressOut,
    disabled = false,
    style,
}: RarityCardProps): JSX.Element {
    const rarity: CardRarityName =
        rarityOverride ?? (card.rarity as CardRarityName) ?? 'common';

    const dim = SIZES[size];
    const config = RARITY_CONFIG[rarity];

    // Theme-based overrides
    const isElven = theme === 'elven';
    const baseBorderColor = isElven ? ELVEN_BORDERS[rarity] : config.borderColor;
    const baseGlowColor = isElven ? ELVEN_GLOW[rarity] : CARD_GLOWS[rarity];

    // Gradient mapping to 3-layer system
    const gradient = isElven
        ? {
            base: ELVEN_GRADIENTS[rarity].length >= 3
                ? [ELVEN_GRADIENTS[rarity][0], ELVEN_GRADIENTS[rarity][1], ELVEN_GRADIENTS[rarity][2]] as const
                : [ELVEN_GRADIENTS[rarity][0], ELVEN_GRADIENTS[rarity][1] ?? ELVEN_GRADIENTS[rarity][0], ELVEN_GRADIENTS[rarity][1] ?? ELVEN_GRADIENTS[rarity][0]] as const,
            mid: [ELVEN_GRADIENTS[rarity][0], ELVEN_GRADIENTS[rarity][1] ?? ELVEN_GRADIENTS[rarity][0], 'transparent'] as const,
            top: [ELVEN.mist, 'rgba(255,255,255,0.05)', 'transparent'] as const,
        }
        : CARD_GRADIENTS[rarity];

    const glowColor = baseGlowColor;
    const shadowCfg = CARD_SHADOWS[rarity];
    const hasGlow = CARD_HAS_GLOW[rarity] || (isElven && rarity !== 'common');
    const hasParticles = CARD_HAS_PARTICLES[rarity];
    const badgeColor = CARD_BADGE_COLORS[rarity];
    const rarityLabel = CARD_RARITY_LABELS[rarity];

    const tap = useCardTapAnimation();
    const summon = useCardSummonAnimation(entranceDelay);
    const hover = useCardHoverScale(isSelected);

    useEffect(() => {
        if (playEntrance) {
            summon.reset();
            summon.play();
        }
    }, [playEntrance, card.id]);

    const outerShadow: ViewStyle = {
        shadowColor: glowColor ?? '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isSelected ? shadowCfg.shadowOpacity + 0.15 : shadowCfg.shadowOpacity,
        shadowRadius: isSelected ? shadowCfg.shadowRadius + 6 : shadowCfg.shadowRadius,
        elevation: isSelected ? 24 : 12,
    };

    const borderStyle: ViewStyle = {
        borderColor: isSelected ? '#ffffff' : baseBorderColor,
        borderWidth: isSelected ? 3 : config.borderWidth,
    };

    const orbSize = dim.w * 0.22;
    const starSize = dim.stat * 0.75;

    return (
        <Animated.View
            style={[
                styles.outerWrapper,
                { width: dim.w, height: dim.h },
                outerShadow,
                summon.animatedStyle,
                hover.animatedStyle,
                style,
            ]}
        >
            {/* LAYER 4 – Filigree Corners (outside card to avoid clipping) */}
            {config.filigree && rarity !== 'common' && (
                <>
                    <FiligreeSVGCorner position="top-left" rarity={rarity} />
                    <FiligreeSVGCorner position="top-right" rarity={rarity} />
                    {rarity === 'legendary' && (
                        <>
                            <FiligreeSVGCorner position="bottom-left" rarity={rarity} />
                            <FiligreeSVGCorner position="bottom-right" rarity={rarity} />
                        </>
                    )}
                </>
            )}

            {/* LAYER 3 – Breathing Border (Legendary ONLY) */}
            {rarity === 'legendary' && (
                <BreathingBorder width={dim.w} height={dim.h} borderRadius={BORDER_R} />
            )}

            {/* Pulsing glow ring (Epic + Legendary) */}
            {hasGlow && glowColor && (
                <GlowRing color={glowColor} borderRadius={BORDER_R + 2} />
            )}

            <Pressable
                onPress={disabled ? undefined : onPress}
                onPressIn={() => { if (!disabled) { tap.onPressIn(); externalPressIn?.(); } }}
                onPressOut={() => { if (!disabled) { tap.onPressOut(); externalPressOut?.(); } }}
                style={styles.pressable}
                accessibilityRole="button"
                accessibilityLabel={`${card.nameAr} card, rarity: ${rarityLabel.ar}`}
            >
                <Animated.View
                    style={[styles.card, { width: dim.w, height: dim.h }, borderStyle, tap.animatedStyle]}
                >
                    {/* ── Background gradient layers ── */}
                    <LinearGradient
                        colors={gradient.base}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={styles.bgBase}
                    />
                    <LinearGradient
                        colors={gradient.mid}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.bgMid}
                    />
                    <LinearGradient
                        colors={gradient.top}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={styles.bgTop}
                    />

                    {/* Diagonal shimmer stripe for Rare+ */}
                    {rarity !== 'common' && <View style={styles.shimmer} />}

                    {/* LAYER 1 – Holo Foil Sweep (Epic + Legendary) */}
                    {config.foilSweep && (
                        <HoloFoilSweep
                            cardWidth={dim.w}
                            cardHeight={dim.h}
                            duration={config.foilDuration}
                            opacity={config.foilOpacity}
                        />
                    )}

                    {/* ── Card Art ── */}
                    {/* REVERTED: source back to card.finalImage (local require format) */}
                    <Image
                        source={card.finalImage}
                        style={styles.art}
                        contentFit="contain"
                        cachePolicy="memory-disk"
                        transition={200}
                    />

                    {/* ── Top badges ── */}
                    <View style={styles.topRow}>
                        <View style={styles.elementPill}>
                            <Text style={[styles.elementEmoji, { fontSize: dim.badge + 2 }]}>{card.emoji}</Text>
                        </View>

                        {config.magicCircles ? (
                            <View
                                style={[
                                    styles.rarityPillPremium,
                                    { borderColor: config.borderColor, backgroundColor: `${config.borderColor}33` },
                                ]}
                            >
                                <Text style={[styles.rarityPillPremiumText, { color: config.borderColor }]}>
                                    {rarityLabel.ar}
                                </Text>
                            </View>
                        ) : (
                            <View style={[styles.rarityPill, { backgroundColor: badgeColor }]}>
                                <Text style={[styles.rarityPillText, { fontSize: dim.badge }]}>
                                    {rarityLabel.en[0]}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* ── Stats strip (bottom) ── */}
                    {/* REVERTED: stats back to card.attack, card.defense, card.hp */}
                    {showStats && (
                        <View style={styles.statsStrip}>
                            {config.magicCircles ? (
                                <>
                                    <View style={styles.premiumStatsRow}>
                                        <PremiumStatOrb
                                            icon="⚔️" value={card.attack}
                                            color={config.borderColor} glowColor={config.glowColor!}
                                            orbSize={orbSize} fontSize={dim.stat}
                                            circleColor={config.circleColor} circleSpeed={config.circleSpeed}
                                            showMagicCircle={config.magicCircles}
                                        />
                                        <View style={styles.centerNameBlock}>
                                            <Text style={[styles.cardName, { fontSize: dim.name }]} numberOfLines={2}>
                                                {card.nameAr}
                                            </Text>
                                            <View style={styles.starsRow}>
                                                {Array.from({ length: 10 }).map((_, i) => (
                                                    <Text key={i} style={{ fontSize: starSize }}>⭐</Text>
                                                ))}
                                            </View>
                                        </View>
                                        <PremiumStatOrb
                                            icon="❤️" value={card.hp}
                                            color={config.borderColor} glowColor={config.glowColor!}
                                            orbSize={orbSize} fontSize={dim.stat}
                                            circleColor={config.circleColor} circleSpeed={config.circleSpeed}
                                            showMagicCircle={config.magicCircles}
                                        />
                                    </View>
                                    <View style={{ alignItems: 'center', marginTop: 2 }}>
                                        <PremiumStatOrb
                                            icon="🛡️" value={card.defense}
                                            color={config.borderColor} glowColor={config.glowColor!}
                                            orbSize={orbSize * 0.85} fontSize={dim.stat * 0.9}
                                            circleColor={config.circleColor} circleSpeed={config.circleSpeed}
                                            showMagicCircle={false}
                                        />
                                    </View>
                                </>
                            ) : (
                                <>
                                    <View style={styles.statsRow}>
                                        <StatBadge icon="⚔️" value={card.attack} fs={dim.stat} />
                                        <StatBadge icon="🛡️" value={card.defense} fs={dim.stat} />
                                        <StatBadge icon="❤️" value={card.hp} fs={dim.stat} />
                                    </View>
                                    <Text style={[styles.cardName, { fontSize: dim.name }]} numberOfLines={1}>
                                        {card.nameAr}
                                    </Text>
                                </>
                            )}
                        </View>
                    )}

                    {/* ── Effect icons (right side) ── */}
                    {card.cardEffects && card.cardEffects.length > 0 && (
                        <View style={styles.effectColumn}>
                            {card.cardEffects.slice(0, 3).map((fx) => (
                                <Text key={fx} style={styles.effectIcon}>
                                    {EFFECT_ICON[fx as CardEffectType] ?? '◈'}
                                </Text>
                            ))}
                        </View>
                    )}

                    {/* ── Selected highlight overlay ── */}
                    {isSelected && <View style={styles.selectedOverlay} />}
                </Animated.View>
            </Pressable>

            {/* ── Fire particles (Legendary only) ── */}
            {hasParticles && !disabled && (
                <FireParticles width={dim.w} height={dim.h} />
            )}
        </Animated.View>
    );
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BORDER_R = 14;

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    outerWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
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
        zIndex: 1,
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
        height: '76%',
        position: 'absolute',
        top: 0,
    },
    topRow: {
        position: 'absolute',
        top: 6, left: 6, right: 6,
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
        width: 20, height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rarityPillText: {
        color: '#fff',
        fontWeight: '900',
        lineHeight: 13,
    },
    rarityPillPremium: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
    },
    rarityPillPremiumText: {
        fontSize: 7,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    statsStrip: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        paddingHorizontal: 8,
        paddingVertical: 6,
        backgroundColor: 'rgba(0,0,0,0.82)', // أغمق من 0.68
        borderBottomLeftRadius: BORDER_R - 1,
        borderBottomRightRadius: BORDER_R - 1,
        gap: 2,
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
        bottom: 56, right: 5,
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
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        borderWidth: 2,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 12,
        elevation: 0,
    },
    holoFoilContainer: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        overflow: 'hidden',
        zIndex: 1,
    },
    holoFoilGradient: {
        position: 'absolute',
        transform: [{ rotate: '-45deg' }],
    },
    magicCircleContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    premiumOrbWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    premiumOrb: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        zIndex: 1,
    },
    premiumOrbIcon: {
        marginBottom: 2,
    },
    premiumOrbValue: {
        fontWeight: '800',
    },
    filigreeCorner: {
        position: 'absolute',
        zIndex: 10,
    },
    breathingBorder: {
        position: 'absolute',
        borderWidth: 2.5,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
    },
    premiumStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 4,
        paddingVertical: 4,
    },
    centerNameBlock: {
        flex: 1,
        alignItems: 'center',
        gap: 3,
    },
    starsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 1,
    },
});

// ─── Exports ───────────────────────────────────────────────────────────────


export default RarityCard;