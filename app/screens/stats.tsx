import { View, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { ThemedText as Text } from '@/components/ui/ThemedText';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { LuxuryBackground } from '@/components/game/luxury-background';
import { useState, useEffect } from 'react';
import { loadStats, resetStats } from '@/lib/stats/storage';
import { PlayerStats } from '@/lib/stats/types';
import { ProButton } from '@/components/ui/ProButton';
import { COLOR, SPACE, RADIUS, FONT, GLASS_PANEL, FONT_FAMILY } from '@/components/ui/design-tokens';

const ELEMENT_COLORS: Record<string, string> = {
  fire: '#EF4444',
  ice: '#38BDF8',
  water: '#3B82F6',
  earth: '#84CC16',
  lightning: '#FACC15',
  wind: '#A78BFA',
};

export default function StatsScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStatsData(); }, []);

  const loadStatsData = async () => {
    setLoading(true);
    const data = await loadStats();
    setStats(data);
    setLoading(false);
  };

  const handleReset = () => {
    Alert.alert(
      'إعادة تعيين الإحصائيات',
      'هل أنت متأكد؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => { await resetStats(); await loadStatsData(); },
        },
      ]
    );
  };

  const winRate = stats && stats.totalMatches > 0
    ? ((stats.totalWins / stats.totalMatches) * 100).toFixed(1)
    : '0.0';

  const elementStatsArray = stats
    ? Object.values(stats.elementStats).sort((a, b) => b.timesUsed - a.timesUsed)
    : [];

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <LuxuryBackground>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>📊 الإحصائيات</Text>
          </View>

          {/* General stats */}
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>عام</Text>
            <View style={styles.statsRow}>
              {[
                { label: 'مباريات', value: stats?.totalMatches ?? 0, color: COLOR.gold },
                { label: 'انتصارات', value: stats?.totalWins ?? 0, color: COLOR.green },
                { label: 'هزائم', value: stats?.totalLosses ?? 0, color: COLOR.red },
                { label: 'تعادلات', value: stats?.totalDraws ?? 0, color: COLOR.amber },
              ].map((s) => (
                <View key={s.label} style={styles.statPill}>
                  <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
            {/* Win rate bar */}
            <View style={styles.winRateRow}>
              <Text style={styles.winRateLabel}>معدل الفوز: {winRate}%</Text>
              <View style={styles.winRateTrack}>
                <View style={[styles.winRateFill, { width: `${winRate}%` as any }]} />
              </View>
            </View>
          </View>

          {/* Streaks */}
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>أفضل النتائج</Text>
            <View style={styles.statsRow}>
              <View style={styles.statPill}>
                <Text style={[styles.statNum, { color: COLOR.gold }]}>{stats?.bestWinStreak ?? 0}</Text>
                <Text style={styles.statLabel}>أطول سلسلة</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={[styles.statNum, { color: COLOR.green }]}>{stats?.currentWinStreak ?? 0}</Text>
                <Text style={styles.statLabel}>السلسلة الحالية</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={[styles.statNum, { color: COLOR.amber }]}>{stats?.highestScore ?? 0}</Text>
                <Text style={styles.statLabel}>أعلى نتيجة</Text>
              </View>
            </View>
          </View>

          {/* Element stats */}
          {elementStatsArray.length > 0 && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>إحصائيات العناصر</Text>
              {elementStatsArray.map((el) => {
                const elColor = ELEMENT_COLORS[el.element] ?? COLOR.gold;
                const winFrac = el.timesUsed > 0 ? el.wins / el.timesUsed : 0;
                return (
                  <View key={el.element} style={styles.elementRow}>
                    <Text style={[styles.elementName, { color: elColor }]}>{el.element}</Text>
                    <View style={styles.elementBarTrack}>
                      <View style={[styles.elementBarFill, { width: `${winFrac * 100}%` as any, backgroundColor: elColor }]} />
                    </View>
                    <Text style={styles.elementStats}>{el.wins}W / {el.losses}L</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Match history */}
          {stats && stats.matchHistory.length > 0 && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>آخر المباريات</Text>
              {stats.matchHistory.map((match, index) => {
                const matchColor =
                  match.winner === 'player' ? COLOR.green :
                    match.winner === 'bot' ? COLOR.red : COLOR.amber;
                const matchLabel =
                  match.winner === 'player' ? 'فوز 🏆' :
                    match.winner === 'bot' ? 'هزيمة 💀' : 'تعادل 🤝';
                const diffLabel =
                  match.difficulty === 1 ? 'سهل' :
                    match.difficulty === 2 ? 'متوسط' :
                      match.difficulty === 3 ? 'صعب' :
                        match.difficulty === 4 ? 'خيالي' :
                          match.difficulty === 5 ? 'أسطوري' : 'مجهول';
                return (
                  <View key={match.id} style={[styles.historyCard, { borderLeftColor: matchColor }]}>
                    <View style={styles.historyLeft}>
                      <Text style={[styles.historyResult, { color: matchColor }]}>{matchLabel}</Text>
                      <Text style={styles.historyDiff}>{diffLabel}</Text>
                    </View>
                    <Text style={styles.historyScore}>
                      {match.playerScore} — {match.botScore}
                    </Text>
                    <Text style={styles.historyRounds}>{match.totalRounds} جولة</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <ProButton label="🗑️ إعادة تعيين" onPress={handleReset} variant="danger" style={styles.actionBtn} />
            <ProButton label="← رجوع" onPress={() => router.back()} variant="secondary" style={styles.actionBtn} />
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
    gap: SPACE.lg,
  },

  header: { alignItems: 'center', marginBottom: SPACE.sm },
  title: { fontSize: FONT.hero, color: COLOR.gold, letterSpacing: 1, textAlign: 'center', flexWrap: 'wrap' } as any,

  panel: { ...GLASS_PANEL, padding: SPACE.xl },
  panelTitle: { color: COLOR.gold, fontSize: FONT.base, marginBottom: SPACE.lg },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACE.lg,
  },
  statPill: { alignItems: 'center' },
  statNum: { fontSize: FONT.xxl },
  statLabel: { color: COLOR.textMuted, fontSize: FONT.xs, marginTop: 2 },

  winRateRow: { gap: SPACE.xs },
  winRateLabel: { color: COLOR.textMuted, fontSize: FONT.sm },
  winRateTrack: {
    height: 6, borderRadius: RADIUS.full,
    backgroundColor: 'rgba(228,165,42,0.12)', overflow: 'hidden',
  },
  winRateFill: { height: '100%', backgroundColor: COLOR.gold, borderRadius: RADIUS.full },

  elementRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACE.md, marginBottom: SPACE.md,
  },
  elementName: { width: 72, fontSize: FONT.sm, textTransform: 'capitalize' },
  elementBarTrack: {
    flex: 1, height: 8, borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
  },
  elementBarFill: { height: '100%', borderRadius: RADIUS.full },
  elementStats: { color: COLOR.textMuted, fontSize: FONT.xs, width: 64, textAlign: 'right' },

  historyCard: {
    flexDirection: 'row', alignItems: 'center',
    borderLeftWidth: 3, paddingLeft: SPACE.md,
    paddingVertical: SPACE.sm, marginBottom: SPACE.sm,
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: RADIUS.sm,
    gap: SPACE.md,
  },
  historyLeft: { flex: 1 },
  historyResult: { fontSize: FONT.sm },
  historyDiff: { color: COLOR.textMuted, fontSize: FONT.xs, marginTop: 2 },
  historyScore: { color: COLOR.textPrimary, fontSize: FONT.base },
  historyRounds: { color: COLOR.textMuted, fontSize: FONT.xs, minWidth: 44, textAlign: 'right' },

  actions: { flexDirection: 'row', gap: SPACE.md },
  actionBtn: { flex: 1 },
});
