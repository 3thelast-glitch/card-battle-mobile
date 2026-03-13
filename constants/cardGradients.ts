/**
 * Card Gradient Definitions
 * All rarity-based gradient configurations in one place.
 *
 * GRADIENT STRUCTURE (3 LinearGradient layers):
 *
 *  ┌──────────────────────────────────────────────────────────────┐
 *  │ TOP layer     → subtle highlight, covers top 55% of card     │
 *  │               → opacity 0.35, vertical gradient              │
 *  │ MID layer     → mid-tone blend, covers bottom 70%            │
 *  │               → opacity 0.70, diagonal gradient              │
 *  │ BASE layer    → full-card solid base, fills entire card       │
 *  │               → opacity 1.00, vertical gradient (dark→mid)   │
 *  └──────────────────────────────────────────────────────────────┘
 */

import type { CardRarityName } from '@/types/card.types';

// ─── Layer Gradient Type ──────────────────────────────────────────────────────

export interface CardGradientLayers {
    /** Full-card base layer – dark to mid, vertical, opacity 1.0 */
    base: readonly [string, string, string];
    /** Mid blend layer – diagonal overlay, opacity 0.70 */
    mid: readonly [string, string, string];
    /** Top highlight layer – covers top 55%, opacity 0.35 */
    top: readonly [string, string, string];
    /** Flat fallback color for View backgrounds (no LinearGradient) */
    flat: string;
}

// ─── Layered Gradients ────────────────────────────────────────────────────────

export interface CardGradientLayers {
    base: readonly [string, string, string];
    mid: readonly [string, string, string];
    top: readonly [string, string, string];
    flat: string;
}

export interface CardGradientLayers {
    base: readonly [string, string, string];
    mid: readonly [string, string, string];
    top: readonly [string, string, string];
    flat: string;
}

export const CARD_GRADIENTS: Record<CardRarityName, CardGradientLayers> = {
    common: {
        flat: '#1e3a8a',
        base: ['#0f1f4a', '#1e3a8a', '#1d4ed8'],
        mid: ['#1d4ed8', '#2563eb', '#1e3a8a'],
        top: ['#3b82f6', '#2563eb', 'transparent'],
    },
    rare: {
        flat: '#78350f',
        base: ['#3d1a06', '#78350f', '#92400e'],
        mid: ['#b45309', '#d97706', '#78350f'],
        top: ['#fbbf24', '#f59e0b', 'transparent'],
    },
    epic: {
        flat: '#4a1d96',
        base: ['#2e1065', '#4a1d96', '#5b21b6'],
        mid: ['#6d28d9', '#7c3aed', '#4a1d96'],
        top: ['#a78bfa', '#8b5cf6', 'transparent'],
    },
    legendary: {
        flat: '#7f1d1d',
        base: ['#450a0a', '#7f1d1d', '#991b1b'],
        mid: ['#b91c1c', '#dc2626', '#7f1d1d'],
        top: ['#f87171', '#ef4444', 'transparent'],
    },
} as const;



// ─── Border Colors ────────────────────────────────────────────────────────────

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

// ─── Rarity Order ─────────────────────────────────────────────────────────────

export const RARITY_ORDER: Record<CardRarityName, number> = {
    common: 0,
    rare: 1,
    epic: 2,
    legendary: 3,
} as const;

/** Sort cards by rarity descending (Legendary first) */
export function sortByRarity<T extends { rarity: CardRarityName }>(cards: T[]): T[] {
    return [...cards].sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]);
}
