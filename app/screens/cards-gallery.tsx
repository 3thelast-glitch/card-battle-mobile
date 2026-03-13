import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { ThemedText as Text } from '@/components/ui/ThemedText';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { LuxuryBackground } from '@/components/game/luxury-background';
import { RarityCard } from '@/components/game/RarityCard';
import { EpicCardTemplate } from '@/components/game/epic-card-template';
import { RotateHintScreen } from '@/components/game/RotateHintScreen';
import { ALL_CARDS } from '@/lib/game/cards-data';
import { Card, ELEMENT_COLORS, ELEMENT_EMOJI } from '@/lib/game/types';
import { getRarityConfig } from '@/lib/game/card-rarity';
import { useLandscapeLayout, CARD_SCALE, LAYOUT_PADDING } from '@/utils/layout';
import { ArrowLeft, Save } from 'lucide-react-native';

/**
 * CardsGalleryScreen Component
 * Displays a gallery of collectible cards with filtering capabilities and detailed view modal
 */
export default function CardsGalleryScreen() {
    const router = useRouter();
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const { isLandscape, size } = useLandscapeLayout();
    const [saveText, setSaveText] = useState('حفظ التعديلات');
    const [activeFilter, setActiveFilter] = useState('All');

    /**
     * Handle save button click
     * Updates save text to "Saved ✓" then reverts after 2 seconds
     */
    const handleSave = () => {
        setSaveText('Saved ✓');
        setTimeout(() => setSaveText('حفظ التعديلات'), 2000);
    };

    // Responsive scaling based on device size
    const cardScale = CARD_SCALE[size];
    const padding = LAYOUT_PADDING[size];
    // Responsive gap: tighter on small phones, more breathing room on tablets
    const gridGap = size === 'sm' ? 10 : size === 'md' ? 14 : size === 'lg' ? 18 : 22;

    /**
     * Handle card press event
     * @param card - The selected card object
     */
    const handleCardPress = (card: Card) => {
        setSelectedCard(card);
    };

    // Only render in landscape mode
    if (!isLandscape) {
        return <RotateHintScreen />;
    }

    // Filter cards based on active filter state
    const filteredCards = ALL_CARDS.filter(card => {
        if (activeFilter === 'All') return true;

        // Map Arabic labels back to rarity IDs
        const rarityMapping: Record<string, string> = {
            'common': 'Common',
            'rare': 'Rare',
            'epic': 'ملحمية',
            'legendary': 'أسطورية'
        };

        const cardRarityId = (card.rarity ?? 'common').toLowerCase();

        // If filter is the english name (Common, Rare)
        if (cardRarityId === activeFilter.toLowerCase()) return true;

        // If filter is the arabic name
        if (rarityMapping[cardRarityId] === activeFilter) return true;

        return false;
    });

    // Sort filtered cards by rarity (legendary first), then by race
    const sortedCards = [...filteredCards].sort((a, b) => {
        const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
        const ra = rarityOrder[a.rarity ?? 'common'];
        const rb = rarityOrder[b.rarity ?? 'common'];
        if (ra !== rb) return ra - rb;
        return a.race.localeCompare(b.race);
    });

    // Filter tabs configuration with styling
    const FILTER_TABS = [
        { label: 'All', activeClasses: 'border-orange-500 text-orange-500 bg-orange-500/10' },
        { label: 'Common', activeClasses: 'border-emerald-500 text-emerald-500 bg-emerald-500/10' },
        { label: 'Rare', activeClasses: 'border-blue-500 text-blue-500 bg-blue-500/10' },
        { label: 'ملحمية', activeClasses: 'border-purple-500 text-purple-500 bg-purple-500/10' },
        { label: 'أسطورية', activeClasses: 'border-amber-500 text-amber-500 bg-amber-500/10' },
    ];

    return (
        <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
            {/* Background */}
            <View style={styles.backgroundWrapper}>
                <LuxuryBackground />
            </View>

            {/* Fixed Back Button */}
            <TouchableOpacity
                onPress={() => router.back()}
                className="absolute top-6 left-6 z-50 flex-row items-center justify-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md rounded-xl border border-white/10 transition-all cursor-pointer"
                activeOpacity={0.7}
            >
                <ArrowLeft size={16} color="#fff" />
                <Text className="text-white text-sm font-bold">رجوع</Text>
            </TouchableOpacity>

            <View style={styles.container} className="pt-4 pb-2">
                {/* Title */}
                <View style={styles.titleContainer} className="mb-2 mt-4 flex-col gap-1 items-center justify-center">
                    <Text style={styles.title}>Card Collection</Text>
                    <Text style={styles.subtitle}>{filteredCards.length} cards</Text>
                </View>

                {/* ─── FILTER BAR ─── */}
                <View className="flex-row flex-wrap justify-center gap-2 mb-4 px-4 mt-2">
                    {FILTER_TABS.map((tab) => {
                        const isActive = activeFilter === tab.label;
                        const baseClasses = "px-4 py-1.5 rounded-full border border-white/10 bg-[#0f172a]/80 backdrop-blur-sm transition-all duration-300 cursor-pointer";
                        const textBaseClasses = "text-sm font-bold text-gray-400";

                        return (
                            <TouchableOpacity
                                key={tab.label}
                                onPress={() => setActiveFilter(tab.label)}
                                className={`${baseClasses} ${isActive ? tab.activeClasses.split(' ').slice(0, 3).join(' ') : ''}`}
                                activeOpacity={0.7}
                            >
                                <Text className={`${textBaseClasses} ${isActive ? tab.activeClasses.split(' ')[1] : ''}`}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Cards Grid */}
                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.gridContainer, { gap: gridGap, paddingHorizontal: padding }]}>
                        {sortedCards.map((card) => (
                            <RarityCard key={card.id} card={card} size="large" />
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Floating Save Button */}
            <TouchableOpacity
                onPress={handleSave}
                className="absolute bottom-8 right-8 z-50 flex-row items-center justify-center gap-2 px-6 py-3 bg-emerald-600 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-full shadow-[0_4px_20px_rgba(16,185,129,0.4)] hover:-translate-y-1 hover:shadow-[0_6px_25px_rgba(16,185,129,0.6)] transition-all duration-300 cursor-pointer"
                activeOpacity={0.8}
            >
                <Save size={18} color="#fff" />
                <Text className="text-white font-bold text-base">{saveText}</Text>
            </TouchableOpacity>

            {/* Card Details Modal */}
            <Modal
                visible={!!selectedCard}
                animationType="fade"
                transparent
                onRequestClose={() => setSelectedCard(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setSelectedCard(null)}
                >
                    {selectedCard && (
                        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                            {/* Full-size Card */}
                            <EpicCardTemplate
                                imageSrc={selectedCard.finalImage}
                                nameAr={selectedCard.nameAr}
                                nameEn={selectedCard.nameEn ?? selectedCard.name}
                                attack={selectedCard.attack}
                                defense={selectedCard.defense}
                                rarity={selectedCard.rarity}
                                element={selectedCard.element}
                                emoji={selectedCard.emoji}
                                scale={0.75}
                            />

                            {/* Detailed Info */}
                            <View
                                style={[
                                    styles.modalDetails,
                                    {
                                        borderColor:
                                            ELEMENT_COLORS[selectedCard.element] ?? '#d4af37',
                                    },
                                ]}
                            >
                                <Text style={styles.modalTitle}>{selectedCard.nameAr}</Text>
                                <Text style={styles.modalEnName}>{selectedCard.name}</Text>

                                {/* Race / Class / Element */}
                                <View style={styles.metaRow}>
                                    <View style={styles.metaChip}>
                                        <Text style={styles.metaChipText}>
                                            {selectedCard.race}
                                        </Text>
                                    </View>
                                    <View style={styles.metaChip}>
                                        <Text style={styles.metaChipText}>
                                            {selectedCard.cardClass}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.metaChip,
                                            {
                                                backgroundColor:
                                                    (ELEMENT_COLORS[selectedCard.element] ?? '#888') +
                                                    '33',
                                            },
                                        ]}
                                    >
                                        <Text style={styles.metaChipText}>
                                            {ELEMENT_EMOJI[selectedCard.element]}{' '}
                                            {selectedCard.element}
                                        </Text>
                                    </View>
                                </View>

                                {/* Full Stats Grid - 2 columns */}
                                <View style={styles.statsGrid}>
                                    <StatDetailItem
                                        icon="⚔️"
                                        label="Attack"
                                        value={selectedCard.attack}
                                    />
                                    <StatDetailItem
                                        icon="🛡️"
                                        label="Defense"
                                        value={selectedCard.defense}
                                    />
                                </View>

                                {/* Rarity */}
                                <View style={styles.rarityRow}>
                                    <View
                                        style={[
                                            styles.rarityBadge,
                                            {
                                                backgroundColor:
                                                    getRarityConfig(selectedCard.rarity).badgeColor,
                                            },
                                        ]}
                                    >
                                        <Text style={styles.rarityBadgeText}>
                                            {getRarityConfig(selectedCard.rarity).label}
                                        </Text>
                                    </View>
                                </View>

                                {/* Close */}
                                <TouchableOpacity
                                    style={styles.modalCloseBtn}
                                    onPress={() => setSelectedCard(null)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.modalCloseBtnText}>إغلاق</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </TouchableOpacity>
            </Modal>
        </ScreenContainer>
    );
}

// ─── Stat Detail Item ─────────────────────────────────────────────────────────

function StatDetailItem({
    icon,
    label,
    value,
}: {
    icon: string;
    label: string;
    value: number;
}) {
    return (
        <View style={styles.statDetailItem}>
            <Text style={styles.statDetailIcon}>{icon}</Text>
            <Text style={styles.statDetailValue}>{value}</Text>
            <Text style={styles.statDetailLabel}>{label}</Text>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    backgroundWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
    },
    container: {
        flex: 1,
        zIndex: 1,
        alignItems: 'center',
        width: '100%',
    },
    titleContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#d4af37',
        textAlign: 'center',
        flexWrap: 'wrap',
    },
    subtitle: {
        fontSize: 13,
        color: '#a0a0a0',
        marginTop: 4,
        textAlign: 'center',
        flexWrap: 'wrap',
    },
    scrollContainer: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 14,
        maxWidth: 900,
        paddingHorizontal: 12,
    },
    backButton: {
        backgroundColor: '#666',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
        marginTop: 12,
        marginBottom: 10,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },

    // ── Modal ──
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.88)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        alignItems: 'center',
    },
    modalDetails: {
        marginTop: 16,
        backgroundColor: 'rgba(20, 20, 25, 0.95)',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1.5,
        alignItems: 'center',
        width: '90%',
        maxWidth: 320,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#f0e6d2',
        marginBottom: 2,
    },
    modalEnName: {
        fontSize: 13,
        color: '#888',
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    metaChip: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    metaChipText: {
        fontSize: 11,
        color: '#ccc',
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    statDetailItem: {
        alignItems: 'center',
        gap: 2,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    statDetailIcon: {
        fontSize: 16,
    },
    statDetailValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
    },
    statDetailLabel: {
        fontSize: 9,
        color: '#888',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    rarityRow: {
        marginBottom: 16,
    },
    rarityBadge: {
        paddingHorizontal: 16,
        paddingVertical: 5,
        borderRadius: 14,
    },
    rarityBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
    modalCloseBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 28,
        paddingVertical: 10,
        borderRadius: 20,
    },
    modalCloseBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#d4af37',
    },
});
