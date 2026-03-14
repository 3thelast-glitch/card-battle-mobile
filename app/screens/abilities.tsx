import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ui/ThemedText';
import { AbilityCard } from '@/components/game/ability-card';
import { useRouter } from 'expo-router';
import { ArrowLeft, Save } from 'lucide-react-native';
import * as AbilitiesData from '@/data/abilities';
import {
  loadDisabledAbilities,
  saveDisabledAbilities,
  NAME_TO_ABILITY_TYPE,
} from '@/lib/game/abilities';
import type { AbilityType } from '@/lib/game/types';

type FilterType = 'All' | 'Common' | 'Rare' | 'Epic' | 'Legendary';

const FILTER_LABELS: Record<FilterType, string> = {
  All: 'All',
  Common: 'Common',
  Rare: 'Rare',
  Epic: 'ملحمية',
  Legendary: 'أسطورية',
};

export default function AbilitiesScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('All');
  const [saveText, setSaveText] = useState('حفظ التعديلات');
  const [loading, setLoading] = useState(true);
  // Set يحتوي nameEn للكروت المعطّلة (نستخدم nameEn لأنه المفتاح الموحّد)
  const [disabledNames, setDisabledNames] = useState<Set<string>>(new Set());

  // تحميل القدرات المعطّلة عند الفتح
  useEffect(() => {
    loadDisabledAbilities().then(disabledTypes => {
      // نحوّل AbilityType → nameEn (عكس الخريطة)
      const typeToName: Record<string, string> = {};
      Object.entries(NAME_TO_ABILITY_TYPE).forEach(([name, type]) => {
        typeToName[type] = name;
      });
      const names = new Set<string>();
      disabledTypes.forEach(type => {
        if (typeToName[type]) names.add(typeToName[type]);
      });
      setDisabledNames(names);
      setLoading(false);
    });
  }, []);

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

  /** تبديل حالة تعطيل كرت */
  const handleToggleDisabled = useCallback((nameEn: string, nowDisabled: boolean) => {
    setDisabledNames(prev => {
      const next = new Set(prev);
      if (nowDisabled) next.add(nameEn);
      else next.delete(nameEn);
      return next;
    });
  }, []);

  /** حفظ التعديلات في AsyncStorage */
  const handleSave = useCallback(async () => {
    setSaveText('جاري الحفظ...');
    // نحوّل nameEn → AbilityType
    const disabledTypes = new Set<AbilityType>();
    disabledNames.forEach(name => {
      const type = NAME_TO_ABILITY_TYPE[name];
      if (type) disabledTypes.add(type);
    });
    await saveDisabledAbilities(disabledTypes);
    setSaveText('تم الحفظ ✓');
    setTimeout(() => setSaveText('حفظ التعديلات'), 2000);
  }, [disabledNames]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#f97316" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View className="flex-1 px-4">
        {/* Back */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-6 left-6 z-50 flex-row items-center justify-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md rounded-xl border border-white/10 transition-all cursor-pointer"
          activeOpacity={0.7}
        >
          <ArrowLeft size={16} color="#fff" />
          <ThemedText className="text-white text-sm font-bold">رجوع</ThemedText>
        </TouchableOpacity>

        <View className="pt-6 pb-4 items-center justify-center mt-12">
          <ThemedText
            className="text-[40px] text-orange-500"
            style={{ textShadowColor: 'rgba(249, 115, 22, 0.8)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15 }}
          >
            القدرات
          </ThemedText>
        </View>

        {/* Filter tabs */}
        <View className="flex-row justify-center mb-6 gap-2 flex-wrap">
          {(['All', 'Common', 'Rare', 'Epic', 'Legendary'] as FilterType[]).map((tab) => {
            const isActive = filter === tab;
            return (
              <TouchableOpacity
                key={tab}
                className={`px-4 py-2 rounded-full border ${
                  isActive ? 'bg-orange-500/20 border-orange-500/60' : 'bg-white/5 border-white/10'
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
              {filteredAbilities.map((item: any, index: number) => {
                const isDisabled = disabledNames.has(item.nameEn);
                return (
                  <View
                    key={item.id ? item.id.toString() : `ability-${index}`}
                    className="shrink-0"
                    style={{ width: 220, height: 330 }}
                  >
                    <AbilityCard
                      ability={{ ...item, isActive: !isDisabled }}
                      onToggleDisabled={(nowDisabled) => handleToggleDisabled(item.nameEn, nowDisabled)}
                    />
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="w-full flex-1 items-center justify-center pt-20">
              <ThemedText className="text-lg text-white/40 text-center">لا توجد قدرات في هذا القسم</ThemedText>
            </View>
          )}
        </ScrollView>

        {/* Save FAB */}
        <TouchableOpacity
          onPress={handleSave}
          className="absolute bottom-8 right-8 z-50 flex-row items-center justify-center gap-2 px-6 py-3 bg-emerald-600 rounded-full shadow-[0_4px_20px_rgba(16,185,129,0.4)] transition-all duration-300 cursor-pointer"
          activeOpacity={0.8}
        >
          <Save size={18} color="#fff" />
          <ThemedText className="text-white font-bold text-base">{saveText}</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020617' },
});
