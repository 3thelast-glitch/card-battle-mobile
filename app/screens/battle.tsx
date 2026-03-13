import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Modal, ScrollView, PanResponder, Animated as RNAnimated, Dimensions, Alert, useWindowDimensions } from 'react-native';
import { ThemedText as Text } from '@/components/ui/ThemedText';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/screen-container';
import { CardItem } from '@/components/game/card-item';
import { StatusBar } from 'expo-status-bar';
import { ElementEffect } from '@/components/game/element-effect';
import { LuxuryBackground } from '@/components/game/luxury-background';
import { HealthBar } from '@/components/game/health-bar';
import { DamageNumber, DamageNumberVariant } from '@/components/game/damage-number';
import { BattleHUD } from '@/components/game/BattleHUD';
import { BattleResultOverlay } from '@/components/game/BattleResultOverlay';
import { RotateHintScreen } from '@/components/game/RotateHintScreen';
import { useLandscapeLayout, LAYOUT_PADDING, CARD_WIDTH_FACTOR } from '@/utils/layout';
import { useGame } from '@/lib/game/game-context';
import { ELEMENT_EMOJI, ElementAdvantage } from '@/lib/game/types';
import { getAbilityNameAr, getAbilityNameOnly, getAbilityDescription } from '@/lib/game/ability-names';
import { AbilityCard } from '@/components/game/ability-card';
import PredictionModal from '@/app/components/modals/PredictionModal';
import PopularityModal from '@/app/components/modals/PopularityModal';
import {
  buildPredictionSummary,
  getRemainingRounds,
  getUpcomingPredictionRounds,
  isPredictionComplete,
} from '@/lib/game/ui-helpers';

type BattlePhase = 'selection' | 'action' | 'combat' | 'result' | 'waiting';

const getAdvantageColor = (advantage: ElementAdvantage): string => {
  switch (advantage) {
    case 'strong':
      return '#4ade80';
    case 'weak':
      return '#f87171';
    default:
      return '#a0a0a0';
  }
};

const getAdvantageText = (advantage: ElementAdvantage): string => {
  switch (advantage) {
    case 'strong':
      return '⬆️ قوي';
    case 'weak':
      return '⬇️ ضعيف';
    default:
      return '';
  }
};



// ✅ شبكة إرشادية
const GridOverlay = () => {
  return (
    <View style={styles.gridContainer} pointerEvents="none">
      <View style={styles.verticalLine} />
      <View style={styles.horizontalLine} />
      <View style={[styles.verticalLineThin, { left: '25%' }]} />
      <View style={[styles.verticalLineThin, { left: '75%' }]} />
      <View style={[styles.horizontalLineThin, { top: '25%' }]} />
      <View style={[styles.horizontalLineThin, { top: '75%' }]} />
      <View style={styles.centerDot} />

      <View style={[styles.quadrantLabel, { left: '25%', top: '25%' }]}>
        <Text style={styles.quadrantText}>↖</Text>
      </View>
      <View style={[styles.quadrantLabel, { left: '75%', top: '25%' }]}>
        <Text style={styles.quadrantText}>↗</Text>
      </View>
      <View style={[styles.quadrantLabel, { left: '25%', top: '75%' }]}>
        <Text style={styles.quadrantText}>↙</Text>
      </View>
      <View style={[styles.quadrantLabel, { left: '75%', top: '75%' }]}>
        <Text style={styles.quadrantText}>↘</Text>
      </View>
    </View>
  );
};

// ✅ Sidebar جانبي
const EditSidebar = ({
  visible,
  onClose,
  elements,
  onElementUpdate,
  showGrid,
  onToggleGrid,
  snapToGrid,
  onToggleSnap,
  onResetLayout
}: any) => {
  const slideAnim = useRef(new RNAnimated.Value(-300)).current;

  useEffect(() => {
    RNAnimated.timing(slideAnim, {
      toValue: visible ? 0 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  return (
    <RNAnimated.View style={[
      styles.sidebar,
      { transform: [{ translateX: slideAnim }] }
    ]}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarTitle}>🎨 أدوات التحرير</Text>
        <TouchableOpacity onPress={onClose} style={styles.sidebarCloseButton}>
          <Text style={styles.sidebarCloseButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.sidebarContent}>
        <View style={styles.sidebarSection}>
          <Text style={styles.sidebarSectionTitle}>⚙️ إعدادات الشبكة</Text>

          <TouchableOpacity
            style={[styles.sidebarOption, showGrid && styles.sidebarOptionActive]}
            onPress={onToggleGrid}
          >
            <Text style={styles.sidebarOptionText}>
              {showGrid ? '✓' : '○'} إظهار الشبكة
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sidebarOption, snapToGrid && styles.sidebarOptionActive]}
            onPress={onToggleSnap}
          >
            <Text style={styles.sidebarOptionText}>
              {snapToGrid ? '✓' : '○'} التقاط تلقائي
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sidebarSection}>
          <Text style={styles.sidebarSectionTitle}>📦 العناصر</Text>

          {Object.entries(elements).map(([key, value]: [string, any]) => (
            <View key={key} style={styles.elementItem}>
              <Text style={styles.elementItemLabel}>
                {key === 'playerCard' ? '👤 بطاقة اللاعب' :
                  key === 'botCard' ? '🤖 بطاقة البوت' :
                    key === 'vs' ? '⚔️ VS' :
                      key === 'score' ? '📊 النقاط' :
                        key === 'round' ? '🔢 الجولة' :
                          key === 'result' ? '🏆 النتيجة' :
                            key === 'abilities' ? '🎮 القدرات' : key}
              </Text>
              <View style={styles.elementItemControls}>
                <Text style={styles.elementItemValue}>
                  الحجم: {Math.round(value.scale * 100)}%
                </Text>
                <Text style={styles.elementItemValue}>
                  X: {value.x.toFixed(0)} Y: {value.y.toFixed(0)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sidebarSection}>
          <Text style={styles.sidebarSectionTitle}>⚡ إجراءات سريعة</Text>

          <TouchableOpacity
            style={styles.sidebarActionButton}
            onPress={onResetLayout}
          >
            <Text style={styles.sidebarActionButtonText}>🔄 إعادة ضبط الكل</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sidebarActionButton, styles.sidebarActionButtonSecondary]}
            onPress={() => {
              const newElements = { ...elements };
              newElements.playerCard.y = 0;
              newElements.botCard.y = 0;
              newElements.vs.y = 0;
              Object.keys(newElements).forEach(key => {
                onElementUpdate(key, newElements[key as keyof typeof newElements]);
              });
            }}
          >
            <Text style={styles.sidebarActionButtonText}>↔️ محاذاة أفقية</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sidebarActionButton, styles.sidebarActionButtonSecondary]}
            onPress={() => {
              const newElements = { ...elements };
              newElements.score.x = 0;
              newElements.round.x = 0;
              newElements.vs.x = 0;
              Object.keys(newElements).forEach(key => {
                onElementUpdate(key, newElements[key as keyof typeof newElements]);
              });
            }}
          >
            <Text style={styles.sidebarActionButtonText}>↕️ محاذاة عمودية</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sidebarSection}>
          <Text style={styles.sidebarSectionTitle}>🎮 ترتيب القدرات</Text>

          <TouchableOpacity
            style={[styles.sidebarActionButton, styles.sidebarActionButtonSecondary]}
            onPress={() => {
              const abilities = elements.abilities;
              const newX = -abilities.y;
              const newY = abilities.x;
              onElementUpdate('abilities', { ...abilities, x: newX, y: newY });
            }}
          >
            <Text style={styles.sidebarActionButtonText}>🔄 تدوير 90°</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sidebarActionButton, styles.sidebarActionButtonSecondary]}
            onPress={() => {
              const abilities = elements.abilities;
              onElementUpdate('abilities', { ...abilities, x: 0, y: 300 });
            }}
          >
            <Text style={styles.sidebarActionButtonText}>↔️ ترتيب أفقي (أسفل)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sidebarActionButton, styles.sidebarActionButtonSecondary]}
            onPress={() => {
              const abilities = elements.abilities;
              onElementUpdate('abilities', { ...abilities, x: -300, y: 0 });
            }}
          >
            <Text style={styles.sidebarActionButtonText}>↕️ ترتيب عمودي (يسار)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sidebarSection}>
          <Text style={styles.sidebarInfoText}>
            💡 اسحب العناصر بحرية{'\n'}
            📐 استخدم الشبكة للتوزيع المتوازن{'\n'}
            🎯 احفظ التخطيط عند الانتهاء{'\n'}
            💾 يُحفظ تلقائياً عند التعديل
          </Text>
        </View>
      </ScrollView>
    </RNAnimated.View>
  );
};

