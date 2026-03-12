/**
 * Card Gradient Definitions
 * All rarity-based gradient configurations in one place.
 */

import type { CardRarityName } from '@/types/card.types';

// ─── Gradients ────────────────────────────────────────────────────────────────

/**
 * 3-stop gradients for each rarity.
 * Used as LinearGradient colors or layered View backgrounds.
 */
export const CARD_GRADIENTS: Record<CardRarityName, readonly [string, string, string]> = {
    common: ['#1e3a8a', '#2563eb', '#3B82F6'],
    rare: ['#78350f', '#d97706', '#F59E0B'],
    epic: ['#4a1d96', '#7c3aed', '#8B5CF6'],
    legendary: ['#7f1d1d', '#b91c1c', '#EF4444'],
} as const;

// ─── Border Colors ─────────────────────────────────────────────────────────────

export const CARD_BORDERS: Record<CardRarityName, string> = {
    common: '#4F46E5',
    rare: '#F59E0B',
    epic: '#8B5CF6',
    legendary: '#EF4444',
} as const;

// ─── Glow Colors ──────────────────────────────────────────────────────────────

export const CARD_GLOWS: Record<CardRarityName, string | null> = {
    common: null,
    rare: '#fbbf24',
    epic: '#8B5CF6',
    legendary: '#ef4444',
} as const;

// ─── Badge Colors ─────────────────────────────────────────────────────────────

export const CARD_BADGE_COLORS: Record<CardRarityName, string> = {
    common: '#6366f1',
    rare: '#f59e0b',
    epic: '#8b5cf6',
    legendary: '#ef4444',
} as const;

// ─── Rarity Labels ────────────────────────────────────────────────────────────

export const CARD_RARITY_LABELS: Record<CardRarityName, { en: string; ar: string }> = {
    common: { en: 'Common', ar: 'عادي' },
    rare: { en: 'Rare', ar: 'نادر' },
    epic: { en: 'Epic', ar: 'ملحمي' },
    legendary: { en: 'Legendary', ar: 'أسطوري' },
} as const;

// ─── Shadow Configuration ─────────────────────────────────────────────────────

export interface CardShadowConfig {
    shadowRadius: number;
    shadowOpacity: number;
}

export const CARD_SHADOWS: Record<CardRarityName, CardShadowConfig> = {
    common: { shadowRadius: 8, shadowOpacity: 0.35 },
    rare: { shadowRadius: 14, shadowOpacity: 0.5 },
    epic: { shadowRadius: 18, shadowOpacity: 0.6 },
    legendary: { shadowRadius: 24, shadowOpacity: 0.7 },
} as const;

// ─── Feature Flags ────────────────────────────────────────────────────────────

export const CARD_HAS_GLOW: Record<CardRarityName, boolean> = {
    common: false,
    rare: false,
    epic: true,
    legendary: true,
} as const;

export const CARD_HAS_PARTICLES: Record<CardRarityName, boolean> = {
    common: false,
    rare: false,
    epic: false,
    legendary: true,
} as const;

// ─── Rarity order ─────────────────────────────────────────────────────────────

export const RARITY_ORDER: Record<CardRarityName, number> = {
    common: 0,
    rare: 1,
    epic: 2,
    legendary: 3,
} as const;

/** Sort cards by rarity (high to low) */
export function sortByRarity<T extends { rarity: CardRarityName }>(cards: T[]): T[] {
    return [...cards].sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]);
}
