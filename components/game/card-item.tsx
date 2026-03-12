/**
 * Enhanced CardItem — Rarity-driven design with 60fps animations.
 *
 * Features:
 *  - Rarity gradients (Common/Rare/Epic/Legendary)
 *  - Glowing border + 3D shadow per rarity
 *  - Pulsing glow ring for Epic & Legendary  
 *  - Fire particle overlay for Legendary
 *  - Tap: scale(1.05) + rotate(2°) spring bounce
 *  - Summon entrance: slide-up + peak scale
 *  - Stats overlay: attack, defense, hp
 *  - Rarity badge pill (top-right)
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
import { Card } from '@/lib/game/types';
import { getRarityConfig } from '@/lib/game/card-rarity';
import { CARD_DIMENSIONS, CARD_SHADOW } from '@/constants/game-config';
import { useCardTapAnimation, useCardSummonAnimation } from '@/lib/animations';
import { RarityGlow } from './rarity-glow';
import { FireParticles } from '@/lib/particles';

// ─── Size Presets ─────────────────────────────────────────────────────────────

const SIZE_PRESETS = {
  small: {
    width: CARD_DIMENSIONS.small.width,
    height: CARD_DIMENSIONS.small.height,
    nameFontSize: 8,
    statFontSize: 8,
    badgeFontSize: 6,
  },
  medium: {
    width: CARD_DIMENSIONS.portrait.width,
    height: CARD_DIMENSIONS.portrait.height,
    nameFontSize: 10,
    statFontSize: 10,
    badgeFontSize: 8,
  },
  large: {
    width: 200,
    height: 300,
    nameFontSize: 13,
    statFontSize: 12,
    badgeFontSize: 10,
  },
} as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface CardItemProps {
  card: Card;
  isSelected?: boolean;
  size?: keyof typeof SIZE_PRESETS;
  /** Play the summon entrance animation on mount */
  playEntranceAnimation?: boolean;
  /** Delay (ms) before summon animation starts */
  entranceDelay?: number;
  onPress?: () => void;
  style?: ViewStyle;
  /** Disable tap interaction (e.g. display-only) */
  disabled?: boolean;
  /** Show attack / defense / hp stats overlay */
  showStats?: boolean;
  /** Absolute width override (ignoring size preset) */
  customWidth?: number;
  /** Absolute height override (ignoring size preset) */
  customHeight?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CardItem({
  card,
  isSelected = false,
  size = 'medium',
  playEntranceAnimation = false,
  entranceDelay = 0,
  onPress,
  style,
  disabled = false,
  showStats = true,
  customWidth,
  customHeight,
}: CardItemProps) {
  const preset = SIZE_PRESETS[size];
  const rarity = card.rarity ?? 'common';
  const rarityCfg = getRarityConfig(rarity);

  const width = customWidth ?? preset.width;
  const height = customHeight ?? preset.height;

  // ── Animations ──
  const tap = useCardTapAnimation();
  const summon = useCardSummonAnimation(entranceDelay);

  useEffect(() => {
    if (playEntranceAnimation) {
      summon.reset();
      summon.play();
    }
  }, [playEntranceAnimation, card.id]);

  // ── Outer shadow driven by rarity ──
  const cardShadow: ViewStyle = {
    shadowColor: rarityCfg.glowColor ?? CARD_SHADOW.shadowColor,
    shadowOffset: CARD_SHADOW.shadowOffset,
    shadowOpacity: rarityCfg.shadowOpacity,
    shadowRadius: rarityCfg.shadowRadius,
    elevation: isSelected ? 20 : 12,
  };

  const borderStyle: ViewStyle = {
    borderColor: isSelected ? '#ffffff' : rarityCfg.borderColor,
    borderWidth: isSelected ? rarityCfg.borderWidth + 1 : rarityCfg.borderWidth,
  };

  return (
    <Animated.View
      style={[
        styles.outerWrapper,
        { width, height },
        cardShadow,
        playEntranceAnimation ? summon.animatedStyle : undefined,
        style,
      ]}
    >
      {/* Pulsing glow ring for Epic / Legendary */}
      {rarityCfg.hasPulsingGlow && (
        <RarityGlow
          color={rarityCfg.glowColor!}
          borderRadius={14}
          spread={size === 'small' ? 4 : 8}
        />
      )}

      <Pressable
        onPress={disabled ? undefined : onPress}
        onPressIn={disabled ? undefined : tap.onPressIn}
        onPressOut={disabled ? undefined : tap.onPressOut}
        style={styles.pressable}
        accessibilityRole="button"
        accessibilityLabel={`${card.nameAr} card`}
      >
        <Animated.View
          style={[
            styles.card,
            { width, height },
            borderStyle,
          ]}
        >
          {/* Background gradient via layered Views */}
          <View style={[styles.gradientBg, { backgroundColor: rarityCfg.gradient[0] }]} />
          <View
            style={[
              styles.gradientMid,
              {
                backgroundColor: rarityCfg.gradient[1],
                opacity: 0.75,
              },
            ]}
          />
          <View
            style={[
              styles.gradientTop,
              {
                backgroundColor: rarityCfg.gradient[2],
                opacity: 0.4,
              },
            ]}
          />

          {/* Card Art Image */}
          <Image
            source={card.finalImage}
            style={styles.image}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={200}
          />

          {/* Tap animated layer */}
          <Animated.View
            style={[StyleSheet.absoluteFillObject, tap.animatedStyle]}
            pointerEvents="none"
          />

          {/* Stats overlay (bottom strip) */}
          {showStats && (
            <View style={styles.statsOverlay}>
              <View style={styles.statsRow}>
                <StatBadge icon="⚔️" value={card.attack} size={preset.statFontSize} />
                <StatBadge icon="🛡️" value={card.defense} size={preset.statFontSize} />
                <StatBadge icon="❤️" value={card.hp} size={preset.statFontSize} />
              </View>

              <Text
                style={[styles.cardName, { fontSize: preset.nameFontSize }]}
                numberOfLines={1}
              >
                {card.nameAr}
              </Text>
            </View>
          )}

          {/* Element pill (top-left) */}
          <View style={styles.elementBadge}>
            <Text style={[styles.elementEmoji, { fontSize: preset.badgeFontSize + 2 }]}>
              {card.emoji}
            </Text>
          </View>

          {/* Rarity badge (top-right) */}
          <View style={[styles.rarityBadge, { backgroundColor: rarityCfg.badgeColor }]}>
            <Text style={[styles.rarityText, { fontSize: preset.badgeFontSize }]}>
              {rarity.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* CardEffect icons */}
          {card.cardEffects && card.cardEffects.length > 0 && (
            <View style={styles.effectsRow}>
              {card.cardEffects.slice(0, 3).map((effect) => (
                <Text key={effect} style={styles.effectIcon}>
                  {EFFECT_ICONS[effect]}
                </Text>
              ))}
            </View>
          )}

          {/* Selected highlight */}
          {isSelected && <View style={styles.selectedOverlay} />}
        </Animated.View>
      </Pressable>

      {/* Fire particles for Legendary (outside Pressable, absolute) */}
      {rarityCfg.hasParticles && !disabled && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: 14, overflow: 'hidden' },
          ]}
          pointerEvents="none"
        >
          <FireParticles width={width} height={height} />
        </View>
      )}
    </Animated.View>
  );
}

