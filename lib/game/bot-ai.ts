/**
 * Bot Brain v2.1 — Utility AI
 *
 * فروق حقيقية بين المستويات الخمسة:
 *
 *  1  سهل      — عشوائي تماماً، لا قدرات
 *  2  متوسط    — أفضل نصف الكروت، قدرات عشوائية خفيفة
 *  3  صعب      — نفس الكروت لكن يحسب التوقيت + threshold أعلى + noise أقل
 *  4  خيالي    — Utility AI كامل + ذاكرة عناصر + عشوائية كروت خفيفة (5٪)
 *  5  أسطوري   — كل ما سبق + ذاكرة شاملة + mode أسرع + يحتفظ بأقوى قدرة للنهاية + عشوائية كروت (3٪)
 */

import { Card, GameState, AbilityType, AbilityState, RoundResult } from './types';
import { ALL_CARDS, getElementAdvantage } from './cards-data';
import type { DifficultyLevel } from '@/app/screens/difficulty';

// ──────────────────────────────── Types ────────────────────────────────
export type BotMode = 'aggressive' | 'balanced' | 'safe';

export interface UtilityBreakdown {
<<<<<<< HEAD
  winChance: number;
  damage: number;
  element: number;
  roundPressure: number;
  saveAbility: number;
  risk: number;
}

export interface BotMemory {
  playerWinStreak: number;
  playerUsedAbilities: AbilityType[];
  playerFavoredElements: Record<string, number>;
  botLossStreak: number;
  totalRoundsPlayed: number;
  strongestBotAbility: AbilityType | null; // يُحفظ لآخر جولة في مستوى 5
}

export interface BotDecision {
  useAbility: boolean;
  abilityType?: AbilityType;
  mode: BotMode;
  score: number;
  breakdown: UtilityBreakdown;
=======
  winChance:     number;
  damage:        number;
  element:       number;
  roundPressure: number;
  saveAbility:   number;
  risk:          number;
}

export interface BotMemory {
  playerWinStreak:       number;
  playerUsedAbilities:   AbilityType[];
  playerFavoredElements: Record<string, number>;
  botLossStreak:         number;
  totalRoundsPlayed:     number;
  strongestBotAbility:   AbilityType | null; // يُحفظ لآخر جولة في مستوى 5
}

export interface BotDecision {
  useAbility:   boolean;
  abilityType?: AbilityType;
  mode:         BotMode;
  score:        number;
  breakdown:    UtilityBreakdown;
>>>>>>> 765f6de734d6ad6d1dd61f8dfa220559988ac639
}

// ──────────────────────────────── Weights ────────────────────────────────
type WeightMap = Record<keyof UtilityBreakdown, number>;

const WEIGHTS: Record<BotMode, WeightMap> = {
<<<<<<< HEAD
  aggressive: { winChance: 0.30, damage: 0.28, element: 0.14, roundPressure: 0.14, saveAbility: 0.04, risk: 0.10 },
  balanced: { winChance: 0.34, damage: 0.22, element: 0.14, roundPressure: 0.12, saveAbility: 0.10, risk: 0.08 },
  safe: { winChance: 0.36, damage: 0.16, element: 0.14, roundPressure: 0.10, saveAbility: 0.16, risk: 0.08 },
=======
  aggressive: { winChance:0.30, damage:0.28, element:0.14, roundPressure:0.14, saveAbility:0.04, risk:0.10 },
  balanced:   { winChance:0.34, damage:0.22, element:0.14, roundPressure:0.12, saveAbility:0.10, risk:0.08 },
  safe:       { winChance:0.36, damage:0.16, element:0.14, roundPressure:0.10, saveAbility:0.16, risk:0.08 },
>>>>>>> 765f6de734d6ad6d1dd61f8dfa220559988ac639
};

