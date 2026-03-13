import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ui/ThemedText';
import * as LucideIcons from 'lucide-react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';

export interface AbilityData {
    id: string | number;
    nameEn: string;
    nameAr: string;
    description: string;
    icon: any;
    rarity: string;
    imageUrl?: string;
    isActive?: boolean;
}

interface Props {
    ability: AbilityData;
    showActionButtons?: boolean;
}

// ─── Card dimensions ──────────────────────────────────────────────────────────
const CARD_W = 220;
const CARD_H = 330;

// ─── Static ability art map — Metro bundler requires explicit require() paths ─
export const ABILITY_IMAGES: Record<string, any> = {
    'default':                      require('../../assets/abilities/Add_Element_Art.png'),
    'Add_Element_Art':              require('../../assets/abilities/Add_Element_Art.png'),
    'Arise_Art':                    require('../../assets/abilities/Arise_Art.png'),
    'Avatar_Art':                   require('../../assets/abilities/Avatar_Art.png'),
    'Cancel_Ability_Art':           require('../../assets/abilities/Cancel_Ability_Art.png'),
    'Compensation_Art':             require('../../assets/abilities/Compensation_Art.png'),
    'Consecutive_Loss_Buff_Art':    require('../../assets/abilities/Consecutive_Loss_Buff_Art.png'),
    'Conversion_Art':               require('../../assets/abilities/Conversion_Art.png'),
    'Convert_Debuffs_Art':          require('../../assets/abilities/Convert_Debuffs_Art.png'),
    'Deprivation_(Ability)_Art':    require('../../assets/abilities/Deprivation_(Ability)_Art.png'),
    'Dilemma_Art':                  require('../../assets/abilities/Dilemma_Art.png'),
    'Disaster_Art':                 require('../../assets/abilities/Disaster_Art.png'),
    'Double_Or_Nothing_Art':        require('../../assets/abilities/Double Or Nothing_Art.png'),
    'Double_Points_Art':            require('../../assets/abilities/Double Points_Art.png'),
    'Double_Your_Buffs_Art':        require('../../assets/abilities/Double Your Buffs_Art.png'),
    'Double_Next_Cards_Art':        require('../../assets/abilities/Double_Next_Cards_Art.png'),
    'Eclipse_Art':                  require('../../assets/abilities/Eclipse_Art.png'),
    'Elemental_Mastery_Art':        require('../../assets/abilities/Elemental Mastery_Art.png'),
    'Explosion_Art':                require('../../assets/abilities/Explosion_Art.png'),
    'Greed_Art':                    require('../../assets/abilities/Greed_Art.png'),
    'Halve_Points_Art':             require('../../assets/abilities/Halve_Points_Art.png.png'),
    'LOGICAL_ENCOUNTER_Art':        require('../../assets/abilities/LOGICAL ENCOUNTER_Art.png'),
    'Lifesteal_Art':                require('../../assets/abilities/Lifesteal_Art.png'),
    'Merge_Art':                    require('../../assets/abilities/Merge_Art.png'),
    'Misdirection_Art':             require('../../assets/abilities/Misdirection_Art.png'),
    'Penetration_Art':              require('../../assets/abilities/Penetration_Art.png'),
    'Pool_Art':                     require('../../assets/abilities/Pool_Art.png'),
    'Propaganda_Art':               require('../../assets/abilities/Propaganda_Art.png'),
    'Protection_Art':               require('../../assets/abilities/Protection_Art.png'),
    'Purge_Art':                    require('../../assets/abilities/Purge_Art.png'),
    'Recall_Art':                   require('../../assets/abilities/Recall_Art.png'),
    'Reduction_Art':                require('../../assets/abilities/Reduction_Art.png'),
    'Reinforcement_Art':            require('../../assets/abilities/Reinforcement_Art.png'),
    'Rescue_Art':                   require('../../assets/abilities/Rescue_Art.png'),
    'Revenge_Art':                  require('../../assets/abilities/Revenge_Art.png'),
    'Revive_Art':                   require('../../assets/abilities/Revive_Art.png'),
    'Sacrifice_Art':                require('../../assets/abilities/Sacrifice_Art.png'),
    'Seal_Art':                     require('../../assets/abilities/Seal_Art.png'),
    'Shield_Art':                   require('../../assets/abilities/Shield_Art.png'),
    'Skip_Art':                     require('../../assets/abilities/Skip_Art.png'),
    'Sniping_Art':                  require('../../assets/abilities/Sniping_Art.png'),
    'Star_Superiority_Art':         require('../../assets/abilities/Star Superiority_Art.png'),
    'Steal_Ability_Art':            require('../../assets/abilities/Steal Ability_Art.png'),
    'Subhan_Art':                   require('../../assets/abilities/Subhan_Art.png'),
    'Suicide_Art':                  require('../../assets/abilities/Suicide_Art.png'),
    'Take_It_Art':                  require('../../assets/abilities/Take It_Art.png'),
    'Trap_Art':                     require('../../assets/abilities/Trap_Art.png'),
    'Weakening_Art':                require('../../assets/abilities/Weakening_Art.png'),
    'Wipe_Art':                     require('../../assets/abilities/Wipe_Art.png'),
};

