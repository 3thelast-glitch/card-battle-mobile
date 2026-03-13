/**
 * LuxuryCharacterCardAnimated — Premium card with animated VFX
 * Layers: HoloFoil · MagicCircles · BreathingBorder · Filigree · GlowRing
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue, useAnimatedStyle,
    withRepeat, withTiming, withSequence,
    interpolate, interpolateColor, Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Polygon, Ellipse } from 'react-native-svg';
import { Card, CardRarity } from '@/lib/game/types';

interface LuxuryCharacterCardAnimatedProps {
    card: Card;
    style?: ViewStyle;
}

const RARITY_THEMES = {
    common: {
        label: 'عادي', color: '#9CA3AF', borderColor: '#6B7280',
        badgeBg: 'rgba(20,20,20,0.9)', badgeBorder: '#6B7280', badgeText: '#9CA3AF',
        shadowColor: '#6B7280', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
        hasShine: false, hasFoil: false, hasMagicCircles: false,
        hasFiligree: false, hasPulse: false, foilDuration: 0,
    },
    rare: {
        label: 'نادر', color: '#CD7F32', borderColor: '#CD7F32',
        badgeBg: 'rgba(20,20,20,0.9)', badgeBorder: '#CD7F32', badgeText: '#D97706',
        shadowColor: '#CD7F32', shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
        hasShine: false, hasFoil: false, hasMagicCircles: false,
        hasFiligree: true, hasPulse: false, foilDuration: 0,
    },
    epic: {
        label: 'ملحمي', color: '#A855F7', borderColor: '#A855F7',
        badgeBg: 'rgba(20,20,20,0.9)', badgeBorder: '#A855F7', badgeText: '#A78BFA',
        shadowColor: '#A855F7', shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
        hasShine: true, hasFoil: true, hasMagicCircles: true,
        hasFiligree: true, hasPulse: false, foilDuration: 3500,
    },
    legendary: {
        label: 'أسطوري', color: '#FFD700', borderColor: '#FFD700',
        badgeBg: 'rgba(20,20,20,0.9)', badgeBorder: '#FFD700', badgeText: '#FBBF24',
        shadowColor: '#FFD700', shadowOpacity: 0.8, shadowRadius: 18, elevation: 10,
        hasShine: true, hasFoil: true, hasMagicCircles: true,
        hasFiligree: true, hasPulse: true, foilDuration: 2500,
    },
} as const;

// ─── Magic Circle ─────────────────────────────────────────────────────────────

function AnimatedMagicCircle({ color, size = 60, reverse = false }: {
    color: string; size?: number; reverse?: boolean;
}) {
    const rotation = useSharedValue(0);
    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(reverse ? -360 : 360, { duration: 8000, easing: Easing.linear }),
            -1, false
        );
    }, []);
    const animStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));
    const spokes = Array.from({ length: 8 }).map((_, i) => {
        const a = (i * 45 * Math.PI) / 180;
        return (
            <Line key={i}
                x1={50 + 28 * Math.cos(a)} y1={50 + 28 * Math.sin(a)}
                x2={50 + 44 * Math.cos(a)} y2={50 + 44 * Math.sin(a)}
                stroke={color} strokeWidth={0.7} opacity={0.6}
            />
        );
    });
    const gems = [0, 90, 180, 270].map((deg, i) => {
        const r = (deg * Math.PI) / 180;
        const cx = 50 + 46 * Math.cos(r), cy = 50 + 46 * Math.sin(r), d = 3;
        return (
            <Polygon key={i}
                points={`${cx},${cy - d} ${cx + d},${cy} ${cx},${cy + d} ${cx - d},${cy}`}
                fill={color} opacity={0.9}
            />
        );
    });
    return (
        <Animated.View style={[{ width: size, height: size }, animStyle]} pointerEvents="none">
            <Svg width={size} height={size} viewBox="0 0 100 100">
                <Circle cx={50} cy={50} r={46} stroke={color} strokeWidth={0.8} strokeDasharray="4 3" fill="none" opacity={0.5} />
                <Circle cx={50} cy={50} r={36} stroke={color} strokeWidth={0.5} fill="none" opacity={0.4} />
                <Circle cx={50} cy={50} r={26} stroke={color} strokeWidth={0.8} strokeDasharray="3 4" fill="none" opacity={0.35} />
                {spokes}
                {gems}
                <Circle cx={50} cy={50} r={2} fill={color} opacity={0.8} />
            </Svg>
        </Animated.View>
    );
}

// ─── Filigree Corner ──────────────────────────────────────────────────────────

function FiligreeCorner({ position, color }: {
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    color: string;
}) {
    const rot = position === 'top-left' ? 0 : position === 'top-right' ? 90
        : position === 'bottom-right' ? 180 : 270;
    const posStyle: ViewStyle = position === 'top-left' ? { top: 2, left: 2 }
        : position === 'top-right' ? { top: 2, right: 2 }
            : position === 'bottom-left' ? { bottom: 2, left: 2 }
                : { bottom: 2, right: 2 };
    const spokes = Array.from({ length: 8 }).map((_, i) => {
        const a = (i * 45 * Math.PI) / 180;
        return (
            <Line key={i}
                x1={14 + 5 * Math.cos(a)} y1={14 + 5 * Math.sin(a)}
                x2={14 + 10 * Math.cos(a)} y2={14 + 10 * Math.sin(a)}
                stroke={color} strokeWidth={0.6} opacity={0.7}
            />
        );
    });
    return (
        <View style={[styles.filigreeCorner, posStyle]} pointerEvents="none">
            <Svg width={40} height={40} viewBox="0 0 80 80"
                style={{ transform: [{ rotate: `${rot}deg` }] }}>
                <Line x1={10} y1={14} x2={60} y2={12} stroke={color} strokeWidth={1.2} opacity={0.85} />
                <Line x1={14} y1={10} x2={12} y2={60} stroke={color} strokeWidth={1.2} opacity={0.85} />
                {[32, 42, 52].map((x, i) => <Ellipse key={`hx${i}`} cx={x} cy={11} rx={3} ry={1.5} fill={color} opacity={0.55} />)}
                {[32, 42, 52].map((y, i) => <Ellipse key={`vy${i}`} cx={11} cy={y} rx={1.5} ry={3} fill={color} opacity={0.55} />)}
                <Circle cx={14} cy={14} r={7} stroke={color} strokeWidth={1} fill="none" opacity={0.8} />
                <Circle cx={14} cy={14} r={4} fill={color} opacity={0.9} />
                {spokes}
                <Circle cx={12.5} cy={12.5} r={1} fill="#fff" opacity={0.7} />
                {[20, 28, 36, 44].map((x, i) => <Circle key={`ch${i}`} cx={x} cy={13} r={0.8} fill={color} opacity={0.5} />)}
                {[20, 28, 36, 44].map((y, i) => <Circle key={`cv${i}`} cx={13} cy={y} r={0.8} fill={color} opacity={0.5} />)}
            </Svg>
        </View>
    );
}

// ─── Breathing Border ─────────────────────────────────────────────────────────

function BreathingBorder() {
    const pulse = useSharedValue(0);
    useEffect(() => {
        pulse.value = withRepeat(
            withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
            -1, true
        );
    }, []);
    const animStyle = useAnimatedStyle(() => ({
        borderColor: interpolateColor(pulse.value, [0, 1], ['#7C5B1A', '#FFE087']),
        shadowOpacity: interpolate(pulse.value, [0, 1], [0.3, 0.9]),
        shadowRadius: interpolate(pulse.value, [0, 1], [8, 28]),
        transform: [{ scale: interpolate(pulse.value, [0, 1], [0.997, 1.006]) }],
    }));
    return (
        <Animated.View style={[styles.breathingBorder, animStyle]} pointerEvents="none" />
    );
}

// ─── Glow Ring ────────────────────────────────────────────────────────────────

function GlowRing({ color }: { color: string }) {
    const opacity = useSharedValue(0.4);
    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1800 }),
                withTiming(0.4, { duration: 1800 })
            ), -1, false
        );
    }, []);
    const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    return (
        <Animated.View
            style={[styles.glowRing, { borderColor: color, shadowColor: color }, animStyle]}
            pointerEvents="none"
        />
    );
}

// ─── Helper: resolve image source for web + native ───────────────────────────

function resolveSource(src: any) {
    if (!src) return null;
    if (typeof src === 'string') return { uri: src };
    if (typeof src === 'number') return src; // require()
    if (typeof src === 'object' && src.uri) return src;
    return src;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LuxuryCharacterCardAnimated({ card, style }: LuxuryCharacterCardAnimatedProps) {
    const rarity: CardRarity = card.rarity ?? 'common';
    const theme = RARITY_THEMES[rarity];

    const foilPos = useSharedValue(-120);
    useEffect(() => {
        if (theme.hasFoil) {
            foilPos.value = withRepeat(
                withTiming(320, { duration: theme.foilDuration, easing: Easing.linear }),
                -1, false
            );
        }
    }, [rarity]);
    const foilStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: foilPos.value }],
    }));

    const imgSource = resolveSource(card.finalImage);

    return (
        <Animated.View
            style={[
                styles.cardContainer,
                {
                    borderColor: theme.borderColor,
                    shadowColor: theme.shadowColor,
                    shadowOpacity: theme.shadowOpacity,
                    shadowRadius: theme.shadowRadius,
                    elevation: theme.elevation,
                },
                style,
            ]}
        >
            {/* Breathing Border — Legendary only */}
            {theme.hasPulse && <BreathingBorder />}

            {/* Glow Ring — Epic + Legendary */}
            {(rarity === 'epic' || rarity === 'legendary') && (
                <GlowRing color={theme.color} />
            )}

            {/* Inner wrapper — overflow hidden يحصر الصورة */}
            <View style={styles.cardInner}>

                {/* ✅ الصورة كـ absolute background — تعمل على الويب والموبايل */}
                {imgSource && (
                    <Image
                        source={imgSource}
                        style={styles.bgImage}
                        resizeMode="cover"
                    />
                )}

                {/* Content layer فوق الصورة */}
                <View style={styles.contentLayer}>

                    {/* HoloFoil Sweep */}
                    {theme.hasFoil && (
                        <View style={styles.foilContainer} pointerEvents="none">
                            <Animated.View style={[styles.foilStrip, foilStyle]}>
                                <LinearGradient
                                    colors={[
                                        'transparent',
                                        'rgba(255,255,255,0.08)',
                                        'rgba(180,120,255,0.25)',
                                        'rgba(100,200,255,0.25)',
                                        'rgba(255,220,80,0.2)',
                                        'transparent',
                                    ]}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    style={styles.foilGradient}
                                />
                            </Animated.View>
                        </View>
                    )}

                    {/* Glass Shine */}
                    {theme.hasShine && (
                        <LinearGradient
                            colors={['rgba(255,255,255,0.07)', 'transparent', 'transparent']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.shineOverlay}
                            pointerEvents="none"
                        />
                    )}

                    {/* Inner Border */}
                    <View
                        style={[styles.innerBorder, { borderColor: theme.borderColor + '55' }]}
                        pointerEvents="none"
                    />

                    {/* Gradient overlay للنص */}
                    <LinearGradient
                        colors={['transparent', 'transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.92)']}
                        style={styles.gradientOverlay}
                        pointerEvents="none"
                    />

                    {/* Filigree Corners */}
                    {theme.hasFiligree && (
                        <>
                            <FiligreeCorner position="top-left" color={theme.color} />
                            <FiligreeCorner position="top-right" color={theme.color} />
                            {theme.hasPulse && (
                                <>
                                    <FiligreeCorner position="bottom-left" color={theme.color} />
                                    <FiligreeCorner position="bottom-right" color={theme.color} />
                                </>
                            )}
                        </>
                    )}

                    {/* Rarity Badge */}
                    <View style={[styles.rarityBadge, { backgroundColor: theme.badgeBg, borderColor: theme.badgeBorder }]}>
                        <Text style={[styles.rarityBadgeText, { color: theme.badgeText }]}>
                            ✦ {theme.label}
                        </Text>
                    </View>

                    {/* Name */}
                    <View style={styles.titlesContainer}>
                        <Text style={[styles.subtitle, { color: theme.color }]}>{card.nameAr}</Text>
                        <Text style={styles.title}>{card.nameEn ?? card.name}</Text>
                    </View>

                    {/* Description */}
                    <View style={[styles.descriptionBox, { borderColor: theme.color + '44' }]}>
                        <Text style={styles.descriptionText}>{card.race} - {card.cardClass}</Text>
                    </View>

                    {/* Stat Orbs */}
                    <View style={styles.statsContainer}>
                        {/* Defense */}
                        <View style={styles.orbWrapper}>
                            {theme.hasMagicCircles && (
                                <View style={styles.magicCircleWrapper}>
                                    <AnimatedMagicCircle color={theme.color} size={70} reverse={false} />
                                    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                                        <AnimatedMagicCircle color={theme.color} size={52} reverse={true} />
                                    </View>
                                </View>
                            )}
                            <View style={[styles.statOrb, { borderColor: theme.color, shadowColor: theme.color }]}>
                                <LinearGradient
                                    colors={['rgba(0,0,0,0.8)', 'rgba(20,20,30,0.95)']}
                                    style={styles.orbGradient}
                                >
                                    <Text style={styles.statOrbIcon}>🛡️</Text>
                                    <Text style={[styles.statOrbValue, { color: theme.color }]}>{card.defense}</Text>
                                </LinearGradient>
                            </View>
                        </View>

                        {/* Attack */}
                        <View style={styles.orbWrapper}>
                            {theme.hasMagicCircles && (
                                <View style={styles.magicCircleWrapper}>
                                    <AnimatedMagicCircle color={theme.color} size={70} reverse={false} />
                                    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                                        <AnimatedMagicCircle color={theme.color} size={52} reverse={true} />
                                    </View>
                                </View>
                            )}
                            <View style={[styles.statOrb, { borderColor: theme.color, shadowColor: theme.color }]}>
                                <LinearGradient
                                    colors={['rgba(0,0,0,0.8)', 'rgba(20,20,30,0.95)']}
                                    style={styles.orbGradient}
                                >
                                    <Text style={styles.statOrbIcon}>⚔️</Text>
                                    <Text style={[styles.statOrbValue, { color: theme.color }]}>{card.attack}</Text>
                                </LinearGradient>
                            </View>
                        </View>
                    </View>

                </View>
            </View>
        </Animated.View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    cardContainer: {
        width: 220,
        height: 320,
        borderRadius: 12,
        borderWidth: 1.5,
        backgroundColor: '#111',
        shadowOffset: { width: 0, height: 0 },
    },
    cardInner: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    bgImage: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        width: '100%',
        height: '100%',
    },
    contentLayer: {
        flex: 1,
        position: 'relative',
    },
    breathingBorder: {
        position: 'absolute', top: -4, left: -4, right: -4, bottom: -4,
        borderRadius: 16, borderWidth: 2,
        shadowOffset: { width: 0, height: 0 }, zIndex: 20,
    },
    glowRing: {
        position: 'absolute', top: -3, left: -3, right: -3, bottom: -3,
        borderRadius: 15, borderWidth: 1.5,
        shadowOffset: { width: 0, height: 0 }, shadowRadius: 12, zIndex: 19,
    },
    foilContainer: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 1, overflow: 'hidden',
    },
    foilStrip: {
        position: 'absolute', top: 0, bottom: 0, width: 80,
    },
    foilGradient: {
        flex: 1, transform: [{ rotate: '-45deg' }],
    },
    shineOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2,
    },
    innerBorder: {
        position: 'absolute', top: 4, left: 4, right: 4, bottom: 4,
        borderRadius: 8, borderWidth: 1, zIndex: 5,
    },
    gradientOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2,
    },
    filigreeCorner: {
        position: 'absolute', width: 40, height: 40, zIndex: 6, opacity: 0.9,
    },
    rarityBadge: {
        position: 'absolute', top: 8, left: 8,
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 8, borderWidth: 1, zIndex: 10,
    },
    rarityBadgeText: { fontSize: 11, fontWeight: '700' },
    titlesContainer: {
        position: 'absolute', top: '38%', left: 0, right: 0,
        alignItems: 'center', paddingHorizontal: 16, zIndex: 5,
    },
    subtitle: {
        fontSize: 13, fontWeight: '600', marginBottom: 2, textAlign: 'center',
    },
    title: {
        fontSize: 22, fontWeight: '900', fontStyle: 'italic',
        color: '#FFF', textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.9)',
        textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
    },
    descriptionBox: {
        position: 'absolute', top: '58%', left: 16, right: 16,
        backgroundColor: 'rgba(10,10,15,0.75)',
        borderWidth: 1, borderRadius: 6, padding: 8, zIndex: 5,
    },
    descriptionText: { fontSize: 10, color: '#DDD', textAlign: 'center' },
    statsContainer: {
        position: 'absolute', bottom: 10, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-between',
        paddingHorizontal: 10, zIndex: 10,
    },
    orbWrapper: { alignItems: 'center', justifyContent: 'center' },
    magicCircleWrapper: {
        position: 'absolute', top: -12, left: -12, right: -12, bottom: -12,
        alignItems: 'center', justifyContent: 'center', zIndex: 0,
    },
    statOrb: {
        width: 48, height: 48, borderRadius: 24,
        borderWidth: 1.5, overflow: 'hidden',
        shadowOffset: { width: 0, height: 0 }, shadowRadius: 10, elevation: 6, zIndex: 1,
    },
    orbGradient: {
        width: '100%', height: '100%',
        alignItems: 'center', justifyContent: 'center',
    },
    statOrbIcon: { fontSize: 13, marginBottom: 1 },
    statOrbValue: { fontSize: 14, fontWeight: 'bold' },
});