// ──────────────────────────────── Memory ────────────────────────────────
let _memory: BotMemory = {
<<<<<<< HEAD
  playerWinStreak: 0,
  playerUsedAbilities: [],
  playerFavoredElements: {},
  botLossStreak: 0,
  totalRoundsPlayed: 0,
  strongestBotAbility: null,
=======
  playerWinStreak:       0,
  playerUsedAbilities:   [],
  playerFavoredElements: {},
  botLossStreak:         0,
  totalRoundsPlayed:     0,
  strongestBotAbility:   null,
>>>>>>> 765f6de734d6ad6d1dd61f8dfa220559988ac639
};

export function getBotMemory(): Readonly<BotMemory> { return { ..._memory }; }

export function updateBotMemory(result: RoundResult, playerUsedAbility?: AbilityType): void {
  _memory.totalRoundsPlayed++;
  if (result.winner === 'player') {
    _memory.playerWinStreak++;
    _memory.botLossStreak++;
  } else {
    _memory.playerWinStreak = 0;
<<<<<<< HEAD
    _memory.botLossStreak = 0;
=======
    _memory.botLossStreak   = 0;
>>>>>>> 765f6de734d6ad6d1dd61f8dfa220559988ac639
  }
  const el = result.playerCard.element;
  _memory.playerFavoredElements[el] = (_memory.playerFavoredElements[el] ?? 0) + 1;
  if (playerUsedAbility) _memory.playerUsedAbilities.push(playerUsedAbility);
}

export function resetBotMemory(): void {
  _memory = {
    playerWinStreak: 0, playerUsedAbilities: [],
    playerFavoredElements: {}, botLossStreak: 0,
    totalRoundsPlayed: 0, strongestBotAbility: null,
  };
}

// ──────────────────────────────── Helpers ────────────────────────────────
const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

function cardPower(c: Card): number { return c.attack + c.defense + c.speed; }

function cardPowerAgainst(attacker: Card, defender: Card): number {
  const base = cardPower(attacker);
<<<<<<< HEAD
  const adv = getElementAdvantage(attacker.element, defender.element);
  if (adv === 'strong') return base * 1.5;
  if (adv === 'weak') return base * 0.7;
=======
  const adv  = getElementAdvantage(attacker.element, defender.element);
  if (adv === 'strong') return base * 1.5;
  if (adv === 'weak')   return base * 0.7;
>>>>>>> 765f6de734d6ad6d1dd61f8dfa220559988ac639
  return base;
}

// ──────────────────────────────── Mode detection ────────────────────────────────
export function chooseBotMode(
  playerScore: number, botScore: number,
  currentRound: number, totalRounds: number,
  difficulty: DifficultyLevel = 3,
): BotMode {
<<<<<<< HEAD
  const diff = botScore - playerScore;
  const roundsLeft = totalRounds - currentRound;
  // مستوى 5 يتحول للـ mode أسرع (بفارق 1 بدل 2)
  const aggressiveThreshold = difficulty >= 5 ? -1 : -2;
  const safeGap = difficulty >= 5 ? 1 : 2;

  if (diff <= aggressiveThreshold) return 'aggressive';
  if (diff >= safeGap && roundsLeft <= 2) return 'safe';
  if (diff >= 1 && roundsLeft <= 2) return 'safe';
=======
  const diff       = botScore - playerScore;
  const roundsLeft = totalRounds - currentRound;
  // مستوى 5 يتحول للـ mode أسرع (بفارق 1 بدل 2)
  const aggressiveThreshold = difficulty >= 5 ? -1 : -2;
  const safeGap             = difficulty >= 5 ?  1 :  2;

  if (diff <= aggressiveThreshold)           return 'aggressive';
  if (diff >= safeGap && roundsLeft <= 2)    return 'safe';
  if (diff >= 1       && roundsLeft <= 2)    return 'safe';
>>>>>>> 765f6de734d6ad6d1dd61f8dfa220559988ac639
  return 'balanced';
}

