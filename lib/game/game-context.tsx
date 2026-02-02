import React, { createContext, useContext, useReducer, useState, ReactNode } from 'react';
import { Card, GameState, RoundResult, Effect, AbilityType, Side } from './types';
import { getRandomAbilities } from './abilities';
import type { DifficultyLevel } from '@/app/screens/difficulty';
import { determineRoundWinner } from './cards-data';
import { getBotCards } from './bot-ai';

// الحالة الأولية
const initialState: GameState = {
  playerDeck: [],
  botDeck: [],
  currentRound: 0,
  totalRounds: 0,
  playerScore: 3, // نقاط الصحة الابتدائية
  botScore: 3,
  roundResults: [],
  difficulty: 'medium',
  abilitiesEnabled: true,
  activeEffects: [],
  playerAbilities: [],
  botAbilities: [],
  usedAbilities: [],
};

const initialDifficulty: DifficultyLevel = 'medium';

const MAX_HP = 3;

const EFFECT_PRIORITY = {
  forcedOutcome: 100,
  silenceAbilities: 90,
  statModifiers: 80,
  starAdvantage: 80,
  preventHpLoss: 70,
  hpDelta: 60,
  rewards: 50,
  cleanseEffects: 10,
  sacrifice: 10,
} as const;

const ABILITY_ALIASES: Partial<Record<AbilityType, AbilityType>> = {
  Eclipse: 'LogicalEncounter',
  CancelAbility: 'Recall',
  Revive: 'Protection',
  Shambles: 'Arise',
  ConsecutiveLossBuff: 'Reinforcement',
  Lifesteal: 'Wipe',
  Revenge: 'Purge',
  Suicide: 'HalvePoints',
  Disaster: 'Seal',
  Compensation: 'DoubleOrNothing',
  Weakening: 'StarSuperiority',
  Misdirection: 'Reduction',
  StealAbility: 'Sacrifice',
  Rescue: 'Popularity',
  Trap: 'LogicalEncounter',
  ConvertDebuffsToBuffs: 'Recall',
  Avatar: 'Sacrifice',
  Penetration: 'Popularity',
  Pool: 'LogicalEncounter',
  Conversion: 'Recall',
  Shield: 'Protection',
  SwapClass: 'Arise',
  TakeIt: 'Reinforcement',
  Skip: 'Wipe',
  AddElement: 'Purge',
  Explosion: 'HalvePoints',
};

const getRoundNumber = (state: GameState) => state.currentRound + 1;

const getOppositeSide = (side: Side): Side => (side === 'player' ? 'bot' : 'player');

const isEffectActive = (effect: Effect, roundNumber: number) => {
  if (effect.createdAtRound > roundNumber) return false;
  if (effect.expiresAtRound !== undefined && roundNumber > effect.expiresAtRound) return false;
  if (effect.charges !== undefined && effect.charges <= 0) return false;
  return true;
};

const isEffectExpired = (effect: Effect, roundNumber: number) => {
  if (effect.expiresAtRound !== undefined && roundNumber >= effect.expiresAtRound) return true;
  if (effect.charges !== undefined && effect.charges <= 0) return true;
  return false;
};

const makeEffectId = (abilityType: AbilityType, side: Side, roundNumber: number) =>
  `${abilityType}-${side}-${roundNumber}-${Math.random().toString(36).slice(2, 6)}`;

const clampHp = (value: number) => Math.max(0, Math.min(MAX_HP, value));

// أنواع الإجراءات
type GameAction =
  | { type: 'SET_PLAYER_DECK'; payload: Card[] }
  | { type: 'SET_BOT_DECK'; payload: Card[] }
  | { type: 'SET_TOTAL_ROUNDS'; payload: number }
  | { type: 'START_BATTLE' }
  | { type: 'PLAY_ROUND' }
  | { type: 'RESET_GAME' }
  | { type: 'ADD_EFFECT'; payload: Effect }
  | { type: 'REMOVE_EFFECTS'; payload: { targetSide?: Side | 'all'; sourceSide?: Side | 'all' } }
  | { type: 'SET_DIFFICULTY'; payload: DifficultyLevel }
  | { type: 'SET_ABILITIES_ENABLED'; payload: boolean }
  | { type: 'USE_ABILITY'; payload: { abilityType: AbilityType; isPlayer: boolean; data?: Record<string, unknown> } };