// ─── Rarity theme presets ─────────────────────────────────────────────────────
const RARITY_THEMES: Record<string, {
    primary: string;
    glow: string;
    border: string;
    badgeBg: string;
    label: string;
}> = {
    Common: {
        primary: '#10b981',
        glow: '#10b981',
        border: 'rgba(16,185,129,0.5)',
        badgeBg: 'rgba(16,185,129,0.25)',
        label: 'COMMON',
    },
    Rare: {
        primary: '#3b82f6',
        glow: '#60a5fa',
        border: 'rgba(59,130,246,0.5)',
        badgeBg: 'rgba(59,130,246,0.25)',
        label: 'RARE',
    },
    Epic: {
        primary: '#a855f7',
        glow: '#c084fc',
        border: 'rgba(168,85,247,0.5)',
        badgeBg: 'rgba(168,85,247,0.25)',
        label: 'EPIC',
    },
    Legendary: {
        primary: '#f59e0b',
        glow: '#fcd34d',
        border: 'rgba(245,158,11,0.6)',
        badgeBg: 'rgba(245,158,11,0.25)',
        label: 'LEGENDARY',
    },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function AbilityCard({ ability, showActionButtons = true }: Props) {
    const IconComponent = ability.icon;

    // Dev-testing state
    const [localRarity, setLocalRarity] = useState(ability.rarity);
    const [isDisabled, setIsDisabled] = useState(ability.isActive === false);

    const isLegendary = localRarity === 'Legendary';
    const theme = RARITY_THEMES[localRarity] ?? RARITY_THEMES.Common;

    const cycleRarity = () => {
        const rarities = ['Common', 'Rare', 'Epic', 'Legendary'];
        const currentIndex = rarities.indexOf(localRarity);
        setLocalRarity(rarities[(currentIndex + 1) % rarities.length]);
    };

    // Resolve local artwork based on ability English name
    // IMPORTANT: ABILITY_IMAGES dictionary already has "_Art" suffix in keys
    // Format: "LogicalEncounter" -> "LogicalEncounter_Art"
    // NOTE: If you see repeated images, add missing abilities to ABILITY_IMAGES dictionary
    const formattedName = ability.nameEn.replaceAll(' ', '_') + '_Art';
    
    // Debug: Warn if image is missing from dictionary
    if (!ABILITY_IMAGES[formattedName]) {
        console.warn(`[Missing Art] Please add the image for: "${ability.nameEn}". Expected dictionary key: "${formattedName}"`);
    }
    
    const imageSource = ABILITY_IMAGES[formattedName] || ABILITY_IMAGES['default'];

    // ── Pulsing outer glow animation ──
    const glowOpacity = useSharedValue(0.4);
    useEffect(() => {
        const peak = isLegendary ? 0.9 : localRarity === 'Epic' ? 0.7 : localRarity === 'Rare' ? 0.55 : 0.4;
        const base = peak * 0.5;
        glowOpacity.value = withRepeat(
            withSequence(
                withTiming(peak, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
                withTiming(base, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
            true,
        );
    }, [localRarity]);

    const animatedGlow = useAnimatedStyle(() => ({
        shadowOpacity: glowOpacity.value,
    }));

    return (
        <Animated.View
            style={[
                styles.outerShell,
                {
                    shadowColor: theme.glow,
                    shadowRadius: isLegendary ? 28 : 16,
                },
                animatedGlow,
                isDisabled && { opacity: 0.5 },
            ]}
        >
            <View
                style={[
                    styles.cardContainer,
                    {
                        borderColor: theme.border,
                        borderWidth: isLegendary ? 2 : 1.5,
                    },
                ]}
            >
                {/* ═══════════════ 1. FULL-BLEED ARTWORK BACKGROUND ═══════════════ */}
                <ImageBackground
                    source={imageSource}
                    style={StyleSheet.absoluteFill}
                    imageStyle={styles.artImage}
                    resizeMode="cover"
                >
                    {/* Legendary extra warm edge glow */}
                    {isLegendary && <View style={styles.legendaryEdgeGlow} />}
                </ImageBackground>

                {/* ═══════════════ 2. DEV ADMIN CONTROLS ═══════════════ */}
                {showActionButtons && __DEV__ && (
                    <View style={styles.devControls}>
                        <TouchableOpacity
                            onPress={() => setIsDisabled(!isDisabled)}
                            style={[
                                styles.devBtn,
                                isDisabled && { backgroundColor: 'rgba(239,68,68,0.25)', borderColor: 'rgba(239,68,68,0.5)' },
                            ]}
                        >
                            <LucideIcons.Power size={10} color={isDisabled ? '#ef4444' : '#fff'} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={cycleRarity} style={styles.devBtn}>
                            <LucideIcons.RefreshCw size={10} color="#38bdf8" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* ═══════════════ 3. DEACTIVATED OVERLAY ═══════════════ */}
                {isDisabled && (
                    <View style={styles.disabledOverlay}>
                        <View style={styles.disabledStamp}>
                            <ThemedText style={styles.disabledText}>
                                DEACTIVATED
                            </ThemedText>
                        </View>
                    </View>
                )}

                {/* ═══════════════ 5. TOP-RIGHT RARITY BADGE ═══════════════ */}
                <View style={[styles.rarityBadge, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
                    <Text style={[styles.rarityText, { color: theme.primary }]}>
                        {theme.label}
                    </Text>
                </View>

                {/* ═══════════════ 6. CENTER TITLE PANEL (frosted glass) ═══════════════ */}
                <View style={styles.titlePanel}>
                    <View style={styles.titlePanelInner}>
                        {/* English name */}
                        <Text style={styles.nameEn} numberOfLines={1}>
                            {ability.nameEn}
                        </Text>
                        {/* Arabic name */}
                        <Text style={[styles.nameAr, { textShadowColor: theme.glow }]} numberOfLines={1}>
                            {ability.nameAr}
                        </Text>
                        {/* Divider */}
                        <View style={[styles.divider, { backgroundColor: theme.primary + '55' }]} />
                        {/* Description */}
                        <Text style={styles.description} numberOfLines={3}>
                            {ability.description}
                        </Text>
                    </View>
                </View>

                {/* ═══════════════ 7. BOTTOM ICON BAR (frosted glass) ═══════════════ */}
                <View style={[styles.bottomBar, { borderTopColor: theme.border }]}>
                    {/* Ability icon */}
                    <View style={[styles.iconCircle, { backgroundColor: theme.primary + '33', borderColor: theme.primary + '77' }]}>
                        {IconComponent ? (
                            <IconComponent size={14} color={theme.primary} strokeWidth={2} />
                        ) : null}
                    </View>
                    {/* Rarity label */}
                    <Text style={[styles.bottomRarityLabel, { color: theme.primary }]}>
                        {localRarity}
                    </Text>
                    {/* Decorative dots */}
                    <View style={styles.bottomDots}>
                        <View style={[styles.dot, { backgroundColor: theme.primary + '88' }]} />
                        <View style={[styles.dot, { backgroundColor: theme.primary + '55' }]} />
                        <View style={[styles.dot, { backgroundColor: theme.primary + '33' }]} />
                    </View>
                </View>
            </View>
        </Animated.View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    // ── Outer animated wrapper (shadow host) ──
    outerShell: {
        width: CARD_W,
        height: CARD_H,
        shadowOffset: { width: 0, height: 0 },
        elevation: 14,
    },

    // ── Card boundary ──
    cardContainer: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#0a0a12',
    },

    // ── Full-bleed art ──
    artImage: {
        borderRadius: 20,
    },

    // ── Gradient overlays ──
    topGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: 'rgba(0,0,0,0.55)',
        // We simulate a gradient by using opacity on a dark band;
        // for a true gradient, LinearGradient from expo-linear-gradient would be ideal
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: CARD_H * 0.6,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    centerVignette: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    legendaryEdgeGlow: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 2,
        borderColor: 'rgba(245,158,11,0.35)',
        borderRadius: 20,
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 10,
    },

    // ── Dev admin controls ──
    devControls: {
        position: 'absolute',
        top: 36,
        left: 10,
        zIndex: 50,
        flexDirection: 'row',
        gap: 4,
    },
    devBtn: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },

    // ── Disabled overlay ──
    disabledOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    disabledStamp: {
        backgroundColor: 'rgba(220,38,38,0.9)',
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#f87171',
        transform: [{ rotate: '-12deg' }],
    },
    disabledText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 10,
        letterSpacing: 3,
        textTransform: 'uppercase',
    },

    // ── Top-left ID badge ──
    idBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 20,
        backgroundColor: 'rgba(0,0,0,0.45)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    idText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    // ── Top-right rarity badge ──
    rarityBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 20,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 1,
    },
    rarityText: {
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },

    // ── Center title panel (frosted glass) ──
    titlePanel: {
        position: 'absolute',
        bottom: 50,
        left: 12,
        right: 12,
        zIndex: 15,
    },
    titlePanelInner: {
        backgroundColor: 'rgba(6,3,18,0.72)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        paddingVertical: 12,
        paddingHorizontal: 14,
        alignItems: 'center',
        // Simulated backdrop-blur via dense bg; for true blur, use @react-native-community/blur
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 6,
    },
    nameEn: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.9)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    nameAr: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: '900',
        textAlign: 'center',
        marginTop: 3,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
        letterSpacing: 0.5,
    },
    divider: {
        width: 36,
        height: 1.5,
        borderRadius: 1,
        marginVertical: 8,
    },
    description: {
        color: 'rgba(203,213,225,0.85)',
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 15,
        writingDirection: 'rtl',
    },

    // ── Bottom icon bar (frosted glass) ──
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 15,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(6,3,18,0.8)',
        borderTopWidth: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        gap: 8,
    },
    iconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottomRarityLabel: {
        flex: 1,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    bottomDots: {
        flexDirection: 'row',
        gap: 3,
        alignItems: 'center',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
});
