import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, FlatList, ScrollView } from 'react-native';
import { ThemedText as Text } from '@/components/ui/ThemedText';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { LuxuryBackground } from '@/components/game/luxury-background';
import { LuxuryCharacterCardAnimated } from '@/components/game/luxury-character-card-animated';
import { RotateHintScreen } from '@/components/game/RotateHintScreen';
import { useGame } from '@/lib/game/game-context';
import { useCards } from '@/lib/game/useCards';
import { Card, AbilityType } from '@/lib/game/types';
import { ALL_ABILITIES, DISABLED_ABILITIES_KEY } from '@/lib/game/abilities';
import { AbilityCard, AbilityData } from '@/components/game/ability-card';
import { abilities as allAbilitiesData } from '@/data/abilities';
import { ProButton } from '@/components/ui/ProButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLOR, SPACE, RADIUS, FONT_FAMILY } from '@/components/ui/design-tokens';
import {
  useLandscapeLayout,
  useCardSize,
  GRID_COLUMNS,
  LAYOUT_PADDING,
} from '@/utils/layout';

function abilityTypeToNameEn(type: AbilityType): string {
  return type.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

function resolveAbilityData(type: AbilityType): AbilityData {
  const nameEn = abilityTypeToNameEn(type);
  const found = allAbilitiesData.find(a => a.nameEn.toLowerCase() === nameEn.toLowerCase());
  if (found) return { id: found.id, nameEn: found.nameEn, nameAr: found.nameAr, description: found.description, icon: found.icon, rarity: found.rarity, isActive: found.isActive };
  return { id: type, nameEn, nameAr: type, description: '', icon: null, rarity: 'Common' };
}

/** اختيار قدرات عشوائية مع استثناء المعطّلة مباشرةً من AsyncStorage */
async function pickRandomAbilities(count: number): Promise<AbilityType[]> {
  try {
    const raw = await AsyncStorage.getItem(DISABLED_ABILITIES_KEY);
    const disabledArr: AbilityType[] = raw ? JSON.parse(raw) : [];
    const disabledSet = new Set(disabledArr);
    const available = ALL_ABILITIES.filter(a => !disabledSet.has(a));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  } catch {
    const shuffled = [...ALL_ABILITIES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}

interface CardRound { card: Card; round: number | null; }

export default function CardSelectionScreen() {
  const router = useRouter();
  const { width, isLandscape, size } = useLandscapeLayout();
  const { state, setPlayerDeck, startBattle } = useGame();
  const [cardRounds, setCardRounds] = useState<CardRound[]>([]);
  const [focusedCardIndex, setFocusedCardIndex] = useState<number | null>(null);
  const [isAbilitiesModalOpen, setIsAbilitiesModalOpen] = useState(false);
  const [assignedAbilities, setAssignedAbilities] = useState<AbilityType[]>([]);
  const totalRounds = state.totalRounds || 5;

  const allCards = useCards();
  const numColumns = GRID_COLUMNS[size];
  const padding = LAYOUT_PADDING[size];

  const { cardW: gridCardW, cardH: gridCardH } = useCardSize('selection');
  const { cardW: modalCardW, cardH: modalCardH } = useCardSize('modal');

  useEffect(() => {
    AsyncStorage.getItem('disabledAbilities').then(raw => {
      const disabled = new Set(raw ? JSON.parse(raw) : []);
      const available = ALL_ABILITIES.filter(a => !disabled.has(a));
      const picked = available.sort(() => Math.random() - 0.5).slice(0, 3);
      const shuffled = [...allCards].sort(() => Math.random() - 0.5);
      setCardRounds(shuffled.slice(0, totalRounds).map(card => ({ card, round: null })));
      setAssignedAbilities(picked);
    });
  }, [totalRounds, allCards]);

  const handleRoundSelect = (round: number) => {
    if (focusedCardIndex !== null) {
      const updated = [...cardRounds];
      const prev = updated[focusedCardIndex].round;
      const existingIdx = updated.findIndex((cr, idx) => cr.round === round && idx !== focusedCardIndex);
      if (existingIdx !== -1) updated[existingIdx].round = prev;
      updated[focusedCardIndex].round = round;
      setCardRounds(updated);
      setFocusedCardIndex(null);
    }
  };

  const handleStartBattle = () => {
    const allAssigned = cardRounds.every(cr => cr.round !== null);
    if (allAssigned) {
      const sorted = [...cardRounds].sort((a, b) => (a.round || 0) - (b.round || 0)).map(cr => cr.card);
      setPlayerDeck(sorted);
      startBattle(sorted, assignedAbilities);
      router.push('/screens/battle' as any);
    }
  };

  const handleShuffleCards = () => {
    const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);
    for (let i = rounds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rounds[i], rounds[j]] = [rounds[j], rounds[i]];
    }
    setCardRounds(prev => prev.map((item, index) => ({ ...item, round: rounds[index] ?? null })));
  };

  const allAssigned = cardRounds.every(cr => cr.round !== null);

  if (!isLandscape) return <RotateHintScreen />;

  const renderCardItem = ({ item, index }: { item: CardRound; index: number }) => (
    <TouchableOpacity
      style={[styles.cardCell, { width: (width - padding * 2 - SPACE.md * (numColumns - 1)) / numColumns }]}
      onPress={() => setFocusedCardIndex(index)}
      activeOpacity={0.8}
    >
      <View style={styles.cardWrapper}>
        <LuxuryCharacterCardAnimated
          card={item.card}
          style={{ width: gridCardW, height: gridCardH }}
        />
        {item.round !== null ? (
          <View style={styles.roundOverlay}>
            <View style={styles.roundBadge}>
              <Text style={styles.roundBadgeText}>الجولة {item.round}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.unassignedOverlay}>
            <Text style={styles.unassignedText}>انقر للتعيين</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      <View style={styles.bgWrapper}><LuxuryBackground /></View>

      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/screens/leaderboard' as any)} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>← رجوع</Text>
          </TouchableOpacity>

          <View style={styles.titleGroup}>
            <Text style={styles.title}>رتّب بطاقاتك</Text>
            <Text style={styles.subtitle}>{cardRounds.filter(c => c.round).length} / {totalRounds} مُعيّنة</Text>
          </View>

          <View style={styles.rightActionGroup}>
            <TouchableOpacity style={styles.abilitiesBtn} onPress={() => setIsAbilitiesModalOpen(true)} activeOpacity={0.7}>
              <Text style={styles.abilitiesBtnText}>⚡ القدرات</Text>
              <View style={styles.abilitiesBadge}><Text style={styles.abilitiesBadgeText}>{assignedAbilities.length}/3</Text></View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shuffleBtn} onPress={handleShuffleCards} activeOpacity={0.7}>
              <Text style={styles.shuffleBtnText}>🔀</Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={cardRounds}
          renderItem={renderCardItem}
          keyExtractor={(_, i) => i.toString()}
          key={numColumns}
          numColumns={numColumns}
          contentContainerStyle={[styles.gridContent, { paddingHorizontal: padding }]}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
          style={styles.grid}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.bottomBar}>
          <ProButton
            label={allAssigned ? 'ابدأ المعركة ⚔️' : `${cardRounds.filter(c => c.round).length} / ${totalRounds} مُعيّنة`}
            onPress={handleStartBattle}
            variant="primary"
            disabled={!allAssigned}
          />
        </View>
      </View>

      {/* Modal: تحديد الجولة */}
      <Modal visible={focusedCardIndex !== null} transparent animationType="fade" onRequestClose={() => setFocusedCardIndex(null)}>
        <TouchableOpacity style={styles.focusModalOverlay} activeOpacity={1} onPress={() => setFocusedCardIndex(null)}>
          <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()} style={styles.focusModalContentRow}>
            <View style={styles.focusModalLeftCol}>
              {Array.from({ length: totalRounds }, (_, i) => i + 1).map(round => {
                const alreadyUsed = cardRounds.some((cr, idx) => cr.round === round && idx !== focusedCardIndex);
                return (
                  <TouchableOpacity key={round} style={[styles.focusRoundBtn, alreadyUsed && styles.focusRoundBtnUsed]} onPress={() => handleRoundSelect(round)} activeOpacity={0.7}>
                    <View style={[
                      styles.focusRoundBadge,
                      alreadyUsed && styles.focusRoundBadgeUsed,
                      focusedCardIndex !== null && cardRounds[focusedCardIndex]?.round === round && styles.focusRoundBadgeActive,
                    ]}>
                      <Text style={[styles.focusRoundText, alreadyUsed && styles.focusRoundTextUsed]}>ج {round}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {focusedCardIndex !== null && cardRounds[focusedCardIndex] && (
              <View style={styles.focusModalRightCol}>
                <LuxuryCharacterCardAnimated
                  card={cardRounds[focusedCardIndex].card}
                  style={{ width: modalCardW, height: modalCardH }}
                />
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal: القدرات */}
      <Modal visible={isAbilitiesModalOpen} transparent animationType="fade" onRequestClose={() => setIsAbilitiesModalOpen(false)}>
        <TouchableOpacity style={styles.abilitiesModalOverlay} activeOpacity={1} onPress={() => setIsAbilitiesModalOpen(false)}>
          <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()} style={styles.abilitiesModalContent}>
            <View style={styles.abilitiesModalHeader}>
              <Text style={styles.abilitiesModalTitle}>قدراتك لهذه الجلسة ⚡</Text>
              <TouchableOpacity onPress={() => setIsAbilitiesModalOpen(false)} style={{ padding: 4 }}>
                <Text style={{ color: '#94a3b8', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 8, paddingVertical: 8 }}>
              {assignedAbilities.map((abilityType, index) => {
                const data = resolveAbilityData(abilityType);
                return (
                  <AbilityCard
                    key={index}
                    ability={{ id: index, nameEn: data.nameEn, nameAr: data.nameAr, description: data.description, icon: data.icon, rarity: data.rarity ?? 'Common', isActive: true }}
                    showActionButtons={false}
                  />
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  bgWrapper: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 },
  container: { flex: 1, zIndex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm,
    backgroundColor: 'rgba(5,5,10,0.85)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(212,175,55,0.2)',
  },
  backBtn: { paddingHorizontal: SPACE.md, paddingVertical: SPACE.xs, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  backBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  titleGroup: { alignItems: 'center' },
  title: { color: '#d4af37', fontSize: 18, fontWeight: '800' },
  subtitle: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  rightActionGroup: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  abilitiesBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACE.md, paddingVertical: SPACE.xs, backgroundColor: 'rgba(168,85,247,0.15)', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(168,85,247,0.4)' },
  abilitiesBtnText: { color: '#c084fc', fontSize: 13, fontWeight: '700' },
  abilitiesBadge: { backgroundColor: '#7c3aed', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  abilitiesBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  shuffleBtn: { width: 36, height: 36, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  shuffleBtnText: { fontSize: 18 },
  grid: { flex: 1 },
  gridContent: { paddingVertical: SPACE.md },
  columnWrapper: { gap: SPACE.md, marginBottom: SPACE.md },
  cardCell: { alignItems: 'center' },
  cardWrapper: { position: 'relative' },
  roundOverlay: { position: 'absolute', top: 6, left: 6, right: 6, alignItems: 'center' },
  roundBadge: { backgroundColor: 'rgba(212,175,55,0.9)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  roundBadgeText: { color: '#1a1a1a', fontSize: 11, fontWeight: '800' },
  unassignedOverlay: { position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center' },
  unassignedText: { color: '#fff', fontSize: 12, fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  bottomBar: { padding: SPACE.md, backgroundColor: 'rgba(5,5,10,0.9)', borderTopWidth: 1, borderTopColor: 'rgba(212,175,55,0.2)', alignItems: 'center' },
  focusModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  focusModalContentRow: { flexDirection: 'row', alignItems: 'center', gap: 24, backgroundColor: 'rgba(10,10,20,0.97)', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)' },
  focusModalLeftCol: { gap: 10 },
  focusRoundBtn: { alignItems: 'center' },
  focusRoundBtnUsed: { opacity: 0.5 },
  focusRoundBadge: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', minWidth: 90, alignItems: 'center' },
  focusRoundBadgeUsed: { borderColor: 'rgba(248,113,113,0.4)', backgroundColor: 'rgba(248,113,113,0.08)' },
  focusRoundBadgeActive: { borderColor: '#d4af37', backgroundColor: 'rgba(212,175,55,0.2)' },
  focusRoundText: { color: '#e2e8f0', fontSize: 14, fontWeight: '700' },
  focusRoundTextUsed: { color: '#f87171' },
  focusModalRightCol: { alignItems: 'center' },
  abilitiesModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  abilitiesModalContent: { width: '90%', maxWidth: 700, backgroundColor: 'rgba(10,15,30,0.97)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(51,65,85,0.8)' },
  abilitiesModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  abilitiesModalTitle: { fontSize: 16, fontWeight: '800', color: '#f8fafc' },
});