// المخفض
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PLAYER_DECK':
      return {
        ...state,
        playerDeck: action.payload,
        totalRounds: action.payload.length,
      };

    case 'SET_BOT_DECK':
      return {
        ...state,
        botDeck: action.payload,
      };

    case 'SET_TOTAL_ROUNDS':
      return {
        ...state,
        totalRounds: action.payload,
      };

    case 'START_BATTLE':
      return {
        ...state,
        currentRound: 0,
        playerScore: MAX_HP,
        botScore: MAX_HP,
        roundResults: [],
        activeEffects: [],
        playerAbilities: state.abilitiesEnabled
          ? getRandomAbilities(3).map(type => ({ type, used: false }))
          : [],
        botAbilities: state.abilitiesEnabled
          ? getRandomAbilities(3).map(type => ({ type, used: false }))
          : [],
        usedAbilities: [],
      };

    case 'PLAY_ROUND': {
      if (state.currentRound >= state.totalRounds) {
        return state;
      }

      const playerCard = state.playerDeck[state.currentRound];
      const botCard = state.botDeck[state.currentRound];

      if (!playerCard || !botCard) {
        console.warn('Missing cards for this round.');
        return state;
      }

      const roundNumber = getRoundNumber(state);
      const activeEffects = state.abilitiesEnabled
        ? state.activeEffects.filter(effect => isEffectActive(effect, roundNumber))
        : [];

      const playerEffects = activeEffects.filter(
        effect => effect.targetSide === 'player' || effect.targetSide === 'all'
      );
      const botEffects = activeEffects.filter(
        effect => effect.targetSide === 'bot' || effect.targetSide === 'all'
      );

      const forcedOutcomeEffect = activeEffects
        .filter(effect => effect.kind === 'forcedOutcome')
        .filter(effect => {
          const data = effect.data as { appliesToRound?: number } | undefined;
          return !data?.appliesToRound || data.appliesToRound === roundNumber;
        })
        .sort((a, b) => b.priority - a.priority || b.createdAtRound - a.createdAtRound)[0];

      // onBeforeResolve: تطبيق المُعدّلات على الكروت
      const result = forcedOutcomeEffect
        ? {
            winner: forcedOutcomeEffect.sourceSide,
            playerDamage: 0,
            botDamage: 0,
            playerBaseDamage: 0,
            botBaseDamage: 0,
            playerElementAdvantage: 'neutral',
            botElementAdvantage: 'neutral',
          }
        : determineRoundWinner(
            playerCard,
            botCard,
            playerEffects,
            botEffects,
            state.abilitiesEnabled
          );

      // onResolve: نتيجة الجولة الأساسية
      const roundResult: RoundResult = {
        round: state.currentRound + 1,
        playerCard,
        botCard,
        playerDamage: result.playerDamage,
        botDamage: result.botDamage,
        playerBaseDamage: result.playerBaseDamage,
        botBaseDamage: result.botBaseDamage,
        playerElementAdvantage: result.playerElementAdvantage,
        botElementAdvantage: result.botElementAdvantage,
        winner: result.winner,
      };

      let playerHpDelta = 0;
      let botHpDelta = 0;

      if (result.winner === 'player') {
        botHpDelta -= 1;
      } else if (result.winner === 'bot') {
        playerHpDelta -= 1;
      }

      // onAfterResolve: تأثيرات ما بعد النتيجة
      const effectsToRemove = new Set<string>();
      const effectsToReplace = new Map<string, Effect>();
      const effectsToAdd: Effect[] = [];

      const orderedEffects = [...activeEffects].sort((a, b) => a.priority - b.priority);

      orderedEffects.forEach(effect => {
        switch (effect.kind) {
          case 'protection': {
            const data = effect.data as { appliesToRound?: number } | undefined;
            if (data?.appliesToRound !== undefined && data.appliesToRound !== roundNumber) {
              break;
            }
            if (effect.targetSide === 'player' && playerHpDelta < 0) {
              playerHpDelta = Math.min(0, playerHpDelta + 1);
              effectsToRemove.add(effect.id);
            }
            if (effect.targetSide === 'bot' && botHpDelta < 0) {
              botHpDelta = Math.min(0, botHpDelta + 1);
              effectsToRemove.add(effect.id);
            }
            break;
          }

          case 'doubleOrNothing': {
            const data = effect.data as { appliesToRound?: number } | undefined;
            if (!data?.appliesToRound || data.appliesToRound === roundNumber) {
              if (result.winner === effect.sourceSide) {
                if (effect.sourceSide === 'player') playerHpDelta += 1;
                if (effect.sourceSide === 'bot') botHpDelta += 1;
              } else if (result.winner === getOppositeSide(effect.sourceSide)) {
                if (effect.sourceSide === 'player') playerHpDelta -= 2;
                if (effect.sourceSide === 'bot') botHpDelta -= 2;
              }
              effectsToRemove.add(effect.id);
            }
            break;
          }

          case 'prediction': {
            const data = effect.data as {
              predictions?: Record<number, 'win' | 'loss'>;
              rewardHp?: number;
            } | undefined;
            const prediction = data?.predictions?.[roundNumber];
            if (!prediction) break;

            const expectedWinner =
              prediction === 'win'
                ? effect.sourceSide
                : getOppositeSide(effect.sourceSide);
            if (result.winner === expectedWinner) {
              const reward = data?.rewardHp ?? 0;
              if (effect.sourceSide === 'player') playerHpDelta += reward;
              if (effect.sourceSide === 'bot') botHpDelta += reward;
            }

            // إزالة توقع الجولة بعد مرورها بغض النظر عن صحة التوقع.
            const nextPredictions = { ...(data?.predictions ?? {}) };
            delete nextPredictions[roundNumber];
            const nextCharges = Math.max(0, (effect.charges ?? 0) - 1);

            if (nextCharges <= 0 || Object.keys(nextPredictions).length === 0) {
              effectsToRemove.add(effect.id);
            } else {
              effectsToReplace.set(effect.id, {
                ...effect,
                charges: nextCharges,
                data: { ...data, predictions: nextPredictions },
              });
            }
            break;
          }

          case 'fortify': {
            if (result.winner === effect.sourceSide) {
              effectsToAdd.push({
                id: makeEffectId('Reinforcement', effect.sourceSide, roundNumber),
                kind: 'statModifier',
                sourceSide: effect.sourceSide,
                targetSide: effect.sourceSide,
                createdAtRound: roundNumber,
                expiresAtRound: state.totalRounds,
                priority: EFFECT_PRIORITY.statModifiers,
                data: { stat: 'defense', amount: 1 },
              });
              effectsToRemove.add(effect.id);
            }
            break;
          }

          case 'sacrifice': {
            const opponentSide = getOppositeSide(effect.sourceSide);
            if (result.winner === opponentSide) {
              const removableEffects = activeEffects
                .filter(active => active.id !== effect.id)
                .filter(
                  active =>
                    active.sourceSide === opponentSide || active.targetSide === opponentSide
                )
                .sort(
                  (a, b) => b.priority - a.priority || a.createdAtRound - b.createdAtRound
                );
              if (removableEffects.length > 0) {
                effectsToRemove.add(removableEffects[0].id);
              }
            }
            effectsToRemove.add(effect.id);
            break;
          }
        }
      });

      let nextEffects = state.activeEffects
        .filter(effect => !effectsToRemove.has(effect.id))
        .map(effect => effectsToReplace.get(effect.id) ?? effect);

      if (effectsToAdd.length > 0) {
        nextEffects = [...nextEffects, ...effectsToAdd];
      }

      if (forcedOutcomeEffect) {
        nextEffects = nextEffects.filter(effect => effect.id !== forcedOutcomeEffect.id);
      }

      // onRoundEnd: تنظيف التأثيرات المنتهية
      nextEffects = nextEffects.filter(effect => !isEffectExpired(effect, roundNumber));
      if (!state.abilitiesEnabled) {
        nextEffects = [];
      }

      return {
        ...state,
        currentRound: state.currentRound + 1,
        playerScore: clampHp(state.playerScore + playerHpDelta),
        botScore: clampHp(state.botScore + botHpDelta),
        roundResults: [...state.roundResults, roundResult],
        activeEffects: nextEffects,
        usedAbilities: [],
      };
    }

    case 'USE_ABILITY': {
      const { abilityType, isPlayer, data } = action.payload;
      if (!state.abilitiesEnabled) {
        return state;
      }
      const resolvedAbilityType = ABILITY_ALIASES[abilityType] ?? abilityType;
      const side: Side = isPlayer ? 'player' : 'bot';
      const opponentSide = getOppositeSide(side);
      const roundNumber = getRoundNumber(state);

      const isSealed = state.activeEffects.some(
        effect =>
          effect.kind === 'silenceAbilities' &&
          isEffectActive(effect, roundNumber) &&
          (effect.targetSide === side || effect.targetSide === 'all')
      );
      if (isSealed) {
        console.log(`⛔ القدرة ${abilityType} مختومة!`);
        return state;
      }

      const abilityStateList = isPlayer ? state.playerAbilities : state.botAbilities;
      const abilityIndex = abilityStateList.findIndex(a => a.type === abilityType && !a.used);
      if (abilityIndex === -1) {
        console.warn(`القدرة ${abilityType} غير متاحة أو مستخدمة بالفعل`);
        return state;
      }

      let nextState: GameState = state;
      let nextEffects = state.activeEffects;

      switch (resolvedAbilityType) {
        case 'LogicalEncounter': {
          const rawPredictions = (data?.predictions ?? {}) as Record<string, 'win' | 'loss'>;
          const predictions: Record<number, 'win' | 'loss'> = {};
          const allowedRounds = new Set(
            [roundNumber + 1, roundNumber + 2].filter((round) => round <= state.totalRounds)
          );
          Object.entries(rawPredictions).forEach(([key, value]) => {
            const parsed = Number(key);
            if (
              !Number.isNaN(parsed) &&
              allowedRounds.has(parsed) &&
              (value === 'win' || value === 'loss')
            ) {
              predictions[parsed] = value;
            }
          });

          const rounds = Object.keys(predictions).map(Number);
          if (rounds.length === 0) {
            return state;
          }

          nextEffects = [
            ...nextEffects,
            {
              id: makeEffectId('LogicalEncounter', side, roundNumber),
              kind: 'prediction',
              sourceSide: side,
              targetSide: side,
              createdAtRound: roundNumber,
              expiresAtRound: Math.max(...rounds),
              charges: rounds.length,
              priority: EFFECT_PRIORITY.rewards,
              data: { predictions, rewardHp: 2 },
            },
          ];
          break;
        }

        case 'Recall': {
          const lastRound = state.roundResults[state.roundResults.length - 1];
          if (lastRound) {
            if (side === 'player') {
              const nextDeck = [...state.playerDeck];
              nextDeck[state.currentRound] = lastRound.playerCard;
              nextState = { ...nextState, playerDeck: nextDeck };
            } else {
              const nextDeck = [...state.botDeck];
              nextDeck[state.currentRound] = lastRound.botCard;
              nextState = { ...nextState, botDeck: nextDeck };
            }
          }
          break;
        }

        case 'Protection': {
          const appliesToRound = roundNumber + 1;
          nextEffects = [
            ...nextEffects,
            {
              id: makeEffectId('Protection', side, roundNumber),
              kind: 'protection',
              sourceSide: side,
              targetSide: side,
              createdAtRound: roundNumber,
              expiresAtRound: appliesToRound,
              charges: 1,
              priority: EFFECT_PRIORITY.preventHpLoss,
              data: { appliesToRound },
            },
          ];
          break;
        }

        case 'Arise': {
          const opponentCard =
            side === 'player'
              ? state.botDeck[state.currentRound]
              : state.playerDeck[state.currentRound];
          if (opponentCard) {
            if (side === 'player') {
              const nextDeck = [...state.playerDeck];
              nextDeck[state.currentRound] = opponentCard;
              nextState = { ...nextState, playerDeck: nextDeck };
            } else {
              const nextDeck = [...state.botDeck];
              nextDeck[state.currentRound] = opponentCard;
              nextState = { ...nextState, botDeck: nextDeck };
            }
          }
          break;
        }

        case 'Reinforcement': {
          nextEffects = [
            ...nextEffects,
            {
              id: makeEffectId('Reinforcement', side, roundNumber),
              kind: 'fortify',
              sourceSide: side,
              targetSide: side,
              createdAtRound: roundNumber,
              priority: EFFECT_PRIORITY.rewards,
              data: { stat: 'defense', amount: 1 },
            },
          ];
          break;
        }

        case 'Wipe': {
          nextEffects = nextEffects.filter(
            effect => effect.targetSide !== side && effect.sourceSide !== side
          );
          break;
        }

        case 'Purge': {
          nextEffects = [];
          break;
        }

        case 'HalvePoints': {
          nextEffects = [
            ...nextEffects,
            {
              id: makeEffectId('HalvePoints', side, roundNumber),
              kind: 'halvePoints',
              sourceSide: side,
              targetSide: opponentSide,
              createdAtRound: roundNumber,
              expiresAtRound: roundNumber,
              charges: 1,
              priority: EFFECT_PRIORITY.statModifiers,
              data: { multiplier: 0.5, stats: ['attack', 'defense'] },
            },
          ];
          break;
        }

        case 'Seal': {
          nextEffects = [
            ...nextEffects,
            {
              id: makeEffectId('Seal', side, roundNumber),
              kind: 'silenceAbilities',
              sourceSide: side,
              targetSide: opponentSide,
              createdAtRound: roundNumber,
              expiresAtRound: roundNumber + 4,
              priority: EFFECT_PRIORITY.silenceAbilities,
              data: { rounds: 5 },
            },
          ];
          break;
        }

        case 'DoubleOrNothing': {
          nextEffects = [
            ...nextEffects,
            {
              id: makeEffectId('DoubleOrNothing', side, roundNumber),
              kind: 'doubleOrNothing',
              sourceSide: side,
              targetSide: side,
              createdAtRound: roundNumber,
              expiresAtRound: roundNumber,
              charges: 1,
              priority: EFFECT_PRIORITY.hpDelta,
              data: { appliesToRound: roundNumber },
            },
          ];
          break;
        }

        case 'StarSuperiority': {
          nextEffects = [
            ...nextEffects,
            {
              id: makeEffectId('StarSuperiority', side, roundNumber),
              kind: 'starAdvantage',
              sourceSide: side,
              targetSide: side,
              createdAtRound: roundNumber,
              expiresAtRound: roundNumber,
              charges: 1,
              priority: EFFECT_PRIORITY.starAdvantage,
            },
          ];
          break;
        }

        case 'Reduction': {
          nextEffects = [
            ...nextEffects,
            {
              id: makeEffectId('Reduction', side, roundNumber),
              kind: 'statModifier',
              sourceSide: side,
              targetSide: opponentSide,
              createdAtRound: roundNumber,
              expiresAtRound: roundNumber,
              charges: 1,
              priority: EFFECT_PRIORITY.statModifiers,
              data: { stat: 'attack', amount: -2 },
            },
          ];
          break;
        }

        case 'Sacrifice': {
          nextEffects = [
            ...nextEffects,
            {
              id: makeEffectId('Sacrifice', side, roundNumber),
              kind: 'sacrifice',
              sourceSide: side,
              targetSide: opponentSide,
              createdAtRound: roundNumber,
              expiresAtRound: roundNumber,
              charges: 1,
              priority: EFFECT_PRIORITY.sacrifice,
            },
          ];
          break;
        }

        case 'Popularity': {
          const selectedRound = Number(data?.round);
          if (
            !Number.isInteger(selectedRound) ||
            selectedRound <= roundNumber ||
            selectedRound > state.totalRounds
          ) {
            return state;
          }
          nextEffects = [
            ...nextEffects,
            {
              id: makeEffectId('Popularity', side, roundNumber),
              kind: 'forcedOutcome',
              sourceSide: side,
              targetSide: side,
              createdAtRound: roundNumber,
              expiresAtRound: selectedRound,
              charges: 1,
              priority: EFFECT_PRIORITY.forcedOutcome,
              data: { appliesToRound: selectedRound },
            },
          ];
          break;
        }
      }

      const newAbilityStateList = [...abilityStateList];
      newAbilityStateList[abilityIndex] = {
        ...newAbilityStateList[abilityIndex],
        used: true,
      };

      return {
        ...nextState,
        activeEffects: nextEffects,
        usedAbilities: [...state.usedAbilities, abilityType],
        playerAbilities: isPlayer ? newAbilityStateList : state.playerAbilities,
        botAbilities: isPlayer ? state.botAbilities : newAbilityStateList,
      };
    }

    case 'ADD_EFFECT':
      return {
        ...state,
        activeEffects: [...state.activeEffects, action.payload],
      };

    case 'REMOVE_EFFECTS': {
      const { targetSide, sourceSide } = action.payload;
      return {
        ...state,
        activeEffects: state.activeEffects.filter(effect => {
          const targetMatch =
            !targetSide || targetSide === 'all' || effect.targetSide === targetSide;
          const sourceMatch =
            !sourceSide || sourceSide === 'all' || effect.sourceSide === sourceSide;
          return !(targetMatch && sourceMatch);
        }),
      };
    }

    case 'SET_DIFFICULTY':
      return {
        ...state,
        difficulty: action.payload,
      };

    case 'SET_ABILITIES_ENABLED':
      return {
        ...state,
        abilitiesEnabled: action.payload,
        activeEffects: action.payload ? state.activeEffects : [],
        playerAbilities: action.payload ? state.playerAbilities : [],
        botAbilities: action.payload ? state.botAbilities : [],
      };

    case 'RESET_GAME':
      return { ...initialState, difficulty: state.difficulty };

    default:
      return state;
  }
}

