/**
 * MultiplayerBattleScreen — Real-time P2P Battle
 *
 * Flow:
 *  1. Show YOUR card for this round (face-up) + opponent card (face-down / spinner)
 *  2. Tap "⚔️ أكشف" → sends REVEAL_CARD to server
 *  3. Server waits for both reveals → broadcasts ROUND_RESULT
 *  4. Both clients show result + score update + animated overlay
 *  5. "الجولة التالية" → repeat | GAME_OVER → final screen
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Pressable } from 'react-native';
import { ThemedText as Text } from '@/components/ui/ThemedText';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ScreenContainer } from '@/components/screen-container';
import { LuxuryBackground } from '@/components/game/luxury-background';
import { useMultiplayer } from '@/lib/multiplayer/multiplayer-context';
import { Card } from '@/lib/game/types';

// ─── HP Hearts ───────────────────────────────────────────────────────────────

function HpHearts({ score, max = 3, color }: { score: number; max?: number; color: string }) {
  return (
    <View style={styles.heartsRow}>
      {Array.from({ length: max }).map((_, i) => (
        <Text key={i} style={[styles.heart, { opacity: i < score ? 1 : 0.2 }]}>
          ❤️
        </Text>
      ))}
    </View>
  );
}

// ─── Card Face ───────────────────────────────────────────────────────────────

function CardFace({ card, revealed = true, isOpponent = false }: { card?: Card | null; revealed?: boolean; isOpponent?: boolean }) {
  if (!card || !revealed) {
    return (
      <View style={[styles.cardFace, styles.cardBack, isOpponent && styles.opponentBack]}>
        <Text style={styles.cardBackText}>🃏</Text>
        {!revealed && <ActivityIndicator size="small" color="#FFD700" style={{ marginTop: 8 }} />}
      </View>
    );
  }
  return (
    <View style={[styles.cardFace, { borderColor: '#d4af37' }]}>
      <Text style={styles.cardEmoji}>{card.emoji}</Text>
      <Text style={styles.cardName} numberOfLines={1}>{card.nameAr}</Text>
      <View style={styles.statsRow}>
        <Text style={styles.statText}>⚔️ {card.attack}</Text>
        <Text style={styles.statText}>🛡️ {card.defense}</Text>
      </View>
      <Text style={styles.statText}>❤️ {card.hp}</Text>
    </View>
  );
}

// ─── Advantage Label ─────────────────────────────────────────────────────────

const ADV_LABELS: Record<string, string> = {
  fire: '🔥', ice: '❄️', water: '💧', earth: '🌍', lightning: '⚡', wind: '🌪️',
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function MultiplayerBattleScreen() {
  const router = useRouter();
  const { state, revealCard, advanceToNextRound, leaveRoom } = useMultiplayer();

  const playerCard = state.playerCards[state.currentRound] ?? null;
  const opponentCard = state.opponentCards[state.currentRound] ?? null;

  const isPlaying = state.status === 'playing';
  const isRevealing = state.status === 'revealing';
  const isResult = state.status === 'result';
  const isFinished = state.status === 'finished';
  const hasRevealed = isRevealing || isResult;

  // Opponent disconnected modal
  const showGrace = state.reconnectGraceSeconds > 0;

  // ── Animations ──
  const resultScale = useSharedValue(0);
  const resultStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultScale.value }],
  }));

  const revealBtnScale = useSharedValue(1);
  const revealBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: revealBtnScale.value }],
  }));

  useEffect(() => {
    if (isResult) {
      resultScale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withSpring(1.05, { damping: 10 }),
        withSpring(1.0, { damping: 14 })
      );
    }
  }, [isResult, state.currentRound]);

  // Navigate to results when finished
  useEffect(() => {
    if (isFinished) {
      const t = setTimeout(() => {
        router.push('/screens/multiplayer-results' as any);
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [isFinished]);

  const handleReveal = useCallback(() => {
    if (!playerCard || hasRevealed) return;
    revealBtnScale.value = withSequence(
      withTiming(0.92, { duration: 80 }),
      withSpring(1.0, { damping: 12 })
    );
    revealCard(state.currentRound, playerCard);
  }, [playerCard, hasRevealed, state.currentRound, revealCard]);

  const handleNextRound = useCallback(() => {
    advanceToNextRound();
  }, [advanceToNextRound]);

  const handleForfeit = useCallback(() => {
    leaveRoom();
    router.back();
  }, [leaveRoom, router]);

  // ── Result analysis ──
  const result = state.lastRoundResult;
  const roundWinner = result
    ? state.isHost
      ? result.winner === 'player1' ? 'win' : result.winner === 'player2' ? 'lose' : 'draw'
      : result.winner === 'player2' ? 'win' : result.winner === 'player1' ? 'lose' : 'draw'
    : null;

  // ── Game Over screen ──
  if (isFinished) {
    const winner = state.gameOverWinner;
    return (
      <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
        <LuxuryBackground>
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={styles.gameOverIcon}>
              {winner === 'player' ? '🏆' : winner === 'draw' ? '🤝' : '💀'}
            </Text>
            <Text style={styles.gameOverTitle}>
              {winner === 'player' ? 'أنت الفائز!' : winner === 'draw' ? 'تعادل!' : 'البوت يفوز!'}
            </Text>
            <View style={styles.finalScoreRow}>
              <View style={styles.finalScoreBox}>
                <Text style={styles.finalScoreLabel}>أنت</Text>
                <Text style={[styles.finalScoreNum, { color: '#4ade80' }]}>{state.playerScore}</Text>
              </View>
              <Text style={styles.finalScoreSep}>–</Text>
              <View style={styles.finalScoreBox}>
                <Text style={styles.finalScoreLabel}>{state.opponentName}</Text>
                <Text style={[styles.finalScoreNum, { color: '#f87171' }]}>{state.opponentScore}</Text>
              </View>
            </View>
            <ActivityIndicator color="#d4af37" style={{ marginTop: 24 }} />
            <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 8 }}>يتم الانتقال...</Text>
          </View>
        </LuxuryBackground>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <LuxuryBackground>
        <View style={styles.container}>

          {/* ── HUD ── */}
          <View style={styles.hud}>
            <View style={styles.hudPlayer}>
              <Text style={styles.hudName} numberOfLines={1}>👤 أنت</Text>
              <HpHearts score={state.playerScore} color="#4ade80" />
            </View>
            <View style={styles.hudCenter}>
              <Text style={styles.hudRound}>
                الجولة {state.currentRound + 1}/{state.totalRounds}
              </Text>
              <View style={styles.hudDots}>
                {Array.from({ length: Math.min(state.totalRounds, 9) }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.hudDot,
                      i < state.currentRound ? styles.hudDotDone
                        : i === state.currentRound ? styles.hudDotActive
                          : styles.hudDotFuture,
                    ]}
                  />
                ))}
              </View>
            </View>
            <View style={styles.hudPlayer}>
              <Text style={styles.hudName} numberOfLines={1}>🤖 {state.opponentName}</Text>
              <HpHearts score={state.opponentScore} color="#f87171" />
            </View>
          </View>

          {/* ── Cards ── */}
          <View style={styles.cardsArea}>
            {/* Player card */}
            <View style={styles.cardSlot}>
              <Text style={styles.cardSlotLabel}>بطاقتك</Text>
              <CardFace card={playerCard} revealed />
            </View>

            {/* VS */}
            <View style={styles.vsCol}>
              <Text style={styles.vs}>⚔️</Text>
            </View>

            {/* Opponent card — face down until result */}
            <View style={styles.cardSlot}>
              <Text style={styles.cardSlotLabel}>{state.opponentName}</Text>
              <CardFace
                card={isResult ? opponentCard : null}
                revealed={isResult}
                isOpponent
              />
              {state.opponentRevealedThisRound && !isResult && (
                <Text style={styles.opponentReadyLabel}>✅ جاهز</Text>
              )}
            </View>
          </View>

          {/* ── Actions ── */}
          <View style={styles.actionsArea}>

            {/* Playing Phase: reveal button */}
            {(isPlaying || isRevealing) && (
              <View style={{ alignItems: 'center', gap: 12 }}>
                {isPlaying && (
                  <Animated.View style={revealBtnStyle}>
                    <TouchableOpacity
                      style={[styles.revealBtn, !playerCard && styles.disabled]}
                      onPress={handleReveal}
                      disabled={!playerCard}
                    >
                      <Text style={styles.revealBtnText}>⚔️ أكشف البطاقة</Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}
                {isRevealing && (
                  <View style={styles.waitingBox}>
                    <ActivityIndicator color="#d4af37" />
                    <Text style={styles.waitingText}>في انتظار {state.opponentName}...</Text>
                  </View>
                )}
              </View>
            )}

            {/* Result Phase */}
            {isResult && result && (
              <Animated.View style={[styles.resultBox, resultStyle]}>
                <Text style={styles.resultAdvantage}>
                  {result.advantage === 'element' ? `🔄 تفوق عنصري` : result.advantage === 'attack' ? '💥 تفوق هجومي' : '⚖️'}
                </Text>
                <Text style={[
                  styles.resultLabel,
                  roundWinner === 'win' && styles.winColor,
                  roundWinner === 'lose' && styles.loseColor,
                  roundWinner === 'draw' && styles.drawColor,
                ]}>
                  {roundWinner === 'win' ? '🏆 فزت بالجولة!' : roundWinner === 'lose' ? '💔 خسرت الجولة' : '🤝 تعادل'}
                </Text>
                <Text style={styles.resultScore}>
                  ❤️ {state.playerScore} — {state.opponentScore} ❤️
                </Text>
                <TouchableOpacity style={styles.nextBtn} onPress={handleNextRound}>
                  <Text style={styles.nextBtnText}>
                    {state.currentRound + 1 >= state.totalRounds ? '🏁 انتهت المباراة' : '▶ الجولة التالية'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>

          {/* ── Forfeit ── */}
          <TouchableOpacity style={styles.forfeitBtn} onPress={handleForfeit}>
            <Text style={styles.forfeitText}>🚪 استسلام</Text>
          </TouchableOpacity>

          {/* ── Reconnect Grace Modal ── */}
          <Modal visible={showGrace} transparent animationType="fade">
            <View style={styles.graceOverlay}>
              <View style={styles.graceBox}>
                <Text style={styles.graceIcon}>📡</Text>
                <Text style={styles.graceTitle}>انقطع اتصال الخصم</Text>
                <Text style={styles.graceTimer}>{state.reconnectGraceSeconds}s</Text>
                <Text style={styles.graceSub}>انتظار إعادة الاتصال...</Text>
              </View>
            </View>
          </Modal>

        </View>
      </LuxuryBackground>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GOLD = '#d4af37';

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, gap: 8 },

  // HUD
  hud: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 14, padding: 10 },
  hudPlayer: { flex: 1, alignItems: 'center', gap: 4 },
  hudName: { color: GOLD, fontSize: 11, fontWeight: '700', maxWidth: 90 },
  heartsRow: { flexDirection: 'row', gap: 2 },
  heart: { fontSize: 14 },
  hudCenter: { alignItems: 'center', gap: 4, flex: 1 },
  hudRound: { color: '#fff', fontSize: 11, fontWeight: '700' },
  hudDots: { flexDirection: 'row', gap: 4 },
  hudDot: { width: 7, height: 7, borderRadius: 4 },
  hudDotDone: { backgroundColor: '#4ade80' },
  hudDotActive: { backgroundColor: GOLD, width: 9, height: 9, borderRadius: 5 },
  hudDotFuture: { backgroundColor: '#374151' },

  // Cards
  cardsArea: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  cardSlot: { flex: 1, alignItems: 'center', gap: 6 },
  cardSlotLabel: { color: '#9ca3af', fontSize: 11, fontWeight: '600' },
  vsCol: { alignItems: 'center' },
  vs: { fontSize: 28 },

  cardFace: {
    width: 130, height: 185, borderRadius: 14, borderWidth: 2.5,
    borderColor: '#d4af37', backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center', gap: 5,
    padding: 10,
  },
  cardBack: { borderColor: '#374151', backgroundColor: 'rgba(17,24,39,0.8)' },
  opponentBack: { borderColor: '#7f1d1d', backgroundColor: 'rgba(127,29,29,0.3)' },
  cardBackText: { fontSize: 40 },
  cardEmoji: { fontSize: 36 },
  cardName: { color: '#e5e7eb', fontSize: 11, fontWeight: '700', textAlign: 'center', flexWrap: 'wrap' },
  statsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  statText: { color: '#d1d5db', fontSize: 11, fontWeight: '600' },
  opponentReadyLabel: { color: '#4ade80', fontSize: 10, fontWeight: '700', marginTop: 4, textAlign: 'center', flexWrap: 'wrap' },

  // Actions
  actionsArea: { minHeight: 160, justifyContent: 'center', alignItems: 'center' },

  revealBtn: {
    backgroundColor: GOLD, paddingHorizontal: 36, paddingVertical: 16,
    borderRadius: 28, minWidth: 220, alignItems: 'center',
    shadowColor: GOLD, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 10,
  },
  revealBtnText: { color: '#1a1a1a', fontSize: 18, fontWeight: '900', letterSpacing: 0.3 },
  disabled: { opacity: 0.4 },

  waitingBox: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 12, flexWrap: 'wrap', justifyContent: 'center' },
  waitingText: { color: '#9ca3af', fontSize: 13, fontWeight: '600', textAlign: 'center', flexWrap: 'wrap' },

  resultBox: {
    backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 18, padding: 20,
    alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
    width: '100%',
  },
  resultAdvantage: { color: '#9ca3af', fontSize: 12, fontWeight: '600' },
  resultLabel: { fontSize: 22, fontWeight: '900', letterSpacing: 0.4, textAlign: 'center', flexWrap: 'wrap' },
  winColor: { color: '#4ade80' },
  loseColor: { color: '#f87171' },
  drawColor: { color: '#facc15' },
  resultScore: { color: '#e5e7eb', fontSize: 14, fontWeight: '700', textAlign: 'center', flexWrap: 'wrap' },

  nextBtn: {
    backgroundColor: GOLD, borderRadius: 20, paddingHorizontal: 28, paddingVertical: 12, marginTop: 4,
  },
  nextBtnText: { color: '#1a1a1a', fontSize: 15, fontWeight: '900' },

  forfeitBtn: { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 16 },
  forfeitText: { color: '#4b5563', fontSize: 11, fontWeight: '600' },

  // Game Over
  gameOverIcon: { fontSize: 72, marginBottom: 12 },
  gameOverTitle: { color: GOLD, fontSize: 32, fontWeight: '900', letterSpacing: 1, marginBottom: 20, textAlign: 'center', flexWrap: 'wrap' },
  finalScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  finalScoreBox: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 14, padding: 16, minWidth: 100 },
  finalScoreLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '600' },
  finalScoreNum: { fontSize: 44, fontWeight: '900', marginTop: 4 },
  finalScoreSep: { color: GOLD, fontSize: 28, fontWeight: '300' },

  // Grace Modal
  graceOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  graceBox: { backgroundColor: '#111827', borderRadius: 20, padding: 32, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#374151' },
  graceIcon: { fontSize: 40 },
  graceTitle: { color: '#e5e7eb', fontSize: 18, fontWeight: '700' },
  graceTimer: { color: '#f59e0b', fontSize: 48, fontWeight: '900' },
  graceSub: { color: '#6b7280', fontSize: 12 },
});