// ✅ مقبض تكبير واحد
const ResizeHandle = ({
  position,
  onResizeStart,
  onResizeMove,
  onResizeEnd
}: any) => {
  const initialScale = useRef(1);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        evt.stopPropagation();
        initialScale.current = onResizeStart();
      },

      onPanResponderMove: (evt, gestureState) => {
        evt.stopPropagation();

        let scaleDelta = 0;

        if (position.includes('corner')) {
          const distance = Math.sqrt(
            gestureState.dx ** 2 + gestureState.dy ** 2
          );
          const direction = gestureState.dx + gestureState.dy > 0 ? 1 : -1;
          scaleDelta = (distance * direction) / 200;
        } else if (position === 'top' || position === 'bottom') {
          scaleDelta = gestureState.dy / 200;
        } else {
          scaleDelta = gestureState.dx / 200;
        }

        onResizeMove(position, initialScale.current + scaleDelta);
      },

      onPanResponderRelease: () => {
        onResizeEnd();
      },
    })
  ).current;

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.resizeHandle,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (styles as any)[`resizeHandle_${position.replace('-', '')}`],
      ]}
    >
      <View style={styles.resizeHandleInner} />
    </View>
  );
};

// ✅ مقابض التحويل
const TransformHandles = ({
  scale,
  onScaleChange,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
  minScale,
  maxScale
}: any) => {
  const positions = [
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
    'top',
    'bottom',
    'left',
    'right',
  ];

  return (
    <View style={styles.transformHandlesContainer} pointerEvents="box-none">
      {positions.map((pos) => (
        <ResizeHandle
          key={pos}
          position={pos}
          onResizeStart={onResizeStart}
          onResizeMove={onResizeMove}
          onResizeEnd={onResizeEnd}
        />
      ))}

      <View style={styles.centerDotHandle} pointerEvents="none">
        <View style={styles.centerDotInner} />
      </View>
    </View>
  );
};

