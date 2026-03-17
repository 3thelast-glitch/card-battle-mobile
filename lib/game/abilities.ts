import { Card, AbilityType, ActiveEffect, GameState } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DISABLED_ABILITIES_KEY = 'disabledAbilities';

// قائمة بجميع القدرات المتاحة
export const ALL_ABILITIES: AbilityType[] = [
  'LogicalEncounter', 'Recall', 'Protection', 'Arise', 'Reinforcement',
  'Wipe', 'Purge', 'HalvePoints', 'Seal', 'DoubleOrNothing',
  'StarSuperiority', 'Reduction', 'Sacrifice', 'Popularity', 'Eclipse',
  'CancelAbility', 'Revive', 'Shambles', 'ConsecutiveLossBuff', 'Lifesteal',
  'Revenge', 'Suicide', 'Disaster', 'Compensation', 'Weakening',
  'Misdirection', 'StealAbility', 'Rescue', 'Trap', 'ConvertDebuffsToBuffs',
  'Sniping', 'Merge', 'DoubleNextCards', 'Deprivation', 'Greed',
  'Dilemma', 'Subhan', 'Propaganda', 'DoubleYourBuffs', 'Avatar',
  'Penetration', 'Pool', 'Conversion', 'Shield', 'SwapClass',
  'TakeIt', 'Skip', 'AddElement', 'Explosion', 'DoublePoints', 'ElementalMastery'
];

/**
 * خريطة تحويل من nameEn (في data/abilities.ts) إلى AbilityType (في types.ts)
 * لأن الأسماء تختلف قليلاً بين الملفين.
 */
export const NAME_TO_ABILITY_TYPE: Record<string, AbilityType> = {
  'Logical Encounter': 'LogicalEncounter',
  'Recall': 'Recall',
  'Protection': 'Protection',
  'Wipe': 'Wipe',
  'Halve Points': 'HalvePoints',
  'Seal': 'Seal',
  'Reduction': 'Reduction',
  'Sacrifice': 'Sacrifice',
  'Suicide': 'Suicide',
  'Compensation': 'Compensation',
  'Arise': 'Arise',
  'Reinforcement': 'Reinforcement',
  'Purge': 'Purge',
  'Double Or Nothing': 'DoubleOrNothing',
  'Disaster': 'Disaster',
  'Rescue': 'Rescue',
  'Trap': 'Trap',
  'Sniping': 'Sniping',
  'Merge': 'Merge',
  'Revive': 'Revive',
  'Consecutive Loss Buff': 'ConsecutiveLossBuff',
  'Weakening': 'Weakening',
  'Subhan': 'Subhan',
  'Swap Class': 'SwapClass',
  'Lifesteal': 'Lifesteal',
  'Revenge': 'Revenge',
  'Popularity': 'Popularity',
  'Misdirection': 'Misdirection',
  'Steal Ability': 'StealAbility',
  'Convert Debuffs': 'ConvertDebuffsToBuffs',
  'Double Next Cards': 'DoubleNextCards',
  'Deprivation': 'Deprivation',
  'Greed': 'Greed',
  'Dilemma': 'Dilemma',
  'Propaganda': 'Propaganda',
  'Double Your Buffs': 'DoubleYourBuffs',
  'Avatar': 'Avatar',
  'Penetration': 'Penetration',
  'Pool': 'Pool',
  'Conversion': 'Conversion',
  'Shield': 'Shield',
  'Take It': 'TakeIt',
  'Skip': 'Skip',
  'Add Element': 'AddElement',
  'Explosion': 'Explosion',
  'Double Points': 'DoublePoints',
  'Star Superiority': 'StarSuperiority',
  'Eclipse': 'Eclipse',
  'Cancel Ability': 'CancelAbility',
  'Elemental Mastery': 'ElementalMastery',
  'Deprivation (Ability)': 'Deprivation',
};

/** قراءة القدرات المعطّلة من AsyncStorage (sync-safe عبر cache) */
let _disabledCache: Set<AbilityType> | null = null;