// ─── StatBadge ────────────────────────────────────────────────────────────────

function StatBadge({ icon, value, size }: { icon: string; value: number; size: number }) {
  return (
    <View style={styles.statBadge}>
      <Text style={[styles.statIcon, { fontSize: size }]}>{icon}</Text>
      <Text style={[styles.statValue, { fontSize: size }]}>{value}</Text>
    </View>
  );
}

// ─── Effect icon map ──────────────────────────────────────────────────────────

const EFFECT_ICONS: Record<string, string> = {
  taunt: '🛡️',
  divine_shield: '✨',
  poison: '☠️',
  stealth: '👁️',
  charge: '⚡',
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressable: {
    borderRadius: 14,
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientMid: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  image: {
    width: '100%',
    height: '75%',
    position: 'absolute',
    top: 0,
  },
  statsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 13,
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
  statIcon: {
    lineHeight: 14,
  },
  statValue: {
    color: '#fff',
    fontWeight: '700',
    fontFamily: 'System',
  },
  cardName: {
    color: '#e5e7eb',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  elementBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  elementEmoji: {
    lineHeight: 16,
  },
  rarityBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rarityText: {
    color: '#fff',
    fontWeight: '900',
    lineHeight: 12,
  },
  effectsRow: {
    position: 'absolute',
    bottom: 52,
    right: 4,
    gap: 2,
    alignItems: 'center',
  },
  effectIcon: {
    fontSize: 10,
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 13,
  },
});
