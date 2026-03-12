import {
  // Common
  Brain, RotateCcw, Shield, XCircle, Divide, Lock, ArrowDownLeft, HeartCrack, Skull, TrendingUp,
  // Rare
  UserPlus, ShieldPlus, Eraser, Zap, ArrowRightLeft, LifeBuoy, AlertTriangle, Crosshair, Combine, HeartPulse, ChevronsUp, ArrowDownRight, Eye, Replace,
  // Epic
  Droplet, Flame, Users, Shuffle, Magnet, RefreshCw, Layers, Ban, Coins, GitCompare, Megaphone, Sparkles, Target, Waves, ShieldCheck, Wand2, SkipForward,
  // Legendary
  Star, Moon, XOctagon, ArrowUpCircle, Repeat, Send, Bomb, PlusCircle, Globe, Ghost
} from 'lucide-react-native';

export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface Ability {
  id: number;
  nameEn: string;
  nameAr: string;
  description: string;
  rarity: Rarity;
  icon: any;
  image?: any; // Replaced imageUrl: string with image: any to support local imports or uri objects
  isActive?: boolean;
}

export const abilities: Ability[] = [
  // 🟢 Common Abilities
  { id: 1, nameEn: "Logical Encounter", nameAr: "مصادفة منطقية", description: "توقع نتيجة دورين قادمين", rarity: 'Common', icon: Brain, image: { uri: "https://images.unsplash.com/photo-1544256718-3b6102f1d931?q=80&w=400&h=300&auto=format&fit=crop" } },
  { id: 2, nameEn: "Recall", nameAr: "استدعاء", description: "استدعاء كرت سابق لك بدون خاصية", rarity: 'Common', icon: RotateCcw, image: { uri: "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=400&h=300&auto=format&fit=crop" } },
  { id: 3, nameEn: "Protection", nameAr: "حماية", description: "تحمي نفسك من خسارة نقطة صحة", rarity: 'Common', icon: Shield },
  { id: 4, nameEn: "Wipe", nameAr: "المسح", description: "امسح أي تأثيرات عليك في اللعبة", rarity: 'Common', icon: XCircle },
  { id: 5, nameEn: "Halve Points", nameAr: "تنصيف النقاط", description: "خصم نقاط الكرت للنصف", rarity: 'Common', icon: Divide },
  { id: 6, nameEn: "Seal", nameAr: "الختم", description: "ختم قدرة لمدة 5 جولات", rarity: 'Common', icon: Lock },
  { id: 7, nameEn: "Reduction", nameAr: "التقليص", description: "-2 لكل عناصر الخصم", rarity: 'Common', icon: ArrowDownLeft },
  { id: 8, nameEn: "Sacrifice", nameAr: "تضحية", description: "تشيل خاصية خصم في حال الخسارة", rarity: 'Common', icon: HeartCrack },
  { id: 9, nameEn: "Suicide", nameAr: "الانتحار", description: "مع الخسارة ينقص الخصم نقطة", rarity: 'Common', icon: Skull },
  { id: 10, nameEn: "Compensation", nameAr: "التعويض", description: "في حال الخسارة +1 دفاع لكل الكروت لك", rarity: 'Common', icon: TrendingUp },

  // 🔵 Rare Abilities
  { id: 11, nameEn: "Arise", nameAr: "أرايز", description: "استدعِ كرت من كروت خصمك", rarity: 'Rare', icon: UserPlus, image: { uri: "https://images.unsplash.com/photo-1620023640244-67d71b56a908?q=80&w=400&h=300&auto=format&fit=crop" } },
  { id: 12, nameEn: "Reinforcement", nameAr: "التدعيم", description: "في حال الفوز +1 دفاع لكل الكروت لك", rarity: 'Rare', icon: ShieldPlus, image: { uri: "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=400&h=300&auto=format&fit=crop" } },
  { id: 13, nameEn: "Purge", nameAr: "التطهير", description: "نظف كل التأثيرات في اللعبة", rarity: 'Rare', icon: Eraser },
  { id: 14, nameEn: "Double Or Nothing", nameAr: "دبل أو نثنق", description: "قبل الراوند: دبل أو نثنق", rarity: 'Rare', icon: Zap },
  { id: 15, nameEn: "Disaster", nameAr: "النكبة", description: "بدل كرت الخصم بكرت سابق له", rarity: 'Rare', icon: ArrowRightLeft },
  { id: 16, nameEn: "Rescue", nameAr: "الإنقاذ", description: "تعطي دفاع الكرت الحالي للكرت القادم", rarity: 'Rare', icon: LifeBuoy },
  { id: 17, nameEn: "Trap", nameAr: "الفخ", description: "قبل الراوند: تفعيل الفخ", rarity: 'Rare', icon: AlertTriangle },
  { id: 18, nameEn: "Sniping", nameAr: "القنص", description: "اختار راوند معين لقنص الخصم", rarity: 'Rare', icon: Crosshair },
  { id: 19, nameEn: "Merge", nameAr: "الدمج", description: "ادمج كرتك مع كرتك السابق بدون خاصية", rarity: 'Rare', icon: Combine },
  { id: 20, nameEn: "Revive", nameAr: "إنعاش", description: "إنعاش كرت سابق لك بنصف طاقاته مع الخاصية", rarity: 'Rare', icon: HeartPulse },
  { id: 21, nameEn: "Consecutive Loss Buff", nameAr: "تعزيز الخسارة", description: "خسارة جولتين +1 هجوم ودفاع", rarity: 'Rare', icon: ChevronsUp },
  { id: 22, nameEn: "Weakening", nameAr: "الإضعاف", description: "في حال الخسارة -1 هجوم للخصم", rarity: 'Rare', icon: ArrowDownRight },
  { id: 23, nameEn: "Subhan", nameAr: "الصبحان", description: "توقع هجوم الكرت القادم للخصم", rarity: 'Rare', icon: Eye },
  { id: 24, nameEn: "Swap Class", nameAr: "تبديل الفئة", description: "بدل فئة واحدة من عندك مع فئة من خصمك", rarity: 'Rare', icon: Replace },

  // 🟣 Epic Abilities
  { id: 25, nameEn: "Lifesteal", nameAr: "سرقة الحياة", description: "مع الفوز ترجع نقطة صحة", rarity: 'Epic', icon: Droplet, image: { uri: "https://images.unsplash.com/photo-1547461971-55bb49de58be?q=80&w=400&h=300&auto=format&fit=crop" } },
  { id: 26, nameEn: "Revenge", nameAr: "الانتقام", description: "في حال الخسارة +1 هجوم لكل الكروت لك", rarity: 'Epic', icon: Flame, image: { uri: "https://images.unsplash.com/photo-1634710186716-e41c4bd6fe69?q=80&w=400&h=300&auto=format&fit=crop" } },
  { id: 27, nameEn: "Popularity", nameAr: "الشعبية", description: "أغلب الشات يختار رقم راوند تفوز فيه", rarity: 'Epic', icon: Users },
  { id: 28, nameEn: "Misdirection", nameAr: "التضليل", description: "دبل كل النيرفات على الخصم", rarity: 'Epic', icon: Shuffle },
  { id: 29, nameEn: "Steal Ability", nameAr: "سرقة الخاصية", description: "اسرق قدرة من الخصم", rarity: 'Epic', icon: Magnet },
  { id: 30, nameEn: "Convert Debuffs", nameAr: "تحويل السلبيات", description: "حول النيرفات عليك لبفات", rarity: 'Epic', icon: RefreshCw },
  { id: 31, nameEn: "Double Next Cards", nameAr: "المضاعفة", description: "ضاعف نقاط كرتين من الدور القادم", rarity: 'Epic', icon: Layers },
  { id: 32, nameEn: "Deprivation", nameAr: "السلب", description: "اسلب الخصم من البفات", rarity: 'Epic', icon: Ban },
  { id: 33, nameEn: "Greed", nameAr: "الجشع", description: "في حال الفوز +1 هجوم لكل الكروت لك", rarity: 'Epic', icon: Coins },
  { id: 34, nameEn: "Dilemma", nameAr: "الوهقة", description: "بدل كرت الخصم بكرت سابق لك", rarity: 'Epic', icon: GitCompare },
  { id: 35, nameEn: "Propaganda", nameAr: "بروباغاندا", description: "اختار فئة واحدة للخصم -2 هجوم ودفاع", rarity: 'Epic', icon: Megaphone },
  { id: 36, nameEn: "Avatar", nameAr: "أفاتار", description: "+2 لكل العناصر لك", rarity: 'Epic', icon: Sparkles },
  { id: 37, nameEn: "Penetration", nameAr: "الاختراق", description: "نقاط دفاع الخصم 0", rarity: 'Epic', icon: Target },
  { id: 38, nameEn: "Pool", nameAr: "المسبح", description: "إغراق كرت الخصم وبقاء تأثير كرتك", rarity: 'Epic', icon: Waves },
  { id: 39, nameEn: "Shield", nameAr: "الدرع", description: "حماية من الخسارة والخاصية", rarity: 'Epic', icon: ShieldCheck },
  { id: 40, nameEn: "Add Element", nameAr: "إضافة عنصر", description: "أضف عنصر لأي كرت", rarity: 'Epic', icon: Wand2 },
  { id: 41, nameEn: "Skip", nameAr: "تخطي", description: "تخطي الدور بدون أي تأثير على اللعب", rarity: 'Epic', icon: SkipForward },

  // 🟡 Legendary Abilities
  { id: 42, nameEn: "Star Superiority", nameAr: "تفوق النجوم", description: "كل كروتك تتفوق بالنجوم على الخصم", rarity: 'Legendary', icon: Star, image: { uri: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&h=300&auto=format&fit=crop" } },
  { id: 43, nameEn: "Eclipse", nameAr: "الخسوف", description: "هجوم خصمك 0 بدون البفات", rarity: 'Legendary', icon: Moon, image: { uri: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=400&h=300&auto=format&fit=crop" } },
  { id: 44, nameEn: "Cancel Ability", nameAr: "إلغاء الخاصية", description: "ألغِ قدرة الخصم", rarity: 'Legendary', icon: XOctagon },
  { id: 45, nameEn: "Double Your Buffs", nameAr: "مضاعفة البفات", description: "دبل البفات لك", rarity: 'Legendary', icon: ArrowUpCircle },
  { id: 46, nameEn: "Conversion", nameAr: "التحويل", description: "حول بفات الخصم لنيرفات", rarity: 'Legendary', icon: Repeat },
  { id: 47, nameEn: "Take It", nameAr: "خذها وأنا بو مبارك", description: "أعطِ النيرفات للخصم (خذها وأنا بو مبارك)", rarity: 'Legendary', icon: Send },
  { id: 48, nameEn: "Explosion", nameAr: "الانفجار", description: "في حال الخسارة -1 دفاع لكل كروت الخصم", rarity: 'Legendary', icon: Bomb },
  { id: 49, nameEn: "Double Points", nameAr: "مضاعفة النقاط", description: "دبل النقاط قبل الراوند", rarity: 'Legendary', icon: PlusCircle },
  { id: 50, nameEn: "Elemental Mastery", nameAr: "إتقان العناصر", description: "تفوق عنصري كامل", rarity: 'Legendary', icon: Globe },
  { id: 51, nameEn: "Deprivation (Ability)", nameAr: "سلب", description: "سلب احد قدرات الخصم", rarity: 'Legendary', icon: Ghost },
];