// السياق
interface GameContextType {
  state: GameState;
  difficulty: DifficultyLevel;
  setPlayerDeck: (cards: Card[]) => void;
  setTotalRounds: (rounds: number) => void;
  startBattle: (playerDeck?: Card[]) => void;
  playRound: () => void;
  addEffect: (effect: Effect) => void;
  removeEffects: (targetSide?: Side | 'all', sourceSide?: Side | 'all') => void;
  useAbility: (abilityType: AbilityType, data?: Record<string, unknown>) => void;
  resetGame: () => void;
  setDifficulty: (level: DifficultyLevel) => void;
  setAbilitiesEnabled: (enabled: boolean) => void;
  isGameOver: boolean;
  currentPlayerCard: Card | null;
  currentBotCard: Card | null;
  lastRoundResult: RoundResult | null;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// المزود
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [difficulty, setDifficultyState] = useState<DifficultyLevel>(initialDifficulty);

  const setPlayerDeck = (cards: Card[]) => {
    dispatch({ type: 'SET_PLAYER_DECK', payload: cards });
  };

  const setTotalRounds = (rounds: number) => {
    dispatch({ type: 'SET_TOTAL_ROUNDS', payload: rounds });
  };

  const startBattle = (playerDeck?: Card[]) => {
    const deck = playerDeck || state.playerDeck;
    if (playerDeck) {
      dispatch({ type: 'SET_PLAYER_DECK', payload: deck });
    }
    const botDeck = getBotCards(deck.length, difficulty, deck);
    dispatch({ type: 'SET_BOT_DECK', payload: botDeck });
    dispatch({ type: 'START_BATTLE' });
  };

