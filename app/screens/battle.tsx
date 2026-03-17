/**
 * BattleScreen — Professional Arena
 *
 * Layout (landscape-only):
 *   [PLAYER SIDE] | [CENTER COMMAND] | [BOT SIDE]
 *
 * Changes:
 *  - Fixed all merge conflicts
 *  - Added ActiveEffectsBar (buffs/nerfs visible under HUD)
 *  - Added choice modals for: Propaganda, AddElement, SwapClass, Dilemma
 *  - Effect chips now show descriptive Arabic labels (e.g. هجوم -2, جميع المحاربين +2)
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, TouchableOpacity, StyleSheet, Platform,
  Modal, ScrollView, PanResponder, Animated as RNAnimated,
  useWindowDimensions, Alert,
} from 'react-native';
import { ThemedText as Text } from '@/components/ui/ThemedText';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withSpring, withSequence,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/screen-container';
import { LuxuryCharacterCardAnimated } from '@/components/game/luxury-character-card-animated';
import { StatusBar } from 'expo-status-bar';
import { ElementEffect } from '@/components/game/element-effect';
import { LuxuryBackground } from '@/components/game/luxury-background';
import { DamageNumber, DamageNumberVariant } from '@/components/game/damage-number';
import { BattleResultOverlay } from '@/components/game/BattleResultOverlay';
import { RotateHintScreen } from '@/components/game/RotateHintScreen';
import { useLandscapeLayout, LAYOUT_PADDING, CARD_WIDTH_FACTOR } from '@/utils/layout';
import { useGame } from '@/lib/game/game-context';
import { ELEMENT_EMOJI, ElementAdvantage, Element, CardClass } from '@/lib/game/types';
import { getAbilityNameAr, getAbilityDescription } from '@/lib/game/ability-names';
import { AbilityCard } from '@/components/game/ability-card';
import PredictionModal from '@/app/components/modals/PredictionModal';
import PopularityModal from '@/app/components/modals/PopularityModal';
import {
  buildPredictionSummary, getRemainingRounds,
  getUpcomingPredictionRounds, isPredictionComplete,
} from '@/lib/game/ui-helpers';
import { COLOR, SPACE, RADIUS, FONT, GLASS_PANEL, SHADOW } from '@/components/ui/design-tokens';

type BattlePhase = 'selection' | 'action' | 'combat' | 'result' | 'waiting';

// ─── Helpers ───────────────────────────────────────────────────────────────
const advantageColor = (a: ElementAdvantage) =>
  a === 'strong' ? '#4ade80' : a === 'weak' ? '#f87171' : '#a0a0a0';
const advantageLabel = (a: ElementAdvantage) =>
  a === 'strong' ? '⬆️ قوي' : a === 'weak' ? '⬇️ ضعيف' : '';

const ALL_ELEMENTS: Element[] = ['fire', 'ice', 'water', 'earth', 'lightning', 'wind'];
const ELEMENT_LABELS: Record<Element, string> = {
  fire: '🔥 نار', ice: '❄️ جليد', water: '💧 ماء',
  earth: '🌍 أرض', lightning: '⚡ برق', wind: '💨 ريح',
};
const ALL_CLASSES: CardClass[] = ['warrior', 'knight', 'mage', 'archer', 'berserker', 'paladin'];
const CLASS_LABELS: Record<CardClass, string> = {
  warrior: '⚔️ محارب', knight: '🛡️ فارس', mage: '🔮 ساحر',
  archer: '🏹 رامي', berserker: '🗡️ بيرسركر', paladin: '💪 بالادين',
};
const CLASS_LABELS_SHORT: Record<string, string> = {
  warrior: 'المحاربين', knight: 'الفرسان', mage: 'السحرة',
  archer: 'الرماة', berserker: 'البيرسركر', paladin: 'البالادين',
};
const STAT_LABELS: Record<string, string> = {
  attack: 'هجوم', defense: 'دفاع', all: 'الكل', hp: 'صحة',
};

// ─── Effect label builder ───────────────────────────────────────────────────
function getEffectLabel(effect: any): string {
  const d = effect.data as any;

  switch (effect.kind) {
    case 'statModifier': {
      const stat = STAT_LABELS[d?.stat] ?? d?.stat ?? '؟';
      const amount = d?.amount ?? 0;
      const sign = amount >= 0 ? '+' : '';
      const onlyClass: string | undefined = d?.onlyClass;
      const multiplier: boolean = !!d?.multiplier;

      if (multiplier) return `${stat} ×${amount > 0 ? amount : '½'}`;
      if (onlyClass) return `جميع ${CLASS_LABELS_SHORT[onlyClass] ?? onlyClass} ${sign}${amount}`;
      return `${stat} ${sign}${amount}`;
    }
    case 'protection': return '🛡 حماية';
    case 'fortify': return '🔩 تحصين';
    case 'halvePoints': return '½ تنصيف';
    case 'silenceAbilities': return '🔇 ختم قدرات';
    case 'doubleOrNothing': return '🎲 مضاعفة أو صفر';
    case 'forcedOutcome': return '🎯 نتيجة مضمونة';
    case 'starAdvantage': return '⭐ أفضلية نجوم';
    case 'sacrifice': return '🩸 تضحية';
    case 'greedBuff': return '💰 جشع';
    case 'lifesteal': return '🩸 سرقة صحة';
    case 'revengeBuff': return '😤 انتقام';
    case 'suicidePact': return '💀 اتفاقية انتحار';
    case 'compensationBuff': return '🎁 تعويض';
    case 'weakeningDebuff': return '📉 إضعاف';
    case 'explosionDebuff': return '💥 انفجار';
    case 'consecutiveLoss': return '🔄 خسائر متتالية';
    case 'shieldGuard': return '🛡 درع';
    case 'trap': return '🪤 فخ';
    case 'convertDebuffs': return '🔃 تحويل نيرف→بف';
    case 'doubleBuffs': return '✨ مضاعفة البفات';
    case 'conversion': return '🔄 تحويل بفات الخصم';
    case 'takeIt': return '↩️ إعادة النيرف';
    case 'deprivation': return '🚫 سلب بف';
    case 'pool': return '🌊 تصفير الجولة';
    case 'prediction': return '🔮 توقع';
    default: return effect.kind ?? '؟';
  }
}

// ─── Round progress bar ──────────────────────────────────────────────────
function RoundBar({ current, total }: { current: number; total: number }) {
  const filled = useSharedValue(0);
  useEffect(() => {
    filled.value = withTiming((current / total) * 100, { duration: 400 });
  }, [current]);
  const barStyle = useAnimatedStyle(() => ({ width: `${filled.value}%` as any }));
  return (
    <View style={rb.track}>
      <Animated.View style={[rb.fill, barStyle]} />
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            rb.tick,
            { left: `${((i + 1) / total) * 100}%` as any },
            i < current && rb.tickDone,
          ]}
        />
      ))}
    </View>
  );
}
const rb = StyleSheet.create({
  track: {
    height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'visible', position: 'relative',
  },
  fill: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    backgroundColor: COLOR.gold, borderRadius: 3,
  },
  tick: {
    position: 'absolute', top: -2, width: 2, height: 10,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 1,
    marginLeft: -1,
  },
  tickDone: { backgroundColor: 'rgba(228,165,42,0.6)' },
});

// ─── Score bar ─────────────────────────────────────────────────────────────
function ScoreBar({ score, maxScore, color, reverse = false }: { score: number; maxScore: number; color: string; reverse?: boolean }) {
  const filled = useSharedValue(0);
  useEffect(() => {
    filled.value = withSpring(maxScore > 0 ? (score / maxScore) * 100 : 0, { damping: 14 });
  }, [score]);
  const barStyle = useAnimatedStyle(() => ({ width: `${filled.value}%` as any }));
  return (
    <View style={[sb.track, reverse && { flexDirection: 'row-reverse' }]}>
      <Animated.View style={[sb.fill, { backgroundColor: color }, reverse && sb.fillRight, barStyle]} />
    </View>
  );
}
const sb = StyleSheet.create({
  track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, position: 'absolute', left: 0 },
  fillRight: { left: undefined, right: 0 },
});

// ─── Advantage chip ─────────────────────────────────────────────────────────
function AdvantageChip({ advantage, element }: { advantage: ElementAdvantage; element: string }) {
  if (advantage === 'neutral') return null;
  const c = advantageColor(advantage);
  return (
    <View style={[ac.chip, { borderColor: c + '55', backgroundColor: c + '14' }]}>
      <Text style={[ac.text, { color: c }]}>
        {ELEMENT_EMOJI[element as keyof typeof ELEMENT_EMOJI]} {advantageLabel(advantage)}
      </Text>
    </View>
  );
}
const ac = StyleSheet.create({
  chip: { paddingHorizontal: SPACE.md, paddingVertical: 3, borderRadius: RADIUS.full, borderWidth: 1, alignSelf: 'center', marginTop: SPACE.sm },
  text: { fontSize: FONT.xs - 2, letterSpacing: 0.4 },
});

// ─── Active Effects Bar ─────────────────────────────────────────────────────
function ActiveEffectsBar({ effects, side }: { effects: any[]; side: 'player' | 'bot' }) {
  const mine = effects.filter(e => e.targetSide === side || e.targetSide === 'all');
  if (!mine.length) return null;

  const BUFF_KINDS = new Set([
    'greedBuff', 'lifesteal', 'revengeBuff', 'compensationBuff',
    'consecutiveLoss', 'shieldGuard', 'doubleBuffs', 'protection',
    'fortify', 'starAdvantage',
  ]);

  return (
    <View style={eff.row}>
      {mine.map((e, i) => {
        // تحديد لون: بف = أخضر، نيرف = أحمر، محايد = ذهبي
        let isBuff = BUFF_KINDS.has(e.kind);
        let isDebuff = false;
        if (e.kind === 'statModifier') {
          const amount = (e.data as any)?.amount ?? 0;
          if (amount > 0) isBuff = true;
          else if (amount < 0) isDebuff = true;
        } else if (
          e.kind === 'weakeningDebuff' || e.kind === 'explosionDebuff' ||
          e.kind === 'silenceAbilities' || e.kind === 'suicidePact' ||
          e.kind === 'halvePoints'
        ) {
          isDebuff = true;
        }
        const color = isBuff ? '#4ade80' : isDebuff ? '#f87171' : '#fbbf24';

        // عدد الجولات المتبقية
        const roundsLeft = e.expiresAtRound !== undefined
          ? Math.max(0, e.expiresAtRound - (e.createdAtRound ?? 0))
          : null;

        const label = getEffectLabel(e);

        return (
          <View key={i} style={[eff.chip, { borderColor: color + '66', backgroundColor: color + '18' }]}>
            <Text style={[eff.label, { color }]}>{label}</Text>
            {roundsLeft !== null && roundsLeft > 0 && (
              <View style={[eff.badge, { backgroundColor: color + '33' }]}>
                <Text style={[eff.badgeText, { color }]}>{roundsLeft}ج</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
const eff = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 3 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1,
  },
  label: { fontSize: 9.5, letterSpacing: 0.2 },
  badge: {
    paddingHorizontal: 4, paddingVertical: 1,
    borderRadius: 5, minWidth: 16, alignItems: 'center',
  },
  badgeText: { fontSize: 8, fontVariant: ['tabular-nums'] } as any,
});

// ─── Choice Modal (generic list picker) ───────────────────────────────────
function ChoiceModal({
  visible, title, options, onSelect, onCancel,
}: {
  visible: boolean;
  title: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity style={cm.overlay} activeOpacity={1} onPress={onCancel}>
        <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()} style={cm.box}>
          <Text style={cm.title}>{title}</Text>
          <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ gap: 8, padding: 4 }}>
            {options.map(opt => (
              <TouchableOpacity key={opt.value} style={cm.option} onPress={() => onSelect(opt.value)} activeOpacity={0.8}>
                <Text style={cm.optionText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={cm.cancel} onPress={onCancel}>
            <Text style={cm.cancelText}>إلغاء</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
const cm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  box: { width: 300, backgroundColor: 'rgba(12,18,36,0.98)', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(228,165,42,0.3)', padding: SPACE.xl },
  title: { color: COLOR.gold, fontSize: FONT.base, textAlign: 'center', marginBottom: SPACE.lg },
  option: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.md, padding: SPACE.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  optionText: { color: '#f1f5f9', fontSize: FONT.sm, textAlign: 'center' },
  cancel: { marginTop: SPACE.lg, alignItems: 'center', padding: SPACE.sm },
  cancelText: { color: '#f87171', fontSize: FONT.sm },
});

// ─── Grid overlay ──────────────────────────────────────────────────────────
const GridOverlay = () => (
  <View style={S.gridContainer} pointerEvents="none">
    <View style={S.vLine} />
    <View style={S.hLine} />
    <View style={[S.vLineThin, { left: '25%' }]} />
    <View style={[S.vLineThin, { left: '75%' }]} />
    <View style={[S.hLineThin, { top: '25%' }]} />
    <View style={[S.hLineThin, { top: '75%' }]} />
    <View style={S.gridCenter} />
  </View>
);

// ─── Edit sidebar ──────────────────────────────────────────────────────────
const EditSidebar = ({ visible, onClose, showGrid, onToggleGrid, snapToGrid, onToggleSnap, onResetLayout }: any) => {
  const slide = useRef(new RNAnimated.Value(-300)).current;
  useEffect(() => {
    RNAnimated.timing(slide, { toValue: visible ? 0 : -300, duration: 260, useNativeDriver: true }).start();
  }, [visible]);
  return (
    <RNAnimated.View style={[S.sidebar, { transform: [{ translateX: slide }] }]}>
      <View style={S.sidebarHead}>
        <Text style={S.sidebarTitle}>🎨 أدوات التحرير</Text>
        <TouchableOpacity onPress={onClose} style={S.sidebarClose}>
          <Text style={{ color: '#f87171', fontSize: 18 }}>✕</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1, padding: SPACE.lg }}>
        <View style={S.sidebarSection}>
          <Text style={S.sidebarSectionTitle}>⚙️ إعدادات الشبكة</Text>
          <TouchableOpacity style={[S.sidebarOpt, showGrid && S.sidebarOptActive]} onPress={onToggleGrid}>
            <Text style={S.sidebarOptText}>{showGrid ? '✓' : '◦'} إظهار الشبكة</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[S.sidebarOpt, snapToGrid && S.sidebarOptActive]} onPress={onToggleSnap}>
            <Text style={S.sidebarOptText}>{snapToGrid ? '✓' : '◦'} التقاط تلقائي</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={S.sidebarAction} onPress={onResetLayout}>
          <Text style={S.sidebarActionText}>🔄 إعادة ضبط الكل</Text>
        </TouchableOpacity>
      </ScrollView>
    </RNAnimated.View>
  );
};

// ─── Resize handle ─────────────────────────────────────────────────────────
const ResizeHandle = ({ position, onResizeStart, onResizeMove, onResizeEnd }: any) => {
  const initScale = useRef(1);
  const pr = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => { e.stopPropagation(); initScale.current = onResizeStart(); },
      onPanResponderMove: (e, g) => {
        e.stopPropagation();
        let delta = 0;
        if (position.includes('corner')) {
          const dist = Math.sqrt(g.dx ** 2 + g.dy ** 2);
          delta = (dist * (g.dx + g.dy > 0 ? 1 : -1)) / 200;
        } else if (position === 'top' || position === 'bottom') {
          delta = g.dy / 200;
        } else {
          delta = g.dx / 200;
        }
        onResizeMove(position, initScale.current + delta);
      },
      onPanResponderRelease: () => onResizeEnd(),
    })
  ).current;
  const key = `rh_${position.replace('-', '')}`;
  return (
    <View {...pr.panHandlers} style={[S.resizeHandle, (S as any)[key]]}>
      <View style={S.resizeHandleInner} />
    </View>
  );
};

const TransformHandles = ({ onResizeStart, onResizeMove, onResizeEnd }: any) => {
  const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right'];
  return (
    <View style={S.transformHandles} pointerEvents="box-none">
      {positions.map((p) => <ResizeHandle key={p} position={p} onResizeStart={onResizeStart} onResizeMove={onResizeMove} onResizeEnd={onResizeEnd} />)}
    </View>
  );
};

const DraggableResizable = ({ children, id, initialX = 0, initialY = 0, initialScale = 1, onUpdate, minScale = 0.5, maxScale = 2.5, snapToGrid = false }: any) => {
  const { width: W, height: H } = useWindowDimensions();
  const [scale, setScale] = useState(initialScale);
  const [isResizing, setIsResizing] = useState(false);
  const position = useRef({ x: W / 2 + initialX, y: H / 2 + initialY });
  const pan = useRef(new RNAnimated.ValueXY(position.current)).current;

  useEffect(() => {
    const p = { x: W / 2 + initialX, y: H / 2 + initialY };
    position.current = p; pan.setValue(p); setScale(initialScale);
  }, [initialX, initialY, initialScale]);

  const onResizeStart = () => { setIsResizing(true); return scale; };
  const onResizeMove = (_: string, s: number) => setScale(Math.max(minScale, Math.min(maxScale, s)));
  const onResizeEnd = () => {
    setIsResizing(false);
    onUpdate?.(id, { x: position.current.x - W / 2, y: position.current.y - H / 2, scale });
  };
  const onScaleChange = (d: number) => {
    const ns = Math.max(minScale, Math.min(maxScale, scale + d));
    setScale(ns);
    onUpdate?.(id, { x: position.current.x - W / 2, y: position.current.y - H / 2, scale: ns });
  };

  const pr = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isResizing,
      onMoveShouldSetPanResponder: () => !isResizing,
      onPanResponderGrant: () => { pan.setOffset(position.current); pan.setValue({ x: 0, y: 0 }); },
      onPanResponderMove: RNAnimated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        pan.flattenOffset();
        const m = 100;
        let fx = Math.max(m, Math.min(W - m, position.current.x + g.dx));
        let fy = Math.max(m, Math.min(H - m, position.current.y + g.dy));
        if (snapToGrid) { const gr = 50; fx = Math.round(fx / gr) * gr; fy = Math.round(fy / gr) * gr; }
        position.current = { x: fx, y: fy };
        RNAnimated.spring(pan, { toValue: { x: fx, y: fy }, useNativeDriver: false, friction: 8, tension: 40 }).start();
        onUpdate?.(id, { x: fx - W / 2, y: fy - H / 2, scale });
      },
    })
  ).current;

  return (
    <RNAnimated.View style={{ position: 'absolute', left: 0, top: 0 }} {...pr.panHandlers}>
      <RNAnimated.View style={{ transform: [{ translateX: pan.x }, { translateY: pan.y }, { translateX: -50 }, { translateY: -50 }, { scale }] }}>
        <View style={{ position: 'relative' }}>
          {children}
          <TransformHandles onResizeStart={onResizeStart} onResizeMove={onResizeMove} onResizeEnd={onResizeEnd} />
        </View>
      </RNAnimated.View>
      <RNAnimated.View style={{ position: 'absolute', left: 0, top: 0, transform: [{ translateX: pan.x }, { translateY: pan.y }] }} pointerEvents="box-none">
        <View style={S.scaleControls} pointerEvents="auto">
          <TouchableOpacity style={[S.scaleBtn, scale <= minScale && S.scaleBtnDisabled]} onPress={(e) => { e.stopPropagation(); onScaleChange(-0.1); }} disabled={scale <= minScale}>
            <Text style={S.scaleBtnText}>−</Text>
          </TouchableOpacity>
          <View style={S.scaleDisplay}><Text style={S.scaleDisplayText}>{Math.round(scale * 100)}%</Text></View>
          <TouchableOpacity style={[S.scaleBtn, scale >= maxScale && S.scaleBtnDisabled]} onPress={(e) => { e.stopPropagation(); onScaleChange(0.1); }} disabled={scale >= maxScale}>
            <Text style={S.scaleBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </RNAnimated.View>
    </RNAnimated.View>
  );
};

// ────────────────────────── MAIN SCREEN ──────────────────────────
export default function BattleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height, isLandscape, size } = useLandscapeLayout();

  const maxH = height * 0.54;
  const cardWidth = Math.min(width * CARD_WIDTH_FACTOR[size] * 0.88, maxH / 1.5);
  const cardHeight = cardWidth * 1.5;

  const {
    state, playRound, isGameOver, currentPlayerCard, currentBotCard,
    lastRoundResult, expectedRoundResult, useAbility,
    resetGame, nextRound, startBattle,
  } = useGame();

  const [phase, setPhase] = useState<BattlePhase>('selection');
  const [showResult, setShowResult] = useState(false);
  const [showPlayerEffect, setShowPlayerEffect] = useState(false);
  const [showBotEffect, setShowBotEffect] = useState(false);
  const [roundHistory, setRoundHistory] = useState<any[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAbilitiesModalOpen, setIsAbilitiesModalOpen] = useState(false);
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [predictionSelections, setPredictionSelections] = useState<Record<number, 'win' | 'loss'>>({});
  const [predictionAbilityType, setPredictionAbilityType] = useState<'LogicalEncounter' | 'Eclipse' | 'Trap' | 'Pool'>('LogicalEncounter');
  const [popularityAbilityType, setPopularityAbilityType] = useState<'Popularity' | 'Rescue' | 'Penetration'>('Popularity');
  const [showPopularityModal, setShowPopularityModal] = useState(false);
  const [selectedPopularityRound, setSelectedPopularityRound] = useState<number | null>(null);
  const [activeDamageNumbers, setActiveDamageNumbers] = useState<{ id: string; side: 'player' | 'bot'; value: number; variant: DamageNumberVariant }[]>([]);

  // ── Choice modal state (Propaganda / AddElement / SwapClass / Dilemma) ──
  const [choiceModal, setChoiceModal] = useState<{
    visible: boolean;
    title: string;
    options: { value: string; label: string }[];
    abilityType: string;
    extraData?: any;
  }>({ visible: false, title: '', options: [], abilityType: '' });

  // edit mode
  const [editMode, setEditMode] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const { width: SW, height: SH } = useWindowDimensions();
  const baseCardScale = Math.min(1, (SW * 0.35) / 200);
  const uiScale = Math.min(1, SW / 400);

  const DEFAULT_LAYOUT = {
    playerCard: { x: -SW * 0.25, y: 0, scale: baseCardScale, minScale: 0.3, maxScale: 1.5 },
    botCard: { x: SW * 0.25, y: 0, scale: baseCardScale, minScale: 0.3, maxScale: 1.5 },
    vs: { x: 0, y: 0, scale: uiScale, minScale: 0.3, maxScale: 2.0 },
    score: { x: 0, y: -SH * 0.35, scale: uiScale * 0.9, minScale: 0.4, maxScale: 1.5 },
    round: { x: 0, y: -SH * 0.42, scale: uiScale * 0.9, minScale: 0.4, maxScale: 1.5 },
    result: { x: 0, y: SH * 0.35, scale: uiScale, minScale: 0.5, maxScale: 2.0 },
    abilities: { x: 0, y: SH * 0.25, scale: uiScale * 0.8, minScale: 0.4, maxScale: 1.5 },
  };
  const [elements, setElements] = useState(DEFAULT_LAYOUT);

  // animations
  const playerAnim = useSharedValue(0);
  const botAnim = useSharedValue(0);
  const vsOpacity = useSharedValue(0);
  const resultOp = useSharedValue(0);
  const flashAnim = useSharedValue(0);

  const playerStyle = useAnimatedStyle(() => ({ transform: [{ scale: playerAnim.value }] }));
  const botStyle = useAnimatedStyle(() => ({ transform: [{ scale: botAnim.value }] }));
  const vsStyle = useAnimatedStyle(() => ({ opacity: vsOpacity.value }));
  const resultStyle = useAnimatedStyle(() => ({ opacity: resultOp.value }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flashAnim.value }));

  // layout persistence
  useEffect(() => { loadLayout(); }, []);
  useEffect(() => { if (editMode) saveLayout(); }, [elements, editMode]);
  const loadLayout = async () => {
    try { const s = await AsyncStorage.getItem('battleLayout'); if (s) setElements(JSON.parse(s)); } catch { }
  };
  const saveLayout = async () => {
    try { await AsyncStorage.setItem('battleLayout', JSON.stringify(elements)); } catch { }
  };
  const updateElement = (id: string, d: any) => setElements(p => ({ ...p, [id]: { ...p[id as keyof typeof p], ...d } }));
  const resetLayout = async () => {
    setElements(DEFAULT_LAYOUT);
    try { await AsyncStorage.removeItem('battleLayout'); } catch { }
  };

  useEffect(() => {
    if (state.currentRound < state.totalRounds && !currentPlayerCard && !currentBotCard)
      startBattle(state.playerDeck);
  }, [state.currentRound, state.totalRounds, currentPlayerCard, currentBotCard]);

  useEffect(() => {
    if (currentPlayerCard && currentBotCard && phase === 'selection' && !editMode) {
      playerAnim.value = 0; botAnim.value = 0; vsOpacity.value = 0; resultOp.value = 0;
      setShowResult(false); setShowPlayerEffect(false); setShowBotEffect(false);
      playerAnim.value = withDelay(80, withTiming(1, { duration: 280 }));
      botAnim.value = withDelay(240, withTiming(1, { duration: 280 }));
      vsOpacity.value = withDelay(440, withTiming(1, { duration: 200 }));
      setTimeout(() => setPhase('action'), 720);
    }
  }, [currentPlayerCard, currentBotCard, phase, state.currentRound, editMode]);

  const handleExecuteAttack = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    flashAnim.value = withSequence(
      withTiming(0.35, { duration: 60 }),
      withTiming(0, { duration: 300 }),
    );
    setPhase('combat'); setShowPlayerEffect(true); setShowBotEffect(true);
    playRound();
    setPredictionSelections({}); setShowPredictionModal(false);
    setTimeout(() => { setShowPlayerEffect(false); setShowBotEffect(false); setPhase('result'); }, 1000);
  }, [playRound]);

  useEffect(() => { if (editMode) setShowSidebar(true); else setShowSidebar(false); }, [editMode]);

  const handleNextRound = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isGameOver) router.push('/screens/battle-results' as any);
    else { setPhase('selection'); nextRound(); }
  }, [isGameOver, router, nextRound]);

  const handleConfirmPrediction = useCallback(() => {
    useAbility(predictionAbilityType, { predictions: predictionSelections });
    setShowPredictionModal(false); setPredictionSelections({});
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [predictionAbilityType, predictionSelections, useAbility]);

  const handleConfirmPopularity = useCallback(() => {
    if (selectedPopularityRound === null) return;
    useAbility(popularityAbilityType, { round: selectedPopularityRound });
    setShowPopularityModal(false); setSelectedPopularityRound(null);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [popularityAbilityType, selectedPopularityRound, useAbility]);

  // ── Choice modal handlers ────────────────────────────────────────────────
  const openChoiceModal = useCallback((abilityType: string) => {
    if (abilityType === 'Propaganda') {
      setChoiceModal({
        visible: true,
        title: '🎙️ بروباغاندا — اختر فئة الخصم',
        options: ALL_CLASSES.map(c => ({ value: c, label: CLASS_LABELS[c] })),
        abilityType,
      });
    } else if (abilityType === 'AddElement') {
      setChoiceModal({
        visible: true,
        title: '🧪 إضافة عنصر — اختر العنصر',
        options: ALL_ELEMENTS.map(e => ({ value: e, label: ELEMENT_LABELS[e] })),
        abilityType,
      });
    } else if (abilityType === 'SwapClass') {
      setChoiceModal({
        visible: true,
        title: '🔀 تبديل الفئة — اختر فئتك',
        options: ALL_CLASSES.map(c => ({ value: c, label: CLASS_LABELS[c] })),
        abilityType,
      });
    } else if (abilityType === 'Dilemma') {
      const botPast = state.roundResults.map((r, i) => ({
        value: String(i),
        label: `جولة ${r.round}: ${r.botCard.nameAr ?? r.botCard.name}`,
      }));
      if (!botPast.length) { Alert.alert('لا يوجد كروت سابقة للخصم بعد'); return; }
      setChoiceModal({
        visible: true,
        title: '🌀 الوهقة — اختر كرت الخصم السابق',
        options: botPast,
        abilityType,
      });
    }
  }, [state.roundResults]);

  const handleChoiceSelect = useCallback((value: string) => {
    const { abilityType } = choiceModal;
    setChoiceModal(p => ({ ...p, visible: false }));
    useAbility(abilityType as any, { selection: value });
    setIsAbilitiesModalOpen(false);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [choiceModal, useAbility]);

  // Round result effect
  useEffect(() => {
    if (phase !== 'result' || !lastRoundResult || editMode) return;
    setRoundHistory(prev => {
      if (prev.some(h => h.round === lastRoundResult.round)) return prev;
      return [...prev, {
        round: lastRoundResult.round,
        playerCard: lastRoundResult.playerCard,
        botCard: lastRoundResult.botCard,
        winner: lastRoundResult.winner,
      }];
    });
    if (lastRoundResult.botDamage > 0) spawnDmg('bot', lastRoundResult.botDamage, lastRoundResult.playerElementAdvantage === 'strong' ? 'critical' : 'damage');
    if (lastRoundResult.playerDamage > 0) spawnDmg('player', lastRoundResult.playerDamage, lastRoundResult.botElementAdvantage === 'strong' ? 'critical' : 'damage');
    if (isGameOver) {
      setShowResult(true); resultOp.value = withTiming(1, { duration: 300 });
      if (Platform.OS !== 'web') {
        if (lastRoundResult.winner === 'player') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else if (lastRoundResult.winner === 'bot') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setPhase('waiting');
    } else {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => { setPhase('selection'); nextRound(); }, 1200);
    }
  }, [phase, lastRoundResult, editMode, isGameOver]);

  const spawnDmg = useCallback((side: 'player' | 'bot', value: number, variant: DamageNumberVariant) => {
    const id = `${Date.now()}-${Math.random()}`;
    setActiveDamageNumbers(p => [...p, { id, side, value, variant }]);
  }, []);
  const removeDmg = useCallback((id: string) => setActiveDamageNumbers(p => p.filter(n => n.id !== id)), []);

  const roundNumber = state.currentRound + 1;
  const upcomingRounds = useMemo(() => getUpcomingPredictionRounds(roundNumber, state.totalRounds), [roundNumber, state.totalRounds]);
  const remainingRounds = useMemo(() => getRemainingRounds(roundNumber, state.totalRounds), [roundNumber, state.totalRounds]);
  const predictionComplete = useMemo(() => isPredictionComplete(upcomingRounds, predictionSelections), [upcomingRounds, predictionSelections]);

  const displayPlayerCard = showResult && lastRoundResult ? lastRoundResult.playerCard : currentPlayerCard;
  const displayBotCard = showResult && lastRoundResult ? lastRoundResult.botCard : currentBotCard;

  const maxScore = state.totalRounds;

  // ── Abilities that need a choice modal ──────────────────────────────────
  const CHOICE_ABILITIES = ['Propaganda', 'AddElement', 'SwapClass', 'Dilemma'];

  if (!displayPlayerCard || !displayBotCard) {
    return (
      <View style={S.root}>
        <View style={S.loadWrap}>
          <Text style={S.loadText}>جاري تحميل الساحة...</Text>
        </View>
      </View>
    );
  }

  if (!isLandscape) return <RotateHintScreen />;

  // ─── RENDER ───
  return (
    <View style={S.root}>
      <StatusBar hidden />
      <View style={S.bgWrap}><LuxuryBackground /></View>

      <Animated.View style={[S.flashOverlay, flashStyle]} pointerEvents="none" />

      {editMode && showGrid && <GridOverlay />}
      <EditSidebar
        visible={showSidebar} onClose={() => setShowSidebar(false)}
        showGrid={showGrid} onToggleGrid={() => setShowGrid(!showGrid)}
        snapToGrid={snapToGrid} onToggleSnap={() => setSnapToGrid(!snapToGrid)}
        onResetLayout={resetLayout}
      />

      <View style={[S.battleWrap, { paddingLeft: insets.left, paddingRight: insets.right }]} pointerEvents={editMode ? 'auto' : 'box-none'}>
        {editMode ? (
          <>
            <DraggableResizable id="playerCard" initialX={elements.playerCard.x} initialY={elements.playerCard.y} initialScale={elements.playerCard.scale} minScale={elements.playerCard.minScale} maxScale={elements.playerCard.maxScale} snapToGrid={snapToGrid} onUpdate={updateElement}>
              <View style={S.editElem}><Text style={S.editLabel}>👤 بطاقة اللاعب</Text>
                <View style={{ transform: [{ scale: 0.8 }] }}><LuxuryCharacterCardAnimated card={displayPlayerCard} /></View>
              </View>
            </DraggableResizable>
            <DraggableResizable id="botCard" initialX={elements.botCard.x} initialY={elements.botCard.y} initialScale={elements.botCard.scale} minScale={elements.botCard.minScale} maxScale={elements.botCard.maxScale} snapToGrid={snapToGrid} onUpdate={updateElement}>
              <View style={S.editElem}><Text style={S.editLabel}>🤖 بطاقة البوت</Text>
                <View style={{ transform: [{ scale: 0.8 }] }}><LuxuryCharacterCardAnimated card={displayBotCard} /></View>
              </View>
            </DraggableResizable>
            <DraggableResizable id="vs" initialX={elements.vs.x} initialY={elements.vs.y} initialScale={elements.vs.scale} minScale={elements.vs.minScale} maxScale={elements.vs.maxScale} snapToGrid={snapToGrid} onUpdate={updateElement}>
              <View style={S.editElem}><Text style={S.editLabel}>⚔️ VS</Text><Text style={{ color: '#e94560', fontSize: 24, padding: 12 }}>⚔️ VS ⚔️</Text></View>
            </DraggableResizable>
            <DraggableResizable id="score" initialX={elements.score.x} initialY={elements.score.y} initialScale={elements.score.scale} minScale={elements.score.minScale} maxScale={elements.score.maxScale} snapToGrid={snapToGrid} onUpdate={updateElement}>
              <View style={S.editElem}><Text style={S.editLabel}>📊 النقاط</Text><Text style={{ color: '#fff', fontSize: 22, padding: 8 }}>{state.playerScore} - {state.botScore}</Text></View>
            </DraggableResizable>
            <DraggableResizable id="abilities" initialX={elements.abilities.x} initialY={elements.abilities.y} initialScale={elements.abilities.scale} minScale={elements.abilities.minScale} maxScale={elements.abilities.maxScale} snapToGrid={snapToGrid} onUpdate={updateElement}>
              <View style={S.editElem}><Text style={S.editLabel}>🎮 القدرات</Text></View>
            </DraggableResizable>
          </>
        ) : (
          <View style={S.normalRoot}>
            <BattleResultOverlay
              visible={showResult && phase === 'waiting'}
              winner={state.playerScore > state.botScore ? 'player' : state.botScore > state.playerScore ? 'bot' : 'draw'}
              playerScore={state.playerScore}
              botScore={state.botScore}
              onPlayAgain={() => { resetGame(); router.replace('/screens/rounds-config' as any); }}
              onHome={() => router.replace('/screens/splash' as any)}
            />

            <View style={[S.screen, { paddingLeft: Math.max(insets.left, 8), paddingRight: Math.max(insets.right, 8) }]}>

              {/* ══ TOP HUD ══ */}
              <View style={S.topHud}>
                <View style={S.hudSide}>
                  <View style={[S.avatar, { borderColor: '#4ade80' }]}><Text style={{ fontSize: 18 }}>👤</Text></View>
                  <View style={S.hudInfo}>
                    <Text style={[S.hudName, { color: '#4ade80' }]}>لاعب</Text>
                    <ScoreBar score={state.playerScore} maxScore={maxScore} color="#4ade80" />
                  </View>
                  <Text style={[S.hudScore, { color: '#4ade80' }]}>{state.playerScore}</Text>
                </View>

                <View style={S.hudCenter}>
                  <Text style={S.hudRound}>جولة {state.currentRound + 1} / {state.totalRounds}</Text>
                  <RoundBar current={state.currentRound} total={state.totalRounds} />
                  <TouchableOpacity style={S.historyBtn} onPress={() => setIsHistoryModalOpen(true)} activeOpacity={0.75}>
                    <Text style={S.historyBtnText}>سجل ↗️</Text>
                  </TouchableOpacity>
                </View>

                <View style={[S.hudSide, S.hudSideRight]}>
                  <Text style={[S.hudScore, { color: '#f87171' }]}>{state.botScore}</Text>
                  <View style={S.hudInfo}>
                    <Text style={[S.hudName, { color: '#f87171', textAlign: 'right' }]}>بوت</Text>
                    <ScoreBar score={state.botScore} maxScore={maxScore} color="#f87171" reverse />
                  </View>
                  <View style={[S.avatar, { borderColor: '#f87171' }]}><Text style={{ fontSize: 18 }}>🤖</Text></View>
                </View>
              </View>

              {/* ══ ACTIVE EFFECTS BAR ══ */}
              {state.activeEffects.length > 0 && (
                <View style={S.effectsBar}>
                  <View style={S.effectsBarSide}>
                    <Text style={S.effectsBarLabel}>تأثيراتك</Text>
                    <ActiveEffectsBar effects={state.activeEffects} side="player" />
                  </View>
                  <View style={S.effectsBarDivider} />
                  <View style={[S.effectsBarSide, { alignItems: 'flex-end' }]}>
                    <Text style={[S.effectsBarLabel, { textAlign: 'right' }]}>تأثيرات البوت</Text>
                    <ActiveEffectsBar effects={state.activeEffects} side="bot" />
                  </View>
                </View>
              )}

              {/* ══ ARENA ══ */}
              <View style={S.arena}>

                {/* PLAYER PANEL */}
                <View style={S.playerPanel}>
                  <Text style={S.panelLabel}>لاعب</Text>
                  <Animated.View style={playerStyle}>
                    <LuxuryCharacterCardAnimated card={displayPlayerCard} style={{ width: cardWidth, height: cardHeight }} />
                    {showPlayerEffect && <ElementEffect element={displayPlayerCard.element} isActive />}
                  </Animated.View>
                  {activeDamageNumbers.filter(n => n.side === 'player').map(n => (
                    <DamageNumber key={n.id} value={n.value} variant={n.variant} x={40} y={-20} onComplete={() => removeDmg(n.id)} />
                  ))}
                  {showResult && lastRoundResult && (
                    <AdvantageChip advantage={lastRoundResult.playerElementAdvantage} element={lastRoundResult.playerCard.element} />
                  )}
                </View>

                {/* CENTER COLUMN */}
                <View style={S.centerCol}>
                  <Animated.View style={[S.vsBadge, vsStyle]}>
                    <Text style={S.vsIcon}>⚔️</Text>
                    <Text style={S.vsText}>VS</Text>
                  </Animated.View>

                  {phase === 'action' && expectedRoundResult && (
                    <Animated.View style={[S.previewChip, vsStyle, {
                      borderColor: expectedRoundResult.winner === 'player' ? '#4ade8055' : expectedRoundResult.winner === 'bot' ? '#f8717155' : '#fbbf2455',
                      backgroundColor: expectedRoundResult.winner === 'player' ? 'rgba(74,222,128,0.08)' : expectedRoundResult.winner === 'bot' ? 'rgba(248,113,113,0.08)' : 'rgba(251,191,36,0.08)',
                    }]}>
                      <Text style={[S.previewChipText, {
                        color: expectedRoundResult.winner === 'player' ? '#4ade80' : expectedRoundResult.winner === 'bot' ? '#f87171' : '#fbbf24',
                      }]}>
                        {expectedRoundResult.winner === 'player' ? '👤 متوقع: فوزك' : expectedRoundResult.winner === 'bot' ? '💀 متوقع: خسارتك' : '🤝 متوقع: تعادل'}
                      </Text>
                    </Animated.View>
                  )}

                  {(phase === 'result' || phase === 'waiting') && lastRoundResult && (
                    <View style={[
                      S.resultBadge,
                      {
                        borderColor: lastRoundResult.winner === 'player' ? '#4ade80' : lastRoundResult.winner === 'bot' ? '#f87171' : '#fbbf24',
                        backgroundColor: lastRoundResult.winner === 'player' ? 'rgba(74,222,128,0.12)' : lastRoundResult.winner === 'bot' ? 'rgba(248,113,113,0.12)' : 'rgba(251,191,36,0.12)',
                      },
                    ]}>
                      <Text style={[S.resultBadgeText, {
                        color: lastRoundResult.winner === 'player' ? '#4ade80' : lastRoundResult.winner === 'bot' ? '#f87171' : '#fbbf24',
                      }]}>
                        {lastRoundResult.winner === 'player' ? '🏆 فزت!' : lastRoundResult.winner === 'bot' ? '💀 خسرت' : '🤝 تعادل'}
                      </Text>
                    </View>
                  )}

                  <View style={S.ctaStack}>
                    {phase === 'action' ? (
                      <TouchableOpacity style={[S.ctaBtn, S.ctaBtnAttack]} onPress={handleExecuteAttack} activeOpacity={0.85}>
                        <Text style={S.ctaBtnIcon}>⚔️</Text>
                        <Text style={S.ctaBtnText}>هجوم!</Text>
                      </TouchableOpacity>
                    ) : phase === 'waiting' ? (
                      <TouchableOpacity style={[S.ctaBtn, S.ctaBtnNext]} onPress={handleNextRound} activeOpacity={0.85}>
                        <Text style={S.ctaBtnIcon}>{isGameOver ? '🏁' : '▶️'}</Text>
                        <Text style={S.ctaBtnText}>{isGameOver ? 'إنهاء' : 'التالي'}</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[S.ctaBtn, S.ctaBtnDisabled]}>
                        <Text style={S.ctaBtnText}>{phase === 'combat' ? '⚔️ معركة...' : '⌛ جاري...'}</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[S.ctaBtn, S.ctaBtnAbilities, phase !== 'action' && S.ctaBtnDisabled]}
                      onPress={() => phase === 'action' && setIsAbilitiesModalOpen(true)}
                      activeOpacity={0.8}
                      disabled={phase !== 'action'}
                    >
                      <Text style={S.ctaBtnIcon}>⚡</Text>
                      <Text style={S.ctaBtnText}>قدرات</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* BOT PANEL */}
                <View style={S.botPanel}>
                  <Text style={S.panelLabel}>بوت</Text>
                  <Animated.View style={[botStyle, { transform: [{ scale: 0.95 }] }]}>
                    <LuxuryCharacterCardAnimated card={displayBotCard} style={{ width: cardWidth, height: cardHeight }} />
                    {showBotEffect && <ElementEffect element={displayBotCard.element} isActive />}
                  </Animated.View>
                  {activeDamageNumbers.filter(n => n.side === 'bot').map(n => (
                    <DamageNumber key={n.id} value={n.value} variant={n.variant} x={40} y={-20} onComplete={() => removeDmg(n.id)} />
                  ))}
                  {showResult && lastRoundResult && (
                    <AdvantageChip advantage={lastRoundResult.botElementAdvantage} element={lastRoundResult.botCard.element} />
                  )}
                  <View style={S.botStatus}>
                    <Text style={S.botStatusText}>
                      {phase === 'action' ? '🤖 ينتظر...' : phase === 'combat' ? '⚔️ يقاتل!' : '🤖 جاهز'}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[S.editFab, editMode && S.editFabActive]}
                onPress={() => setEditMode(!editMode)}
                activeOpacity={0.8}
              >
                <Text style={S.editFabText}>{editMode ? '✅ تم' : '✏️'}</Text>
              </TouchableOpacity>

            </View>
          </View>
        )}
      </View>

      {/* ── MODALS ── */}

      {/* Abilities modal */}
      <Modal visible={isAbilitiesModalOpen} transparent animationType="fade" onRequestClose={() => setIsAbilitiesModalOpen(false)}>
        <TouchableOpacity style={S.modalOverlay} activeOpacity={1} onPress={() => setIsAbilitiesModalOpen(false)}>
          <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()} style={S.abilitiesModal}>
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>⚡ القدرات المتاحة</Text>
              <TouchableOpacity onPress={() => setIsAbilitiesModalOpen(false)} style={S.modalClose}>
                <Text style={S.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            {state.playerAbilities.length === 0 ? (
              <Text style={S.emptyText}>لا توجد قدرات متاحة</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ flexDirection: 'row', gap: SPACE.md, paddingHorizontal: SPACE.sm, paddingVertical: SPACE.sm }}
              >
                {state.playerAbilities.map((ability, i) => {
                  const isSealed = state.activeEffects.some(ef =>
                    ef.kind === 'silenceAbilities' &&
                    (ef.targetSide === 'player' || ef.targetSide === 'all') &&
                    ef.createdAtRound <= roundNumber &&
                    (ef.expiresAtRound === undefined || roundNumber <= ef.expiresAtRound)
                  );
                  const canUse = !ability.used && phase === 'action' && !isSealed;
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => {
                        if (!canUse) { if (isSealed) Alert.alert('القدرات مختومة', 'لا يمكنك تفعيل القدرات خلال مدة الختم.'); return; }

                        // Prediction abilities
                        if (['LogicalEncounter', 'Eclipse', 'Trap', 'Pool'].includes(ability.type)) {
                          if (!upcomingRounds.length) return;
                          setPredictionSelections({}); setPredictionAbilityType(ability.type as any);
                          setIsAbilitiesModalOpen(false); setShowPredictionModal(true); return;
                        }
                        // Popularity abilities
                        if (['Popularity', 'Rescue', 'Penetration'].includes(ability.type)) {
                          if (!remainingRounds.length) return;
                          setSelectedPopularityRound(null); setPopularityAbilityType(ability.type as any);
                          setIsAbilitiesModalOpen(false); setShowPopularityModal(true); return;
                        }
                        // Choice abilities (Propaganda / AddElement / SwapClass / Dilemma)
                        if (CHOICE_ABILITIES.includes(ability.type)) {
                          setIsAbilitiesModalOpen(false);
                          openChoiceModal(ability.type);
                          return;
                        }
                        // Default
                        useAbility(ability.type); setIsAbilitiesModalOpen(false);
                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      disabled={!canUse}
                      activeOpacity={0.85}
                      style={{ opacity: canUse ? 1 : 0.4, transform: [{ scale: 0.85 }] }}
                    >
                      <AbilityCard
                        ability={{
                          id: i,
                          nameEn: ability.type,
                          nameAr: getAbilityNameAr(ability.type).split('(')[0].trim(),
                          description: getAbilityDescription(ability.type),
                          icon: null,
                          rarity: 'Rare',
                          isActive: canUse,
                        }}
                        showActionButtons={false}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Choice modal */}
      <ChoiceModal
        visible={choiceModal.visible}
        title={choiceModal.title}
        options={choiceModal.options}
        onSelect={handleChoiceSelect}
        onCancel={() => setChoiceModal(p => ({ ...p, visible: false }))}
      />

      <PredictionModal
        visible={showPredictionModal}
        upcomingRounds={upcomingRounds}
        selections={predictionSelections}
        onSelect={(r, o) => setPredictionSelections(p => ({ ...p, [r]: o }))}
        onCancel={() => { setShowPredictionModal(false); setPredictionSelections({}); }}
        onRequestClose={() => setShowPredictionModal(false)}
        onConfirm={handleConfirmPrediction}
        isConfirmDisabled={!predictionComplete}
      />
      <PopularityModal
        visible={showPopularityModal}
        remainingRounds={remainingRounds}
        selectedRound={selectedPopularityRound}
        onSelect={r => setSelectedPopularityRound(r)}
        onCancel={() => { setShowPopularityModal(false); setSelectedPopularityRound(null); }}
        onRequestClose={() => setShowPopularityModal(false)}
        onConfirm={handleConfirmPopularity}
        isConfirmDisabled={selectedPopularityRound === null}
      />

      {/* History modal */}
      <Modal visible={isHistoryModalOpen} transparent animationType="slide" onRequestClose={() => setIsHistoryModalOpen(false)}>
        <View style={S.modalOverlay}>
          <View style={S.historyModal}>
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>📜 سجل الجولات</Text>
              <TouchableOpacity onPress={() => setIsHistoryModalOpen(false)} style={S.modalClose}>
                <Text style={S.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flexShrink: 1 }}>
              {roundHistory.length === 0 ? (
                <Text style={S.emptyText}>لا يوجد سجل بعد</Text>
              ) : (
                roundHistory.map((item, idx) => {
                  const c = item.winner === 'player' ? '#4ade80' : item.winner === 'bot' ? '#f87171' : '#fbbf24';
                  const l = item.winner === 'player' ? '🏆 فاز اللاعب' : item.winner === 'bot' ? '🤖 فاز البوت' : '🤝 تعادل';
                  return (
                    <View key={idx} style={[S.historyRow, { borderLeftColor: c }]}>
                      <View style={S.historyCardWrap}>
                        {item.winner === 'player' && <Text style={S.crown}>👑</Text>}
                        <LuxuryCharacterCardAnimated card={item.playerCard} style={{ width: 72, height: 100 }} />
                      </View>
                      <View style={S.historyCenter}>
                        <Text style={S.historyRound}>جولة {item.round}</Text>
                        <Text style={[S.historyResult, { color: c }]}>{l}</Text>
                      </View>
                      <View style={S.historyCardWrap}>
                        {item.winner === 'bot' && <Text style={S.crown}>👑</Text>}
                        <LuxuryCharacterCardAnimated card={item.botCard} style={{ width: 72, height: 100 }} />
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ──────────────────────────── STYLES ───────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080612' },
  bgWrap: { position: 'absolute', inset: 0, zIndex: 0 },
  battleWrap: { flex: 1, zIndex: 1 },
  flashOverlay: {
    position: 'absolute', inset: 0, zIndex: 5,
    backgroundColor: '#fff', pointerEvents: 'none',
  },

  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadText: { fontSize: FONT.xl, color: COLOR.textMuted },

  normalRoot: { flex: 1 },
  screen: { flex: 1, flexDirection: 'column', paddingBottom: 8 },

  // ── TOP HUD
  topHud: {
    height: 68, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACE.lg,
    backgroundColor: 'rgba(8,6,18,0.82)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(228,165,42,0.18)',
    gap: SPACE.sm,
  },
  hudSide: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  hudSideRight: { justifyContent: 'flex-end' },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  hudInfo: { flex: 1, gap: 4 },
  hudName: { fontSize: FONT.xs, letterSpacing: 0.5 },
  hudScore: { fontSize: FONT.xxl, fontVariant: ['tabular-nums'] } as any,
  hudCenter: { width: 160, alignItems: 'center', gap: SPACE.xs },
  hudRound: { color: '#e2e8f0', fontSize: FONT.sm, letterSpacing: 0.4 },
  historyBtn: { paddingHorizontal: SPACE.sm, paddingVertical: 2, borderRadius: RADIUS.full, backgroundColor: 'rgba(228,165,42,0.1)', borderWidth: 1, borderColor: 'rgba(228,165,42,0.25)' },
  historyBtnText: { color: COLOR.gold, fontSize: FONT.xs - 2 },

  // ── ACTIVE EFFECTS BAR
  effectsBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: SPACE.lg,
    paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: SPACE.sm,
    minHeight: 32,
  },
  effectsBarSide: { flex: 1, alignItems: 'flex-start' },
  effectsBarDivider: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.08)' },
  effectsBarLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9, letterSpacing: 0.5, marginBottom: 2 },

  // ── ARENA
  arena: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.lg, paddingTop: SPACE.md, gap: SPACE.sm },
  playerPanel: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,26,10,0.4)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)', borderRadius: RADIUS.lg, paddingVertical: SPACE.lg, gap: SPACE.sm, height: '100%' },
  botPanel: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(26,10,10,0.4)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)', borderRadius: RADIUS.lg, paddingVertical: SPACE.lg, gap: SPACE.sm, height: '100%' },
  panelLabel: { color: COLOR.textMuted, fontSize: FONT.xs - 2, letterSpacing: 1, textTransform: 'uppercase' },
  botStatus: { marginTop: SPACE.xs, paddingHorizontal: SPACE.md, paddingVertical: 3, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  botStatusText: { color: '#94a3b8', fontSize: FONT.xs - 2 },

  // ── CENTER COLUMN
  centerCol: { width: 152, alignItems: 'center', justifyContent: 'center', gap: SPACE.sm, zIndex: 20 },
  vsBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(8,6,18,0.9)', borderWidth: 2, borderColor: 'rgba(228,165,42,0.7)', alignItems: 'center', justifyContent: 'center', ...SHADOW.gold },
  vsIcon: { fontSize: 18 },
  vsText: { fontSize: FONT.sm, color: COLOR.gold, letterSpacing: 1 },
  previewChip: { paddingHorizontal: SPACE.md, paddingVertical: SPACE.xs, borderRadius: RADIUS.full, borderWidth: 1, alignItems: 'center' },
  previewChipText: { fontSize: FONT.xs - 2, textAlign: 'center' },
  resultBadge: { paddingHorizontal: SPACE.lg, paddingVertical: SPACE.sm, borderRadius: RADIUS.pill, borderWidth: 1.5, alignItems: 'center' },
  resultBadgeText: { fontSize: FONT.base, letterSpacing: 0.5 },

  // ── CTA
  ctaStack: { gap: SPACE.sm, width: '100%', alignItems: 'center' },
  ctaBtn: { width: 140, height: 48, borderRadius: RADIUS.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.xs, borderWidth: 1.5, backgroundColor: 'rgba(0,0,0,0.4)' },
  ctaBtnAttack: { backgroundColor: 'rgba(74,222,128,0.12)', borderColor: '#4ade80', shadowColor: '#4ade80', shadowOpacity: 0.5, shadowOffset: { width: 0, height: 0 }, shadowRadius: 10, elevation: 6 },
  ctaBtnNext: { backgroundColor: 'rgba(96,165,250,0.12)', borderColor: '#60a5fa', shadowColor: '#60a5fa', shadowOpacity: 0.5, shadowOffset: { width: 0, height: 0 }, shadowRadius: 8, elevation: 4 },
  ctaBtnAbilities: { backgroundColor: 'rgba(168,85,247,0.12)', borderColor: '#a855f7', shadowColor: '#a855f7', shadowOpacity: 0.45, shadowOffset: { width: 0, height: 0 }, shadowRadius: 8, elevation: 4 },
  ctaBtnDisabled: { backgroundColor: 'rgba(71,85,105,0.2)', borderColor: '#475569', shadowOpacity: 0 },
  ctaBtnIcon: { fontSize: 16 },
  ctaBtnText: { color: '#f1f5f9', fontSize: FONT.sm, letterSpacing: 0.3 },

  // ── edit FAB
  editFab: { position: 'absolute', bottom: 16, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(228,165,42,0.15)', borderWidth: 1, borderColor: COLOR.goldDim, alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  editFabActive: { backgroundColor: 'rgba(74,222,128,0.2)', borderColor: '#4ade80' },
  editFabText: { fontSize: 16 },

  // ── GRID
  gridContainer: { position: 'absolute', inset: 0, zIndex: 2 },
  vLine: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, backgroundColor: 'rgba(228,165,42,0.4)' },
  hLine: { position: 'absolute', top: '50%', left: 0, right: 0, height: 2, backgroundColor: 'rgba(228,165,42,0.4)' },
  vLineThin: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(228,165,42,0.15)' },
  hLineThin: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(228,165,42,0.15)' },
  gridCenter: { position: 'absolute', left: '50%', top: '50%', width: 12, height: 12, borderRadius: 6, backgroundColor: COLOR.gold, marginLeft: -6, marginTop: -6 },

  // ── SIDEBAR
  sidebar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 280, backgroundColor: 'rgba(20,14,30,0.97)', zIndex: 300, borderRightWidth: 2, borderRightColor: 'rgba(228,165,42,0.3)' },
  sidebarHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACE.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(228,165,42,0.2)', backgroundColor: 'rgba(228,165,42,0.06)' },
  sidebarTitle: { color: COLOR.gold, fontSize: FONT.base },
  sidebarClose: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(248,113,113,0.15)', borderRadius: 15 },
  sidebarSection: { marginBottom: SPACE.lg, padding: SPACE.md, backgroundColor: 'rgba(228,165,42,0.04)', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(228,165,42,0.12)' },
  sidebarSectionTitle: { color: COLOR.gold, fontSize: FONT.sm, marginBottom: SPACE.sm },
  sidebarOpt: { padding: SPACE.md, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.sm, marginBottom: SPACE.xs, borderWidth: 1, borderColor: 'rgba(228,165,42,0.15)' },
  sidebarOptActive: { backgroundColor: 'rgba(228,165,42,0.15)', borderColor: COLOR.gold },
  sidebarOptText: { color: '#f1f5f9', fontSize: FONT.sm },
  sidebarAction: { padding: SPACE.md, backgroundColor: COLOR.gold, borderRadius: RADIUS.md, alignItems: 'center' },
  sidebarActionText: { color: '#1A0D1A', fontSize: FONT.sm },

  // ── DraggableResizable
  resizeHandle: { position: 'absolute', width: 12, height: 12, backgroundColor: '#fff', borderWidth: 2, borderColor: '#2196F3', borderRadius: 2, zIndex: 10 },
  resizeHandleInner: { width: '100%', height: '100%', backgroundColor: '#2196F3' },
  rh_topleft: { top: 0, left: 0 },
  rh_topright: { top: 0, right: 0 },
  rh_bottomleft: { bottom: 50, left: 0 },
  rh_bottomright: { bottom: 50, right: 0 },
  rh_top: { top: 0, left: '50%', marginLeft: -6 },
  rh_bottom: { bottom: 50, left: '50%', marginLeft: -6 },
  rh_left: { top: '50%', left: 0, marginTop: -6 },
  rh_right: { top: '50%', right: 0, marginTop: -6 },
  transformHandles: { position: 'absolute', top: -30, left: -30, right: -30, bottom: -30 },
  scaleControls: { position: 'absolute', bottom: -60, left: '50%', transform: [{ translateX: -85 }], flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(28,28,40,0.95)', paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm, borderRadius: RADIUS.md, gap: SPACE.sm, borderWidth: 1.5, borderColor: '#2196F3' },
  scaleBtn: { backgroundColor: '#2196F3', width: 34, height: 34, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  scaleBtnDisabled: { backgroundColor: '#555', opacity: 0.5 },
  scaleBtnText: { color: '#fff', fontSize: 22, lineHeight: 22 },
  scaleDisplay: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: SPACE.md, paddingVertical: 4, borderRadius: 6, minWidth: 56, alignItems: 'center' },
  scaleDisplayText: { color: '#4ade80', fontSize: FONT.sm },
  editElem: { alignItems: 'center' },
  editLabel: { color: COLOR.gold, fontSize: FONT.sm, marginBottom: SPACE.sm },

  // ── MODALS
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  abilitiesModal: { width: '92%', maxWidth: 820, backgroundColor: 'rgba(12,18,36,0.97)', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(51,65,85,0.7)', padding: SPACE.xl, paddingBottom: SPACE.lg },
  historyModal: { backgroundColor: 'rgba(18,14,28,0.97)', borderRadius: RADIUS.lg, width: '90%', maxHeight: '82%', padding: SPACE.xl, borderWidth: 1, borderColor: '#1e293b' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACE.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', paddingBottom: SPACE.md },
  modalTitle: { color: '#f8fafc', fontSize: FONT.xl },
  modalClose: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(248,113,113,0.12)', borderRadius: 16 },
  modalCloseText: { color: '#f87171', fontSize: 18 },
  emptyText: { color: '#64748b', textAlign: 'center', marginVertical: SPACE.xxl, fontSize: FONT.base },

  historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderLeftWidth: 3, paddingLeft: SPACE.lg, paddingVertical: SPACE.md, marginBottom: SPACE.lg, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: RADIUS.md, gap: SPACE.lg },
  historyCardWrap: { alignItems: 'center', position: 'relative' },
  crown: { fontSize: 20, position: 'absolute', top: -20, alignSelf: 'center', zIndex: 10 },
  historyCenter: { flex: 1, alignItems: 'center', gap: SPACE.xs },
  historyRound: { color: COLOR.gold, fontSize: FONT.sm },
  historyResult: { fontSize: FONT.base },
});