/**
 * EpicCardTemplate — Premium MTG/Hearthstone-quality trading card
 *
 * Architecture (bottom → top in z-order):
 *   1. Dark base fill
 *   2. Full-bleed artwork (object-fit: cover)
 *   3. Multi-layer gradient overlays  (vignette, top shadow, bottom shadow)
 *   4. Decorative golden SVG frame (outer glow, inner stroke, corner filigree)
 *   5. Top header bar (rarity stars · English name · element icon)
 *   6. Thin gold separator above stats
 *   7. Glassmorphism stats bar (HP pill · Arabic name · ATK pill)
 *   8. Footer strip (decorative dashes · English name · element char)
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
    Circle,
    Line,
    Path,
    G,
} from 'react-native-svg';
import { Image } from 'expo-image';
import type { ImageSourcePropType } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EpicCardProps {
    imageSrc: ImageSourcePropType;
    nameAr: string;
    nameEn: string;
    hp: number;
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
    common: { stars: 1, primary: '#A8A8A8', glow: '#888', label: 'COMMON', ring: '#9CA3AF' },
    rare: { stars: 2, primary: '#3B82F6', glow: '#60A5FA', label: 'RARE', ring: '#60A5FA' },
    epic: { stars: 3, primary: '#A855F7', glow: '#C084FC', label: 'EPIC', ring: '#C084FC' },
    legendary: { stars: 4, primary: '#FFD700', glow: '#FCD34D', label: 'LEGENDARY', ring: '#FFD700' },
} as const;

// ─── Element config ───────────────────────────────────────────────────────────

const ELEMENT: Record<string, { color: string; char: string; tint: string }> = {
    fire: { color: '#EF4444', char: '🔥', tint: 'rgba(239,68,68,0.12)' },
    ice: { color: '#38BDF8', char: '❄️', tint: 'rgba(56,189,248,0.12)' },
    water: { color: '#3B82F6', char: '💧', tint: 'rgba(59,130,246,0.12)' },
    earth: { color: '#84CC16', char: '🌍', tint: 'rgba(132,204,22,0.12)' },
    lightning: { color: '#FACC15', char: '⚡', tint: 'rgba(250,204,21,0.12)' },
    wind: { color: '#A78BFA', char: '💨', tint: 'rgba(167,139,250,0.12)' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function starsString(count: number): string {
    return Array.from({ length: count }, () => '★').join('');
}

// ─── Golden SVG Frame ─────────────────────────────────────────────────────────

function GoldenFrame({
    w, h, rarityColor, selected,
}: {
    w: number; h: number; rarityColor: string; selected?: boolean;
}) {
    const r = 18;
    // Corner filigree path offset from each corner
    const fc = 10;

    return (
        <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={StyleSheet.absoluteFill as any}>
            <Defs>
                {/* Main gold gradient */}
                <SvgGrad id="gf_gold" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#FFE566" />
                    <Stop offset="0.3" stopColor="#C8A84B" />
                    <Stop offset="0.6" stopColor="#FFD700" />
                    <Stop offset="1" stopColor="#8B6914" />
                </SvgGrad>
                {/* Inner secondary border */}
                <SvgGrad id="gf_inner" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#00000044" />
                    <Stop offset="1" stopColor="#00000088" />
                </SvgGrad>
                {/* Vignette */}
                <SvgRadial id="gf_vign" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
                    <Stop offset="50%" stopColor="#000" stopOpacity="0" />
                    <Stop offset="100%" stopColor="#000" stopOpacity="0.65" />
                </SvgRadial>
                {/* Top shadow */}
                <SvgGrad id="gf_top" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#000" stopOpacity="0.75" />
                    <Stop offset="1" stopColor="#000" stopOpacity="0" />
                </SvgGrad>
                {/* Bottom shadow */}
                <SvgGrad id="gf_bot" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#000" stopOpacity="0" />
                    <Stop offset="0.5" stopColor="#000" stopOpacity="0.6" />
                    <Stop offset="1" stopColor="#000" stopOpacity="0.92" />
                </SvgGrad>
                {/* Rarity shimmer on selection */}
                <SvgGrad id="gf_select" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={rarityColor} stopOpacity="0.8" />
                    <Stop offset="0.5" stopColor={rarityColor} stopOpacity="0.3" />
                    <Stop offset="1" stopColor={rarityColor} stopOpacity="0.8" />
                </SvgGrad>
            </Defs>

            {/* ── Gradient overlays (on top of image) ── */}
            <Rect x={0} y={0} width={w} height={h} rx={r} ry={r} fill="url(#gf_vign)" />
            <Rect x={0} y={0} width={w} height={h * 0.28} rx={r} ry={r} fill="url(#gf_top)" />
            <Rect x={0} y={h * 0.52} width={w} height={h * 0.48} rx={r} ry={r} fill="url(#gf_bot)" />

            {/* ── OUTER golden border (3px) ── */}
            <Rect
                x={1} y={1} width={w - 2} height={h - 2}
                rx={r} ry={r}
                fill="none"
                stroke={selected ? 'url(#gf_select)' : 'url(#gf_gold)'}
                strokeWidth={selected ? 4 : 3}
            />
            {/* ── Inner dark stroke for depth ── */}
            <Rect
                x={5} y={5} width={w - 10} height={h - 10}
                rx={r - 3} ry={r - 3}
                fill="none"
                stroke="rgba(0,0,0,0.7)"
                strokeWidth={1.5}
            />
            {/* ── Second thin gold inner ring ── */}
            <Rect
                x={7} y={7} width={w - 14} height={h - 14}
                rx={r - 5} ry={r - 5}
                fill="none"
                stroke="#FFD70033"
                strokeWidth={0.8}
            />

            {/* ── Corner filigree (top-left) ── */}
            <G opacity={0.85}>
                <Circle cx={fc + 4} cy={fc + 4} r={3} fill="#FFD700" />
                <Line x1={fc + 7} y1={fc + 4} x2={fc + 22} y2={fc + 4} stroke="#FFD700" strokeWidth={0.8} opacity={0.6} />
                <Line x1={fc + 4} y1={fc + 7} x2={fc + 4} y2={fc + 22} stroke="#FFD700" strokeWidth={0.8} opacity={0.6} />
            </G>
            {/* ── Corner filigree (top-right) ── */}
            <G opacity={0.85}>
                <Circle cx={w - fc - 4} cy={fc + 4} r={3} fill="#FFD700" />
                <Line x1={w - fc - 7} y1={fc + 4} x2={w - fc - 22} y2={fc + 4} stroke="#FFD700" strokeWidth={0.8} opacity={0.6} />
                <Line x1={w - fc - 4} y1={fc + 7} x2={w - fc - 4} y2={fc + 22} stroke="#FFD700" strokeWidth={0.8} opacity={0.6} />
            </G>
            {/* ── Corner filigree (bottom-left) ── */}
            <G opacity={0.85}>
                <Circle cx={fc + 4} cy={h - fc - 4} r={3} fill="#C8A84B" />
                <Line x1={fc + 7} y1={h - fc - 4} x2={fc + 22} y2={h - fc - 4} stroke="#C8A84B" strokeWidth={0.8} opacity={0.6} />
                <Line x1={fc + 4} y1={h - fc - 7} x2={fc + 4} y2={h - fc - 22} stroke="#C8A84B" strokeWidth={0.8} opacity={0.6} />
            </G>
            {/* ── Corner filigree (bottom-right) ── */}
            <G opacity={0.85}>
                <Circle cx={w - fc - 4} cy={h - fc - 4} r={3} fill="#C8A84B" />
                <Line x1={w - fc - 7} y1={h - fc - 4} x2={w - fc - 22} y2={h - fc - 4} stroke="#C8A84B" strokeWidth={0.8} opacity={0.6} />
                <Line x1={w - fc - 4} y1={h - fc - 7} x2={w - fc - 4} y2={h - fc - 22} stroke="#C8A84B" strokeWidth={0.8} opacity={0.6} />
            </G>

            {/* ── Gold separator above stats bar ── */}
            <Line
                x1={w * 0.1} y1={h * 0.775}
                x2={w * 0.9} y2={h * 0.775}
                stroke="#FFD700"
                strokeWidth={0.8}
                opacity={0.45}
                strokeDasharray="6 4"
            />

            {/* ── Top-center diamond gem ── */}
            <Circle cx={w / 2} cy={6} r={4.5} fill="#FFD700" opacity={0.7} />
            <Circle cx={w / 2} cy={6} r={2.5} fill="#fff" opacity={0.5} />

            {/* ── Bottom center ornament ── */}
            <Circle cx={w / 2} cy={h - 7} r={3} fill="#C8A84B" opacity={0.6} />
        </Svg>
    );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({
    value, icon, glowColor, scale,
}: {
    value: number; icon: string; glowColor: string; scale: number;
}) {
    const sz = Math.max(scale, 0.5);
    return (
        <View style={[pill.wrap, { backgroundColor: glowColor + '33', borderColor: glowColor + '77' }]}>
            <Text style={[pill.icon, { fontSize: Math.round(11 * sz) }]}>{icon}</Text>
            <Text style={[pill.val, { fontSize: Math.round(14 * sz), color: '#fff' }]}>{value}</Text>
        </View>
    );
}

