import React, { useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ui/ThemedText';
import * as LucideIcons from 'lucide-react-native';

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
}

// Static ability art map — Metro bundler requires explicit require() paths
export const ABILITY_IMAGES: Record<string, any> = {
    'default':                      require('../../assets/abilities/Add_Element_Art.png'), // fallback reuses first art until a true default.png is added
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

export function AbilityCard({ ability }: Props) {
    const IconComponent = ability.icon;

    // State for dev testing
    const [localRarity, setLocalRarity] = useState(ability.rarity);
    const [isDisabled, setIsDisabled] = useState(ability.isActive === false);

    const isLegendary = localRarity === 'Legendary';

    const cycleRarity = () => {
        const rarities = ['Common', 'Rare', 'Epic', 'Legendary'];
        const currentIndex = rarities.indexOf(localRarity);
        setLocalRarity(rarities[(currentIndex + 1) % rarities.length]);
    };

    // Rarity Colors Configuration
    let rarityConfig = {
        badgeBg: 'bg-emerald-500/50',
        badgeText: 'text-emerald-400',
        border: 'border-emerald-500',
        iconColor: '#10b981',
    };

    if (localRarity === 'Rare') {
        rarityConfig = {
            badgeBg: 'bg-blue-500/50',
            badgeText: 'text-blue-400',
            border: 'border-blue-500',
            iconColor: '#3b82f6',
        };
    } else if (localRarity === 'Epic') {
        rarityConfig = {
            badgeBg: 'bg-purple-500/50',
            badgeText: 'text-purple-400',
            border: 'border-purple-500',
            iconColor: '#a855f7',
        };
    } else if (localRarity === 'Legendary') {
        rarityConfig = {
            badgeBg: 'bg-amber-500/50',
            badgeText: 'text-amber-400',
            border: 'border-amber-500',
            iconColor: '#f59e0b',
        };
    }

    return (
        <View
            className={`relative justify-between items-center bg-slate-900 overflow-hidden rounded-xl border-2 ${rarityConfig.border}`}
            style={[
                styles.cardContainer,
                {
                    width: 160,
                    height: 208,
                    shadowColor: rarityConfig.iconColor,
                    borderColor: rarityConfig.iconColor
                },
                isLegendary && { borderWidth: 3 },
                isDisabled && { opacity: 0.5 },
            ]}
        >
            {/* ─── DEV ADMIN CONTROLS ─── */}
            {__DEV__ && (
                <View className="absolute top-2 left-2 z-50 flex-row gap-1">
                    <TouchableOpacity
                        onPress={() => setIsDisabled(!isDisabled)}
                        className={`w-5 h-5 rounded-full items-center justify-center border ${isDisabled ? 'bg-red-500/20 border-red-500/50' : 'bg-black/50 border-white/20'}`}
                    >
                        <LucideIcons.Power size={10} color={isDisabled ? '#ef4444' : '#fff'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={cycleRarity}
                        className="w-5 h-5 rounded-full items-center justify-center bg-black/50 border border-white/20"
                    >
                        <LucideIcons.RefreshCw size={10} color="#38bdf8" />
                    </TouchableOpacity>
                </View>
            )}

            {/* ─── DEACTIVATED OVERLAY ─── */}
            {isDisabled && (
                <View className="absolute inset-0 z-40 items-center justify-center bg-black/20 rounded-xl">
                    <View className="bg-red-600/90 px-3 py-1 rounded-lg border-2 border-red-400 shadow-xl" style={{ transform: [{ rotate: '-12deg' }] }}>
                        <ThemedText className="text-white font-black tracking-widest text-[9px] shadow-sm">
                            DEACTIVATED
                        </ThemedText>
                    </View>
                </View>
            )}

            {/* Top Badge */}
            <View className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/50 z-20 ${rarityConfig.badgeBg}`}>
                <ThemedText className={`text-[7px] uppercase font-bold tracking-wider ${rarityConfig.badgeText}`} style={{ color: rarityConfig.iconColor }}>
                    {localRarity}
                </ThemedText>
            </View>

            {/* ─── TOP HALF: Full-Bleed Image Container ─── */}
            <View style={styles.imageContainer} className="w-full overflow-hidden rounded-t-xl">
                <ImageBackground
                    source={(() => {
                        const formattedName = ability.nameEn.replaceAll(' ', '_') + '_Art';
                        return ABILITY_IMAGES[formattedName] || ABILITY_IMAGES['default'];
                    })()}
                    style={styles.imageBackground}
                    imageStyle={styles.imageStyle}
                    resizeMode="cover"
                >
                    {/* Dark gradient fade at the bottom */}
                    <View style={styles.gradientOverlay} />

                    {/* Legendary inner glow ring */}
                    {isLegendary && (
                        <View style={[styles.legendaryGlow, { borderColor: rarityConfig.iconColor }]} />
                    )}

                    {/* ─── Glowing Icon Overlay ─── */}
                    <View style={styles.iconOverlay}>
                        <View
                            style={[
                                styles.iconContainer,
                                {
                                    shadowColor: rarityConfig.iconColor,
                                    shadowOpacity: 0.9,
                                    shadowRadius: 16,
                                    shadowOffset: { width: 0, height: 0 },
                                    elevation: 12,
                                }
                            ]}
                        >
                            {IconComponent ? (
                                <IconComponent size={32} color="rgba(255,255,255,0.92)" strokeWidth={1.5} />
                            ) : null}
                        </View>
                    </View>
                </ImageBackground>
            </View>

            {/* ─── BOTTOM INFO BOX ─── */}
            <View className="w-full flex-1 bg-black/50 backdrop-blur-sm p-2 border-t border-white/10 z-10 flex flex-col items-center justify-center">
                <ThemedText className="text-[9px] font-black uppercase leading-tight text-white text-center" numberOfLines={1}>
                    {ability.nameEn}
                </ThemedText>
                <ThemedText className="text-[10px] font-bold text-amber-300 mt-0.5 text-center" numberOfLines={1}>
                    {ability.nameAr}
                </ThemedText>

                {/* Subtle Divider */}
                <View className="w-6 h-[1px] bg-white/20 my-1" />

                <ThemedText className="text-[7px] text-slate-300 leading-tight mt-1 px-1 text-center" style={{ writingDirection: 'rtl' }} numberOfLines={2}>
                    {ability.description}
                </ThemedText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 14,
        elevation: 10,
    },
    imageContainer: {
        height: 104,
        flexShrink: 0,
    },
    imageBackground: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageStyle: {
        width: '100%',
        height: '100%',
    },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 50,
        backgroundColor: 'rgba(2, 6, 23, 0.6)',
    },
    legendaryGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderWidth: 2,
        borderRadius: 10,
        shadowColor: '#f59e0b',
        shadowOpacity: 1,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 0 },
        elevation: 12,
    },
    iconOverlay: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        // Half of (32px icon + 2*8px padding) ≈ 24px
        transform: [{ translateX: -24 }, { translateY: -24 }],
        zIndex: 10,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        borderRadius: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
});
