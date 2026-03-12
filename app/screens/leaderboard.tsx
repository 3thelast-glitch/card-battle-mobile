import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { ThemedText as Text } from '@/components/ui/ThemedText';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { LuxuryBackground } from '@/components/game/luxury-background';
import { useGame } from '@/lib/game/game-context';
import { ProButton } from '@/components/ui/ProButton';
import { COLOR, SPACE, RADIUS, FONT, GLASS_PANEL, SHADOW, FONT_FAMILY } from '@/components/ui/design-tokens';

export default function LeaderboardScreen() {
  const router = useRouter();
  const { state } = useGame();
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const { width } = useWindowDimensions();

  const totalRounds = state.totalRounds || 5;
  const numberOptions = Array.from({ length: 20 }, (_, i) => i + 1);

  const toggleNumber = (num: number) => {
    setSelectedNumbers((prev) => {
      if (prev.includes(num)) return prev.filter((n) => n !== num);
      if (prev.length < totalRounds) return [...prev, num];
      return prev;
    });
  };

  const handleRandomSelect = () => {
    const shuffled = [...numberOptions].sort(() => Math.random() - 0.5);
    setSelectedNumbers(shuffled.slice(0, totalRounds));
  };

  const handleContinue = () => {
    if (selectedNumbers.length === totalRounds) {
      router.push('/screens/card-selection' as any);
    }
  };

  const progress = selectedNumbers.length / totalRounds;

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <LuxuryBackground>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push('/screens/rounds-config' as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>← رجوع</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>اختر أرقامك المحظوظة</Text>
            <Text style={styles.subtitle}>اختر {totalRounds} أرقام لجولاتك</Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
            </View>
            <Text style={styles.progressLabel}>
              {selectedNumbers.length} / {totalRounds}
            </Text>
          </View>

          {/* Numbers panel */}
          <View style={styles.panel}>
            <View style={styles.numbersGrid}>
              {numberOptions.map((num) => {
                const isSelected = selectedNumbers.includes(num);
                const selectionOrder = isSelected ? selectedNumbers.indexOf(num) + 1 : null;
                // calculate dynamic pill width based on screen width minus paddings (approximate 5 columns)
                const pillSize = Math.max(36, Math.min(48, (width - (SPACE.lg * 2) - (SPACE.xl * 2) - (SPACE.md * 4)) / 5));

                return (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.numPill,
                      isSelected && styles.numPillSelected,
                      { width: pillSize, height: pillSize }
                    ]}
                    onPress={() => toggleNumber(num)}
                    activeOpacity={0.7}
                  >
                    {selectionOrder !== null ? (
                      <Text style={[styles.numOrderText, { fontSize: pillSize * 0.3 }]}>{selectionOrder}</Text>
                    ) : (
                      <Text style={[styles.numText, isSelected && styles.numTextSelected, { fontSize: pillSize * 0.35 }]}>
                        {num}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <ProButton
              label="🎲 عشوائي"
              onPress={handleRandomSelect}
              variant="secondary"
              style={styles.randomBtn}
            />
            <ProButton
              label="التالي →"
              onPress={handleContinue}
              variant="primary"
              disabled={selectedNumbers.length !== totalRounds}
              style={styles.continueBtn}
            />
          </View>

        </ScrollView>
      </LuxuryBackground>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.xl,
    paddingBottom: SPACE.xxl + SPACE.xl,
  },

  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(228,165,42,0.3)',
    marginBottom: SPACE.xl,
  },
  backBtnText: { color: COLOR.gold, fontSize: FONT.md },
  header: { alignItems: 'center', marginBottom: SPACE.xl },
  title: {
    fontSize: FONT.xxl,
    color: COLOR.gold,
    letterSpacing: 0.8,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  subtitle: { color: COLOR.textMuted, fontSize: FONT.base, marginTop: SPACE.xs, textAlign: 'center', flexWrap: 'wrap' },

  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    marginBottom: SPACE.xl,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(228,165,42,0.15)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLOR.gold,
    borderRadius: RADIUS.full,
  },
  progressLabel: {
    color: COLOR.gold,
    fontSize: FONT.md,
    minWidth: 40,
    textAlign: 'right',
  },

  panel: {
    ...GLASS_PANEL,
    padding: SPACE.xl,
    marginBottom: SPACE.xl,
  },

  numbersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.md,
    justifyContent: 'center',
  },

  numPill: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(228,165,42,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numPillSelected: {
    backgroundColor: COLOR.green,
    borderColor: COLOR.green,
    ...SHADOW.card,
  },
  numText: { color: COLOR.textMuted, fontSize: FONT.base },
  numTextSelected: { color: '#052e16' },
  numOrderText: { color: '#052e16', fontSize: FONT.sm },
  controls: { flexDirection: 'row', gap: SPACE.md },
  randomBtn: { flex: 1 },
  continueBtn: { flex: 2 },
});
