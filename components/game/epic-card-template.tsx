/**
 * EpicCardTemplate — Elegant Premium Trading Card
 *
 * Architecture (bottom → top in z-order):
 *   1. Dark base fill (#0a0a0f)
 *   2. Full-bleed artwork (object-fit: cover)
 *   3. SVG gradient overlays (vignette, top shadow, bottom shadow)
 *   4. Thin elegant rarity-colored border (1px)
 *   5. Top-left sleek badge (stars + Arabic rarity label)
 *   6. Center typography block (Arabic subtitle, English title italic, description box)
 *   7. Bottom corner stat orbs (Attack ⚔️ left, Defense 🛡️ right)
 *   8. Selected checkmark overlay
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import Svg, {
    Defs,
    LinearGradient as SvgGrad,
    RadialGradient as SvgRadial,
    Stop,
    Rect,
} from 'react-native-svg';
import { Image } from 'expo-image';
import type { ImageSourcePropType } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EpicCardProps {
    imageSrc: ImageSourcePropType;
    nameAr: string;
    nameEn: string;
    hp?: number;
    attack: number;
    defense?: number;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
    element?: string;
    emoji?: string;
    /** 1.0 = 350×480, gallery ~0.46, selection ~0.40 */
    scale?: number;
    style?: ViewStyle;
    /** Whether the card is selected (shows pulsing border) */
    selected?: boolean;
}

// ─── Rarity config ────────────────────────────────────────────────────────────