export async function loadDisabledAbilities(): Promise<Set<AbilityType>> {
  try {
    const raw = await AsyncStorage.getItem(DISABLED_ABILITIES_KEY);
    const arr: AbilityType[] = raw ? JSON.parse(raw) : [];
    _disabledCache = new Set(arr);
  } catch {
    _disabledCache = new Set();
  }
  return _disabledCache;
}

export function getDisabledAbilitiesCache(): Set<AbilityType> {
  return _disabledCache ?? new Set();
}

export async function saveDisabledAbilities(disabled: Set<AbilityType>): Promise<void> {
  _disabledCache = disabled;
  await AsyncStorage.setItem(DISABLED_ABILITIES_KEY, JSON.stringify([...disabled]));
}

/**
 * اختيار عشوائي مع استثناء المعطّلة.
 * يُستخدم في game-context عند START_BATTLE.
 */
export function getRandomAbilities(count: number): AbilityType[] {
  const disabled = getDisabledAbilitiesCache();
  const available = ALL_ABILITIES.filter(a => !disabled.has(a));
  if (available.length === 0) return [];
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// تعريف واجهة لدالة تنفيذ القدرة
interface AbilityExecutionResult {
  newEffects: ActiveEffect[];
  newPlayerScore?: number;
  newBotScore?: number;
  playerDeckChange?: { index: number, newCard: Card };
  botDeckChange?: { index: number, newCard: Card };
}

export type AbilityExecutor = (
  state: GameState,
  isPlayer: boolean,
) => AbilityExecutionResult;

// خريطة لتخزين دوال تنفيذ القدرات
export const abilityExecutors: Record<AbilityType, AbilityExecutor> = {
  LogicalEncounter: (state, isPlayer) => ({ newEffects: [] }),
  Recall: (state, isPlayer) => ({ newEffects: [] }),
  Arise: (state, isPlayer) => ({ newEffects: [] }),
  Popularity: (state, isPlayer) => ({ newEffects: [] }),
  Revive: (state, isPlayer) => ({ newEffects: [] }),
  Sniping: (state, isPlayer) => ({ newEffects: [] }),
  Subhan: (state, isPlayer) => ({ newEffects: [] }),
  Propaganda: (state, isPlayer) => ({ newEffects: [] }),

  // Protection → يرفع الدفاع
  Protection: (state, isPlayer) => {
    const target = isPlayer ? 'player' : 'bot';
    return { newEffects: [{ type: 'buff', target, stat: 'defense', value: 5, roundsLeft: 1, sourceAbility: 'Protection' }] };
  },
  // HalvePoints → يخصم نصف هجوم ودفاع الخصم (منطق halvePoints في cards-data)
  HalvePoints: (state, isPlayer) => {
    const target = isPlayer ? 'bot' : 'player';
    return { newEffects: [{ type: 'debuff', target, stat: 'attack', value: -50, roundsLeft: 1, sourceAbility: 'HalvePoints' }] };
  },
  Seal: (state, isPlayer) => {
    const target = isPlayer ? 'bot' : 'player';
    return { newEffects: [{ type: 'seal', target, stat: 'ability', value: 0, roundsLeft: 5, sourceAbility: 'Seal' }] };
  },
  StarSuperiority: (state, isPlayer) => {
    const target = isPlayer ? 'player' : 'bot';
    const rem = state.totalRounds - state.currentRound;
    return { newEffects: [{ type: 'buff', target, stat: 'attack', value: 3, roundsLeft: rem, sourceAbility: 'StarSuperiority' }] };
  },
  Reduction: (state, isPlayer) => {
    const target = isPlayer ? 'bot' : 'player';
    return { newEffects: [{ type: 'debuff', target, stat: 'defense', value: -2, roundsLeft: 1, sourceAbility: 'Reduction' }] };
  },
  Eclipse: (state, isPlayer) => {
    const target = isPlayer ? 'bot' : 'player';
    return { newEffects: [{ type: 'debuff', target, stat: 'attack', value: -9999, roundsLeft: 1, sourceAbility: 'Eclipse' }] };
  },
  Avatar: (state, isPlayer) => {
    const target = isPlayer ? 'player' : 'bot';
    return { newEffects: [{ type: 'buff', target, stat: 'attack', value: 2, roundsLeft: 1, sourceAbility: 'Avatar' }] };
  },
  Penetration: (state, isPlayer) => {
    const target = isPlayer ? 'bot' : 'player';
    return { newEffects: [{ type: 'debuff', target, stat: 'defense', value: -9999, roundsLeft: 1, sourceAbility: 'Penetration' }] };
  },
  Reinforcement: () => ({ newEffects: [] }),
  DoubleOrNothing: () => ({ newEffects: [] }),
  Sacrifice: () => ({ newEffects: [] }),
  Lifesteal: () => ({ newEffects: [] }),
  Revenge: () => ({ newEffects: [] }),
  Suicide: () => ({ newEffects: [] }),
  Compensation: () => ({ newEffects: [] }),
  Weakening: () => ({ newEffects: [] }),
  Greed: () => ({ newEffects: [] }),
  Explosion: () => ({ newEffects: [] }),
  ConsecutiveLossBuff: () => ({ newEffects: [] }),
  Wipe: () => ({ newEffects: [] }),
  Purge: () => ({ newEffects: [] }),
  ConvertDebuffsToBuffs: () => ({ newEffects: [] }),
  Deprivation: () => ({ newEffects: [] }),
  DoubleYourBuffs: () => ({ newEffects: [] }),
  Conversion: () => ({ newEffects: [] }),
  TakeIt: () => ({ newEffects: [] }),
  Misdirection: (state, isPlayer) => {
    const opponentTarget = isPlayer ? 'bot' : 'player';
    const debuffs = (state.activeEffects as unknown as ActiveEffect[]).filter(
      e => e.target === opponentTarget && e.type === 'debuff'
    );
    return { newEffects: debuffs.map(e => ({ ...e, value: e.value * 2, sourceAbility: 'Misdirection' as AbilityType })) };
  },
  CancelAbility: () => ({ newEffects: [] }),
  Shambles: () => ({ newEffects: [] }),
  Disaster: () => ({ newEffects: [] }),
  StealAbility: () => ({ newEffects: [] }),
  Rescue: () => ({ newEffects: [] }),
  Trap: () => ({ newEffects: [] }),
  Merge: () => ({ newEffects: [] }),
  DoubleNextCards: (state, isPlayer) => {
    const target = isPlayer ? 'player' : 'bot';
    return { newEffects: [{ type: 'buff', target, stat: 'attack', value: 2, roundsLeft: 2, sourceAbility: 'DoubleNextCards' }] };
  },
  Dilemma: () => ({ newEffects: [] }),
  Pool: () => ({ newEffects: [] }),
  Shield: (state, isPlayer) => {
    const target = isPlayer ? 'player' : 'bot';
    return { newEffects: [{ type: 'buff', target, stat: 'defense', value: 5, roundsLeft: 1, sourceAbility: 'Shield' }] };
  },
  SwapClass: () => ({ newEffects: [] }),
  Skip: () => ({ newEffects: [] }),
  AddElement: () => ({ newEffects: [] }),
  DoublePoints: (state, isPlayer) => {
    const target = isPlayer ? 'player' : 'bot';
    return { newEffects: [{ type: 'buff', target, stat: 'attack', value: 100, roundsLeft: 1, sourceAbility: 'DoublePoints' }] };
  },
  ElementalMastery: (state, isPlayer) => {
    const target = isPlayer ? 'player' : 'bot';
    return { newEffects: [{ type: 'buff', target, stat: 'attack', value: 4, roundsLeft: state.totalRounds - state.currentRound, sourceAbility: 'ElementalMastery' }] };
  },
};