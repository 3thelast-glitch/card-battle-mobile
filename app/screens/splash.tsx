/**
 * SplashScreen — Professional Landscape Hero (Overhauled)
 *
 * Layout:
 *  Left (<40%): Rarity card carousel rotating showcase
 *  Right (>60%): Title + live stats strip + daily quests + CTA
 *
 * Animations: Reanimated stagger-in on all sections.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { ThemedText as Text } from '@/components/ui/ThemedText';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { ScreenContainer } from '@/components/screen-container';
import { LuxuryBackground } from '@/components/game/luxury-background';
import { loadStats } from '@/lib/stats/storage';
import { PlayerStats } from '@/lib/stats/types';
import { ProButton } from '@/components/ui/ProButton';
import { COLOR, SPACE, RADIUS, FONT, GLASS_PANEL, SHADOW, FONT_FAMILY } from '@/components/ui/design-tokens';

// ─── Rarity Carousel ─────────────────────────────────────────────────────────
const RARITIES = [
  { label: 'Common', color: '#4F46E5', emoji: '🔵', element: '💧', bg: '#1e3a8a' },
  { label: 'Rare', color: '#F59E0B', emoji: '🟡', element: '🔥', bg: '#78350f' },
  { label: 'Epic', color: '#8B5CF6', emoji: '🟣', element: '⚡', bg: '#4a1d96' },
  { label: 'Legendary', color: '#EF4444', emoji: '🔴', element: '🌪️', bg: '#7f1d1d' },
];

function RarityShowcase() {
  const [idx, setIdx] = useState(0);
  const scale = useSharedValue(1);
  const r = RARITIES[idx];

  useEffect(() => {
    const id = setInterval(() => {
      scale.value = withSequence(
        withTiming(0.85, { duration: 150 }),
        withSpring(1.0, { damping: 10 })
      );
      setIdx((p) => (p + 1) % RARITIES.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const { width } = useWindowDimensions();
  const cardScale = width < 400 ? 0.8 : 1;

  return (
    <View style={[showcase.wrap, { transform: [{ scale: cardScale }] }]}>
      <Animated.View style={[showcase.card, { borderColor: r.color, shadowColor: r.color, backgroundColor: r.bg + 'cc' }, cardStyle]}>
        <Text style={showcase.emoji}>{r.emoji}</Text>
        <Text style={showcase.element}>{r.element}</Text>
        <View style={[showcase.badge, { backgroundColor: r.color + '22', borderColor: r.color }]}>
          <Text style={[showcase.badgeText, { color: r.color }]}>{r.label}</Text>
        </View>
      </Animated.View>
      {/* Rarity dots */}
      <View style={showcase.dots}>
        {RARITIES.map((rr, i) => (
          <View
            key={rr.label}
            style={[
              showcase.dot,
              { backgroundColor: rr.color, opacity: i === idx ? 1 : 0.25, transform: [{ scale: i === idx ? 1.4 : 1 }] }
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const showcase = StyleSheet.create({
  wrap: { alignItems: 'center', gap: SPACE.lg },
  card: {
    width: 140, height: 196,
    borderRadius: RADIUS.lg,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 24,
    elevation: 20,
  },
  emoji: { fontSize: 52 },
  element: { fontSize: 24 },
  badge: {
    paddingHorizontal: SPACE.md, paddingVertical: 3,
    borderRadius: RADIUS.sm, borderWidth: 1, marginTop: SPACE.xs,
  },
  badgeText: { fontSize: 9, letterSpacing: 0.5 },
  dots: { flexDirection: 'row', gap: SPACE.sm, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

// ─── Animated Section ─────────────────────────────────────────────────────────
function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useSharedValue(0);
  const y = useSharedValue(24);
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 460 }));
    y.value = withDelay(delay, withSpring(0, { damping: 18 }));
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: y.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

// ─── Pulsing CTA ──────────────────────────────────────────────────────────────
function PulsingPlay({ onPress }: { onPress: () => void }) {
  const glow = useSharedValue(1);
  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.00, { duration: 900, easing: Easing.inOut(Easing.sin) })
      ), -1, false
    );
  }, []);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: glow.value }] }));
  return (
    <Animated.View style={s}>
      <TouchableOpacity style={cta.btn} onPress={onPress} activeOpacity={0.85}>
        <Text style={cta.icon}>⚔️</Text>
        <Text style={cta.text}>ابدأ المواجهة</Text>
        <Text style={cta.sub}>QUICK PLAY</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const cta = StyleSheet.create({
  btn: {
    backgroundColor: COLOR.gold,
    paddingHorizontal: SPACE.xxl + SPACE.xl,
    paddingVertical: SPACE.lg,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    ...SHADOW.gold,
  },
  icon: { fontSize: 26, marginBottom: 2 },
  text: { color: '#1A0D1A', fontSize: FONT.xl, letterSpacing: 0.5 },
  sub: { color: 'rgba(0,0,0,0.4)', fontSize: 9, letterSpacing: 2, marginTop: 2 },
});

// ─── Quest Progress Bar ───────────────────────────────────────────────────────
function QuestBar({ progress, target }: { progress: number; target: number }) {
  const w = useSharedValue(0);
  const frac = target > 0 ? Math.min(progress / target, 1) : 0;
  useEffect(() => {
    w.value = withTiming(frac * 100, { duration: 700, easing: Easing.out(Easing.quad) });
  }, [frac]);
  const barStyle = useAnimatedStyle(() => ({ width: `${w.value}%` as any }));
  return (
    <View style={quest.track}>
      <Animated.View style={[quest.fill, barStyle, { backgroundColor: frac >= 1 ? COLOR.green : COLOR.gold }]} />
    </View>
  );
}

const quest = StyleSheet.create({
  track: { height: 5, borderRadius: 3, backgroundColor: '#1f2937', overflow: 'hidden' },
  fill: { height: 5, borderRadius: 3 },
});

// ─── Daily Quest Helper ───────────────────────────────────────────────────────
interface DailyQuest { id: string; icon: string; titleAr: string; target: number; progress: number; reward: string; }
function getDailyQuests(stats: PlayerStats | null): DailyQuest[] {
  const wins = stats?.totalWins ?? 0;
  const matches = stats?.totalMatches ?? 0;
  return [
    { id: 'q1', icon: '⚔️', titleAr: 'العب 3 مباريات', target: 3, progress: Math.min(matches % 3, 3), reward: '🏆 +50 XP' },
    { id: 'q2', icon: '🥇', titleAr: 'انتصر في مباراتين', target: 2, progress: Math.min(wins % 2, 2), reward: '💎 بطاقة نادرة' },
    { id: 'q3', icon: '🔥', titleAr: 'حقق سلسلة 3 انتصارات', target: 3, progress: Math.min(stats?.currentWinStreak ?? 0, 3), reward: '⭐ أسطورية' },
  ];
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SplashScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLandscape = width > 600;

  const [stats, setStats] = useState<PlayerStats | null>(null);
  const loadData = useCallback(async () => { const s = await loadStats(); setStats(s); }, []);
  useEffect(() => { loadData(); }, [loadData]);

  const totalMatches = stats?.totalMatches ?? 0;
  const totalWins = stats?.totalWins ?? 0;
  const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
  const streak = stats?.currentWinStreak ?? 0;
  const dailyQuests = getDailyQuests(stats);

  // Logo entrance
  const logoOp = useSharedValue(0);
  const logoY = useSharedValue(-32);
  useEffect(() => {
    logoOp.value = withTiming(1, { duration: 600 });
    logoY.value = withSpring(0, { damping: 14 });
  }, []);
  const logoStyle = useAnimatedStyle(() => ({ opacity: logoOp.value, transform: [{ translateY: logoY.value }] }));

  const rightContent = (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: SPACE.lg, paddingBottom: SPACE.xxl }}>
      {/* Logo */}
      <Section delay={0}>
        <Animated.View style={[styles.logoArea, logoStyle, { transform: [{ scale: width < 400 ? 0.8 : 1 }] }]}>
          <Text style={styles.logoIcon}>🃏</Text>
          <Text style={[styles.logoTitle, { flexWrap: 'wrap', textAlign: 'center' }]}>Card Clash</Text>
          <Text style={[styles.logoTagline, { flexWrap: 'wrap', textAlign: 'center' }]}>المواجهة الأسطورية للكروت</Text>
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 سلسلة {streak} انتصارات!</Text>
            </View>
          )}
        </Animated.View>
      </Section>

      {/* Live Stats */}
      <Section delay={160}>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>📊 إحصائياتك</Text>
          <View style={styles.statsRow}>
            {[
              { num: totalWins, label: 'انتصارات', color: COLOR.green },
              { num: `${winRate}%`, label: 'معدل الفوز', color: COLOR.amber },
              { num: totalMatches, label: 'مباريات', color: COLOR.red },
              { num: stats?.bestWinStreak ?? 0, label: 'أفضل سلسلة', color: '#fb923c' },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <View style={styles.statDiv} />}
                <View style={styles.statPill}>
                  <Text style={[styles.statNum, { color: s.color }]}>{s.num}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>
      </Section>

      {/* Daily quests */}
      <Section delay={300}>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>🎯 المهام اليومية</Text>
          {dailyQuests.map((q) => {
            const done = q.progress >= q.target;
            return (
              <View key={q.id} style={[styles.questRow, done && styles.questDone]}>
                <Text style={styles.questIcon}>{q.icon}</Text>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[styles.questTitle, done && { color: COLOR.green }]}>{q.titleAr}</Text>
                    <Text style={styles.questProgress}>{q.progress}/{q.target}</Text>
                  </View>
                  <QuestBar progress={q.progress} target={q.target} />
                </View>
                <Text style={styles.questReward}>{done ? '✅' : q.reward}</Text>
              </View>
            );
          })}
        </View>
      </Section>

      {/* CTA */}
      <Section delay={460}>
        <View style={styles.ctaArea}>
          <PulsingPlay onPress={() => router.push('/screens/game-mode' as any)} />
          <View style={[styles.secondaryRow, { flexWrap: 'wrap', justifyContent: 'center' }]}>
            {[
              { icon: '📊', label: 'الإحصائيات', route: '/screens/stats' },
              { icon: '⚙️', label: 'الإعدادات', route: '/screens/settings' },
              // Removed leaderboard nav to avoid sending player to the number-picker
            ].map((b) => (
              <TouchableOpacity
                key={b.route}
                style={[styles.secBtn, { flex: 1, minWidth: 100 }]}
                onPress={() => router.push(b.route as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.secIcon}>{b.icon}</Text>
                <Text style={styles.secLabel}>{b.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.version}>Card Clash v2.0</Text>
        </View>
      </Section>
    </ScrollView>
  );

  if (isLandscape) {
    return (
      <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
        <LuxuryBackground>
          <View style={styles.landscapeRoot}>
            {/* Left: card showcase */}
            <View style={styles.landscapeLeft}>
              <Section delay={80}>
                <RarityShowcase />
              </Section>
            </View>
            {/* Right: content */}
            <View style={styles.landscapeRight}>
              {rightContent}
            </View>
          </View>
        </LuxuryBackground>
      </ScreenContainer>
    );
  }

  // Portrait fallback
  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <LuxuryBackground>
        <View style={{ flex: 1, paddingHorizontal: SPACE.lg }}>
          {rightContent}
        </View>
      </LuxuryBackground>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  landscapeRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  landscapeLeft: {
    width: '38%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(228,165,42,0.12)',
    paddingHorizontal: SPACE.xl,
  },
  landscapeRight: {
    flex: 1,
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.lg,
  },

  logoArea: { alignItems: 'center', gap: SPACE.sm },
  logoIcon: { fontSize: 52 },
  logoTitle: {
    fontSize: 42,
    color: COLOR.gold,
    letterSpacing: 2,
    textShadowColor: 'rgba(228,165,42,0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  logoTagline: { color: COLOR.textMuted, fontSize: 12, letterSpacing: 0.8 },
  streakBadge: {
    backgroundColor: 'rgba(251,146,60,0.18)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACE.lg,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#fb923c55',
    marginTop: SPACE.xs,
  },
  streakText: { color: '#fb923c', fontSize: 12 },

  panel: {
    ...GLASS_PANEL,
    padding: SPACE.lg,
    gap: SPACE.md,
  },
  panelTitle: { color: COLOR.gold, fontSize: FONT.sm, letterSpacing: 0.5 },

  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statDiv: { width: 1, height: 28, backgroundColor: 'rgba(228,165,42,0.15)' },
  statPill: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: FONT.xxl },
  statLabel: { color: '#6b7280', fontSize: 8, marginTop: 2 },

  questRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACE.sm,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.md, padding: SPACE.sm,
  },
  questDone: { backgroundColor: 'rgba(74,222,128,0.07)' },
  questIcon: { fontSize: 20 },
  questTitle: { color: '#e5e7eb', fontSize: 11, flex: 1 },
  questProgress: { color: '#9ca3af', fontSize: 10 },
  questReward: { fontSize: 10, color: COLOR.gold, minWidth: 36, textAlign: 'right' },

  ctaArea: { alignItems: 'center', gap: SPACE.lg },
  secondaryRow: { flexDirection: 'row', gap: SPACE.md },
  secBtn: {
    alignItems: 'center',
    backgroundColor: COLOR.goldFill,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLOR.goldDim,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.lg,
    gap: SPACE.xs,
  },
  secIcon: { fontSize: 20 },
  secLabel: { color: COLOR.gold, fontSize: 9 },
  version: { color: '#374151', fontSize: 9, letterSpacing: 0.4 },
});
