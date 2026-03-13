/**
 * LuxuryCharacterCard — Premium card with dynamic rarity theming
 * Features:
 * - Dynamic rarity colors (Legendary: Gold, Epic: Silver/Purple, Rare: Bronze, Common: Dark/Grey)
 * - ImageBackground with gradient overlay
 * - Top-left badge with rarity name
 * - Centered titles (Arabic + English)
 * - Frosted glass description box
 * - Bottom stat orbs (Defense: Blue, Attack: Red)
 */
import React from 'react';
import { View, Text, StyleSheet, ImageBackground, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, CardRarity } from '@/lib/game/types';

interface LuxuryCharacterCardProps {
    card: Card;
    style?: ViewStyle;
}

// Rarity theme configuration with visual effects
const RARITY_THEMES = {
    common: {
        label: 'عادي',
        color: '#9CA3AF',
        borderColor: '#6B7280',
        badgeBg: 'rgba(20, 20, 20, 0.9)',
        badgeBorder: '#6B7280',
        badgeText: '#9CA3AF',
        shadowColor: '#6B7280',
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
        hasShine: false,
        titleGlowRadius: 4,
    },
    rare: {
        label: 'نادر',
        color: '#CD7F32',
        borderColor: '#CD7F32',
        badgeBg: 'rgba(20, 20, 20, 0.9)',
        badgeBorder: '#CD7F32',
        badgeText: '#D97706',
        shadowColor: '#CD7F32',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
        hasShine: false,
        titleGlowRadius: 6,
    },
    epic: {
        label: 'ملحمي',
        color: '#A855F7',
        borderColor: '#A855F7',
        badgeBg: 'rgba(20, 20, 20, 0.9)',
        badgeBorder: '#A855F7',
        badgeText: '#A78BFA',
        shadowColor: '#A855F7',
        shadowOpacity: 0.5,
        shadowRadius: 14,
        elevation: 8,
        hasShine: true,
        titleGlowRadius: 8,
    },
    legendary: {
        label: 'أسطوري',
        color: '#FFD700',
        borderColor: '#FFD700',
        badgeBg: 'rgba(20, 20, 20, 0.9)',
        badgeBorder: '#FFD700',
        badgeText: '#FBBF24',
        shadowColor: '#FFD700',
        shadowOpacity: 0.8,
        shadowRadius: 18,
        elevation: 10,
        hasShine: true,
        titleGlowRadius: 10,
    },
};

