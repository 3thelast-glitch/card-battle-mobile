import React, { useState, useEffect, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, FlatList, ScrollView } from 'react-native';
import { ThemedText as Text } from '@/components/ui/ThemedText';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { LuxuryBackground } from '@/components/game/luxury-background';
import { EpicCardTemplate } from '@/components/game/epic-card-template';
import { RotateHintScreen } from '@/components/game/RotateHintScreen';
import { useGame } from '@/lib/game/game-context';
import { ALL_CARDS } from '@/lib/game/cards-data';
import { Card, AbilityType } from '@/lib/game/types';
import { getAbilityNameOnly, getAbilityDescription } from '@/lib/game/ability-names';
import { getRandomAbilities } from '@/lib/game/abilities';
import { AbilityCard, AbilityData } from '@/components/game/ability-card';
import { abilities as allAbilitiesData } from '@/data/abilities';
import { ProButton } from '@/components/ui/ProButton';
import { COLOR, SPACE, RADIUS, FONT, GLASS_PANEL, SHADOW, FONT_FAMILY } from '@/components/ui/design-tokens';
import { useLandscapeLayout, GRID_COLUMNS, CARD_SCALE, LAYOUT_PADDING } from '@/utils/layout';

// Convert PascalCase AbilityType to space-separated nameEn
// e.g. 'LogicalEncounter' → 'Logical Encounter', 'AddElement' → 'Add Element'
function abilityTypeToNameEn(type: AbilityType): string {
  return type.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

// Map AbilityType → full Ability object from data/abilities.ts
function resolveAbilityData(type: AbilityType): AbilityData {
  const nameEn = abilityTypeToNameEn(type);
  const found = allAbilitiesData.find(
    (a) => a.nameEn.toLowerCase() === nameEn.toLowerCase()
  );
  if (found) {
    return {
      id: found.id,
      nameEn: found.nameEn,
      nameAr: found.nameAr,
      description: found.description,
      icon: found.icon,
      rarity: found.rarity,
      isActive: found.isActive,
    };
  }
  // Fallback for abilities not in the data array (e.g. 'Shambles')
  return {
    id: type,
    nameEn: nameEn,
    nameAr: type,
    description: '',
    icon: null,
    rarity: 'Common',
  };
}

interface CardRound {
  card: Card;
  round: number | null;
}

export default function CardSelectionScreen() {
  const router = useRouter();
  const { width, isLandscape, size } = useLandscapeLayout();
  const { state, setPlayerDeck, startBattle } = useGame();
  const [cardRounds, setCardRounds] = useState<CardRound[]>([]);
  const [focusedCardIndex, setFocusedCardIndex] = useState<number | null>(null);
  const [isAbilitiesModalOpen, setIsAbilitiesModalOpen] = useState(false);
  const [shuffledCards, setShuffledCards] = useState<Card[]>([]);
  const [assignedAbilities, setAssignedAbilities] = useState<AbilityType[]>([]);
  const totalRounds = state.totalRounds || 5;

  // Responsive layout values from centralized hook
  const numColumns = GRID_COLUMNS[size];
  const cardScale = CARD_SCALE[size];
  const padding = LAYOUT_PADDING[size];

  useEffect(() => {
    // Generate the deck
    const shuffled = [...ALL_CARDS].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    const initialCards = shuffled.slice(0, totalRounds).map((card) => ({ card, round: null }));
    setCardRounds(initialCards);

    // Generate 3 random abilities
    const selectedAbilities = getRandomAbilities(3);
    setAssignedAbilities(selectedAbilities);
  }, [totalRounds]);

  const handleRoundSelect = (round: number) => {
    if (focusedCardIndex !== null) {
      const updated = [...cardRounds];
      const previousRound = updated[focusedCardIndex].round;

      // Find if another card has this round
      const existingCardIndex = updated.findIndex(
        (cr, idx) => cr.round === round && idx !== focusedCardIndex
      );

      // Swap logic
      if (existingCardIndex !== -1) {
        updated[existingCardIndex].round = previousRound;
      }

      updated[focusedCardIndex].round = round;
      setCardRounds(updated);
      setFocusedCardIndex(null);
    }
  };

  const handleStartBattle = () => {
    const allAssigned = cardRounds.every((cr) => cr.round !== null);
    if (allAssigned) {
      const sortedCards = [...cardRounds]
        .sort((a, b) => (a.round || 0) - (b.round || 0))
        .map((cr) => cr.card);
      setPlayerDeck(sortedCards);
      startBattle(sortedCards, assignedAbilities);
      router.push('/screens/battle' as any);
    }
  };

  const handleShuffleCards = () => {
    const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);
    for (let i = rounds.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [rounds[i], rounds[j]] = [rounds[j], rounds[i]];
    }
    setCardRounds((prev) => prev.map((item, index) => ({ ...item, round: rounds[index] ?? null })));
  };

  const allAssigned = cardRounds.every((cr) => cr.round !== null);

  if (!isLandscape) {
    return <RotateHintScreen />;
  }

  const renderCardItem = ({ item, index }: { item: CardRound; index: number }) => (
    <TouchableOpacity
      style={[styles.cardCell, { width: (width - padding * 2 - SPACE.md * (numColumns - 1)) / numColumns }]}
      onPress={() => setFocusedCardIndex(index)}
      activeOpacity={0.8}
    >
      <View style={styles.cardWrapper}>
        <EpicCardTemplate
          imageSrc={item.card.finalImage}
          nameAr={item.card.nameAr}
          nameEn={item.card.nameEn ?? item.card.name}
          hp={item.card.hp}
          attack={item.card.attack}
          rarity={item.card.rarity}
          element={item.card.element}
          emoji={item.card.emoji}
          scale={cardScale}
        />
        {/* Round assignment overlay */}
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
      <View style={styles.bgWrapper}>
        <LuxuryBackground />
      </View>

      <View style={styles.container}>
        {/* Top bar (Refactored to be compact) */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push('/screens/leaderboard' as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>← رجوع</Text>
          </TouchableOpacity>

          <View style={styles.titleGroup}>
            <Text style={styles.title}>رتّب بطاقاتك</Text>
            <Text style={styles.subtitle}>{cardRounds.filter(c => c.round).length} / {totalRounds} مُعيّنة</Text>
          </View>

          <View style={styles.rightActionGroup}>
            <TouchableOpacity
              style={styles.abilitiesBtn}
              onPress={() => setIsAbilitiesModalOpen(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.abilitiesBtnText}>⚡ القدرات</Text>
              <View style={styles.abilitiesBadge}>
                <Text style={styles.abilitiesBadgeText}>{assignedAbilities.length}/3</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shuffleBtn}
              onPress={handleShuffleCards}
              activeOpacity={0.7}
            >
              <Text style={styles.shuffleBtnText}>🔀</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cards grid */}
        <FlatList
          data={cardRounds}
          renderItem={renderCardItem}
          keyExtractor={(_, index) => index.toString()}
          key={numColumns}
          numColumns={numColumns}
          contentContainerStyle={[styles.gridContent, { paddingHorizontal: padding }]}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
          style={styles.grid}
          showsVerticalScrollIndicator={false}
        />

        {/* Bottom sticky bar */}
        <View style={styles.bottomBar}>
          <ProButton
            label={allAssigned ? 'ابدأ المعركة ⚔️' : `${cardRounds.filter(c => c.round).length} / ${totalRounds} مُعيّنة`}
            onPress={handleStartBattle}
            variant="primary"
            disabled={!allAssigned}
          />
        </View>
      </View>

      {/* Focus & Round Assignment Modal */}
      <Modal
        visible={focusedCardIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setFocusedCardIndex(null)}
      >
        <TouchableOpacity
          style={styles.focusModalOverlay}
          activeOpacity={1}
          onPress={() => setFocusedCardIndex(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.focusModalContentRow}
          >
            {/* Left: Round Buttons */}
            <View style={styles.focusModalLeftCol}>
              {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => {
                const alreadyUsed = cardRounds.some(
                  (cr, idx) => cr.round === round && idx !== focusedCardIndex
                );
                return (
                  <TouchableOpacity
                    key={round}
                    style={[
                      styles.focusRoundBtn,
                      alreadyUsed && styles.focusRoundBtnUsed
                    ]}
                    onPress={() => handleRoundSelect(round)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.focusRoundBadge, alreadyUsed && styles.focusRoundBadgeUsed]}>
                      <Text style={[styles.focusRoundBadgeText, alreadyUsed && styles.focusRoundBadgeTextUsed]}>{round}</Text>
                    </View>
                    <Text style={[
                      styles.focusRoundBtnText,
                      alreadyUsed && styles.focusRoundBtnTextUsed
                    ]}>
                      الجولة {round}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Right: Enlarged Card */}
            {focusedCardIndex !== null && cardRounds[focusedCardIndex] && (
              <View style={styles.focusModalRightCol}>
                <View style={{ transform: [{ scale: 1.4 }] }}>
                  <EpicCardTemplate
                    imageSrc={cardRounds[focusedCardIndex].card.finalImage}
                    nameAr={cardRounds[focusedCardIndex].card.nameAr}
                    nameEn={cardRounds[focusedCardIndex].card.nameEn ?? cardRounds[focusedCardIndex].card.name}
                    hp={cardRounds[focusedCardIndex].card.hp}
                    attack={cardRounds[focusedCardIndex].card.attack}
                    rarity={cardRounds[focusedCardIndex].card.rarity}
                    element={cardRounds[focusedCardIndex].card.element}
                    emoji={cardRounds[focusedCardIndex].card.emoji}
                    scale={cardScale}
                  />
                </View>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Abilities Modal — Horizontal AbilityCard Gallery */}
      <Modal
        visible={isAbilitiesModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAbilitiesModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsAbilitiesModalOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.abilitiesModalContent}
          >
            {/* Header row */}
            <View style={styles.abilitiesModalHeader}>
              <Text style={[styles.modalTitle, { marginBottom: 0 }]}>القدرات المتاحة ⚡</Text>
              <TouchableOpacity onPress={() => setIsAbilitiesModalOpen(false)} style={{ padding: 4 }}>
                <Text style={{ color: COLOR.textMuted, fontSize: FONT.xl }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Horizontal scrolling AbilityCards */}
            {assignedAbilities.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.abilitiesScrollContent}
              >
                {assignedAbilities.map((abilityType, index) => {
                  const abilityData = resolveAbilityData(abilityType);
                  return (
                    <View key={index} style={styles.abilityCardSlot}>
                      <View style={{ transform: [{ scale: 0.85 }] }}>
                        <AbilityCard ability={abilityData} showActionButtons={false} />
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={{ color: COLOR.textMuted, textAlign: 'center', marginVertical: SPACE.xl }}>
                لا توجد قدرات متاحة
              </Text>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  bgWrapper: { ...StyleSheet.absoluteFillObject, zIndex: 0 },

  container: { flex: 1, zIndex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.md,
    paddingBottom: SPACE.sm,
  },

  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(228,165,42,0.3)',
  },
  backBtnText: { color: COLOR.gold, fontSize: 14 },
  titleGroup: { flex: 1, alignItems: 'center' },
  title: { fontSize: 20, color: COLOR.gold, textAlign: 'center', flexWrap: 'wrap' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, textAlign: 'center', flexWrap: 'wrap' },

  rightActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  abilitiesBtn: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1.5,
    borderColor: '#a855f7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  abilitiesBtnText: { color: '#c4b5fd', fontSize: 14 },
  abilitiesBadge: {
    backgroundColor: '#a855f7',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  abilitiesBadgeText: {
    color: '#ffffff',
    fontSize: 10,
  },

  shuffleBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(228,165,42,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shuffleBtnText: { fontSize: 20 },

  grid: { flex: 1 },
  gridContent: {
    paddingHorizontal: SPACE.lg,
    paddingBottom: SPACE.xxl,
    gap: SPACE.md,
  },
  columnWrapper: { gap: SPACE.md },

  cardCell: { alignItems: 'center', marginBottom: SPACE.md },
  cardWrapper: { position: 'relative' },

  roundOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  roundBadge: {
    backgroundColor: COLOR.gold,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACE.lg,
    paddingVertical: 6,
    ...SHADOW.gold,
  },
  roundBadgeText: { color: '#1A0D1A', fontSize: FONT.sm },
  unassignedOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  unassignedText: {
    color: COLOR.textMuted,
    fontSize: FONT.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACE.lg,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },

  bottomBar: {
    position: 'absolute',
    bottom: SPACE.xl,
    left: SPACE.lg,
    right: SPACE.lg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  // Focus Modal
  focusModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Base modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    ...GLASS_PANEL,
    width: '90%',
    maxWidth: 400,
    padding: SPACE.xl,
    paddingHorizontal: SPACE.md,
  },
  modalTitle: {
    color: COLOR.gold,
    fontSize: FONT.xl,
    textAlign: 'center',
    marginBottom: SPACE.xl,
  },
  // Abilities modal (horizontal card gallery)
  abilitiesModalContent: {
    ...GLASS_PANEL,
    width: '92%',
    maxWidth: 800,
    padding: SPACE.lg,
    paddingBottom: SPACE.md,
  },
  abilitiesModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE.lg,
  },
  abilitiesScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  abilityCardSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusModalContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusModalLeftCol: {
    width: 140,
    gap: 10,
    marginRight: 24,
  },
  focusRoundBtn: {
    borderRadius: 22,
    height: 44,
    backgroundColor: 'rgba(20, 20, 30, 0.9)',
    borderColor: '#4c1d95',
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
  },
  focusRoundBtnUsed: {
    borderColor: '#4ade80',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  focusRoundBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusRoundBadgeUsed: {
    borderColor: '#4ade80',
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
  },
  focusRoundBadgeText: {
    color: '#8b5cf6',
    fontSize: 12,
  },
  focusRoundBadgeTextUsed: {
    color: '#4ade80',
  },
  focusRoundBtnText: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 12,
  },
  focusRoundBtnTextUsed: {
    color: '#4ade80',
  },
  focusModalRightCol: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
    shadowColor: '#000',
    shadowOpacity: 0.8,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },

  abilityModalItem: {
    backgroundColor: 'rgba(30, 30, 40, 0.95)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a855f7',
    marginBottom: 12,
  },
  abilityModalItemActive: {
    // Styling merged into abilityModalItem above per AAA pill style
  },
  abilityModalItemUsed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.6,
  },
  abilityModalItemTitle: {
    fontSize: 16,
    color: '#e0f2fe',
    marginBottom: 6,
  },
  abilityModalItemDesc: {
    fontSize: 13,
    color: COLOR.textMuted,
    lineHeight: 18,
  },
});

// Re-export for type compatibility
export const COLOR_COMPAT = COLOR;
