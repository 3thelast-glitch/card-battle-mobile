import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ui/ThemedText';
import { AbilityCard } from '@/components/game/ability-card';
import { useRouter } from 'expo-router';
import { ArrowLeft, Save } from 'lucide-react-native';
// Using any safely to handle the case where the user has or hasn't saved the file yet.
import * as AbilitiesData from '@/data/abilities';

type FilterType = 'All' | 'Common' | 'Rare' | 'Epic' | 'Legendary';

const FILTER_LABELS: Record<FilterType, string> = {
    All: 'All',
    Common: 'Common',
    Rare: 'Rare',
    Epic: 'ملحمية', // Epic in Arabic as requested
    Legendary: 'أسطورية', // Legendary in Arabic
};

export default function AbilitiesScreen() {
    const router = useRouter();
    const [filter, setFilter] = useState<FilterType>('All');
    const [saveText, setSaveText] = useState('حفظ التعديلات');

    const handleSave = () => {
        setSaveText('Saved ✓');
        setTimeout(() => setSaveText('حفظ التعديلات'), 2000);
    };

    // Safely extract the abilities, prioritizing the separate arrays if they exist,
    // falling back to the generic `abilities` array if they haven't saved their file changes yet.
    const allAbilities = useMemo(() => {
        const data = AbilitiesData as any;
        if (data.commonAbilities || data.rareAbilities || data.epicAbilities || data.legendaryAbilities) {
            return [
                ...(data.commonAbilities || []),
                ...(data.rareAbilities || []),
                ...(data.epicAbilities || []),
                ...(data.legendaryAbilities || []),
            ];
        }
        return data.abilities || [];
    }, []);

    const filteredAbilities = useMemo(() => {
        if (filter === 'All') return allAbilities;
        return allAbilities.filter((a: any) => a.rarity === filter);
    }, [allAbilities, filter]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View className="flex-1 px-4">
                {/* Fixed Back Button */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute top-6 left-6 z-50 flex-row items-center justify-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md rounded-xl border border-white/10 transition-all cursor-pointer"
                    activeOpacity={0.7}
                >
                    <ArrowLeft size={16} color="#fff" />
                    <ThemedText className="text-white text-sm font-bold">رجوع</ThemedText>
                </TouchableOpacity>

                <View className="pt-6 pb-4 items-center justify-center mt-12">
                    <ThemedText className="text-[40px] text-orange-500" style={{ textShadowColor: 'rgba(249, 115, 22, 0.8)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15 }}>
                        القدرات
                    </ThemedText>
                </View>

                <View className="flex-row justify-center mb-6 gap-2 flex-wrap">
                    {(['All', 'Common', 'Rare', 'Epic', 'Legendary'] as FilterType[]).map((tab) => {
                        const isActive = filter === tab;
                        return (
                            <TouchableOpacity
                                key={tab}
                                className={`px-4 py-2 rounded-full border ${isActive
                                    ? 'bg-orange-500/20 border-orange-500/60'
                                    : 'bg-white/5 border-white/10'
                                    }`}
                                onPress={() => setFilter(tab)}
                                activeOpacity={0.7}
                            >
                                <ThemedText className={`text-sm ${isActive ? 'text-orange-500' : 'text-white/60'}`}>
                                    {FILTER_LABELS[tab]}
                                </ThemedText>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <ScrollView
                    className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}
                >
                    {filteredAbilities.length > 0 ? (
                        <View className="flex-row flex-wrap justify-center gap-4 w-full">
                            {filteredAbilities.map((item: any, index: number) => (
                                <View
                                    key={item.id ? item.id.toString() : `ability-${index}`}
                                    className="shrink-0"
                                    style={{
                                        width: 220,
                                        height: 330,
                                    }}
                                >
                                    <AbilityCard ability={item} />
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View className="w-full flex-1 items-center justify-center pt-20">
                            <ThemedText className="text-lg text-white/40 text-center">لا توجد قدرات في هذا القسم</ThemedText>
                        </View>
                    )}
                </ScrollView>

                {/* Floating Save Button */}
                <TouchableOpacity
                    onPress={handleSave}
                    className="absolute bottom-8 right-8 z-50 flex-row items-center justify-center gap-2 px-6 py-3 bg-emerald-600 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-full shadow-[0_4px_20px_rgba(16,185,129,0.4)] hover:-translate-y-1 hover:shadow-[0_6px_25px_rgba(16,185,129,0.6)] transition-all duration-300 cursor-pointer"
                    activeOpacity={0.8}
                >
                    <Save size={18} color="#fff" />
                    <ThemedText className="text-white font-bold text-base">{saveText}</ThemedText>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// Keeping safeArea and base container styles just in case NativeWind isn't perfectly handling the root SafeAreaView
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#020617', // slate-950 equivalent for safety
    },
});