// ──────────────────────────────── Utility scoring ────────────────────────────────
function scoreUtility(b: UtilityBreakdown, mode: BotMode): number {
  const w = WEIGHTS[mode];
<<<<<<< HEAD
  return b.winChance * w.winChance + b.damage * w.damage + b.element * w.element
    + b.roundPressure * w.roundPressure + b.saveAbility * w.saveAbility + b.risk * w.risk;
=======
  return b.winChance*w.winChance + b.damage*w.damage + b.element*w.element
       + b.roundPressure*w.roundPressure + b.saveAbility*w.saveAbility + b.risk*w.risk;
>>>>>>> 765f6de734d6ad6d1dd61f8dfa220559988ac639
}

function evaluateCardVs(
  botCard: Card, playerCard: Card,
  currentRound: number, totalRounds: number,
  botScore: number, playerScore: number, mode: BotMode,
): UtilityBreakdown {
<<<<<<< HEAD
  const botPower = cardPowerAgainst(botCard, playerCard);
  const playerPower = cardPowerAgainst(playerCard, botCard);
  const adv = getElementAdvantage(botCard.element, playerCard.element);
  const roundsLeft = totalRounds - currentRound;
  const totalPower = botPower + playerPower;

  const winChance = totalPower > 0 ? clamp(botPower / totalPower) : 0.5;
  const maxPossible = Math.max(...ALL_CARDS.map(c => c.attack + c.defense + c.speed)) * 1.5;
  const damage = clamp(botPower / maxPossible);
  const element = adv === 'strong' ? 1.0 : adv === 'weak' ? 0.0 : 0.5;
  const scoreDiff = Math.abs(botScore - playerScore);
  const urgencyBase = scoreDiff >= 2 && roundsLeft <= 2 ? 1.0
    : scoreDiff >= 1 && roundsLeft <= 3 ? 0.75
      : roundsLeft <= 2 ? 0.6 : 0.4;
  const roundPressure = clamp(urgencyBase);
  const saveAbility = winChance > 0.70 ? 0.8 : winChance > 0.55 ? 0.5 : 0.2;
  const risk = mode === 'aggressive' ? clamp(1 - winChance + 0.3) : clamp(1 - winChance);
=======
  const botPower    = cardPowerAgainst(botCard, playerCard);
  const playerPower = cardPowerAgainst(playerCard, botCard);
  const adv         = getElementAdvantage(botCard.element, playerCard.element);
  const roundsLeft  = totalRounds - currentRound;
  const totalPower  = botPower + playerPower;

  const winChance     = totalPower > 0 ? clamp(botPower / totalPower) : 0.5;
  const maxPossible   = Math.max(...ALL_CARDS.map(c => c.attack + c.defense + c.speed)) * 1.5;
  const damage        = clamp(botPower / maxPossible);
  const element       = adv === 'strong' ? 1.0 : adv === 'weak' ? 0.0 : 0.5;
  const scoreDiff     = Math.abs(botScore - playerScore);
  const urgencyBase   = scoreDiff >= 2 && roundsLeft <= 2 ? 1.0
                      : scoreDiff >= 1 && roundsLeft <= 3 ? 0.75
                      : roundsLeft <= 2 ? 0.6 : 0.4;
  const roundPressure = clamp(urgencyBase);
  const saveAbility   = winChance > 0.70 ? 0.8 : winChance > 0.55 ? 0.5 : 0.2;
  const risk          = mode === 'aggressive' ? clamp(1 - winChance + 0.3) : clamp(1 - winChance);
>>>>>>> 765f6de734d6ad6d1dd61f8dfa220559988ac639

  return { winChance, damage, element, roundPressure, saveAbility, risk };
}

