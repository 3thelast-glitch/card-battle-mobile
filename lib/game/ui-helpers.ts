import { Effect, Side } from './types';

export type PredictionSelections = Record<number, 'win' | 'loss'>;

export const getUpcomingPredictionRounds = (currentRound: number, totalRounds: number) =>
  [currentRound + 1, currentRound + 2].filter((round) => round <= totalRounds);

export const getRemainingRounds = (currentRound: number, totalRounds: number) =>
  Array.from(
    { length: Math.max(0, totalRounds - currentRound) },
    (_, index) => currentRound + 1 + index
  );

export const isPredictionComplete = (
  upcomingRounds: number[],
  selections: PredictionSelections
) =>
  upcomingRounds.length > 0 && upcomingRounds.every((round) => selections[round]);

export const buildPredictionSummary = (activeEffects: Effect[], sourceSide: Side = 'player') => {
  const predictionEffect = activeEffects.find(
    (effect) => effect.kind === 'prediction' && effect.sourceSide === sourceSide
  );
  const predictions =
    (predictionEffect?.data as { predictions?: Record<number, 'win' | 'loss'> } | undefined)
      ?.predictions ?? {};
  const entries = Object.entries(predictions)
    .map(([round, outcome]) => ({ round: Number(round), outcome }))
    .filter((entry) => !Number.isNaN(entry.round))
    .sort((a, b) => a.round - b.round)
    .map((entry) => `Round ${entry.round}: ${entry.outcome === 'win' ? 'Win' : 'Loss'}`);
  return entries.length > 0 ? entries.join(' | ') : '';
};