export function LuxuryCharacterCard({ card, style }: LuxuryCharacterCardProps) {
    const rarity: CardRarity = card.rarity ?? 'common';
    const theme = RARITY_THEMES[rarity];

    return (
        <View style={[styles.cardContainer, style, {
            shadowColor: theme.shadowColor,
            shadowOpacity: theme.shadowOpacity,
            shadowRadius: theme.shadowRadius,
            elevation: theme.elevation,
        }]}>
            {/* Card Background Image */}
            <ImageBackground
                source={card.finalImage}
                style={styles.cardBackground}
                imageStyle={{ borderRadius: 12 }}
            >
                {/* Glass Shine Overlay - Epic & Legendary only */}
                {theme.hasShine && (
                    <LinearGradient
                        colors={['rgba(255,255,255, 0.0)', 'rgba(255,255,255, 0.15)', 'rgba(255,255,255, 0.0)']}
                        style={styles.shineOverlay}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                )}

                {/* Elegant Thin Border */}
                <View style={[styles.innerBorder, { borderColor: theme.borderColor }]} />

                {/* Gradient Overlay for Text Readability */}
                <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
                    style={styles.gradientOverlay}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                />

                {/* Top-Left Sleek Badge */}
                <View style={[styles.rarityBadge, { backgroundColor: theme.badgeBg, borderColor: theme.badgeBorder }]}>
                    <Text style={[styles.rarityBadgeText, { color: theme.badgeText }]}>
                        {theme.label} ✦
                    </Text>
                </View>

                {/* Center Typography - Lower Half */}
                <View style={styles.titlesContainer}>
                    <Text style={styles.subtitle} numberOfLines={1}>
                        {card.nameAr}
                    </Text>
                    <Text style={[styles.title, {
                        textShadowColor: theme.color,
                        textShadowRadius: theme.titleGlowRadius,
                    }]} numberOfLines={2}>
                        {card.nameEn || card.name}
                    </Text>
                </View>

                {/* Frosted Glass Description Box */}
                <View style={styles.descriptionBox}>
                    <Text style={styles.descriptionText} numberOfLines={3}>
                        {card.nameAr} - {card.race} {card.cardClass}
                    </Text>
                </View>

                {/* Bottom Stat Orbs - Embedded in Corners */}
                <View style={styles.statsContainer}>
                    {/* Left Orb - Defense */}
                    <View style={[styles.statOrb, styles.defenseOrb, {
                        borderColor: theme.borderColor,
                        shadowColor: theme.color,
                        shadowOpacity: theme.shadowOpacity * 0.6,
                    }]}>
                        <LinearGradient
                            colors={['rgba(10, 10, 10, 0.9)', 'rgba(30, 30, 40, 0.7)', 'rgba(10, 10, 10, 0.9)']}
                            style={styles.orbGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.statOrbIcon}>🛡️</Text>
                            <Text style={styles.statOrbValue}>{card.defense}</Text>
                        </LinearGradient>
                    </View>

                    {/* Right Orb - Attack */}
                    <View style={[styles.statOrb, styles.attackOrb, {
                        borderColor: theme.borderColor,
                        shadowColor: theme.color,
                        shadowOpacity: theme.shadowOpacity * 0.6,
                    }]}>
                        <LinearGradient
                            colors={['rgba(10, 10, 10, 0.9)', 'rgba(30, 30, 40, 0.7)', 'rgba(10, 10, 10, 0.9)']}
                            style={styles.orbGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.statOrbIcon}>⚔️</Text>
                            <Text style={[styles.statOrbValue, styles.attackValue]}>{card.attack}</Text>
                        </LinearGradient>
                    </View>
                </View>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        width: 220, height: 320, borderRadius: 12,
        borderWidth: 1.5, backgroundColor: '#111',
        shadowOffset: { width: 0, height: 0 },
    },
    cardBackground: {
        width: '100%',
        height: '100%',
        justifyContent: 'space-between',
    },
    shineOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
    },
    innerBorder: {
        position: 'absolute',
        top: 4,
        left: 4,
        right: 4,
        bottom: 4,
        borderRadius: 8,
        borderWidth: 1,
        zIndex: 5,
    },
    gradientOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2,
    },
    rarityBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderBottomRightRadius: 10,
        borderWidth: 1,
        zIndex: 10,
    },
    rarityBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    titlesContainer: {
        position: 'absolute',
        top: '40%',
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 16,
        zIndex: 5,
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '500',
        color: '#FFD700',
        marginBottom: 4,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#FFFFFF',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    descriptionBox: {
        position: 'absolute',
        top: '58%',
        left: 16,
        right: 16,
        backgroundColor: 'rgba(15, 15, 15, 0.75)',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
        borderRadius: 6,
        padding: 10,
        alignSelf: 'center',
        marginBottom: 60,
        zIndex: 5,
    },
    descriptionText: {
        fontSize: 10,
        color: '#FFF',
        lineHeight: 16,
        textAlign: 'center',
    },
    statsContainer: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        zIndex: 10,
    },
    statOrb: {
        width: 45,
        height: 45,
        borderRadius: 25,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 8,
        elevation: 6,
    },
    defenseOrb: {},
    attackOrb: {},
    orbGradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statOrbIcon: {
        fontSize: 14,
        marginBottom: 1,
    },
    statOrbValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#87CEEB',
    },
    attackValue: {
        color: '#FFD700',
    },
});
