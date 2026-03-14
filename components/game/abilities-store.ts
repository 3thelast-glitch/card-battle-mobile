/**
 * abilities-store.ts
 * مخزن بسيط لحفظ القدرات المعطّلة في AsyncStorage.
 * يُستخدم في شاشة القدرات وفي game-context لاستثنائها من اللعب.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'disabled_abilities_v1';

/** اقرأ مجموعة الـ IDs المعطّلة */
export async function getDisabledAbilityIds(): Promise<Set<number>> {
    try {
        const raw = await AsyncStorage.getItem(KEY);
        if (!raw) return new Set();
        const arr = JSON.parse(raw) as number[];
        return new Set(arr);
    } catch {
        return new Set();
    }
}

/** احفظ مجموعة الـ IDs المعطّلة */
export async function saveDisabledAbilityIds(ids: Set<number>): Promise<void> {
    try {
        await AsyncStorage.setItem(KEY, JSON.stringify([...ids]));
    } catch { }
}