const pill = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
        elevation: 4,
    },
    icon: {},
    val: {
        fontWeight: '900',
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
    const eCfg = ELEMENT[element] ?? ELEMENT.fire;
    const stars = starsString(rCfg.stars);
    const sz = Math.max(scale, 0.5); // font scale floor

    const W = Math.round(350 * scale);
    const H = Math.round(480 * scale);

    // ── Pulsing outer glow ──
    const glowAlpha = useSharedValue(rarity === 'legendary' ? 0.6 : 0.35);
    React.useEffect(() => {
        const peak = rarity === 'legendary' ? 1.0
            : rarity === 'epic' ? 0.95
                : rarity === 'rare' ? 0.85
                    : 0.65;
        const base = peak * 0.6;
        glowAlpha.value = withRepeat(
            withSequence(
                withTiming(peak, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
                withTiming(base, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
            true,
        );
    }, [rarity]);

    const glowStyle = useAnimatedStyle(() => ({
        shadowOpacity: glowAlpha.value,
    }));

    // ─ selected extra pulse ─
    const selPulse = useSharedValue(0);
    React.useEffect(() => {
        if (selected) {
            selPulse.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 800 }),
                    withTiming(0, { duration: 800 }),
                ),
                -1, true,
            );
        } else {
            selPulse.value = 0;
        }
    }, [selected]);

    return (
        <Animated.View
            style={[
                {
                    width: W,
                    height: H,
                    shadowColor: selected ? rCfg.ring : rCfg.glow,
                    shadowOffset: { width: 0, height: 0 },
                    shadowRadius: rarity === 'legendary' ? 32 : selected ? 24 : 18,
                    elevation: 16,
                },
                glowStyle,
                style,
            ]}
        >
            {/* ── Card shell ── */}
            <View style={[card.shell, { backgroundColor: '#0a0707' }]}>

                {/* 1. Full-bleed artwork */}
                <Image
                    source={imageSrc}
                    style={card.art}
                    contentFit="cover"
                    contentPosition="top"
                    cachePolicy="memory-disk"
                    transition={250}
                />

                {/* 2. Element tint overlay */}
                <View style={[card.tintOverlay, { backgroundColor: eCfg.tint }]} />

                {/* 3. All gradient overlays + golden frame (SVG) */}
                <GoldenFrame w={W} h={H} rarityColor={rCfg.ring} selected={selected} />

                {/* ── 4. TOP HEADER BAR ── */}
                <View style={[header.row, { top: Math.round(12 * scale), paddingHorizontal: Math.round(12 * scale) }]}>
                    {/* Element badge (left) */}
                    <View style={[header.elemBadge, { backgroundColor: eCfg.color + '33', borderColor: eCfg.color + '66' }]}>
                        <Text style={[header.elemText, { fontSize: Math.round(14 * sz) }]}>
                            {emoji ?? eCfg.char}
                        </Text>
                    </View>

                    {/* Stars · English name (center) */}
                    <View style={header.centerBlock}>
                        <Text
                            style={[
                                header.starsLabel,
                                { fontSize: Math.round(11 * sz), color: rCfg.primary },
                            ]}
                            numberOfLines={1}
                        >
                            {stars}
                        </Text>
                        <Text
                            style={[header.nameLabel, { fontSize: Math.round(11 * sz) }]}
                            numberOfLines={1}
                        >
                            {nameEn}
                        </Text>
                    </View>

                    {/* Menu dot (right) */}
                    <View style={header.dotWrap}>
                        <View style={[header.dot, { backgroundColor: rCfg.primary }]} />
                    </View>
                </View>

                {/* ── 5. GLASSMORPHISM STATS BAR ── */}
                <View
                    style={[
                        stats.bar,
                        {
                            bottom: Math.round(36 * scale),
                            left: Math.round(10 * scale),
                            right: Math.round(10 * scale),
                            paddingVertical: Math.round(7 * scale),
                            paddingHorizontal: Math.round(10 * scale),
                            borderColor: `${rCfg.primary}44`,
                        },
                    ]}
                >
                    {/* HP left */}
                    <StatPill value={hp} icon="❤️" glowColor="#EF4444" scale={scale} />

                    {/* Arabic name center */}
                    <View style={stats.nameWrap}>
                        <Text
                            style={[
                                stats.nameAr,
                                {
                                    fontSize: Math.round(19 * sz),
                                    textShadowColor: rCfg.glow,
                                },
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.6}
                        >
                            {nameAr}
                        </Text>
                    </View>

                    {/* Attack right */}
                    <StatPill value={attack} icon="⚔️" glowColor="#8B5CF6" scale={scale} />
                </View>

                {/* ── 6. FOOTER STRIP ── */}
                <View style={[footer.strip, { bottom: Math.round(10 * scale) }]}>
                    <Text style={[footer.text, { fontSize: Math.round(9 * sz) }]} numberOfLines={1}>
                        ── {nameEn} ──
                    </Text>
                </View>

                {/* 7. Selected checkmark overlay */}
                {selected && (
                    <View style={card.selectedOverlay}>
                        <Text style={[card.checkmark, { fontSize: Math.round(32 * sz) }]}>✓</Text>
                    </View>
                )}
            </View>
        </Animated.View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const card = StyleSheet.create({
    shell: {
        flex: 1,
        borderRadius: 18,
        overflow: 'hidden',
        position: 'relative',
    },
    art: {
        ...StyleSheet.absoluteFillObject,
    },
    tintOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    selectedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,215,0,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkmark: {
        color: '#FFD700',
        fontWeight: '900',
        textShadowColor: '#000',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },
});

const header = StyleSheet.create({
    row: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    elemBadge: {
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 5,
        paddingVertical: 3,
        minWidth: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    elemText: {
        lineHeight: 18,
    },
    centerBlock: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    starsLabel: {
        fontWeight: '900',
        letterSpacing: 2,
        textShadowColor: 'rgba(255,215,0,0.8)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
    },
    nameLabel: {
        color: '#FF69B4',
        fontWeight: '800',
        fontStyle: 'italic',
        textShadowColor: 'rgba(255,105,180,0.7)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 5,
        letterSpacing: 0.4,
    },
    dotWrap: {
        width: 28,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 4,
    },
});

const stats = StyleSheet.create({
    bar: {
        position: 'absolute',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(6, 3, 12, 0.82)',
        borderRadius: 18,
        borderWidth: 1,
        // backdropFilter equivalent applied via backgroundColor alpha
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 10,
    },
    nameWrap: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    nameAr: {
        color: '#FFD700',
        fontWeight: '900',
        textAlign: 'center',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
        letterSpacing: 0.5,
    },
});

const footer = StyleSheet.create({
    strip: {
        position: 'absolute',
        left: 16,
        right: 16,
        alignItems: 'center',
        zIndex: 10,
    },
    text: {
        color: '#C8A84B',
        fontWeight: '700',
        letterSpacing: 1.5,
        textShadowColor: 'rgba(0,0,0,0.95)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
});

export default EpicCardTemplate;
