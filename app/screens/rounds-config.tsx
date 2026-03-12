import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { ThemedText as Text } from '@/components/ui/ThemedText';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { LuxuryBackground } from '@/components/game/luxury-background';
import { useGame } from '@/lib/game/game-context';
import { ProButton } from '@/components/ui/ProButton';
import { COLOR, SPACE, RADIUS, FONT, GLASS_PANEL, SHADOW, FONT_FAMILY } from '@/components/ui/design-tokens';

export default function RoundsConfigScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isSmallHeight = height < 400;

  const { setTotalRounds, setAbilitiesEnabled } = useGame();
  const [rounds, setRounds] = useState(5);
  const [withAbility, setWithAbility] = useState(false);

  const roundOptions = Array.from({ length: 20 }, (_, i) => i + 1);

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <LuxuryBackground>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.container, isSmallHeight && { paddingTop: SPACE.md, paddingBottom: SPACE.lg }]}
          showsVerticalScrollIndicator={false}
        >

          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push('/screens/game-mode' as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>← رجوع</Text>
          </TouchableOpacity>

          {/* Title */}
          <View style={[styles.header, isSmallHeight && { marginBottom: SPACE.md }]}>
            <Text style={[styles.title, isSmallHeight && { fontSize: FONT.xl }]}>عدد الجولات</Text>
            <View style={[styles.selectedPill, isSmallHeight && { paddingVertical: SPACE.xs, paddingHorizontal: SPACE.lg }]}>
              <Text style={[styles.selectedPillText, isSmallHeight && { fontSize: FONT.lg }]}>{rounds} جولات</Text>
            </View>
          </View>

          {/* Rounds grid */}
          <View style={[styles.panel, isSmallHeight && { padding: SPACE.lg, marginBottom: SPACE.md }]}>
            <Text style={[styles.panelLabel, isSmallHeight && { marginBottom: SPACE.xs }]}>اختر عدد الجولات</Text>
            <View style={[styles.roundsGrid, isSmallHeight && { marginTop: SPACE.xs, gap: SPACE.xs }]}>
              {roundOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.roundPill,
                    rounds === option && styles.roundPillActive,
                    { width: Math.min(44, (width - 40 - 40) / 6), height: Math.min(44, (width - 40 - 40) / 6) },
                    isSmallHeight && { width: 36, height: 36 }
                  ]}
                  onPress={() => setRounds(option)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.roundPillText,
                    rounds === option && styles.roundPillTextActive,
                    isSmallHeight && { fontSize: FONT.xs }
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Abilities toggle */}
          <View style={[styles.panel, isSmallHeight && { padding: SPACE.lg, marginBottom: SPACE.md }]}>
            <Text style={styles.panelLabel}>القدرات الخاصة</Text>
            <Text style={[styles.panelDesc, isSmallHeight && { marginBottom: SPACE.md }]}>
              قدرات فريدة تغير مجريات المعركة
            </Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleOption, withAbility && styles.toggleOptionActive]}
                onPress={() => { setWithAbility(true); setAbilitiesEnabled(true); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleOptionText, withAbility && styles.toggleOptionTextActive]}>
                  ✦ مفعّلة
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleOption, !withAbility && styles.toggleOptionActive]}
                onPress={() => { setWithAbility(false); setAbilitiesEnabled(false); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleOptionText, !withAbility && styles.toggleOptionTextActive]}>
                  ✕ معطّلة
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Continue CTA */}
          <ProButton
            label="التالي →"
            onPress={() => {
              setTotalRounds(rounds);
              setAbilitiesEnabled(withAbility);
              router.push('/screens/leaderboard' as any);
            }}
            variant="primary"
            fullWidth
            style={[styles.continueBtn, isSmallHeight && { marginTop: SPACE.md }]}
          />
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
  backBtnText: {
    color: COLOR.gold,
    fontSize: FONT.md,
    },

  header: {
    alignItems: 'center',
    marginBottom: SPACE.xxl,
    gap: SPACE.md,
  },
  title: {
    fontSize: FONT.hero,
    color: COLOR.gold,
    letterSpacing: 1,
  },
  selectedPill: {
    backgroundColor: COLOR.goldFill,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACE.xl,
    paddingVertical: SPACE.sm,
    borderWidth: 1.5,
    borderColor: COLOR.gold,
  },
  selectedPillText: {
    color: COLOR.gold,
    fontSize: FONT.xl,
    },

  panel: {
    ...GLASS_PANEL,
    padding: SPACE.xl,
    marginBottom: SPACE.lg,
  },
  panelLabel: {
    color: COLOR.gold,
    fontSize: FONT.base,
    letterSpacing: 0.5,
    marginBottom: SPACE.sm,
  },
  panelDesc: {
    color: COLOR.textMuted,
    fontSize: FONT.sm,
    marginBottom: SPACE.lg,
  },

  roundsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
    justifyContent: 'center',
    marginTop: SPACE.sm,
  },

  roundPill: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(228,165,42,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundPillActive: {
    backgroundColor: COLOR.gold,
    borderColor: COLOR.gold,
    ...SHADOW.gold,
  },
  roundPillText: {
    color: COLOR.textMuted,
    fontSize: FONT.lg,
    },
  roundPillTextActive: {
    color: '#1A0D1A',
  },

  toggleRow: {
    flexDirection: 'row',
    gap: SPACE.md,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: SPACE.md,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(228,165,42,0.2)',
    alignItems: 'center',
  },
  toggleOptionActive: {
    backgroundColor: COLOR.goldFill,
    borderColor: COLOR.gold,
  },
  toggleOptionText: {
    color: COLOR.textMuted,
    fontSize: FONT.base,
    },
  toggleOptionTextActive: {
    color: COLOR.gold,
  },

  continueBtn: {
    marginTop: SPACE.xl,
  },
});
