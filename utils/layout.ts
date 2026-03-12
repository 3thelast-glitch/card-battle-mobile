import { useWindowDimensions } from 'react-native';

/**
 * Breakpoint sizes for landscape-responsive layouts.
 *
 * sm  – normal phones in landscape  (< 700px wide)
 * md  – S23 Ultra / wide phones     (700–899px wide)
 * lg  – tablets / very wide phones  (900–1199px wide)
 * xl  – large tablets / desktop     (≥ 1200px wide)
 */
export type LayoutSize = 'sm' | 'md' | 'lg' | 'xl';

export interface LandscapeLayout {
    width: number;
    height: number;
    isLandscape: boolean;
    size: LayoutSize;
}

/**
 * Single source of truth for landscape-responsive layout values.
 * Re-renders whenever the window dimensions change (e.g. device rotation).
 */
export const useLandscapeLayout = (): LandscapeLayout => {
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

    const size: LayoutSize = (() => {
        if (width >= 1200) return 'xl'; // large tablets / desktop
        if (width >= 900) return 'lg';  // tablets / very wide phones
        if (width >= 700) return 'md';  // S23 Ultra class
        return 'sm';                    // normal phones
    })();

    return { width, height, isLandscape, size };
};

// ─── Shared responsive tokens ────────────────────────────────────────────────

/** Horizontal padding per size breakpoint. */
export const LAYOUT_PADDING: Record<LayoutSize, number> = {
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
};

/**
 * Card width as a fraction of total screen width.
 * Height = width * 1.5  →  2:3 aspect ratio.
 */
export const CARD_WIDTH_FACTOR: Record<LayoutSize, number> = {
    sm: 0.42,
    md: 0.36,
    lg: 0.30,
    xl: 0.26,
};

/** Card scale factor for EpicCardTemplate / EpicCardTemplate scale prop. */
export const CARD_SCALE: Record<LayoutSize, number> = {
    sm: 0.44,
    md: 0.38,
    lg: 0.32,
    xl: 0.28,
};

/** Number of grid columns for list/gallery screens. */
export const GRID_COLUMNS: Record<LayoutSize, number> = {
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
};
