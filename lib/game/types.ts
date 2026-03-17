// أنواع البطاقات والإحصائيات

import type { ImageSourcePropType } from 'react-native';

export type Race = 'human' | 'elf' | 'orc' | 'dragon' | 'demon' | 'undead';

export type CardClass = 'warrior' | 'knight' | 'mage' | 'archer' | 'berserker' | 'paladin';

export type Element = 'fire' | 'ice' | 'water' | 'earth' | 'lightning' | 'wind';

export type Tag = 'sword' | 'shield' | 'magic' | 'bow' | 'crown';

/** Rarity tier for a card */
export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';

/** Special in-game effects a card can carry */
export type CardEffect = 'taunt' | 'divine_shield' | 'poison' | 'stealth' | 'charge';

/** Localised string for bilingual support */
export interface LocalizedString {
  en: string;
  ar: string;
}

/** Per-card animation preset key */
export type CardAnimationPreset = 'default' | 'fire' | 'ice' | 'lightning' | 'shadow' | 'holy';

export interface Card {
  id: string;
  name: string;
  nameAr: string;
  nameEn?: string;
  finalImage: ImageSourcePropType;
  attack: number;
  defense: number;
  race: Race;
  cardClass: CardClass;
  element: Element;
  tags: Tag[];
  emoji: string;
  videoUrl?: string;
  rarity?: CardRarity;
  stars?: number;
  specialAbility?: string;
  cardEffects?: CardEffect[];
  animationPreset?: CardAnimationPreset;
  /** Optional ability slot — can be undefined after Recall/Merge/etc. */
  ability?: AbilityType;
}

export type AbilityType =
  | 'LogicalEncounter'
  | 'Recall'
  | 'Protection'
  | 'Arise'
  | 'Reinforcement'
  | 'Wipe'
  | 'Purge'
  | 'HalvePoints'
  | 'Seal'
  | 'DoubleOrNothing'
  | 'StarSuperiority'
  | 'Reduction'
  | 'Sacrifice'
  | 'Popularity'
  | 'Eclipse'
  | 'CancelAbility'
  | 'Revive'
  | 'Shambles'
  | 'ConsecutiveLossBuff'
  | 'Lifesteal'
  | 'Revenge'
  | 'Suicide'
  | 'Disaster'
  | 'Compensation'
  | 'Weakening'
  | 'Misdirection'
  | 'StealAbility'
  | 'Rescue'
  | 'Trap'
  | 'ConvertDebuffsToBuffs'
  | 'Sniping'
  | 'Merge'
  | 'DoubleNextCards'
  | 'Deprivation'
  | 'Greed'
  | 'Dilemma'
  | 'Subhan'
  | 'Propaganda'
  | 'DoubleYourBuffs'
  | 'Avatar'
  | 'Penetration'
  | 'Pool'
  | 'Conversion'
  | 'Shield'
  | 'SwapClass'
  | 'TakeIt'
  | 'Skip'
  | 'AddElement'
  | 'Explosion'
  | 'DoublePoints'
  | 'ElementalMastery';

export type Side = 'player' | 'bot';

export type EffectKind =
  | 'prediction'
  | 'protection'
  | 'fortify'
  | 'statModifier'
  | 'halvePoints'
  | 'silenceAbilities'
  | 'doubleOrNothing'
  | 'forcedOutcome'
  | 'starAdvantage'
  | 'sacrifice'
  | 'greedBuff'
  | 'lifesteal'
  | 'revengeBuff'
  | 'suicidePact'
  | 'compensationBuff'
  | 'weakeningDebuff'
  | 'explosionDebuff'
  | 'consecutiveLoss'
  | 'shieldGuard'
  | 'trap'
  | 'convertDebuffs'
  | 'doubleBuffs'
  | 'conversion'
  | 'takeIt'
  | 'deprivation'
  | 'pool';

export interface Effect {
  id: string;
  kind: EffectKind;
  sourceSide: Side;
  targetSide: Side | 'all';
  createdAtRound: number;
  expiresAtRound?: number;
  charges?: number;
  priority: number;
  data?: Record<string, unknown>;
}

export interface ActiveEffect {
  type: 'buff' | 'debuff' | 'seal';
  target: 'player' | 'bot' | 'all';
  stat: 'attack' | 'defense' | 'ability';
  value: number;
  roundsLeft: number;
  sourceAbility: AbilityType;
}

export interface GameState {
  playerDeck: Card[];
  botDeck: Card[];
  currentRound: number;
  totalRounds: number;
  playerScore: number;
  botScore: number;
  roundResults: RoundResult[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  abilitiesEnabled: boolean;
  activeEffects: Effect[];
  playerAbilities: AbilityState[];
  botAbilities: AbilityState[];
  usedAbilities: AbilityType[];
}

export interface AbilityState {
  type: AbilityType;
  used: boolean;
}

export interface RoundResult {
  round: number;
  playerCard: Card;
  botCard: Card;
  playerDamage: number;
  botDamage: number;
  playerBaseDamage: number;
  botBaseDamage: number;
  playerElementAdvantage: ElementAdvantage;
  botElementAdvantage: ElementAdvantage;
  winner: 'player' | 'bot' | 'draw';
}

export const RACE_EMOJI: Record<Race, string> = {
  human: '👤',
  elf: '🧝',
  orc: '👹',
  dragon: '🐉',
  demon: '😈',
  undead: '💀',
};

export const CLASS_EMOJI: Record<CardClass, string> = {
  warrior: '⚔️',
  knight: '🛡️',
  mage: '🔮',
  archer: '🏹',
  berserker: '🗡️',
  paladin: '💪',
};

export const ELEMENT_EMOJI: Record<Element, string> = {
  fire: '🔥',
  ice: '❄️',
  water: '💧',
  earth: '🌍',
  lightning: '⚡',
  wind: '💨',
};

export const ELEMENT_COLORS: Record<Element, string> = {
  fire: '#ef4444',
  ice: '#38bdf8',
  water: '#3b82f6',
  earth: '#a3e635',
  lightning: '#facc15',
  wind: '#a78bfa',
};

export type ElementAdvantage = 'strong' | 'weak' | 'neutral';

export const ELEMENT_MULTIPLIER = {
  strong: 1.25,
  weak: 0.75,
  neutral: 1.0,
};

export const ELEMENT_ADVANTAGES: Record<Element, Element[]> = {
  fire: ['ice'],
  ice: ['earth'],
  earth: ['fire'],
  water: [],
  lightning: [],
  wind: [],
};

export const ELEMENT_WEAKNESSES: Record<Element, Element[]> = {
  fire: ['earth'],
  ice: ['fire'],
  earth: ['ice'],
  water: [],
  lightning: [],
  wind: [],
};