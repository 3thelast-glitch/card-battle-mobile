/**
 * SplashScreen — Fully Polished Home Screen (Phase 6 Complete)
 *
 * Sections:
 *  1. Hero: animated logo + golden title + live win-streak badge
 *  2. Live Stats Bar:  real persisted wins / win-rate / streak from loadStats()
 *  3. Daily Quests:   3 generated daily missions with progress bars
 *  4. Recent Match:   last match card pulled from matchHistory
 *  5. Rarity Showcase: auto-cycling rarity frame with element preview
 *  6. CTA Row:        pulsing ⚔️ Play + Stats + Collection + Settings
 *
 * All sections stagger in with Reanimated v4.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
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

const { width: SW } = Dimensions.get('window');

// ─── Daily Quest Definition ───────────────────────────────────────────────────

interface DailyQuest {
  id: string;
  icon: string;
  titleAr: string;
  target: number;
  progress: number;
  reward: string;
}

function getDailyQuests(stats: PlayerStats | null): DailyQuest[] {
  const wins = stats?.totalWins ?? 0;
  const matches = stats?.totalMatches ?? 0;
  return [
    {
      id: 'q1',
      icon: '⚔️',
      titleAr: 'العب 3 مباريات',
      target: 3,
      progress: Math.min(matches % 3, 3),
      reward: '🏆 +50 XP',
    },
    {
      id: 'q2',
      icon: '🥇',
      titleAr: 'انتصر في مباراتين',
      target: 2,
      progress: Math.min(wins % 2, 2),
      reward: '💎 بطاقة نادرة',
    },
    {
      id: 'q3',
      icon: '🔥',
      titleAr: 'حقق سلسلة 3 انتصارات',
      target: 3,
      progress: Math.min(stats?.currentWinStreak ?? 0, 3),
      reward: '⭐ بطاقة أسطورية',
    },
  ];
}

// ─── Animated Components ──────────────────────────────────────────────────────

function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useSharedValue(0);
  const y = useSharedValue(20);
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    y.value = withDelay(delay, withSpring(0, { damping: 16 }));
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: y.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

function PulsingPlay({ onPress }: { onPress: () => void }) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.00, { duration: 900, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  return (
    <Animated.View style={pulseStyle}>
      <Pressable style={styles.playBtn} onPress={onPress} accessibilityRole="button">
        <Text style={styles.playBtnIcon}>⚔️</Text>
        <Text style={styles.playBtnText}>ابدأ المواجهة</Text>
        <Text style={styles.playBtnSub}>QUICK PLAY</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Rarity Showcase ──────────────────────────────────────────────────────────

const RARITIES = [
  { label: 'Common', color: '#4F46E5', emoji: '🔵', element: '💧', bg: '#1e3a8a' },
  { label: 'Rare', color: '#F59E0B', emoji: '🟡', element: '🔥', bg: '#78350f' },
  { label: 'Epic', color: '#8B5CF6', emoji: '🟣', element: '⚡', bg: '#4a1d96' },
  { label: 'Legendary', color: '#EF4444', emoji: '🔴', element: '🌪️', bg: '#7f1d1d' },
];

function RarityCarousel() {
  const [idx, setIdx] = useState(0);
  const cardScale = useSharedValue(1);
  useEffect(() => {
    const id = setInterval(() => {
      cardScale.value = withSequence(
        withTiming(0.88, { duration: 120 }),
        withSpring(1.0, { damping: 12 })
      );
      setIdx((p) => (p + 1) % RARITIES.length);
    }, 2000);
    return () => clearInterval(id);
  }, []);
  const r = RARITIES[idx];
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: cardScale.value }] }));

  return (
    <View style={styles.rarityWrap}>
      <Animated.View
        style={[
          styles.rarityCard,
          { borderColor: r.color, shadowColor: r.color, backgroundColor: r.bg + 'cc' },
          cardStyle,
        ]}
      >
        <Text style={styles.rarityCardEmoji}>{r.emoji}</Text>
        <Text style={styles.rarityCardElement}>{r.element}</Text>
        <View style={[styles.rarityBadge, { backgroundColor: r.color + '33', borderColor: r.color }]}>
          <Text style={[styles.rarityBadgeText, { color: r.color }]}>{r.label}</Text>
        </View>
      </Animated.View>
      {/* Rarity dots */}
      <View style={styles.rarityDots}>
        {RARITIES.map((rr, i) => (
          <Pressable key={rr.label} onPress={() => setIdx(i)}>
            <View style={[styles.dot, { backgroundColor: rr.color, opacity: i === idx ? 1 : 0.3, transform: [{ scale: i === idx ? 1.35 : 1 }] }]} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─── Quest Progress Bar ───────────────────────────────────────────────────────

function QuestBar({ progress, target }: { progress: number; target: number }) {
  const width = useSharedValue(0);
  const fraction = target > 0 ? Math.min(progress / target, 1) : 0;
  useEffect(() => {
    width.value = withTiming(fraction * 100, { duration: 700, easing: Easing.out(Easing.quad) });
  }, [fraction]);
  const barStyle = useAnimatedStyle(() => ({ width: `${width.value}%` as any }));
  return (
    <View style={styles.questBarTrack}>
      <Animated.View style={[styles.questBarFill, barStyle, { backgroundColor: fraction >= 1 ? '#4ade80' : '#d4af37' }]} />
    </View>
  );
}

// ─── Match Result Chip ────────────────────────────────────────────────────────

function MatchChip({ match }: { match: { winner: string; playerScore: number; botScore: number; difficulty: string } }) {
  const isWin = match.winner === 'player';
  const isDraw = match.winner === 'draw';
  const color = isWin ? '#4ade80' : isDraw ? '#facc15' : '#f87171';
  const label = isWin ? 'فوز 🏆' : isDraw ? 'تعادل 🤝' : 'هزيمة 💀';
  return (
    <View style={[styles.matchChip, { borderColor: color + '55', backgroundColor: color + '15' }]}>
      <Text style={[styles.matchLabel, { color }]}>{label}</Text>
      <Text style={styles.matchScore}>{match.playerScore} - {match.botScore}</Text>
      <Text style={styles.matchDiff}>{match.difficulty === 'easy' ? 'سهل' : match.difficulty === 'medium' ? 'متوسط' : 'صعب'}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SplashScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<PlayerStats | null>(null);

  const loadData = useCallback(async () => {
    const s = await loadStats();
    setStats(s);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalMatches = stats?.totalMatches ?? 0;
  const totalWins = stats?.totalWins ?? 0;
  const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
  const streak = stats?.currentWinStreak ?? 0;
  const bestStreak = stats?.bestWinStreak ?? 0;
  const lastMatch = stats?.matchHistory?.[0] ?? null;
  const dailyQuests = getDailyQuests(stats);

  // Hero animation
  const logoY = useSharedValue(-40);
  const logoOp = useSharedValue(0);
  useEffect(() => {
    logoOp.value = withTiming(1, { duration: 600 });
    logoY.value = withSpring(0, { damping: 14 });
  }, []);
  const logoStyle = useAnimatedStyle(() => ({ opacity: logoOp.value, transform: [{ translateY: logoY.value }] }));

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <LuxuryBackground>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 1. Hero ── */}
          <Animated.View style={[styles.hero, logoStyle]}>
            <Text style={styles.logoIcon}>🃏</Text>
            <Text style={styles.logoTitle}>Card Clash</Text>
            <Text style={styles.logoTagline}>المواجهة الأسطورية للكروت</Text>
            {streak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 سلسلة {streak} انتصارات!</Text>
              </View>
            )}
          </Animated.View>

          {/* ── 2. Live Stats ── */}
          <Section delay={180}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📊 إحصائياتك</Text>
              <View style={styles.statsRow}>
                <View style={styles.statPill}>
                  <Text style={[styles.statNum, { color: '#4ade80' }]}>{totalWins}</Text>
                  <Text style={styles.statLbl}>انتصارات</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statPill}>
                  <Text style={[styles.statNum, { color: '#facc15' }]}>{winRate}%</Text>
                  <Text style={styles.statLbl}>معدل الفوز</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statPill}>
                  <Text style={[styles.statNum, { color: '#f87171' }]}>{totalMatches}</Text>
                  <Text style={styles.statLbl}>مباريات</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statPill}>
                  <Text style={[styles.statNum, { color: '#fb923c' }]}>{bestStreak}</Text>
                  <Text style={styles.statLbl}>أفضل سلسلة</Text>
                </View>
              </View>
            </View>
          </Section>

          {/* ── 3. Daily Quests ── */}
          <Section delay={300}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🎯 المهام اليومية</Text>
              {dailyQuests.map((q) => {
                const done = q.progress >= q.target;
                return (
                  <View key={q.id} style={[styles.questRow, done && styles.questDone]}>
                    <Text style={styles.questIcon}>{q.icon}</Text>
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={styles.questHeader}>
                        <Text style={[styles.questTitle, done && { color: '#4ade80' }]}>{q.titleAr}</Text>
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

          {/* ── 4. Last Match ── */}
          {lastMatch && (
            <Section delay={420}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>⏱️ آخر مباراة</Text>
                <MatchChip match={lastMatch} />
              </View>
            </Section>
          )}

          {/* ── 5. Rarity Showcase ── */}
          <Section delay={500}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>✨ ندرة الكروت</Text>
              <RarityCarousel />
            </View>
          </Section>

          {/* ── 6. CTA ── */}
          <Section delay={600}>
            <View style={styles.ctaSection}>
              <PulsingPlay onPress={() => router.push('/screens/game-mode' as any)} />
              <View style={styles.secondaryRow}>
                {[
                  { icon: '📊', label: 'الإحصائيات', route: '/screens/stats' },
                  { icon: '⚙️', label: 'الإعدادات', route: '/screens/settings' },
                  { icon: '🏆', label: 'المتصدرين', route: '/screens/leaderboard' },
                ].map((b) => (
                  <TouchableOpacity
                    key={b.route}
                    style={styles.secBtn}
                    onPress={() => router.push(b.route as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.secIcon}>{b.icon}</Text>
                    <Text style={styles.secLabel}>{b.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.version}>Card Clash v2.0 — Game-Changing Edition</Text>
            </View>
          </Section>

        </ScrollView>
      </LuxuryBackground>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GOLD = '#d4af37';
const CARD_BG = 'rgba(0,0,0,0.55)';

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 14,
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  logoIcon: { fontSize: 58 },
  logoTitle: {
    fontSize: 44,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 2,
    textShadowColor: 'rgba(212,175,55,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  logoTagline: {
    color: '#9ca3af',
    fontSize: 13,
    letterSpacing: 0.8,
  },
  streakBadge: {
    backgroundColor: 'rgba(251,146,60,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#fb923c55',
    marginTop: 4,
  },
  streakText: { color: '#fb923c', fontWeight: '800', fontSize: 13 },

  // Cards (section panels)
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
    gap: 12,
  },
  cardTitle: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statPill: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 22, fontWeight: '900' },
  statLbl: { color: '#6b7280', fontSize: 9, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(212,175,55,0.15)' },

  // Quests
  questRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 10,
  },
  questDone: { backgroundColor: 'rgba(74,222,128,0.07)' },
  questIcon: { fontSize: 22 },
  questHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  questTitle: { color: '#e5e7eb', fontSize: 12, fontWeight: '600', flex: 1 },
  questProgress: { color: '#9ca3af', fontSize: 11 },
  questBarTrack: {
    height: 5, borderRadius: 3, backgroundColor: '#1f2937', overflow: 'hidden',
  },
  questBarFill: { height: 5, borderRadius: 3 },
  questReward: { fontSize: 11, color: GOLD, fontWeight: '700', textAlign: 'right', minWidth: 36 },

  // Last Match
  matchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  matchLabel: { fontSize: 14, fontWeight: '800' },
  matchScore: { color: '#fff', fontSize: 16, fontWeight: '900' },
  matchDiff: { color: '#9ca3af', fontSize: 11 },

  // Rarity Carousel
  rarityWrap: { alignItems: 'center', gap: 14 },
  rarityCard: {
    width: 120,
    height: 170,
    borderRadius: 16,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 18,
  },
  rarityCardEmoji: { fontSize: 46 },
  rarityCardElement: { fontSize: 22 },
  rarityBadge: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 10, borderWidth: 1, marginTop: 4,
  },
  rarityBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  rarityDots: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  dot: { width: 9, height: 9, borderRadius: 5 },

  // CTA
  ctaSection: { alignItems: 'center', gap: 14 },
  playBtn: {
    backgroundColor: GOLD,
    paddingHorizontal: 44,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    minWidth: SW * 0.72,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
  },
  playBtnIcon: { fontSize: 26, marginBottom: 2 },
  playBtnText: { color: '#1a1a1a', fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
  playBtnSub: { color: 'rgba(0,0,0,0.45)', fontSize: 9, fontWeight: '700', letterSpacing: 2, marginTop: 2 },

  secondaryRow: { flexDirection: 'row', gap: 10 },
  secBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.10)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.25)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 4,
  },
  secIcon: { fontSize: 22 },
  secLabel: { color: GOLD, fontSize: 10, fontWeight: '700' },

  version: { color: '#374151', fontSize: 10, fontWeight: '500', letterSpacing: 0.4 },
});
