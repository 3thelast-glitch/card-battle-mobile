/**
 * RoundsConfigScreen — Redesigned: Professional, responsive, clean.
 */
import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { ThemedText as Text } from '@/components/ui/ThemedText';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { LuxuryBackground } from '@/components/game/luxury-background';
import { useGame } from '@/lib/game/game-context';
import { COLOR, SPACE, RADIUS, FONT, GLASS_PANEL, SHADOW } from '@/components/ui/design-tokens';

const ROUND_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20];

export default function RoundsConfigScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const { setTotalRounds, setAbilitiesEnabled } = useGame();
  const [rounds, setRounds] = useState(5);
  const [withAbility, setWithAbility] = useState(false);

  const handleContinue = () => {
    setTotalRounds(rounds);
    setAbilitiesEnabled(withAbility);
    router.push('/screens/leaderboard' as any);
  };

  const mainContent = (
    <>
      {/* Rounds picker */}
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>🎯 عدد الجولات</Text>
          <View style={styles.selectedPill}>
            <Text style={styles.selectedPillText}>{rounds}</Text>
          </View>
        </View>
        <View style={styles.pillsGrid}>
          {ROUND_OPTIONS.map((opt) => {
            const active = rounds === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.roundPill, active && styles.roundPillActive]}
                onPress={() => setRounds(opt)}
                activeOpacity={0.7}
              >
                <Text style={[styles.roundPillText, active && styles.roundPillTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Abilities toggle */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>⚡ القدرات الخاصة</Text>
        <Text style={styles.panelDesc}>قدرات فريدة تغير مجريات المعركة</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, withAbility && styles.toggleBtnActive]}
            onPress={() => setWithAbility(true)}
            activeOpacity={0.75}
          >
            <Text style={styles.toggleBtnIcon}>✦</Text>
            <Text style={[styles.toggleBtnText, withAbility && styles.toggleBtnTextActive]}>مفعّلة</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, !withAbility && styles.toggleBtnInactive]}
            onPress={() => setWithAbility(false)}
            activeOpacity={0.75}
          >
            <Text style={styles.toggleBtnIcon}>✕</Text>
            <Text style={[styles.toggleBtnText, !withAbility && styles.toggleBtnTextInactive]}>معطّلة</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CTA */}
      <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
        <Text style={styles.continueBtnText}>التالي →</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <LuxuryBackground>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/screens/game-mode' as any)} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>← رجوع</Text>
          </TouchableOpacity>

          {/* Title */}
          <View style={styles.header}>
            <Text style={styles.title}>إعداد المباراة</Text>
            <Text style={styles.subtitle}>خصّص تجربتك قبل المعركة</Text>
          </View>

          {isLandscape ? (
            <View style={styles.twoCol}>
              <View style={{ flex: 1, gap: SPACE.lg }}>
                {/* Rounds panel */}
                <View style={styles.panel}>
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>🎯 عدد الجولات</Text>
                    <View style={styles.selectedPill}>
                      <Text style={styles.selectedPillText}>{rounds}</Text>
                    </View>
                  </View>
                  <View style={styles.pillsGrid}>
                    {ROUND_OPTIONS.map((opt) => {
                      const active = rounds === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.roundPill, active && styles.roundPillActive]}
                          onPress={() => setRounds(opt)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.roundPillText, active && styles.roundPillTextActive]}>{opt}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
              <View style={{ flex: 1, gap: SPACE.lg }}>
                {/* Abilities panel */}
                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>⚡ القدرات الخاصة</Text>
                  <Text style={styles.panelDesc}>قدرات فريدة تغير مجريات المعركة</Text>
                  <View style={styles.toggleRow}>
                    <TouchableOpacity style={[styles.toggleBtn, withAbility && styles.toggleBtnActive]} onPress={() => setWithAbility(true)} activeOpacity={0.75}>
                      <Text style={styles.toggleBtnIcon}>✦</Text>
                      <Text style={[styles.toggleBtnText, withAbility && styles.toggleBtnTextActive]}>مفعّلة</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.toggleBtn, !withAbility && styles.toggleBtnInactive]} onPress={() => setWithAbility(false)} activeOpacity={0.75}>
                      <Text style={styles.toggleBtnIcon}>✕</Text>
                      <Text style={[styles.toggleBtnText, !withAbility && styles.toggleBtnTextInactive]}>معطّلة</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {/* CTA in landscape */}
                <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
                  <Text style={styles.continueBtnText}>التالي →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : mainContent}
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
    gap: SPACE.lg,
  },

  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(228,165,42,0.3)',
  },
  backBtnText: { color: COLOR.gold, fontSize: FONT.md },

  header: { alignItems: 'center', gap: SPACE.xs },
  title: { fontSize: FONT.hero, color: COLOR.gold, letterSpacing: 1, textAlign: 'center' },
  subtitle: { color: COLOR.textMuted, fontSize: FONT.sm, textAlign: 'center' },

  twoCol: { flexDirection: 'row', gap: SPACE.lg },

  panel: { ...GLASS_PANEL, padding: SPACE.xl, gap: SPACE.md },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  panelTitle: { color: COLOR.gold, fontSize: FONT.base },
  panelDesc: { color: COLOR.textMuted, fontSize: FONT.sm },

  selectedPill: {
    backgroundColor: COLOR.goldFill,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.xs,
    borderWidth: 1,
    borderColor: COLOR.gold,
  },
  selectedPillText: { color: COLOR.gold, fontSize: FONT.xl },

  pillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
    justifyContent: 'center',
  },
  roundPill: {
    width: 48, height: 48,
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
  roundPillText: { color: COLOR.textMuted, fontSize: FONT.lg },
  roundPillTextActive: { color: '#1A0D1A' },

  toggleRow: { flexDirection: 'row', gap: SPACE.md },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.xs,
    paddingVertical: SPACE.md,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(228,165,42,0.2)',
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderColor: '#4ade80',
  },
  toggleBtnInactive: {
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderColor: '#f87171',
  },
  toggleBtnIcon: { fontSize: 16, color: COLOR.textMuted },
  toggleBtnText: { fontSize: FONT.base, color: COLOR.textMuted },
  toggleBtnTextActive: { color: '#4ade80' },
  toggleBtnTextInactive: { color: '#f87171' },

  continueBtn: {
    backgroundColor: COLOR.gold,
    paddingVertical: SPACE.lg,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    ...SHADOW.gold,
  },
  continueBtnText: { fontSize: FONT.xl, color: '#1A0D1A' },

});