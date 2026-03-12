import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { ThemedText as Text } from '@/components/ui/ThemedText';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { LuxuryBackground } from '@/components/game/luxury-background';
import { useGame } from '@/lib/game/game-context';
import { updateStatsAfterMatch } from '@/lib/stats/storage';
import { ProButton } from '@/components/ui/ProButton';
import { COLOR, SPACE, RADIUS, FONT, GLASS_PANEL, SHADOW, FONT_FAMILY } from '@/components/ui/design-tokens';

export default function BattleResultsScreen() {
  const router = useRouter();
  const { state, resetGame } = useGame();
  const { height } = useWindowDimensions();
  const isSmallHeight = height < 400;

  const playerWins = state.playerScore;
  const botWins = state.botScore;
  const isPlayerWinner = playerWins > botWins;
  const isDraw = playerWins === botWins;

  useEffect(() => {
    const saveStats = async () => {
      if (state.playerDeck.length > 0) {
        const elementsUsed = state.playerDeck.map((card) => card.element);
        await updateStatsAfterMatch(
          state.playerScore,
          state.botScore,
          state.totalRounds,
          elementsUsed,
          state.difficulty,
        );
      }
    };
    saveStats();
  }, []);

  const resultConfig = isDraw
    ? { emoji: '🤝', label: 'تعادل!', color: COLOR.amber, bg: 'rgba(251,191,36,0.08)' }
    : isPlayerWinner
      ? { emoji: '🏆', label: 'فزت!', color: COLOR.green, bg: 'rgba(74,222,128,0.08)' }
      : { emoji: '💀', label: 'انتهت اللعبة!', color: COLOR.red, bg: 'rgba(248,113,113,0.08)' };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <LuxuryBackground>
        <ScrollView contentContainerStyle={[styles.container, isSmallHeight && { paddingTop: SPACE.xl, paddingBottom: SPACE.xl, gap: SPACE.md }]} showsVerticalScrollIndicator={false}>

          {/* Hero banner */}
          <View style={[styles.heroBanner, { backgroundColor: resultConfig.bg, borderColor: resultConfig.color + '40' }, isSmallHeight && { paddingVertical: SPACE.lg, gap: SPACE.sm }]}>
            <Text style={[styles.heroEmoji, isSmallHeight && { fontSize: 48 }]}>{resultConfig.emoji}</Text>
            <Text style={[styles.heroLabel, { color: resultConfig.color }, isSmallHeight && { fontSize: FONT.xl }]}>{resultConfig.label}</Text>

            {/* Score row */}
            <View style={[styles.scoreRow, isSmallHeight && { marginTop: 0 }]}>
              <View style={styles.scoreBlock}>
                <Text style={styles.scoreWho}>أنت</Text>
                <Text style={[styles.scoreNum, { color: COLOR.green }, isSmallHeight && { fontSize: 36, lineHeight: 42 }]}>{playerWins}</Text>
              </View>
              <Text style={styles.scoreVs}>VS</Text>
              <View style={styles.scoreBlock}>
                <Text style={styles.scoreWho}>البوت</Text>
                <Text style={[styles.scoreNum, { color: COLOR.red }, isSmallHeight && { fontSize: 36, lineHeight: 42 }]}>{botWins}</Text>
              </View>
            </View>
          </View>

          {/* Round history */}
          {state.roundResults && state.roundResults.length > 0 && (
            <View style={styles.historyPanel}>
              <Text style={styles.panelTitle}>سجل الجولات</Text>
              {state.roundResults.map((round: any, index: number) => {
                const roundColor =
                  round.winner === 'player' ? COLOR.green :
                    round.winner === 'bot' ? COLOR.red : COLOR.amber;
                const roundLabel =
                  round.winner === 'player' ? '✓ أنت' :
                    round.winner === 'bot' ? '✗ البوت' : '= تعادل';
                return (
                  <View key={index} style={[styles.roundRow, { borderLeftColor: roundColor }]}>
                    <View style={styles.roundLeft}>
                      <Text style={styles.roundNum}>جولة {index + 1}</Text>
                      <Text style={[styles.roundWinner, { color: roundColor }]}>{roundLabel}</Text>
                    </View>
                    <View style={styles.roundCards}>
                      <Text style={styles.roundCard} numberOfLines={1}>{round.playerCard?.nameAr}</Text>
                      <Text style={styles.roundVs}>vs</Text>
                      <Text style={styles.roundCard} numberOfLines={1}>{round.botCard?.nameAr}</Text>
                    </View>
                    <View style={styles.roundRight}>
                      <Text style={styles.roundDmg}>
                        {round.playerDamage}
                        {round.playerElementAdvantage !== 'neutral'
                          ? ` (${round.playerElementAdvantage === 'strong' ? '+25%' : '-25%'})`
                          : ''}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <ProButton
              label="🎮 العب مجدداً"
              onPress={() => { resetGame(); router.push('/screens/rounds-config' as any); }}
              variant="primary"
              style={styles.actionBtn}
            />
            <ProButton
              label="🏠 الرئيسية"
              onPress={() => router.push('/screens/splash' as any)}
              variant="secondary"
              style={styles.actionBtn}
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
    paddingTop: SPACE.xxl,
    paddingBottom: SPACE.xxl + SPACE.xl,
    gap: SPACE.xl,
  },

  heroBanner: {
    ...GLASS_PANEL,
    alignItems: 'center',
    paddingVertical: SPACE.xxl,
    gap: SPACE.md,
  },
  heroEmoji: { fontSize: 64 },
  heroLabel: {
    fontSize: FONT.hero + 4,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    textAlign: 'center',
    flexWrap: 'wrap',
  },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xl,
    marginTop: SPACE.md,
  },
  scoreBlock: { alignItems: 'center' },
  scoreWho: { color: COLOR.textMuted, fontSize: FONT.sm },
  scoreNum: { fontSize: 48, fontWeight: '900', lineHeight: 56 },
  scoreVs: { color: COLOR.textMuted, fontSize: FONT.xl },

  historyPanel: {
    ...GLASS_PANEL,
    padding: SPACE.xl,
  },
  panelTitle: {
    color: COLOR.gold,
    fontSize: FONT.lg,
    marginBottom: SPACE.lg,
  },

  roundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    paddingLeft: SPACE.md,
    paddingVertical: SPACE.sm,
    marginBottom: SPACE.sm,
    gap: SPACE.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.sm,
  },
  roundLeft: { minWidth: 72 },
  roundNum: { color: COLOR.textMuted, fontSize: FONT.xs },
  roundWinner: { fontSize: FONT.sm, marginTop: 2 },
  roundCards: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  roundCard: { flex: 1, color: COLOR.textPrimary, fontSize: FONT.xs, textAlign: 'center' },
  roundVs: { color: COLOR.textMuted, fontSize: FONT.xs },
  roundRight: { minWidth: 60, alignItems: 'flex-end' },
  roundDmg: { color: COLOR.textMuted, fontSize: FONT.xs },

  actions: {
    flexDirection: 'row',
    gap: SPACE.md,
  },
  actionBtn: { flex: 1 },
});
