import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { ThemedText } from '@/components/ui/ThemedText';
import { ArrowLeft, Save, Check } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Rarity } from '@/data/abilities';

const RARITIES: { id: Rarity; label: string; colors: { border: string; bg: string; text: string; shadow: string } }[] = [
    {
        id: 'Common',
        label: 'Common',
        colors: {
            border: 'border-emerald-500',
            bg: 'bg-emerald-500/10',
            text: 'text-emerald-400',
            shadow: 'shadow-emerald-500/50',
        }
    },
    {
        id: 'Rare',
        label: 'Rare',
        colors: {
            border: 'border-blue-500',
            bg: 'bg-blue-500/10',
            text: 'text-blue-400',
            shadow: 'shadow-blue-500/50',
        }
    },
    {
        id: 'Epic',
        label: 'Epic',
        colors: {
            border: 'border-purple-500',
            bg: 'bg-purple-500/10',
            text: 'text-purple-400',
            shadow: 'shadow-purple-500/50',
        }
    },
    {
        id: 'Legendary',
        label: 'Legendary',
        colors: {
            border: 'border-amber-500',
            bg: 'bg-amber-500/10',
            text: 'text-amber-400',
            shadow: 'shadow-amber-500/50',
        }
    }
];

export default function EditAbilityScreen() {
    const navigation = useNavigation();
    
    // In a real app, you'd get the initial data from useRoute().params
    // For this example, we'll initialize with empty/default values
    const [nameEn, setNameEn] = useState('');
    const [nameAr, setNameAr] = useState('');
    const [description, setDescription] = useState('');
    const [rarity, setRarity] = useState<Rarity>('Common');

    const handleSave = () => {
        // Implement save logic here
        console.log('Saving:', { nameEn, nameAr, description, rarity });
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />
            
            {/* ─── STICKY HEADER ─── */}
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-white/10 bg-slate-900/80 backdrop-blur-md z-50">
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    className="w-10 h-10 items-center justify-center rounded-full bg-white/5 border border-white/10"
                >
                    <ArrowLeft size={20} color="#fff" />
                </TouchableOpacity>
                <ThemedText className="text-xl font-bold text-white">تعديل القدرة</ThemedText>
                <View className="w-10 h-10" /> {/* Spacer for centering */}
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    className="flex-1 px-4 pt-6 pb-24"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ─── RARITY SELECTOR ─── */}
                    <View className="mb-8">
                        <ThemedText className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider ml-1">
                            Rarity / الندرة
                        </ThemedText>
                        <View className="flex-row flex-wrap gap-3">
                            {RARITIES.map((r) => {
                                const isSelected = rarity === r.id;
                                return (
                                    <TouchableOpacity
                                        key={r.id}
                                        onPress={() => setRarity(r.id)}
                                        className={`flex-1 min-w-[45%] h-24 rounded-xl border-2 p-3 justify-between items-start ${
                                            isSelected ? `${r.colors.border} ${r.colors.bg}` : 'border-white/10 bg-white/5'
                                        }`}
                                        style={isSelected ? {
                                            shadowColor: r.colors.shadow.split('-')[1], // Extract color
                                            shadowOffset: { width: 0, height: 0 },
                                            shadowOpacity: 0.8,
                                            shadowRadius: 10,
                                            elevation: 8,
                                        } : undefined}
                                    >
                                        <View className="w-full flex-row justify-between items-center">
                                            <View className={`px-2 py-0.5 rounded-full ${isSelected ? "bg-black/40" : "bg-black/20"}`}>
                                                <ThemedText className={`text-[10px] uppercase font-bold tracking-widest ${isSelected ? r.colors.text : 'text-slate-400'}`}>
                                                    {r.id}
                                                </ThemedText>
                                            </View>
                                            {isSelected && (
                                                <View className="w-5 h-5 rounded-full bg-black/40 items-center justify-center">
                                                    <Check size={12} color={r.colors.text.includes('emerald') ? '#10b981' : r.colors.text.includes('blue') ? '#3b82f6' : r.colors.text.includes('purple') ? '#a855f7' : '#f59e0b'} />
                                                </View>
                                            )}
                                        </View>
                                        <ThemedText className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                                            {r.label}
                                        </ThemedText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* ─── INPUT FIELDS ─── */}
                    <View className="gap-5">
                        <View>
                            <ThemedText className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider ml-1">
                                English Name
                            </ThemedText>
                            <View className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 h-14 justify-center">
                                <TextInput
                                    value={nameEn}
                                    onChangeText={setNameEn}
                                    placeholder="e.g. Logical Encounter"
                                    placeholderTextColor="#64748b"
                                    className="text-white font-medium text-base w-full h-full"
                                    style={{ fontFamily: Platform.OS === 'ios' ? 'San Francisco' : 'Roboto' }}
                                />
                            </View>
                        </View>

                        <View>
                            <ThemedText className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider ml-1 font-arabic" style={{ textAlign: 'right' }}>
                                الاسم العربي
                            </ThemedText>
                            <View className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 h-14 justify-center">
                                <TextInput
                                    value={nameAr}
                                    onChangeText={setNameAr}
                                    placeholder="مثال: مصادفة منطقية"
                                    placeholderTextColor="#64748b"
                                    className="text-amber-300 font-semibold text-base w-full h-full text-right"
                                    style={{ fontFamily: Platform.OS === 'ios' ? 'San Francisco' : 'Roboto' }}
                                />
                            </View>
                        </View>

                        <View>
                            <ThemedText className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider mr-1" style={{ textAlign: 'right' }}>
                                Description / الوصف
                            </ThemedText>
                            <View className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-[100px]">
                                <TextInput
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="Enter ability description..."
                                    placeholderTextColor="#64748b"
                                    multiline
                                    textAlignVertical="top"
                                    className="text-slate-300 text-sm leading-relaxed w-full h-full text-right"
                                    style={{ fontFamily: Platform.OS === 'ios' ? 'San Francisco' : 'Roboto' }}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Spacer for bottom padding so it can scroll past the fixed footer */}
                    <View className="h-32" /> 
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ─── FIXED FOOTER BUTTONS ─── */}
            <View className="absolute bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 flex-row gap-3 pb-8">
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    className="flex-1 h-14 rounded-xl border border-white/20 bg-white/5 items-center justify-center"
                >
                    <ThemedText className="text-white font-semibold flex-1 text-center mt-4">Cancel</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    onPress={handleSave}
                    className="flex-[2] h-14 rounded-xl items-center justify-center flex-row gap-2 bg-amber-500 shadow-lg shadow-amber-500/30"
                >
                    <Save size={20} color="#000" />
                    <ThemedText className="text-black font-black uppercase tracking-wider text-base mt-0">
                        Save Changes
                    </ThemedText>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#020617', // slate-950
    },
});