  const playRound = () => {
    dispatch({ type: 'PLAY_ROUND' });
  };

  const addEffect = (effect: Effect) => {
    dispatch({ type: 'ADD_EFFECT', payload: effect });
  };

  const removeEffects = (targetSide?: Side | 'all', sourceSide?: Side | 'all') => {
    dispatch({ type: 'REMOVE_EFFECTS', payload: { targetSide, sourceSide } });
  };

  const useAbility = (abilityType: AbilityType, data?: Record<string, unknown>) => {
    dispatch({ type: 'USE_ABILITY', payload: { abilityType, isPlayer: true, data } });
  };

  const resetGame = () => {
    dispatch({ type: 'RESET_GAME' });
  };

  const setDifficulty = (level: DifficultyLevel) => {
    setDifficultyState(level);
    dispatch({ type: 'SET_DIFFICULTY', payload: level });
  };

  const setAbilitiesEnabled = (enabled: boolean) => {
    dispatch({ type: 'SET_ABILITIES_ENABLED', payload: enabled });
  };

  const isGameOver = state.currentRound >= state.totalRounds && state.totalRounds > 0;

  const currentPlayerCard = state.currentRound < state.totalRounds
    ? state.playerDeck[state.currentRound]
    : null;

  const currentBotCard = state.currentRound < state.totalRounds
    ? state.botDeck[state.currentRound]
    : null;

  const lastRoundResult = state.roundResults.length > 0
    ? state.roundResults[state.roundResults.length - 1]
    : null;

  return (
    <GameContext.Provider
      value={{
        state,
        difficulty,
        setPlayerDeck,
        setTotalRounds,
        startBattle,
        playRound,
        addEffect,
        removeEffects,
        useAbility,
        resetGame,
        setDifficulty,
        setAbilitiesEnabled,
        isGameOver,
        currentPlayerCard,
        currentBotCard,
        lastRoundResult,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

// هوك للاستخدام
export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