const RARITY = {
    common: { stars: 1, color: '#9CA3AF', glow: '#888', label: 'عادي', borderColor: '#9CA3AF' },
    rare: { stars: 2, color: '#60A5FA', glow: '#60A5FA', label: 'نادر', borderColor: '#3B82F6' },
    epic: { stars: 3, color: '#C084FC', glow: '#C084FC', label: 'ملحمي', borderColor: '#A855F7' },
    legendary: { stars: 4, color: '#FFD700', glow: '#FCD34D', label: 'أسطوري', borderColor: '#FFD700' },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function starsString(count: number): string {
    return Array.from({ length: count }, () => '★').join('');
}

// ─── SVG Overlay (gradient vignette only, no thick borders) ───────────────────

function CardOverlay({ w, h }: { w: number; h: number }) {
    const r = 14;
    return (
        <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={StyleSheet.absoluteFill as any}>
            <Defs>
                <SvgRadial id="co_vign" cx="50%" cy="45%" r="70%" fx="50%" fy="45%">
                    <Stop offset="40%" stopColor="#000" stopOpacity="0" />
                    <Stop offset="100%" stopColor="#000" stopOpacity="0.55" />
                </SvgRadial>
                <SvgGrad id="co_top" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#000" stopOpacity="0.6" />
                    <Stop offset="1" stopColor="#000" stopOpacity="0" />
                </SvgGrad>
                <SvgGrad id="co_bot" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#000" stopOpacity="0" />
                    <Stop offset="0.4" stopColor="#000" stopOpacity="0.5" />
                    <Stop offset="0.7" stopColor="#000" stopOpacity="0.78" />
                    <Stop offset="1" stopColor="#000" stopOpacity="0.95" />
                </SvgGrad>
            </Defs>
            {/* Vignette */}
            <Rect x={0} y={0} width={w} height={h} rx={r} ry={r} fill="url(#co_vign)" />
            {/* Top shadow for badge readability */}
            <Rect x={0} y={0} width={w} height={h * 0.22} rx={r} ry={r} fill="url(#co_top)" />
            {/* Bottom deep shadow for text area */}
            <Rect x={0} y={h * 0.42} width={w} height={h * 0.58} rx={r} ry={r} fill="url(#co_bot)" />
        </Svg>
    );
}

// ─── Stat Orb (bottom corner) ─────────────────────────────────────────────────

function StatOrb({
    value, icon, borderColor, valueColor, scale, position,
}: {
    value: number;
    icon: string;
    borderColor: string;
    valueColor: string;
    scale: number;
    position: 'left' | 'right';
}) {
    const sz = Math.max(scale, 0.4);
    const orbSize = Math.round(45 * sz);
    return (
        <View
            style={[
                orbStyles.orb,
                {
                    width: orbSize,
                    height: orbSize,
                    borderRadius: Math.round(25 * sz),
                    borderColor,
                    position: 'absolute',
                    bottom: Math.round(10 * scale),
                    [position]: Math.round(10 * scale),
                },
            ]}
        >
            <Text style={[orbStyles.icon, { fontSize: Math.round(14 * sz) }]}>{icon}</Text>
            <Text style={[orbStyles.val, { fontSize: Math.round(14 * sz), color: valueColor }]}>{value}</Text>
        </View>
    );
}

const orbStyles = StyleSheet.create({
    orb: {
        backgroundColor: 'rgba(10, 10, 10, 0.9)',
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
        elevation: 8,
    },
    icon: {
        marginBottom: -2,
    },
    val: {
        fontWeight: '800',
        textShadowColor: 'rgba(0,0,0,0.9)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});

// ─── Main component ───────────────────────────────────────────────────────────

export function EpicCardTemplate({
    imageSrc,
    nameAr,
    nameEn,
    hp,
    attack,
    defense,
    rarity = 'common',
    element = 'fire',
    emoji,
    scale = 1,
    style,
    selected = false,
}: EpicCardProps) {
    const rCfg = RARITY[rarity] ?? RARITY.common;
    const stars = starsString(rCfg.stars);
    const sz = Math.max(scale, 0.4);

    const W = Math.round(350 * scale);
    const H = Math.round(480 * scale);

    // ── Subtle pulsing outer glow ──
    const glowAlpha = useSharedValue(0.3);
    React.useEffect(() => {
        const peak = rarity === 'legendary' ? 0.85
            : rarity === 'epic' ? 0.7
                : rarity === 'rare' ? 0.55
                    : 0.35;
        const base = peak * 0.5;
        glowAlpha.value = withRepeat(
            withSequence(
                withTiming(peak, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
                withTiming(base, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
            true,
        );
    }, [rarity]);

    const glowStyle = useAnimatedStyle(() => ({
        shadowOpacity: glowAlpha.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    width: W,
                    height: H,
                    shadowColor: rCfg.glow,
                    shadowOffset: { width: 0, height: 0 },
                    shadowRadius: rarity === 'legendary' ? 24 : 14,
                    elevation: 12,
                },
                glowStyle,
                style,
            ]}
        >
            {/* ── Card shell ── */}
            <View
                style={[
                    s.shell,
                    {
                        borderColor: selected ? rCfg.color : rCfg.borderColor,
                        borderWidth: selected ? 2 : 1,
                    },
                ]}
            >
                {/* 1. Full-bleed artwork */}
                <Image
                    source={imageSrc}
                    style={s.art}
                    contentFit="cover"
                    contentPosition="top"
                    cachePolicy="memory-disk"
                    transition={200}
                />

                {/* 2. SVG gradient overlays (no thick borders) */}
                <CardOverlay w={W} h={H} />

                {/* ═══ 3. TOP-LEFT SLEEK BADGE ═══ */}
                <View
                    style={[
                        s.badge,
                        {
                            borderColor: rCfg.borderColor,
                            paddingVertical: Math.round(4 * sz),
                            paddingHorizontal: Math.round(12 * sz),
                        },
                    ]}
                >
                    <Text
                        style={[s.badgeText, { fontSize: Math.round(10 * sz), color: rCfg.color }]}
                        numberOfLines={1}
                    >
                        {stars} {rCfg.label}
                    </Text>
                </View>

                {/* ═══ 4. CENTER TYPOGRAPHY BLOCK ═══ */}
                <View style={[s.centerBlock, { bottom: Math.round(70 * scale) }]}>
                    {/* Arabic subtitle (gold, small) */}
                    <Text
                        style={[s.arabicName, { fontSize: Math.round(12 * sz), color: rCfg.color }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                    >
                        {nameAr}
                    </Text>

                    {/* English main title (large, italic, bold, white) */}
                    <Text
                        style={[s.englishTitle, { fontSize: Math.round(24 * sz) }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.5}
                    >
                        {nameEn}
                    </Text>

                    {/* Frosted glass description box */}
                    <View style={[s.descBox, { borderColor: rCfg.borderColor + '4D' }]}>
                        <Text style={[s.descText, { fontSize: Math.round(10 * sz), lineHeight: Math.round(16 * sz) }]}>
                            {emoji ? `${emoji} ` : ''}بطاقة {nameAr} — قوة الهجوم {attack} ⚔️ ، الدفاع {defense ?? 0} 🛡️
                        </Text>
                    </View>
                </View>

                {/* ═══ 5. BOTTOM STAT ORBS (corners) ═══ */}
                <StatOrb
                    value={attack}
                    icon="⚔️"
                    borderColor={rCfg.borderColor}
                    valueColor="#FFD700"
                    scale={scale}
                    position="left"
                />
                <StatOrb
                    value={defense ?? 0}
                    icon="🛡️"
                    borderColor="#60A5FA"
                    valueColor="#93C5FD"
                    scale={scale}
                    position="right"
                />

                {/* ═══ 6. SELECTED OVERLAY ═══ */}
                {selected && (
                    <View style={s.selectedOverlay}>
                        <Text style={[s.checkmark, { fontSize: Math.round(32 * sz) }]}>✓</Text>
                    </View>
                )}
            </View>
        </Animated.View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    // Card container — thin elegant border, clean rounded corners
    shell: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#0a0a0f',
    },

    // Full-bleed art
    art: {
        ...StyleSheet.absoluteFillObject,
    },

    // ── Top-left badge ──
    badge: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 15,
        backgroundColor: 'rgba(20, 20, 20, 0.9)',
        borderBottomRightRadius: 10,
        borderWidth: 1,
        borderTopWidth: 0,
        borderLeftWidth: 0,
    },
    badgeText: {
        fontWeight: '700',
        letterSpacing: 1,
    },

    // ── Center typography block ──
    centerBlock: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
        paddingHorizontal: 12,
    },
    arabicName: {
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 0.5,
        marginBottom: 2,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    englishTitle: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontStyle: 'italic',
        textAlign: 'center',
        letterSpacing: 0.3,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        marginBottom: 8,
    },

    // ── Description box (frosted glass) ──
    descBox: {
        backgroundColor: 'rgba(15, 15, 15, 0.75)',
        borderRadius: 6,
        borderWidth: 1,
        padding: 10,
        alignSelf: 'center',
        width: '90%',
    },
    descText: {
        color: '#e0e0e0',
        textAlign: 'center',
        fontWeight: '500',
    },

    // ── Selected overlay ──
    selectedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,215,0,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 25,
    },
    checkmark: {
        color: '#FFD700',
        fontWeight: '900',
        textShadowColor: '#000',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },
});

export default EpicCardTemplate;