// ──────────────────────────────── Ability timing ────────────────────────────────
export function evaluateAbilityTiming(
  ability: AbilityType,
  currentRound: number, totalRounds: number,
  botScore: number, playerScore: number,
  mode: BotMode, memory: BotMemory,
): number {
  const roundsLeft = totalRounds - currentRound;
<<<<<<< HEAD
  const scoreDiff = botScore - playerScore;
  const losing = scoreDiff < 0;
  const closeMatch = Math.abs(scoreDiff) <= 1;

  if (['LogicalEncounter', 'Eclipse', 'Trap', 'Pool'].includes(ability)) {
    if (roundsLeft < 2) return 0.1;
    if (roundsLeft <= 4) return losing || closeMatch ? 0.85 : 0.55;
    return 0.35;
  }
  if (['Rescue', 'Popularity', 'Penetration'].includes(ability)) {
    if (losing && roundsLeft <= 3) return 0.90;
    if (losing) return 0.70;
    if (closeMatch) return 0.50;
    return 0.20;
  }
  if (['Protection', 'Shield', 'Fortify'].includes(ability)) {
    if (losing && roundsLeft <= 2) return 0.80;
    if (closeMatch) return 0.60;
    return 0.30;
  }
  if (['Reinforcement', 'Wipe', 'HalvePoints', 'Disaster', 'Explosion', 'DoublePoints'].includes(ability)) {
    if (mode === 'aggressive') return losing ? 0.92 : 0.70;
    if (mode === 'balanced') return closeMatch ? 0.65 : 0.40;
    return 0.25;
  }
  if (['Recall', 'Arise', 'Revive', 'Shambles', 'Sacrifice'].includes(ability)) {
    if (losing && closeMatch) return 0.75;
    if (losing) return 0.60;
    return 0.35;
  }
  if (['DoubleOrNothing', 'Dilemma', 'Suicide'].includes(ability)) {
=======
  const scoreDiff  = botScore - playerScore;
  const losing     = scoreDiff < 0;
  const closeMatch = Math.abs(scoreDiff) <= 1;

  if (['LogicalEncounter','Eclipse','Trap','Pool'].includes(ability)) {
    if (roundsLeft < 2)  return 0.1;
    if (roundsLeft <= 4) return losing || closeMatch ? 0.85 : 0.55;
    return 0.35;
  }
  if (['Rescue','Popularity','Penetration'].includes(ability)) {
    if (losing && roundsLeft <= 3) return 0.90;
    if (losing)                    return 0.70;
    if (closeMatch)                return 0.50;
    return 0.20;
  }
  if (['Protection','Shield','Fortify'].includes(ability)) {
    if (losing && roundsLeft <= 2) return 0.80;
    if (closeMatch)                return 0.60;
    return 0.30;
  }
  if (['Reinforcement','Wipe','HalvePoints','Disaster','Explosion','DoublePoints'].includes(ability)) {
    if (mode === 'aggressive') return losing ? 0.92 : 0.70;
    if (mode === 'balanced')   return closeMatch ? 0.65 : 0.40;
    return 0.25;
  }
  if (['Recall','Arise','Revive','Shambles','Sacrifice'].includes(ability)) {
    if (losing && closeMatch) return 0.75;
    if (losing)               return 0.60;
    return 0.35;
  }
  if (['DoubleOrNothing','Dilemma','Suicide'].includes(ability)) {
>>>>>>> 765f6de734d6ad6d1dd61f8dfa220559988ac639
    if (mode === 'aggressive' && losing) return 0.80;
    return 0.30;
  }
  return closeMatch ? 0.55 : losing ? 0.65 : 0.35;
}

// ──────────────────────────────── Per-level ability config ────────────────────────────────

/** العتبة التي فوقها يستخدم القدرة */
function abilityThreshold(mode: BotMode, difficulty: DifficultyLevel): number {
  const base = mode === 'aggressive' ? 0.50 : mode === 'safe' ? 0.68 : 0.58;
  // مستوى 3 يرفع العتبة → أكثر انتقائية
  if (difficulty === 3) return Math.min(base + 0.08, 0.90);
  // مستوى 5 يخفض العتبة قليلاً → أكثر استعداداً للاستخدام عند التوقيت الصح
  if (difficulty >= 5) return Math.max(base - 0.05, 0.35);
  return base;
}

/** noise عشوائية حسب المستوى */
function abilityNoise(difficulty: DifficultyLevel): number {
  if (difficulty <= 1) return 0;                          // لا فرق (لا يستخدم قدرات)
  if (difficulty === 2) return (Math.random() - 0.5) * 0.20;  // عشوائية عالية
  if (difficulty === 3) return (Math.random() - 0.5) * 0.08;  // عشوائية خفيفة
  return 0;                                               // 4 و5: لا عشوائية في القدرات
}

// ──────────────────────────────── Main decision engine ────────────────────────────────
export function decideBotAbility(
  botAbilities: AbilityState[],
<<<<<<< HEAD
  playerCard: Card,
  gameState: GameState,
  difficulty: DifficultyLevel,
): BotDecision {
  const { currentRound, totalRounds, botScore, playerScore } = gameState;
  const mode = chooseBotMode(playerScore, botScore, currentRound, totalRounds, difficulty);
  const memory = getBotMemory();
  const botCard = gameState.botDeck[currentRound];
=======
  playerCard:   Card,
  gameState:    GameState,
  difficulty:   DifficultyLevel,
): BotDecision {
  const { currentRound, totalRounds, botScore, playerScore } = gameState;
  const mode     = chooseBotMode(playerScore, botScore, currentRound, totalRounds, difficulty);
  const memory   = getBotMemory();
  const botCard  = gameState.botDeck[currentRound];
>>>>>>> 765f6de734d6ad6d1dd61f8dfa220559988ac639

  const noAbilityBreakdown = evaluateCardVs(
    botCard, playerCard, currentRound, totalRounds, botScore, playerScore, mode,
  );
  const noAbilityScore = scoreUtility(noAbilityBreakdown, mode);

  const available = botAbilities.filter(a => !a.used);

  // ── مستوى 1: لا يستخدم قدرات أبداً ──
  if (available.length === 0 || difficulty <= 1) {
    return { useAbility: false, mode, score: noAbilityScore, breakdown: noAbilityBreakdown };
  }

  // ── مستوى 5: يحتفظ بأقوى قدرة للجولة الأخيرة ──
  const roundsLeft = totalRounds - currentRound;
  let lockedAbility: AbilityType | null = null;
  if (difficulty >= 5 && roundsLeft > 1 && memory.strongestBotAbility) {
    lockedAbility = memory.strongestBotAbility;
  }

  let bestAbilityScore = 0;
  let bestAbility: AbilityType | undefined;

  for (const ab of available) {
    // مستوى 5 يحتجز القدرة الأقوى للنهاية
    if (lockedAbility && ab.type === lockedAbility) continue;

    const timing = evaluateAbilityTiming(
      ab.type, currentRound, totalRounds, botScore, playerScore, mode, memory,
    );

    const effectiveScore = difficulty >= 4
      ? noAbilityScore * (1 - timing) + timing
      : timing * 0.7;

    if (effectiveScore > bestAbilityScore) {
      bestAbilityScore = effectiveScore;
<<<<<<< HEAD
      bestAbility = ab.type;
=======
      bestAbility      = ab.type;
>>>>>>> 765f6de734d6ad6d1dd61f8dfa220559988ac639
    }
  }

  const threshold = abilityThreshold(mode, difficulty);
<<<<<<< HEAD
  const noise = abilityNoise(difficulty);
  const finalUse = bestAbility !== undefined
    && (bestAbilityScore + noise) > threshold;

  return {
    useAbility: finalUse,
    abilityType: finalUse ? bestAbility : undefined,
    mode,
    score: bestAbilityScore,
    breakdown: noAbilityBreakdown,
=======
  const noise     = abilityNoise(difficulty);
  const finalUse  = bestAbility !== undefined
                  && (bestAbilityScore + noise) > threshold;

  return {
    useAbility:  finalUse,
    abilityType: finalUse ? bestAbility : undefined,
    mode,
    score:       bestAbilityScore,
    breakdown:   noAbilityBreakdown,
>>>>>>> 765f6de734d6ad6d1dd61f8dfa220559988ac639
  };
}

// ──────────────────────────────── Card selection ────────────────────────────────

function pickRandom(count: number): Card[] {
  return [...ALL_CARDS].sort(() => Math.random() - 0.5).slice(0, count);
}

function pickBalanced(count: number): Card[] {
  const top = [...ALL_CARDS]
    .sort((a, b) => cardPower(b) - cardPower(a))
    .slice(0, Math.ceil(ALL_CARDS.length / 2));
  const shuffled = [...top].sort(() => Math.random() - 0.5);
  return Array.from({ length: count }, (_, i) => shuffled[i % shuffled.length]);
}

function pickBalancedHard(count: number): Card[] {
  // مستوى 3: أفضل الثلث بدل النصف → أقوى من متوسط
  const top = [...ALL_CARDS]
    .sort((a, b) => cardPower(b) - cardPower(a))
    .slice(0, Math.ceil(ALL_CARDS.length / 3));
  const shuffled = [...top].sort(() => Math.random() - 0.5);
  return Array.from({ length: count }, (_, i) => shuffled[i % shuffled.length]);
}

/**
 * مستوى 4 و5: يختار بذكاء ضد بطاقات اللاعب
 * مع عشوائية: 4 → 5٪، 5 → 3٪
 */
function pickSmart(count: number, playerCards: Card[], randomnessFraction: number): Card[] {
<<<<<<< HEAD
  const memory = getBotMemory();
=======
  const memory   = getBotMemory();
>>>>>>> 765f6de734d6ad6d1dd61f8dfa220559988ac639
  const selected: Card[] = [];

  for (let i = 0; i < count; i++) {
    const playerCard = playerCards[i % playerCards.length];
<<<<<<< HEAD
    const pool = ALL_CARDS.filter(c => !selected.some(s => s.id === c.id));
=======
    const pool       = ALL_CARDS.filter(c => !selected.some(s => s.id === c.id));
>>>>>>> 765f6de734d6ad6d1dd61f8dfa220559988ac639

    // عشوائية خفيفة: بنسبة randomnessFraction يختار عشوائياً من أفضل 5 بدل الأول
    const scored = pool.map(card => ({
      card,
      score: cardPowerAgainst(card, playerCard)
        + (card.element !== playerCard.element
<<<<<<< HEAD
          && (memory.playerFavoredElements[playerCard.element] ?? 0) >= 2 ? 10 : 0),
=======
           && (memory.playerFavoredElements[playerCard.element] ?? 0) >= 2 ? 10 : 0),
>>>>>>> 765f6de734d6ad6d1dd61f8dfa220559988ac639
    }));
    scored.sort((a, b) => b.score - a.score);

    if (Math.random() < randomnessFraction) {
      // اختر بشكل عشوائي من أفضل 5 كروت
      const top5 = scored.slice(0, Math.min(5, scored.length));
      selected.push(top5[Math.floor(Math.random() * top5.length)].card);
    } else {
      selected.push(scored[0].card);
    }
  }

  return selected;
}

export function getBotCards(
  count:      number,
  difficulty: DifficultyLevel,
  playerCards?: Card[],
): Card[] {
  if (difficulty <= 1) return pickRandom(count);
  if (difficulty === 2) return pickBalanced(count);
  if (difficulty === 3) return pickBalancedHard(count);
  if (difficulty === 4) return pickSmart(count, playerCards ?? [], 0.05); // 5٪ عشوائية
  return pickSmart(count, playerCards ?? [], 0.03);                        // 3٪ عشوائية
}

// ──────────────────────────────── Strategy label ────────────────────────────────
export function getBotStrategyDescription(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case 1: return 'البوت يختار عشوائياً بدون استراتيجية';
    case 2: return 'البوت يختار من أفضل نصف الكروت ويستخدم القدرات بعشوائية';
    case 3: return 'البوت يختار من أقوى الكروت ويوقّت قدراته بذكاء';
    case 4: return 'البوت يحسب utility لكل قرار ويستغل نقاط ضعفك';
    case 5: return 'البوت يتذكر أنماطك، يضغط في الجولات الحرجة، ويحتفظ بأقوى قدرة للحظة المناسبة';
    default: return 'البوت يستخدم استراتيجية متوازنة';
  }
}