import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { ThemedText as Text } from '@/components/ui/ThemedText';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { LuxuryBackground } from '@/components/game/luxury-background';
import { RotateHintScreen } from '@/components/game/RotateHintScreen';
import { useGame } from '@/lib/game/game-context';
import { COLOR, SPACE, RADIUS, FONT, GLASS_PANEL, SHADOW, FONT_FAMILY } from '@/components/ui/design-tokens';
import { useLandscapeLayout, LAYOUT_PADDING } from '@/utils/layout';

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

const MiniLevelButton = ({
  level,
  difficulty,
  stars,
  selected,
  onPress
}: {
  level: DifficultyLevel;
  difficulty: string;
  stars: number;
  selected: boolean;
  onPress: (lvl: DifficultyLevel) => void
}) => (
  <TouchableOpacity
    style={[
      styles.miniButton,
      selected && styles.miniButtonSelected
    ]}
    onPress={() => onPress(level)}
    activeOpacity={0.7}
  >
    {/* Stars Row */}
    <View style={styles.starsRow}>
      {[...Array(5)].map((_, i) => (
        <View key={i} style={[
          styles.star,
          i < stars && styles.filledStar,
          i >= stars && styles.emptyStar
        ]} />
      ))}
    </View>

    {/* Level Number */}
    <Text style={styles.levelNumber}>{level}</Text>

    {/* Arabic Label */}
    <Text style={styles.difficultyLabel}>{difficulty}</Text>
  </TouchableOpacity>
);

export default function DifficultyScreen() {
  const router = useRouter();
  const { setDifficulty } = useGame();
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel | null>(null);
  const { isLandscape, size } = useLandscapeLayout();
  const { height } = useWindowDimensions();
  const padding = LAYOUT_PADDING[size];
  const isSmallHeight = height < 400;

  const levels: { level: DifficultyLevel; difficulty: string; stars: number }[] = [
    { level: 1, difficulty: 'سهل', stars: 1 },
    { level: 2, difficulty: 'متوسط', stars: 2 },
    { level: 3, difficulty: 'صعب', stars: 3 },
    { level: 4, difficulty: 'خيالي', stars: 4 },
    { level: 5, difficulty: 'أسطوري', stars: 5 },
  ];

  const handleContinue = () => {
    if (selectedLevel) {
      setDifficulty(selectedLevel);
      router.push('/screens/rounds-config' as any);
    }
  };

  if (!isLandscape) {
    return <RotateHintScreen />;
  }

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <LuxuryBackground>
        <View style={[styles.levelsContainer, { paddingHorizontal: padding }, isSmallHeight && { paddingVertical: 12 }]}>
          <Text style={[styles.title, isSmallHeight && { fontSize: 24, marginBottom: 4 }]}>اختر المستوى</Text>
          <View style={[styles.miniButtonsRow, isSmallHeight && { marginVertical: 16 }]}>
            {levels.map((lvl) => (
              <MiniLevelButton
                key={lvl.level}
                level={lvl.level}
                difficulty={lvl.difficulty}
                stars={lvl.stars}
                selected={selectedLevel === lvl.level}
                onPress={setSelectedLevel}
              />
            ))}
          </View>

          <View style={[styles.controlsContainer, isSmallHeight && { marginTop: 20 }]}>
            <TouchableOpacity
              style={[styles.backButton, isSmallHeight && { paddingVertical: 12 }]}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text style={[styles.backButtonText, isSmallHeight && { fontSize: 16 }]}>← رجوع</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.continueButton,
                isSmallHeight && { paddingVertical: 12 },
                !selectedLevel && styles.continueButtonDisabled,
              ]}
              onPress={handleContinue}
              disabled={!selectedLevel}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.continueButtonText,
                  isSmallHeight && { fontSize: 16 },
                  !selectedLevel && styles.continueButtonTextDisabled,
                ]}
              >
                التالي →
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LuxuryBackground>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  levelsContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    color: '#d4af37',
    textAlign: 'center',
    marginBottom: 8,
  },
  miniButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginVertical: 32,
    gap: 12,
  },
  miniButton: {
    flex: 1,
    maxWidth: 80,
    minHeight: 60,
    borderRadius: 24,
    backgroundColor: 'rgba(26,13,26,0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(228,165,42,0.4)',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  miniButtonSelected: {
    backgroundColor: 'rgba(228,165,42,0.15)',
    borderColor: '#E4A52A',
    shadowColor: '#E4A52A',
    shadowOpacity: 0.6,
  },
  starsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-evenly',
  },
  star: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filledStar: {
    backgroundColor: '#E4A52A',
  },
  emptyStar: {
    backgroundColor: 'rgba(228,165,42,0.3)',
    borderWidth: 0.5,
    borderColor: 'rgba(228,165,42,0.5)',
  },
  levelNumber: {
    fontSize: 22,
    color: '#E4A52A',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  difficultyLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 9,
    width: '100%',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 40,
    width: '100%',
  },
  backButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
  },
  backButtonText: {
    fontSize: 18,
    color: '#d4af37',
    textAlign: 'center',
  },
  continueButton: {
    flex: 1,
    backgroundColor: '#d4af37',
    paddingVertical: 16,
    borderRadius: 32,
  },
  continueButtonDisabled: {
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
  },
  continueButtonText: {
    fontSize: 18,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  continueButtonTextDisabled: {
    color: '#666',
  },
});