// ✅ Component قابل للسحب والتكبير مع زر ثابت الحجم
const DraggableResizable = ({
  children,
  id,
  initialX = 0,
  initialY = 0,
  initialScale = 1,
  onUpdate,
  minScale = 0.5,
  maxScale = 2.5,
  snapToGrid = false
}: any) => {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const CENTER_X = SCREEN_WIDTH / 2;
  const CENTER_Y = SCREEN_HEIGHT / 2;

  const [scale, setScale] = useState(initialScale);
  const [isResizing, setIsResizing] = useState(false);

  const position = useRef({ x: CENTER_X + initialX, y: CENTER_Y + initialY });
  const pan = useRef(new RNAnimated.ValueXY(position.current)).current;

  useEffect(() => {
    const newPos = { x: CENTER_X + initialX, y: CENTER_Y + initialY };
    position.current = newPos;
    pan.setValue(newPos);
    setScale(initialScale);
  }, [initialX, initialY, initialScale]);

  const handleResizeStart = () => {
    setIsResizing(true);
    return scale;
  };

  const handleResizeMove = (position: string, newScale: number) => {
    const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));
    setScale(clampedScale);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    if (onUpdate) {
      onUpdate(id, {
        x: position.current.x - CENTER_X,
        y: position.current.y - CENTER_Y,
        scale,
      });
    }
  };

  const handleScaleChange = (delta: number) => {
    const newScale = Math.max(minScale, Math.min(maxScale, scale + delta));
    setScale(newScale);
    if (onUpdate) {
      onUpdate(id, {
        x: position.current.x - CENTER_X,
        y: position.current.y - CENTER_Y,
        scale: newScale,
      });
    }
  };

  const calculateBounds = () => {
    const margin = 100;
    return {
      minX: margin,
      maxX: SCREEN_WIDTH - margin,
      minY: margin,
      maxY: SCREEN_HEIGHT - margin,
    };
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isResizing,
      onMoveShouldSetPanResponder: () => !isResizing,

      onPanResponderGrant: () => {
        pan.setOffset({
          x: position.current.x,
          y: position.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: RNAnimated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),

      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();

        let finalX = position.current.x + gestureState.dx;
        let finalY = position.current.y + gestureState.dy;

        const bounds = calculateBounds();
        finalX = Math.max(bounds.minX, Math.min(bounds.maxX, finalX));
        finalY = Math.max(bounds.minY, Math.min(bounds.maxY, finalY));

        if (snapToGrid) {
          const gridSize = 50;
          finalX = Math.round(finalX / gridSize) * gridSize;
          finalY = Math.round(finalY / gridSize) * gridSize;
        }

        position.current = { x: finalX, y: finalY };

        RNAnimated.spring(pan, {
          toValue: { x: finalX, y: finalY },
          useNativeDriver: false,
          friction: 8,
          tension: 40,
        }).start();

        if (onUpdate) {
          onUpdate(id, {
            x: finalX - CENTER_X,
            y: finalY - CENTER_Y,
            scale,
          });
        }
      },
    })
  ).current;

  return (
    <RNAnimated.View
      style={[{ position: 'absolute', left: 0, top: 0 }]}
      {...panResponder.panHandlers}
    >
      {/* ✅ المحتوى المُكبَّر */}
      <RNAnimated.View
        style={{
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { translateX: -50 },
            { translateY: -50 },
            { scale },
          ],
        }}
      >
        <View style={styles.draggableContainer}>
          {children}

          <TransformHandles
            scale={scale}
            onScaleChange={handleScaleChange}
            onResizeStart={handleResizeStart}
            onResizeMove={handleResizeMove}
            onResizeEnd={handleResizeEnd}
            minScale={minScale}
            maxScale={maxScale}
          />
        </View>
      </RNAnimated.View>

      {/* ✅ الزر الثابت خارج Scale */}
      <RNAnimated.View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
          ],
        }}
        pointerEvents="box-none"
      >
        <View style={styles.fixedScaleControls} pointerEvents="auto">
          <TouchableOpacity
            style={[styles.scaleControlButton, scale <= minScale && styles.scaleControlButtonDisabled]}
            onPress={(e) => {
              e.stopPropagation();
              handleScaleChange(-0.1);
            }}
            disabled={scale <= minScale}
          >
            <Text style={styles.scaleControlButtonText}>−</Text>
          </TouchableOpacity>

          <View style={styles.scaleControlDisplay}>
            <Text style={styles.scaleControlText}>{Math.round(scale * 100)}%</Text>
          </View>

          <TouchableOpacity
            style={[styles.scaleControlButton, scale >= maxScale && styles.scaleControlButtonDisabled]}
            onPress={(e) => {
              e.stopPropagation();
              handleScaleChange(0.1);
            }}
            disabled={scale >= maxScale}
          >
            <Text style={styles.scaleControlButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </RNAnimated.View>
    </RNAnimated.View>
  );
};
export default function BattleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height, isLandscape, size } = useLandscapeLayout();
  const padding = LAYOUT_PADDING[size];
  const maxAvailableHeight = height * 0.55;
  const cardWidthByHeight = maxAvailableHeight / 1.5;
  const cardWidthByWidth = width * CARD_WIDTH_FACTOR[size] * 0.9;
  const cardWidth = Math.min(cardWidthByWidth, cardWidthByHeight);
  const cardHeight = cardWidth * 1.5;

  const {
    state,
    playRound,
    isGameOver,
    currentPlayerCard,
    currentBotCard,
    lastRoundResult,
    expectedRoundResult,
    useAbility,
    resetGame,
    setAbilitiesEnabled,
    nextRound,
    startBattle,
  } = useGame();

  const [phase, setPhase] = useState<BattlePhase>('selection');
  const [showResult, setShowResult] = useState(false);
  const [showPlayerEffect, setShowPlayerEffect] = useState(false);
  const [showBotEffect, setShowBotEffect] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [roundHistory, setRoundHistory] = useState<any[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [predictionSelections, setPredictionSelections] = useState<Record<number, 'win' | 'loss'>>({});
  const [predictionAbilityType, setPredictionAbilityType] = useState<'LogicalEncounter' | 'Eclipse' | 'Trap' | 'Pool'>('LogicalEncounter');
  const [popularityAbilityType, setPopularityAbilityType] = useState<'Popularity' | 'Rescue' | 'Penetration'>('Popularity');
  const [showPopularityModal, setShowPopularityModal] = useState(false);
  const [selectedPopularityRound, setSelectedPopularityRound] = useState<number | null>(null);
  const [isAbilitiesModalOpen, setIsAbilitiesModalOpen] = useState(false);

  // ── Damage numbers state ──────────────────────────────────────────────────
  const [activeDamageNumbers, setActiveDamageNumbers] = useState<{
    id: string;
    side: 'player' | 'bot';
    value: number;
    variant: DamageNumberVariant;
  }[]>([]);

  const spawnDamageNumber = useCallback(
    (side: 'player' | 'bot', value: number, variant: DamageNumberVariant = 'damage') => {
      const id = `${Date.now()}-${Math.random()}`;
      setActiveDamageNumbers((prev) => [...prev, { id, side, value, variant }]);
    },
    []
  );

  const removeDamageNumber = useCallback((id: string) => {
    setActiveDamageNumbers((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const [editMode, setEditMode] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const CENTER_X = SCREEN_WIDTH / 2;
  const CENTER_Y = SCREEN_HEIGHT / 2;

  // Calculate dynamic scales based on screen size
  const maxCardWidth = SCREEN_WIDTH * 0.35; // Maximum 35% of screen width for cards
  const baseCardScale = Math.min(1, maxCardWidth / 200); // Assuming 200 is base card width
  const uiScale = Math.min(1, SCREEN_WIDTH / 400); // Scale down UI elements on small screens

  // ✅ التخطيط الافتراضي مستند إلى النسب بدلاً من الأرقام الثابتة
  const DEFAULT_LAYOUT = {
    playerCard: { x: -SCREEN_WIDTH * 0.25, y: 0, scale: baseCardScale, minScale: 0.3, maxScale: 1.5 },
    botCard: { x: SCREEN_WIDTH * 0.25, y: 0, scale: baseCardScale, minScale: 0.3, maxScale: 1.5 },
    vs: { x: 0, y: 0, scale: uiScale, minScale: 0.3, maxScale: 2.0 },
    score: { x: 0, y: -SCREEN_HEIGHT * 0.35, scale: uiScale * 0.9, minScale: 0.4, maxScale: 1.5 },
    round: { x: 0, y: -SCREEN_HEIGHT * 0.42, scale: uiScale * 0.9, minScale: 0.4, maxScale: 1.5 },
    result: { x: 0, y: SCREEN_HEIGHT * 0.35, scale: uiScale, minScale: 0.5, maxScale: 2.0 },
    abilities: { x: 0, y: SCREEN_HEIGHT * 0.25, scale: uiScale * 0.8, minScale: 0.4, maxScale: 1.5 },
  };

  const [elements, setElements] = useState(DEFAULT_LAYOUT);

  const playerCardScale = useSharedValue(0);
  const botCardScale = useSharedValue(0);
  const vsOpacity = useSharedValue(0);
  const resultOpacity = useSharedValue(0);

  // ✅ تحميل التخطيط المحفوظ عند بدء الصفحة
  useEffect(() => {
    loadLayout();
  }, []);

  // ✅ حفظ التخطيط تلقائياً عند التعديل
  useEffect(() => {
    if (editMode) {
      saveLayout();
    }
  }, [elements, editMode]);

  // ✅ دالة تحميل التخطيط
  const loadLayout = async () => {
    try {
      const savedLayout = await AsyncStorage.getItem('battleLayout');
      if (savedLayout) {
        setElements(JSON.parse(savedLayout));
        console.log('✅ تم تحميل التخطيط المحفوظ');
      } else {
        console.log('📌 استخدام التخطيط الافتراضي');
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل التخطيط:', error);
    }
  };

  // ✅ دالة حفظ التخطيط
  const saveLayout = async () => {
    try {
      await AsyncStorage.setItem('battleLayout', JSON.stringify(elements));
      console.log('💾 تم حفظ التخطيط');
    } catch (error) {
      console.error('❌ خطأ في حفظ التخطيط:', error);
    }
  };

  const updateElement = (id: string, data: any) => {
    setElements((prev) => ({
      ...prev,
      [id]: { ...prev[id as keyof typeof prev], ...data },
    }));
  };

  const resetLayout = async () => {
    setElements(DEFAULT_LAYOUT);
    try {
      await AsyncStorage.removeItem('battleLayout');
      console.log('🔄 تم إعادة ضبط التخطيط');
    } catch (error) {
      console.error('❌ خطأ في إعادة الضبط:', error);
    }
  };

  useEffect(() => {
    if (state.currentRound < state.totalRounds && !currentPlayerCard && !currentBotCard) {
      startBattle(state.playerDeck);
    }
  }, [state.currentRound, state.totalRounds, currentPlayerCard, currentBotCard, startBattle, state.playerDeck]);

  useEffect(() => {
    if (currentPlayerCard && currentBotCard && phase === 'selection' && !editMode) {
      playerCardScale.value = 0;
      botCardScale.value = 0;
      vsOpacity.value = 0;
      resultOpacity.value = 0;
      setShowResult(false);
      setShowPlayerEffect(false);
      setShowBotEffect(false);

      playerCardScale.value = withDelay(100, withTiming(1, { duration: 300 }));
      botCardScale.value = withDelay(300, withTiming(1, { duration: 300 }));
      vsOpacity.value = withDelay(500, withTiming(1, { duration: 200 }));

      setTimeout(() => {
        setPhase('action');
      }, 800);
    }
  }, [currentPlayerCard, currentBotCard, phase, state.currentRound, editMode]);

  const handleExecuteAttack = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // 1. Enter Combat Visuals
    setPhase('combat');
    setShowPlayerEffect(true);
    setShowBotEffect(true);

    // 2. Play the Math
    playRound();

    // 3. Clear Prediction States to prevent UI locks.
    setPredictionSelections({});
    setShowPredictionModal(false);

    setTimeout(() => {
      // Visuals off
      setShowPlayerEffect(false);
      setShowBotEffect(false);

      // We check the newest history log to evaluate results
      const newHistory = [...state.roundResults];

      // This is a safety check but playRound happens synchronously, 
      // however the react state update for state.roundResults might be queued.
      // It's safer to use the 'isGameOver' context variable directly if it's updated. 
      // We know playRound executes purely. Let React flush, then we rely on lastRoundResult in the next render cycle. 
      setPhase('result');
    }, 1000);
  }, [playRound, state.roundResults]);

  useEffect(() => {
    if (editMode) {
      setShowSidebar(true);
    } else {
      setShowSidebar(false);
    }
  }, [editMode]);

  const handleNextRound = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (isGameOver) {
      router.push('/screens/battle-results' as any);
    } else {
      setPhase('selection');
      nextRound();
    }
  }, [isGameOver, router, nextRound]);

  const handleConfirmPrediction = useCallback(() => {
    useAbility(predictionAbilityType, { predictions: predictionSelections });
    setShowPredictionModal(false);
    setPredictionSelections({});
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [predictionAbilityType, predictionSelections, useAbility]);

  const handleConfirmPopularity = useCallback(() => {
    if (selectedPopularityRound === null) {
      return;
    }
    useAbility(popularityAbilityType, { round: selectedPopularityRound });
    setShowPopularityModal(false);
    setSelectedPopularityRound(null);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [popularityAbilityType, selectedPopularityRound, useAbility]);

  const handleSelectPrediction = useCallback((round: number, outcome: 'win' | 'loss') => {
    setPredictionSelections((prev) => ({ ...prev, [round]: outcome }));
  }, []);

  const handleClosePrediction = useCallback(() => {
    setShowPredictionModal(false);
  }, []);



  useEffect(() => {
    if (phase === 'result' && lastRoundResult && !editMode) {
      setRoundHistory(prev => {
        if (prev.some(h => h.round === lastRoundResult.round)) return prev;
        return [...prev, {
          round: lastRoundResult.round,
          playerCard: lastRoundResult.playerCard,
          botCard: lastRoundResult.botCard,
          winner: lastRoundResult.winner
        }];
      });

      // Spawn floating damage numbers
      if (lastRoundResult.botDamage > 0) {
        const isCrit = lastRoundResult.playerElementAdvantage === 'strong';
        spawnDamageNumber('bot', lastRoundResult.botDamage, isCrit ? 'critical' : 'damage');
      }
      if (lastRoundResult.playerDamage > 0) {
        const isCrit = lastRoundResult.botElementAdvantage === 'strong';
        spawnDamageNumber('player', lastRoundResult.playerDamage, isCrit ? 'critical' : 'damage');
      }

      if (isGameOver) {
        setShowResult(true);
        resultOpacity.value = withTiming(1, { duration: 300 });

        if (Platform.OS !== 'web') {
          if (lastRoundResult.winner === 'player') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else if (lastRoundResult.winner === 'bot') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        }
        setPhase('waiting');
      } else {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        // Delay long enough for floating numbers to rise, then violently rip to next frame:
        setTimeout(() => {
          setPhase('selection');
          nextRound();
        }, 1200);
      }
    }
  }, [phase, lastRoundResult, resultOpacity, editMode, spawnDamageNumber, isGameOver, nextRound]);
  const handleCancelPrediction = useCallback(() => {
    setShowPredictionModal(false);
    setPredictionSelections({});
  }, []);

  const handleSelectPopularity = useCallback((round: number) => {
    setSelectedPopularityRound(round);
  }, []);

  const handleClosePopularity = useCallback(() => {
    setShowPopularityModal(false);
  }, []);

  const handleCancelPopularity = useCallback(() => {
    setShowPopularityModal(false);
    setSelectedPopularityRound(null);
  }, []);

  const playerCardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playerCardScale.value }],
  }));

  const botCardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: botCardScale.value }],
  }));

  const vsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: vsOpacity.value,
  }));

  const resultAnimatedStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
  }));

  const getResultMessage = () => {
    if (!lastRoundResult) return '';
    switch (lastRoundResult.winner) {
      case 'player':
        return '🎉 أنت الفائز!';
      case 'bot':
        return '😢 البوت يفوز!';
      default:
        return '🤝 تعادلاً!';
    }
  };

  const getResultColor = () => {
    if (!lastRoundResult) return '#a0a0a0';
    switch (lastRoundResult.winner) {
      case 'player':
        return '#4ade80';
      case 'bot':
        return '#f87171';
      default:
        return '#fbbf24';
    }
  };

  const roundNumber = state.currentRound + 1;
  const upcomingRounds = useMemo(
    () => getUpcomingPredictionRounds(roundNumber, state.totalRounds),
    [roundNumber, state.totalRounds]
  );
  const remainingRounds = useMemo(
    () => getRemainingRounds(roundNumber, state.totalRounds),
    [roundNumber, state.totalRounds]
  );
  const predictionComplete = useMemo(
    () => isPredictionComplete(upcomingRounds, predictionSelections),
    [upcomingRounds, predictionSelections]
  );
  const isPopularityReady = selectedPopularityRound !== null;

  const predictionSummary = useMemo(
    () => buildPredictionSummary(state.activeEffects, 'player'),
    [state.activeEffects]
  );

  const displayPlayerCard = showResult && lastRoundResult
    ? lastRoundResult.playerCard
    : currentPlayerCard;

  const displayBotCard = showResult && lastRoundResult
    ? lastRoundResult.botCard
    : currentBotCard;

  // Derived: is this the final round? Used by BattleResultOverlay

  if (!displayPlayerCard || !displayBotCard) {
    return (
      <View style={styles.rootScreen}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </View>
    );
  }

  if (!isLandscape) {
    return <RotateHintScreen />;
  }

  return (
    <View style={styles.rootScreen}>
      <StatusBar hidden />
      <View style={styles.backgroundWrapper}>
        <LuxuryBackground />
      </View>

      {editMode && showGrid && <GridOverlay />}

      <EditSidebar
        visible={showSidebar}
        onClose={() => setShowSidebar(false)}
        elements={elements}
        onElementUpdate={updateElement}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid(!snapToGrid)}
        onResetLayout={resetLayout}
      />



      {editMode && !showSidebar && (
        <View style={styles.editInstructions}>
          <Text style={styles.editInstructionsText}>
            💡 اسحب للتحريك • المقابض للتكبير • + و − للتحكم الدقيق
          </Text>
        </View>
      )}

      {/* Inner interactive container receives Safe Area horizontal padding to center content away from notches */}
      <View style={[styles.battleContainer, { paddingLeft: insets.left, paddingRight: insets.right }]} pointerEvents={editMode ? 'auto' : 'box-none'}>

        {editMode ? (
          <>
            <DraggableResizable
              id="playerCard"
              initialX={elements.playerCard.x}
              initialY={elements.playerCard.y}
              initialScale={elements.playerCard.scale}
              minScale={elements.playerCard.minScale}
              maxScale={elements.playerCard.maxScale}
              snapToGrid={snapToGrid}
              onUpdate={updateElement}
            >
              <View style={styles.editElement}>
                <Text style={styles.elementLabel}>👤 بطاقة اللاعب</Text>
                <View style={{ transform: [{ scale: 0.8 }] }}>
                  <CardItem card={displayPlayerCard} size="large" />
                </View>
              </View>
            </DraggableResizable>

            <DraggableResizable
              id="botCard"
              initialX={elements.botCard.x}
              initialY={elements.botCard.y}
              initialScale={elements.botCard.scale}
              minScale={elements.botCard.minScale}
              maxScale={elements.botCard.maxScale}
              snapToGrid={snapToGrid}
              onUpdate={updateElement}
            >
              <View style={styles.editElement}>
                <Text style={styles.elementLabel}>🤖 بطاقة البوت</Text>
                <View style={{ transform: [{ scale: 0.8 }] }}>
                  <CardItem card={displayBotCard} size="large" />
                </View>
              </View>
            </DraggableResizable>

            <DraggableResizable
              id="vs"
              initialX={elements.vs.x}
              initialY={elements.vs.y}
              initialScale={elements.vs.scale}
              minScale={elements.vs.minScale}
              maxScale={elements.vs.maxScale}
              snapToGrid={snapToGrid}
              onUpdate={updateElement}
            >
              <View style={styles.editElement}>
                <Text style={styles.elementLabel}>⚔️ VS</Text>
                <Text style={styles.vsEditText}>⚔️ VS ⚔️</Text>
              </View>
            </DraggableResizable>

            <DraggableResizable
              id="score"
              initialX={elements.score.x}
              initialY={elements.score.y}
              initialScale={elements.score.scale}
              minScale={elements.score.minScale}
              maxScale={elements.score.maxScale}
              snapToGrid={snapToGrid}
              onUpdate={updateElement}
            >
              <View style={styles.editElement}>
                <Text style={styles.elementLabel}>📊 النقاط</Text>
                <Text style={styles.scoreEditText}>
                  {state.playerScore} - {state.botScore}
                </Text>
              </View>
            </DraggableResizable>

            <DraggableResizable
              id="round"
              initialX={elements.round.x}
              initialY={elements.round.y}
              initialScale={elements.round.scale}
              minScale={elements.round.minScale}
              maxScale={elements.round.maxScale}
              snapToGrid={snapToGrid}
              onUpdate={updateElement}
            >
              <View style={styles.editElement}>
                <Text style={styles.elementLabel}>🔢 الجولة</Text>
                <Text style={styles.roundEditText}>
                  الجولة {state.currentRound + 1}/{state.totalRounds}
                </Text>
              </View>
            </DraggableResizable>

            <DraggableResizable
              id="abilities"
              initialX={elements.abilities.x}
              initialY={elements.abilities.y}
              initialScale={elements.abilities.scale}
              minScale={elements.abilities.minScale}
              maxScale={elements.abilities.maxScale}
              snapToGrid={snapToGrid}
              onUpdate={updateElement}
            >
              <View style={styles.editElement}>
                <Text style={styles.elementLabel}>🎮 القدرات</Text>
                <View style={styles.abilitiesEditBox}>
                  {state.playerAbilities.map((ability, index) => (
                    <View key={index} style={styles.abilityEditItem}>
                      <Text style={styles.abilityEditText}>
                        {ability.used ? '✗' : '✓'} {getAbilityNameAr(ability.type)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </DraggableResizable>

            <DraggableResizable
              id="result"
              initialX={elements.result.x}
              initialY={elements.result.y}
              initialScale={elements.result.scale}
              minScale={elements.result.minScale}
              maxScale={elements.result.maxScale}
              snapToGrid={snapToGrid}
              onUpdate={updateElement}
            >
              <View style={styles.editElement}>
                <Text style={styles.elementLabel}>🏆 النتيجة</Text>
                <Text style={[styles.resultEditText, { color: '#fbbf24' }]}>
                  🤝 تعادلاً!
                </Text>
              </View>
            </DraggableResizable>
          </>
        ) : (
          <>
            <View style={styles.normalPlayContainer}>

              {/* ── Cinematic Result Overlay (full-screen) ── */}
              <BattleResultOverlay
                visible={showResult && phase === 'waiting'}
                winner={
                  state.playerScore > state.botScore
                    ? 'player'
                    : state.botScore > state.playerScore
                      ? 'bot'
                      : 'draw'
                }
                playerScore={state.playerScore}
                botScore={state.botScore}
                onPlayAgain={() => {
                  resetGame();
                  router.replace('/screens/rounds-config' as any);
                }}
                onHome={() => {
                  router.replace('/screens/splash' as any);
                }}
              />

              {/* ════════════════════════════════════════════════════
                2-COLUMN BATTLE BOARD
                LEFT = PLAYER  |  RIGHT = BOT
            ════════════════════════════════════════════════════ */}
              {/* ════════════════════════════════════════════════════
                  NEW HORIZONTAL LAYOUT (Perfect fit for S23 Ultra)
              ════════════════════════════════════════════════════ */}
              <View style={[styles.battleRoot, { paddingLeft: Math.max(insets.left, 8), paddingRight: Math.max(insets.right, 8) }]}>

                {/* ── TOP HUD SCOREBOARD (8vh) ── */}
                <View style={[styles.topHud, { backgroundColor: 'rgba(5, 10, 20, 0.45)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#334155' }]}>
                  {/* Player Header */}
                  <View style={styles.hudPlayer}>
                    <View style={[styles.avatarCircle, { backgroundColor: '#1a3a1a', width: 40, height: 40, borderWidth: 2, borderColor: '#4ade80' }]}>
                      <Text style={{ fontSize: 20 }}>👤</Text>
                    </View>
                    <View style={[styles.hudInfo, { marginLeft: 10 }]}>
                      <Text style={[styles.combatantName, { color: '#4ade80', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 }]}>لاعب</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Text style={{ fontSize: 22, fontWeight: '900', color: '#fbbf24', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 2 }}>{state.playerScore}</Text>
                        <Text style={{ fontSize: 16 }}>⭐</Text>
                      </View>
                    </View>
                  </View>

                  {/* Center Score */}
                  <View style={[styles.hudCenter, { flex: 1 }]}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 1 }}>Round {state.currentRound + 1}/{state.totalRounds}</Text>
                  </View>

                  {/* Bot Header */}
                  <View style={styles.hudBot}>
                    <View style={[styles.hudInfo, { alignItems: 'flex-end', marginRight: 10 }]}>
                      <Text style={[styles.combatantName, { color: '#f87171', fontSize: 13, fontWeight: '600', letterSpacing: 0.5, textAlign: 'right' }]}>البوت</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Text style={{ fontSize: 16 }}>⭐</Text>
                        <Text style={{ fontSize: 22, fontWeight: '900', color: '#fbbf24', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 2 }}>{state.botScore}</Text>
                      </View>
                    </View>
                    <View style={[styles.avatarCircle, { backgroundColor: '#3a1a1a', width: 40, height: 40, borderWidth: 2, borderColor: '#f87171' }]}>
                      <Text style={{ fontSize: 20 }}>🤖</Text>
                    </View>
                  </View>
                </View>

                {/* ── MAIN ARENA (82vh) ── */}
                <View style={styles.arenaContainer}>

                  {/* ─ LEFT: PLAYER SIDE ─ */}
                  <View style={styles.playerSideHorizontal}>

                    {/* Current Card (Player) */}
                    <View style={styles.currentCardAreaHorizontal}>
                      <Animated.View style={playerCardAnimatedStyle}>
                        <CardItem card={displayPlayerCard} customWidth={cardWidth} customHeight={cardHeight} playEntranceAnimation={phase === 'selection'} entranceDelay={100} />
                        {showPlayerEffect && displayPlayerCard && <ElementEffect element={displayPlayerCard.element} isActive={showPlayerEffect} />}
                      </Animated.View>
                      {activeDamageNumbers.filter((n) => n.side === 'player').map((n) => (
                        <DamageNumber key={n.id} value={n.value} variant={n.variant} x={40} y={-20} onComplete={() => removeDamageNumber(n.id)} />
                      ))}
                    </View>

                    {/* Effects Box (Player) */}
                    <View style={[styles.effectsBox, { width: cardWidth }]}>
                      {showResult && lastRoundResult && lastRoundResult.playerElementAdvantage !== 'neutral' ? (
                        <Text style={[styles.advantageText, { color: getAdvantageColor(lastRoundResult.playerElementAdvantage) }]}>
                          {ELEMENT_EMOJI[lastRoundResult.playerCard.element]} {getAdvantageText(lastRoundResult.playerElementAdvantage)}
                        </Text>
                      ) : (
                        <View style={{ height: 20 }} />
                      )}
                    </View>
                  </View>

                  {/* ─ CENTER VS GLOW ─ */}
                  <View style={styles.centerVSGlow}>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => setIsHistoryModalOpen(true)}>
                      <Animated.View style={[styles.vsBadgeHorizontal, vsAnimatedStyle, { transform: [{ scale: 1.2 }] }]}>
                        <Text style={styles.vsBadgeTextHorizontal}>⚔️</Text>
                        <Text style={styles.vsBadgeVSHorizontal}>VS</Text>
                      </Animated.View>
                    </TouchableOpacity>

                    {phase === 'action' && expectedRoundResult && (
                      <Animated.View style={[styles.previewBadge, { opacity: vsOpacity.value }]}>
                        <Text style={[
                          styles.previewBadgeText,
                          {
                            color: expectedRoundResult.winner === 'player' ? '#4ade80' : expectedRoundResult.winner === 'bot' ? '#f87171' : '#fbbf24'
                          }
                        ]}>
                          {expectedRoundResult.winner === 'player' ? '👤 المتوقع: فوزك' : expectedRoundResult.winner === 'bot' ? '💀 المتوقع: خسارتك' : '🤝 المتوقع: تعادل'}
                        </Text>
                      </Animated.View>
                    )}

                    {/* NEW: Unified Action Button */}
                    {phase === 'action' ? (
                      <TouchableOpacity
                        style={[styles.unifiedButton, styles.unifiedButtonConfirm]}
                        onPress={handleExecuteAttack}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.unifiedButtonText}>اعتماد النتيجة</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.unifiedButton, phase === 'waiting' ? styles.unifiedButtonWait : styles.unifiedButtonDisabled]}
                        onPress={phase === 'waiting' ? handleNextRound : undefined}
                        activeOpacity={0.85}
                        disabled={phase !== 'waiting'}
                      >
                        <Text style={styles.unifiedButtonText}>
                          {isGameOver ? '🏁 إنهاء' : '⚙️ جاري...'}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Abilities Toggle */}
                    <TouchableOpacity
                      style={[styles.unifiedButton, styles.unifiedButtonAbilities]}
                      onPress={() => setIsAbilitiesModalOpen(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.unifiedButtonText}>القدرات ⚡</Text>
                    </TouchableOpacity>
                  </View>

                  {/* ─ RIGHT: ENEMY SIDE ─ */}
                  <View style={styles.enemySideHorizontal}>

                    {/* Current Card (Bot) */}
                    <View style={styles.currentCardAreaHorizontal}>
                      <Animated.View style={[botCardAnimatedStyle, { transform: [{ scale: 0.95 }] }]}>
                        <CardItem card={displayBotCard} customWidth={cardWidth} customHeight={cardHeight} playEntranceAnimation={phase === 'selection'} entranceDelay={300} />
                        {showBotEffect && displayBotCard && <ElementEffect element={displayBotCard.element} isActive={showBotEffect} />}
                      </Animated.View>
                      {activeDamageNumbers.filter((n) => n.side === 'bot').map((n) => (
                        <DamageNumber key={n.id} value={n.value} variant={n.variant} x={40} y={-20} onComplete={() => removeDamageNumber(n.id)} />
                      ))}
                    </View>

                    {/* Effects Box (Bot) */}
                    <View style={[styles.effectsBox, { width: cardWidth }]}>
                      {showResult && lastRoundResult && lastRoundResult.botElementAdvantage !== 'neutral' && (
                        <Text style={[styles.advantageText, { color: getAdvantageColor(lastRoundResult.botElementAdvantage) }]}>
                          {ELEMENT_EMOJI[lastRoundResult.botCard.element]} {getAdvantageText(lastRoundResult.botElementAdvantage)}
                        </Text>
                      )}
                      {showResult && lastRoundResult ? (
                        <View style={{ alignItems: 'center' }}>
                          <Text style={[styles.botResultValue, { color: lastRoundResult.winner === 'bot' ? '#4ade80' : lastRoundResult.winner === 'player' ? '#f87171' : '#fbbf24', fontSize: 13, marginTop: 4 }]}>
                            {lastRoundResult.winner === 'bot' ? '🏆 البوت فاز' : lastRoundResult.winner === 'player' ? '💀 البوت خسر' : '= تعادل'}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>

                {/* ── Floating Actions (Log & Bot Status) ── */}


                <View style={[styles.floatingActionRight, { bottom: Math.max(insets.bottom, 20) + 20 }]} pointerEvents="none">
                  <View style={styles.botStatusPillHUD}>
                    <Text style={styles.botStatusTextHUD}>
                      {phase === 'action' ? 'ينتظر... 🤖' : phase === 'combat' ? 'يقاتل... ⚔️' : '🤖...'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <Modal
              visible={isAbilitiesModalOpen}
              transparent
              animationType="fade"
              onRequestClose={() => setIsAbilitiesModalOpen(false)}
            >
              <TouchableOpacity
                style={styles.abilitiesModalOverlay}
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
                    <Text style={styles.abilitiesModalTitle}>القدرات المتاحة ⚡</Text>
                    <TouchableOpacity onPress={() => setIsAbilitiesModalOpen(false)} style={{ padding: 4 }}>
                      <Text style={{ color: '#94a3b8', fontSize: 20 }}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Horizontal scrolling AbilityCards */}
                  {state.playerAbilities.length === 0 ? (
                    <Text style={{ color: '#94a3b8', textAlign: 'center', marginVertical: 24 }}>لا توجد قدرات متاحة</Text>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingHorizontal: 8,
                        paddingVertical: 8,
                      }}
                    >
                      {state.playerAbilities.map((ability, index) => {
                        const isSealed = state.activeEffects.some(
                          (effect) =>
                            effect.kind === 'silenceAbilities' &&
                            (effect.targetSide === 'player' || effect.targetSide === 'all') &&
                            effect.createdAtRound <= roundNumber &&
                            (effect.expiresAtRound === undefined || roundNumber <= effect.expiresAtRound)
                        );
                        // Use ability.type directly as English name for image mapping
                        // IMPORTANT: Ensure ABILITY_IMAGES dictionary includes keys matching these types
                        const abilityNameEn = ability.type;
                        const abilityNameAr = getAbilityNameAr(ability.type).split('(')[0].trim();
                        const abilityDescription = getAbilityDescription(ability.type);
                        return (
                          <View key={index} style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <TouchableOpacity
                              onPress={() => {
                                if (ability.used || phase !== 'action') return;
                                if (isSealed) {
                                  Alert.alert('القدرات مختومة', 'لا يمكنك تفعيل القدرات خلال مدة الختم.');
                                  return;
                                }
                                if (['LogicalEncounter', 'Eclipse', 'Trap', 'Pool'].includes(ability.type)) {
                                  if (upcomingRounds.length === 0) return;
                                  setPredictionSelections({});
                                  setPredictionAbilityType(ability.type as any);
                                  setIsAbilitiesModalOpen(false);
                                  setShowPredictionModal(true);
                                  return;
                                }
                                if (['Popularity', 'Rescue', 'Penetration'].includes(ability.type)) {
                                  if (remainingRounds.length === 0) return;
                                  setSelectedPopularityRound(null);
                                  setPopularityAbilityType(ability.type as any);
                                  setIsAbilitiesModalOpen(false);
                                  setShowPopularityModal(true);
                                  return;
                                }
                                useAbility(ability.type);
                                setIsAbilitiesModalOpen(false);
                                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              }}
                              disabled={ability.used || phase !== 'action'}
                              activeOpacity={0.9}
                              style={{
                                opacity: (ability.used || phase !== 'action') ? 0.5 : 1,
                                transform: [{ scale: 0.85 }],
                              }}
                            >
                              <AbilityCard
                                ability={{
                                  id: index,
                                  nameEn: abilityNameEn,
                                  nameAr: abilityNameAr,
                                  description: abilityDescription,
                                  icon: null,
                                  rarity: 'Rare',
                                  isActive: !ability.used && phase === 'action',
                                }}
                                showActionButtons={false}
                              />
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </ScrollView>
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
            <PredictionModal
              visible={showPredictionModal}
              upcomingRounds={upcomingRounds}
              selections={predictionSelections}
              onSelect={handleSelectPrediction}
              onCancel={handleCancelPrediction}
              onRequestClose={handleClosePrediction}
              onConfirm={handleConfirmPrediction}
              isConfirmDisabled={!predictionComplete}
            />

            <PopularityModal
              visible={showPopularityModal}
              remainingRounds={remainingRounds}
              selectedRound={selectedPopularityRound}
              onSelect={handleSelectPopularity}
              onCancel={handleCancelPopularity}
              onRequestClose={handleClosePopularity}
              onConfirm={handleConfirmPopularity}
              isConfirmDisabled={!isPopularityReady}
            />

            <Modal
              visible={showHistoryModal}
              transparent
              animationType="slide"
              onRequestClose={() => setShowHistoryModal(false)}
            >
              <View style={styles.historyModalOverlay}>
                <View style={styles.historyModalContent}>
                  <View style={styles.historyModalHeader}>
                    <Text style={styles.historyModalTitle}>سجل البطاقات</Text>
                    <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                      <Text style={styles.historyModalCloseButton}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.historyScroll}>
                    {state.roundResults.map((result) => (
                      <View key={result.round} style={styles.historyRoundItem}>
                        <Text style={styles.historyRoundNumber}>الجولة {result.round}</Text>
                        <View style={styles.historyCardsRow}>
                          <View style={styles.historyCardSection}>
                            <Text style={styles.historyCardLabel}>👤 أنت</Text>
                            <Text style={styles.historyCardName}>{result.playerCard.nameAr}</Text>
                            <Text style={styles.historyCardStats}>الضرر: {result.playerDamage}</Text>
                          </View>
                          <View style={styles.historyVS}>
                            <Text style={styles.historyVSText}>VS</Text>
                          </View>
                          <View style={styles.historyCardSection}>
                            <Text style={styles.historyCardLabel}>🤖 البوت</Text>
                            <Text style={styles.historyCardName}>{result.botCard.nameAr}</Text>
                            <Text style={styles.historyCardStats}>الضرر: {result.botDamage}</Text>
                          </View>
                        </View>
                        <Text style={[styles.historyWinner, { color: result.winner === 'player' ? '#4ade80' : result.winner === 'bot' ? '#f87171' : '#fbbf24' }]}>
                          {result.winner === 'player' ? '✓ أنت الفائز' : result.winner === 'bot' ? '✗ البوت يفوز' : '= تعادل'}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </Modal>

            <Modal
              visible={isHistoryModalOpen}
              transparent
              animationType="slide"
              onRequestClose={() => setIsHistoryModalOpen(false)}
            >
              <View style={styles.matchHistoryOverlay}>
                <View style={styles.matchHistoryContent}>
                  <View style={styles.matchHistoryHeader}>
                    <Text style={styles.matchHistoryTitle}>تاريخ الجولات السابقة</Text>
                    <TouchableOpacity onPress={() => setIsHistoryModalOpen(false)}>
                      <Text style={styles.matchHistoryCloseBtn}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.matchHistoryScroll}>
                    {roundHistory.length === 0 ? (
                      <Text style={styles.matchHistoryEmpty}>لا يوجد سجل بعد</Text>
                    ) : (
                      roundHistory.map((item, index) => (
                        <View key={index} style={styles.matchHistoryRowVisual}>
                          {/* Left: Player Card */}
                          <View style={styles.matchHistoryCardWrapper}>
                            {item.winner === 'player' && (
                              <Text style={styles.historyCrown}>👑</Text>
                            )}
                            <CardItem card={item.playerCard} customWidth={80} customHeight={110} />
                          </View>

                          {/* Center: Round Number */}
                          <View style={styles.matchHistoryRoundCenter}>
                            <Text style={styles.matchHistoryRoundText}>الجولة {item.round}</Text>
                            <Text style={styles.matchHistoryVSCenter}>⚔️</Text>
                          </View>

                          {/* Right: Bot Card */}
                          <View style={styles.matchHistoryCardWrapper}>
                            {item.winner === 'bot' && (
                              <Text style={styles.historyCrown}>👑</Text>
                            )}
                            <CardItem card={item.botCard} customWidth={80} customHeight={110} />
                          </View>
                        </View>
                      ))
                    )}
                  </ScrollView>
                </View>
              </View>
            </Modal>
          </>
        )}
      </View>
    </View>
  );
}

// ✅ STYLES
const styles = StyleSheet.create({
  rootScreen: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  backgroundWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },

  hudWrapper: {
    position: 'absolute',
    top: 50,
    left: 12,
    right: 12,
    zIndex: 50,
  },

  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '80%',
    maxWidth: 300,
    backgroundColor: 'rgba(26, 26, 26, 0.98)',
    zIndex: 300,
    borderRightWidth: 3,
    borderRightColor: '#d4af37',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },

  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#d4af37',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },

  sidebarTitle: {
    color: '#d4af37',
    fontSize: 16,
    fontWeight: 'bold',
  },

  sidebarCloseButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.2)',
    borderRadius: 15,
  },

  sidebarCloseButtonText: {
    color: '#f87171',
    fontSize: 18,
    fontWeight: 'bold',
  },

  sidebarContent: {
    flex: 1,
    padding: 16,
  },

  sidebarSection: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },

  sidebarSectionTitle: {
    color: '#d4af37',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  sidebarOption: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },

  sidebarOptionActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: '#d4af37',
  },

  sidebarOptionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },

  elementItem: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#d4af37',
  },

  elementItemLabel: {
    color: '#d4af37',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },

  elementItemControls: {
    gap: 4,
  },

  elementItemValue: {
    color: '#aaa',
    fontSize: 11,
  },

  sidebarActionButton: {
    padding: 12,
    backgroundColor: '#d4af37',
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },

  sidebarActionButtonSecondary: {
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
  },

  sidebarActionButtonText: {
    color: '#1a1a1a',
    fontSize: 13,
    fontWeight: 'bold',
  },

  sidebarInfoText: {
    color: '#888',
    fontSize: 11,
    lineHeight: 18,
  },

  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },

  verticalLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.5)',
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },

  horizontalLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.5)',
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },

  verticalLineThin: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },

  horizontalLineThin: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },

  centerDot: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#d4af37',
    marginLeft: -6,
    marginTop: -6,
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },

  quadrantLabel: {
    position: 'absolute',
    width: 30,
    height: 30,
    marginLeft: -15,
    marginTop: -15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },

  quadrantText: {
    color: '#d4af37',
    fontSize: 16,
    fontWeight: 'bold',
  },

  controlPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    zIndex: 100,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    width: '100%',
    maxWidth: 500,
    paddingHorizontal: 12,
    alignSelf: 'center',
  },
  controlBtn: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  controlBtnOutline: {
    backgroundColor: 'rgba(20, 20, 30, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  controlBtnPrimary: {
    backgroundColor: '#d4af37',
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  controlBtnText: {
    color: '#d4af37',
    fontWeight: 'bold',
  },
  controlBtnTextMain: {
    color: '#1A0D1A',
    fontWeight: '900',
  },
  mainControls: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 200,
    flexDirection: 'row',
    gap: 10,
  },

  editModeButton: {
    backgroundColor: '#d4af37',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },

  editModeButtonActive: {
    backgroundColor: '#4ade80',
  },

  editModeButtonText: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: 'bold',
  },

  sidebarToggleButton: {
    backgroundColor: '#666',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },

  sidebarToggleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  editInstructions: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.95)',
    padding: 12,
    borderRadius: 12,
    zIndex: 199,
  },

  editInstructionsText: {
    color: '#1a1a1a',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  battleContainer: {
    flex: 1,
    zIndex: 1,
  },

  draggableContainer: {
    position: 'relative',
  },

  transformHandlesContainer: {
    position: 'absolute',
    top: -30,
    left: -30,
    right: -30,
    bottom: -30,
  },

  resizeHandle: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 2,
    zIndex: 10,
  },

  resizeHandleInner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2196F3',
  },

  resizeHandle_topleft: { top: 0, left: 0 },
  resizeHandle_topright: { top: 0, right: 0 },
  resizeHandle_bottomleft: { bottom: 50, left: 0 },
  resizeHandle_bottomright: { bottom: 50, right: 0 },
  resizeHandle_top: { top: 0, left: '50%', marginLeft: -6 },
  resizeHandle_bottom: { bottom: 50, left: '50%', marginLeft: -6 },
  resizeHandle_left: { top: '50%', left: 0, marginTop: -6 },
  resizeHandle_right: { top: '50%', right: 0, marginTop: -6 },

  centerDotHandle: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 16,
    height: 16,
    marginLeft: -8,
    marginTop: -8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  centerDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
    borderWidth: 2,
    borderColor: '#fff',
  },

  fixedScaleControls: {
    position: 'absolute',
    bottom: -60,
    left: '50%',
    transform: [{ translateX: -85 }],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 33, 33, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 10,
    borderWidth: 2,
    borderColor: '#2196F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
  },

  scaleControlButton: {
    backgroundColor: '#2196F3',
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },

  scaleControlButtonDisabled: {
    backgroundColor: '#555',
    opacity: 0.5,
    shadowOpacity: 0,
  },

  scaleControlButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
  },

  scaleControlDisplay: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },

  scaleControlText: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  editElement: {
    alignItems: 'center',
  },

  elementLabel: {
    color: '#d4af37',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },

  vsEditText: {
    color: '#e94560',
    fontSize: 24,
    fontWeight: 'bold',
    padding: 12,
  },

  scoreEditText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    padding: 8,
  },

  roundEditText: {
    color: '#d4af37',
    fontSize: 15,
    fontWeight: 'bold',
    padding: 8,
  },

  abilitiesEditBox: {
    gap: 6,
    minHeight: 300,
  },

  abilityEditItem: {
    backgroundColor: '#d4af37',
    padding: 10,
    borderRadius: 12,
    minWidth: 120,
  },

  abilityEditText: {
    color: '#1a1a1a',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  resultEditText: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 12,
  },


  absolutePositionFixed: {
    position: 'absolute',
    alignItems: 'center',
  },

  playerLabel: {
    fontSize: 14,
    color: '#d4af37',
    marginBottom: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  elementEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  damageContainer: {
    alignItems: 'center',
    marginTop: 12,
  },

  damageText: {
    fontSize: 14,
    color: '#e94560',
    fontWeight: 'bold',
  },

  advantageText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },

  vsText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e94560',
  },

  scoreBoard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  score: {
    fontSize: 32,
    fontWeight: 'bold',
  },

  scoreSeparator: {
    fontSize: 28,
    color: '#a0a0a0',
  },

  roundText: {
    fontSize: 18,
    color: '#d4af37',
    fontWeight: 'bold',
  },

  abilitiesSidebar: {
    gap: 12,
    padding: 8,
  },

  abilitiesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d4af37',
    textAlign: 'center',
    marginBottom: 8,
  },

  abilityButtonVertical: {
    backgroundColor: '#d4af37',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    minHeight: 60,
    justifyContent: 'center',
    minWidth: 120,
  },

  abilityButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.5,
  },

  abilityButtonTextVertical: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },

  resultContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#d4af37',
  },

  resultText: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  bottomControlsFixed: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 100,
  },

  historyButton: {
    backgroundColor: '#666',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },

  historyButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },

  nextButtonLarge: {
    backgroundColor: '#d4af37',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },

  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    fontSize: 18,
    color: '#a0a0a0',
  },

  historyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },

  historyModalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    borderTopWidth: 2,
    borderTopColor: '#d4af37',
  },

  historyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },

  historyModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d4af37',
  },

  historyModalCloseButton: {
    fontSize: 24,
    color: '#a0a0a0',
  },

  historyScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  historyRoundItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#d4af37',
  },

  historyRoundNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d4af37',
    marginBottom: 8,
  },

  historyCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  historyCardSection: {
    flex: 1,
    alignItems: 'center',
  },

  historyCardLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    marginBottom: 4,
  },

  historyCardName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#eee',
    marginBottom: 4,
  },

  historyCardStats: {
    fontSize: 11,
    color: '#888',
  },

  historyVS: {
    marginHorizontal: 8,
  },

  historyVSText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d4af37',
  },

  historyWinner: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  predictionSummary: {
    fontSize: 12,
    color: '#fbbf24',
    textAlign: 'center',
    marginBottom: 4,
  },

  // ── HORIZONTAL S23 ULTRA PERFECT FIT ──────────────────────
  battleRoot: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  topHud: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(20, 10, 15, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,175,55,0.3)',
    zIndex: 10,
  },
  hudPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  hudBot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    flex: 1,
  },
  hudInfo: {
    justifyContent: 'center',
    gap: 2,
  },
  hudCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.5,
  },
  hudScoreText: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
  },
  arenaContainer: {
    flex: 1, // Let it fill remaining space
    flexDirection: 'row',
    justifyContent: 'flex-start', // Shift up instead of center vertically
    alignItems: 'flex-start',
    marginTop: 20, // Push slightly down from the top header
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 0, // Tighten the space below the cards
    gap: 12,
  },
  playerSideHorizontal: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'rgba(10, 20, 10, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.25)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  enemySideHorizontal: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'rgba(20, 10, 10, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.25)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  centerVSGlow: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    gap: 8,
    zIndex: 20,
  },
  vsBadgeHorizontal: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.8)',
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  vsBadgeTextHorizontal: {
    fontSize: 10,
  },
  vsBadgeVSHorizontal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#d4af37',
    marginTop: -2,
  },

  prevGridVertical: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    width: '100%',
  },
  prevCardSlotHorizontal: {
    width: 44,
    height: 58,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(15,15,20,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  prevGridEmptyHorizontal: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentCardAreaHorizontal: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  effectsBox: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  abilitiesAreaHorizontal: {
    width: '100%',
    position: 'absolute',
    bottom: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
    zIndex: 10,
  },
  bottomActionBar: {
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(20, 10, 15, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,175,55,0.3)',
    zIndex: 10,
  },
  actionIconButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actionIconText: {
    color: '#e8e8e8',
    fontSize: 14,
    fontWeight: '600',
  },
  mainActionButtonHorizontal: {
    flex: 1,
    marginHorizontal: 16,
    maxWidth: 240,
    backgroundColor: '#d4af37',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  mainActionButtonTextHorizontal: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '800',
  },

  // ── Zone Layout ──────────────────────────────────────────────────────────────
  normalPlayContainer: {
    flex: 1,
    flexDirection: 'column',
    // bottomControls is now a flex child; no paddingBottom needed
  },

  enemyZone: {
    flex: 0.42,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  playerZone: {
    flex: 0.36,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  vsSeparator: {
    flex: 0.10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },

  vsGlowRing: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(180,0,0,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255,60,60,0.45)',
    shadowColor: '#ff2222',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 10,
  },

  combatantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
    gap: 8,
    marginBottom: 4,
  },

  combatantInfo: {
    flex: 1,
    gap: 4,
  },

  combatantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  combatantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e0c8a0',
    letterSpacing: 0.5,
    flexWrap: 'wrap',
  },

  turnDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },

  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2a1a2a',
    borderWidth: 1.5,
    borderColor: '#d4af37',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarEmoji: {
    fontSize: 22,
    lineHeight: 22,
  },

  roundBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderWidth: 1,
    borderColor: '#d4af37',
  },

  roundBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#d4af37',
    textAlign: 'center',
  },

  roundBadgeSub: {
    fontSize: 10,
    fontWeight: '400',
    color: '#a0845c',
  },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },

  scoreNum: {
    fontSize: 22,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  scoreDash: {
    fontSize: 18,
    color: '#666',
    fontWeight: '300',
  },

  botCardContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },

  playerCardContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },

  abilitiesRow: {
    maxHeight: 44,
    width: '100%',
    marginTop: 6,
  },

  abilitiesRowContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },

  abilityChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(50,20,60,0.90)',
    borderWidth: 1,
    borderColor: '#7c3aed',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },

  abilityChipUsed: {
    backgroundColor: 'rgba(40,40,40,0.70)',
    borderColor: '#444',
    shadowOpacity: 0,
  },

  abilityChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e2d9f3',
    letterSpacing: 0.3,
  },

  // bottomControls replaces old absolute controlBar
  bottomControls: {
    flex: 0.06,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
    backgroundColor: 'rgba(8,4,12,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,175,55,0.30)',
  },



  hudSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  hudSideInfo: {
    flex: 1,
    gap: 3,
  },



  scoreRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  predictionSummaryHud: {
    fontSize: 9,
    color: '#fbbf24',
    textAlign: 'center',
    maxWidth: 90,
  },

  prevSlotWin: {
    borderColor: 'rgba(74, 222, 128, 0.6)',
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
  },
  prevSlotLoss: {
    borderColor: 'rgba(248, 113, 113, 0.6)',
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
  },
  prevSlotDraw: {
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  prevCardEmoji: {
    fontSize: 16,
  },
  prevCardName: {
    fontSize: 8,
    color: '#fff',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: 'bold',
  },
  prevGridEmptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontStyle: 'italic',
  },
  abilitiesBoxEmpty: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  prevCardSlotBot: {
  },
  botResultValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff4444',
  },
  bottomHintText: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
  },
  previewBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  previewBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // ── AAA BOTTOM HUD STYLES ─────────────────────────────────
  floatingActionLeft: {
    position: 'absolute',
    left: 20,
    zIndex: 100,
  },
  floatingActionRight: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
  },
  abilitiesContainer: {
    maxHeight: 50,
    marginBottom: 10,
    width: '100%',
    justifyContent: 'center',
    zIndex: 110,
  },
  abilityPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 30, 40, 0.95)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    borderWidth: 1,
  },
  abilityPillActive: {
    borderColor: 'rgba(124, 58, 237, 0.8)', // subtle purple border
  },
  abilityPillUsed: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.6,
  },
  abilityPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  bottomHudActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    width: '100%',
  },
  hudSideLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  logButtonHUD: {
    backgroundColor: 'rgba(15, 15, 20, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logButtonTextHUD: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },

  abilitiesModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  abilitiesModalContent: {
    width: '92%',
    maxWidth: 800,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.8)',
    overflow: 'hidden',
    padding: 16,
    paddingBottom: 12,
  },
  abilitiesModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  abilitiesModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  abilitiesModalCloseWrap: {
    padding: 4,
  },
  abilitiesModalCloseButton: {
    color: '#94a3b8',
    fontSize: 20,
    fontWeight: 'bold',
  },
  abilitiesModalScroll: {
    flexShrink: 1,
  },
  abilityModalItem: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  abilityModalItemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  abilityModalItemUsed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.6,
  },
  abilityModalItemTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#e0f2fe',
    marginBottom: 4,
  },
  abilityModalItemDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
  unifiedButton: {
    width: 150,
    height: 45,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1.5,
  },
  unifiedButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  unifiedButtonConfirm: {
    borderColor: '#4ade80',
    shadowColor: '#4ade80',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 4,
  },
  unifiedButtonAbilities: {
    borderColor: '#a855f7',
    shadowColor: '#a855f7',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 4,
  },
  unifiedButtonWait: {
    borderColor: '#3b82f6',
    shadowColor: '#60a5fa',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
  },
  unifiedButtonDisabled: {
    borderColor: '#475569',
    backgroundColor: 'rgba(71, 85, 105, 0.4)',
  },
  hudSideRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  primaryCombatButton: {
    width: '100%',
    height: 55,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryCombatButtonAttack: {
    backgroundColor: '#dc2626',
    shadowColor: '#ef4444',
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  primaryCombatButtonWait: {
    backgroundColor: '#2563eb',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  primaryCombatButtonDisabled: {
    backgroundColor: '#334155',
  },
  primaryCombatButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  botStatusPillHUD: {
    backgroundColor: 'rgba(15, 15, 20, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botStatusTextHUD: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  matchHistoryOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchHistoryContent: {
    backgroundColor: '#1a1a24',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  matchHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a35',
    paddingBottom: 10,
  },
  matchHistoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  matchHistoryCloseBtn: {
    fontSize: 22,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  matchHistoryScroll: {
    flexShrink: 1,
  },
  matchHistoryEmpty: {
    color: '#a0a0a0',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  matchHistoryRowVisual: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  matchHistoryCardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 80,
    height: 110,
  },
  historyCrown: {
    position: 'absolute',
    top: -20,
    alignSelf: 'center',
    fontSize: 24,
    zIndex: 10,
  },
  matchHistoryRoundCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchHistoryRoundText: {
    fontSize: 14,
    color: '#d4af37',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  matchHistoryVSCenter: {
    fontSize: 18,
    color: '#e94560',
  },
});

