import { Card, Element, ElementAdvantage, Effect, ELEMENT_ADVANTAGES, ELEMENT_WEAKNESSES, ELEMENT_MULTIPLIER } from './types';


export const ALL_CARDS: Card[] = [
  // ════════════════════════════════════════════
  // البشر — Humans (4 cards)
  // ════════════════════════════════════════════
  {
    id: 'human-warrior',
    name: 'Human Warrior',
    nameAr: 'المحارب البشري',
    finalImage: require('../../assets/cards/final/human-warrior.png'),
    hp: 100,
    attack: 28,
    defense: 18,
    speed: 12,
    race: 'human',
    cardClass: 'warrior',
    element: 'fire',
    tags: ['sword'],
    emoji: '⚔️',
    rarity: 'common',
    animationPreset: 'fire',
  },
  {
    id: 'human-knight',
    name: 'Human Knight',
    nameAr: 'الفارس البشري',
    finalImage: require('../../assets/cards/final/human-knight.png'),
    hp: 120,
    attack: 25,
    defense: 25,
    speed: 10,
    race: 'human',
    cardClass: 'knight',
    element: 'earth',
    tags: ['sword', 'shield'],
    emoji: '🛡️',
    rarity: 'rare',
    animationPreset: 'default',
  },
  {
    id: 'human-paladin',
    name: 'Human Paladin',
    nameAr: 'البالادين البشري',
    finalImage: require('../../assets/cards/final/human-paladin.png'),
    hp: 110,
    attack: 30,
    defense: 22,
    speed: 11,
    race: 'human',
    cardClass: 'paladin',
    element: 'lightning',
    tags: ['sword', 'shield', 'magic'],
    emoji: '⚡',
    rarity: 'epic',
    animationPreset: 'lightning',
    cardEffects: ['divine_shield'],
  },
  {
    id: 'human-mage',
    name: 'Human Mage',
    nameAr: 'الساحر البشري',
    finalImage: require('../../assets/cards/final/human-mage.png'),
    hp: 75,
    attack: 22,
    defense: 12,
    speed: 15,
    race: 'human',
    cardClass: 'mage',
    element: 'ice',
    tags: ['magic'],
    emoji: '❄️',
    rarity: 'common',
    animationPreset: 'ice',
  },

  // ════════════════════════════════════════════
  // الجن — Elves (4 cards)
  // ════════════════════════════════════════════
  {
    id: 'elf-archer',
    name: 'Elf Archer',
    nameAr: 'الرامي الجني',
    finalImage: require('../../assets/cards/final/elf-archer.png'),
    hp: 80,
    attack: 32,
    defense: 12,
    speed: 18,
    race: 'elf',
    cardClass: 'archer',
    element: 'wind',
    tags: ['bow'],
    emoji: '🏹',
    rarity: 'rare',
    animationPreset: 'default',
  },
  {
    id: 'elf-mage',
    name: 'Elf Mage',
    nameAr: 'الساحر الجني',
    finalImage: require('../../assets/cards/final/elf-mage.png'),
    hp: 70,
    attack: 20,
    defense: 10,
    speed: 16,
    race: 'elf',
    cardClass: 'mage',
    element: 'lightning',
    tags: ['magic'],
    emoji: '🔮',
    rarity: 'common',
    animationPreset: 'lightning',
  },
  {
    id: 'elf-knight',
    name: 'Elf Knight',
    nameAr: 'الفارس الجني',
    finalImage: require('../../assets/cards/final/elf-knight.png'),
    hp: 95,
    attack: 24,
    defense: 20,
    speed: 14,
    race: 'elf',
    cardClass: 'knight',
    element: 'water',
    tags: ['sword', 'shield'],
    emoji: '💧',
    rarity: 'rare',
    animationPreset: 'default',
  },
  {
    id: 'elf-berserker',
    name: 'Elf Berserker',
    nameAr: 'البيرسركر الجني',
    finalImage: require('../../assets/cards/final/elf-archer.png'),
    hp: 78,
    attack: 38,
    defense: 8,
    speed: 19,
    race: 'elf',
    cardClass: 'berserker',
    element: 'wind',
    tags: ['sword'],
    emoji: '💨',
    rarity: 'epic',
    animationPreset: 'default',
    cardEffects: ['charge'],
  },

  // ════════════════════════════════════════════
  // الأورك — Orcs (4 cards)
  // ════════════════════════════════════════════
  {
    id: 'orc-berserker',
    name: 'Orc Berserker',
    nameAr: 'البيرسركر الأورك',
    finalImage: require('../../assets/cards/final/orc-berserker.png'),
    hp: 110,
    attack: 35,
    defense: 10,
    speed: 8,
    race: 'orc',
    cardClass: 'berserker',
    element: 'fire',
    tags: ['sword'],
    emoji: '🗡️',
    rarity: 'rare',
    animationPreset: 'fire',
  },
  {
    id: 'orc-warrior',
    name: 'Orc Warrior',
    nameAr: 'المحارب الأورك',
    finalImage: require('../../assets/cards/final/orc-warrior.png'),
    hp: 130,
    attack: 30,
    defense: 15,
    speed: 7,
    race: 'orc',
    cardClass: 'warrior',
    element: 'earth',
    tags: ['sword', 'shield'],
    emoji: '⚔️',
    rarity: 'common',
    animationPreset: 'default',
  },
  {
    id: 'orc-mage',
    name: 'Orc Shaman',
    nameAr: 'الشامان الأورك',
    finalImage: require('../../assets/cards/final/orc-mage.png'),
    hp: 85,
    attack: 26,
    defense: 14,
    speed: 13,
    race: 'orc',
    cardClass: 'mage',
    element: 'wind',
    tags: ['magic'],
    emoji: '🌪️',
    rarity: 'common',
    animationPreset: 'default',
  },
  {
    id: 'orc-knight',
    name: 'Orc Warlord',
    nameAr: 'أمير الحرب الأورك',
    finalImage: require('../../assets/cards/final/orc-warrior.png'),
    hp: 145,
    attack: 26,
    defense: 28,
    speed: 5,
    race: 'orc',
    cardClass: 'knight',
    element: 'earth',
    tags: ['sword', 'shield', 'crown'],
    emoji: '👑',
    rarity: 'epic',
    animationPreset: 'default',
    cardEffects: ['taunt'],
  },

  // ════════════════════════════════════════════
  // التنانين — Dragons (4 cards)
  // ════════════════════════════════════════════
  {
    id: 'dragon-mage',
    name: 'Dragon Mage',
    nameAr: 'ساحر التنين',
    finalImage: require('../../assets/cards/final/dragon-mage.png'),
    hp: 90,
    attack: 38,
    defense: 14,
    speed: 14,
    race: 'dragon',
    cardClass: 'mage',
    element: 'fire',
    tags: ['magic', 'crown'],
    emoji: '🐉',
    rarity: 'epic',
    animationPreset: 'fire',
    cardEffects: ['charge'],
  },
  {
    id: 'dragon-knight',
    name: 'Dragon Knight',
    nameAr: 'فارس التنين',
    finalImage: require('../../assets/cards/final/dragon-knight.png'),
    hp: 140,
    attack: 28,
    defense: 28,
    speed: 12,
    race: 'dragon',
    cardClass: 'knight',
    element: 'fire',
    tags: ['sword', 'shield', 'crown'],
    emoji: '🐲',
    rarity: 'rare',
    animationPreset: 'fire',
  },
  {
    id: 'dragon-archer',
    name: 'Dragon Archer',
    nameAr: 'رامي التنين',
    finalImage: require('../../assets/cards/final/dragon-archer.png'),
    hp: 82,
    attack: 34,
    defense: 10,
    speed: 17,
    race: 'dragon',
    cardClass: 'archer',
    element: 'lightning',
    tags: ['bow'],
    emoji: '⚡',
    rarity: 'rare',
    animationPreset: 'lightning',
  },
  {
    id: 'phoenix-lord',
    name: 'Phoenix Lord',
    nameAr: 'سيد الفينيق',
    finalImage: require('../../assets/cards/final/dragon-mage.png'),
    hp: 85,
    attack: 42,
    defense: 12,
    speed: 16,
    race: 'dragon',
    cardClass: 'mage',
    element: 'fire',
    tags: ['magic', 'crown'],
    emoji: '🔥',
    rarity: 'legendary',
    animationPreset: 'fire',
    cardEffects: ['divine_shield', 'charge'],
  },

  // ════════════════════════════════════════════
  // الشياطين — Demons (4 cards)
  // ════════════════════════════════════════════
  {
    id: 'demon-berserker',
    name: 'Demon Berserker',
    nameAr: 'البيرسركر الشيطاني',
    finalImage: require('../../assets/cards/final/demon-berserker.png'),
    hp: 85,
    attack: 40,
    defense: 8,
    speed: 15,
    race: 'demon',
    cardClass: 'berserker',
    element: 'fire',
    tags: ['sword'],
    emoji: '😈',
    rarity: 'epic',
    animationPreset: 'fire',
    cardEffects: ['poison'],
  },
  {
    id: 'demon-mage',
    name: 'Demon Mage',
    nameAr: 'الساحر الشيطاني',
    finalImage: require('../../assets/cards/final/demon-mage.png'),
    hp: 75,
    attack: 36,
    defense: 6,
    speed: 17,
    race: 'demon',
    cardClass: 'mage',
    element: 'lightning',
    tags: ['magic'],
    emoji: '👿',
    rarity: 'rare',
    animationPreset: 'lightning',
  },
  {
    id: 'demon-warrior',
    name: 'Demon Warrior',
    nameAr: 'المحارب الشيطاني',
    finalImage: require('../../assets/cards/final/demon-warrior.png'),
    hp: 115,
    attack: 32,
    defense: 18,
    speed: 9,
    race: 'demon',
    cardClass: 'warrior',
    element: 'earth',
    tags: ['sword', 'shield'],
    emoji: '🗡️',
    rarity: 'common',
    animationPreset: 'shadow',
  },
  {
    id: 'shadow-king',
    name: 'Shadow King',
    nameAr: 'ملك الظلام',
    finalImage: require('../../assets/cards/final/demon-archer.png'),
    hp: 95,
    attack: 44,
    defense: 10,
    speed: 14,
    race: 'demon',
    cardClass: 'berserker',
    element: 'ice',
    tags: ['sword', 'magic', 'crown'],
    emoji: '👑',
    rarity: 'legendary',
    animationPreset: 'shadow',
    cardEffects: ['stealth', 'poison'],
  },

  // ════════════════════════════════════════════
  // الموتى الأحياء — Undead (4 cards)
  // ════════════════════════════════════════════
  {
    id: 'undead-knight',
    name: 'Undead Knight',
    nameAr: 'الفارس الميت',
    finalImage: require('../../assets/cards/final/human-knight.png'),
    hp: 150,
    attack: 22,
    defense: 30,
    speed: 5,
    race: 'undead',
    cardClass: 'knight',
    element: 'ice',
    tags: ['sword', 'shield'],
    emoji: '💀',
    rarity: 'rare',
    animationPreset: 'ice',
  },
  {
    id: 'undead-paladin',
    name: 'Undead Paladin',
    nameAr: 'البالادين الميت',
    finalImage: require('../../assets/cards/final/human-paladin.png'),
    hp: 120,
    attack: 25,
    defense: 22,
    speed: 9,
    race: 'undead',
    cardClass: 'paladin',
    element: 'ice',
    tags: ['sword', 'shield', 'magic'],
    emoji: '👻',
    rarity: 'common',
    animationPreset: 'ice',
  },
  {
    id: 'undead-mage',
    name: 'Undead Necromancer',
    nameAr: 'محيي الموتى',
    finalImage: require('../../assets/cards/final/elf-mage.png'),
    hp: 72,
    attack: 34,
    defense: 8,
    speed: 16,
    race: 'undead',
    cardClass: 'mage',
    element: 'ice',
    tags: ['magic', 'crown'],
    emoji: '☠️',
    rarity: 'epic',
    animationPreset: 'ice',
    cardEffects: ['poison'],
  },
  {
    id: 'storm-titan',
    name: 'Storm Titan',
    nameAr: 'جبار العاصفة',
    finalImage: require('../../assets/cards/final/orc-berserker.png'),
    hp: 150,
    attack: 40,
    defense: 5,
    speed: 6,
    race: 'undead',
    cardClass: 'berserker',
    element: 'lightning',
    tags: ['sword', 'crown'],
    emoji: '🌩️',
    rarity: 'legendary',
    animationPreset: 'lightning',
    cardEffects: ['charge', 'taunt'],
  },
];

// دالة للحصول على بطاقات عشوائية للبوت
export function getRandomCards(count: number): Card[] {
  const shuffled = [...ALL_CARDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// دالة لحساب الضرر الأساسي
export function calculateBaseDamage(attacker: Card, defender: Card): number {
  const damage = attacker.attack - defender.defense;
  return Math.max(0, damage);
}

// دالة لتحديد التفوق العنصري
export function getElementAdvantage(attackerElement: Element, defenderElement: Element): ElementAdvantage {
  // التحقق من التفوق
  if (ELEMENT_ADVANTAGES[attackerElement]?.includes(defenderElement)) {
    return 'strong';
  }
  // التحقق من الضعف
  if (ELEMENT_WEAKNESSES[attackerElement]?.includes(defenderElement)) {
    return 'weak';
  }
  return 'neutral';
}

// دالة لحساب الضرر مع تأثير العناصر
export function applyActiveEffects(
  card: Card,
  effects: Effect[] = [],
  abilitiesEnabled = true
): Card {
  let modifiedCard = { ...card };

  if (!abilitiesEnabled || !effects || effects.length === 0) {
    return modifiedCard;
  }

  const orderedEffects = [...effects].sort((a, b) => b.priority - a.priority);

  orderedEffects.forEach(effect => {
    if (effect.kind === 'statModifier') {
      const data = effect.data as { stat?: 'attack' | 'defense' | 'hp' | 'all'; amount?: number };
      const amount = data?.amount ?? 0;
      const stat = data?.stat ?? 'all';
      if (stat === 'all') {
        modifiedCard.attack += amount;
        modifiedCard.defense += amount;
        modifiedCard.hp += amount;
      } else if (stat === 'attack') {
        modifiedCard.attack += amount;
      } else if (stat === 'defense') {
        modifiedCard.defense += amount;
      } else if (stat === 'hp') {
        modifiedCard.hp += amount;
      }
    }

    if (effect.kind === 'halvePoints') {
      const data = effect.data as { multiplier?: number; stats?: Array<'attack' | 'defense' | 'hp'> };
      const multiplier = data?.multiplier ?? 1;
      // تنصيف نقاط الكرت يطبق على attack/defense فقط لهذه الجولة.
      const stats = data?.stats ?? ['attack', 'defense'];
      if (stats.includes('attack')) modifiedCard.attack = Math.round(modifiedCard.attack * multiplier);
      if (stats.includes('defense')) modifiedCard.defense = Math.round(modifiedCard.defense * multiplier);
      if (stats.includes('hp')) modifiedCard.hp = Math.round(modifiedCard.hp * multiplier);
    }
  });

  // التأكد من أن القيم لا تقل عن الصفر
  modifiedCard.attack = Math.max(0, modifiedCard.attack);
  modifiedCard.defense = Math.max(0, modifiedCard.defense);
  modifiedCard.hp = Math.max(0, modifiedCard.hp);

  return modifiedCard;
}

export function calculateDamage(attacker: Card, defender: Card): { damage: number; baseDamage: number; advantage: ElementAdvantage } {
  const baseDamage = calculateBaseDamage(attacker, defender);
  const advantage = getElementAdvantage(attacker.element, defender.element);
  const multiplier = ELEMENT_MULTIPLIER[advantage];
  const damage = Math.round(baseDamage * multiplier);

  return { damage, baseDamage, advantage };
}

// دالة لتحديد الفائز في الجولة
export function determineRoundWinner(
  playerCard: Card,
  botCard: Card,
  playerEffects: Effect[] = [], // التأثيرات النشطة على اللاعب
  botEffects: Effect[] = [], // التأثيرات النشطة على البوت
  abilitiesEnabled = true
): {
  winner: 'player' | 'bot' | 'draw';
  playerDamage: number;
  botDamage: number;
  playerBaseDamage: number;
  botBaseDamage: number;
  playerElementAdvantage: ElementAdvantage;
  botElementAdvantage: ElementAdvantage;
} {
  // تطبيق التأثيرات على البطاقات الحالية
  const modifiedPlayerCard = applyActiveEffects(playerCard, playerEffects, abilitiesEnabled);
  const modifiedBotCard = applyActiveEffects(botCard, botEffects, abilitiesEnabled);

  // الضرر الذي يسببه اللاعب للبوت
  const playerResult = calculateDamage(modifiedPlayerCard, modifiedBotCard);
  // الضرر الذي يسببه البوت للاعب
  const botResult = calculateDamage(modifiedBotCard, modifiedPlayerCard);

  let winner: 'player' | 'bot' | 'draw';
  if (playerResult.damage > botResult.damage) {
    winner = 'player';
  } else if (botResult.damage > playerResult.damage) {
    winner = 'bot';
  } else {
    winner = 'draw';
  }

  const playerStarAdvantage = playerEffects.some(effect => effect.kind === 'starAdvantage');
  const botStarAdvantage = botEffects.some(effect => effect.kind === 'starAdvantage');
  // افتراض: "النجوم" غير ممثلة في المنطق الحالي، فنستخدمها ككسر تعادل فقط.
  if (winner === 'draw' && playerStarAdvantage !== botStarAdvantage) {
    winner = playerStarAdvantage ? 'player' : 'bot';
  }

  return {
    winner,
    playerDamage: playerResult.damage,
    botDamage: botResult.damage,
    playerBaseDamage: playerResult.baseDamage,
    botBaseDamage: botResult.baseDamage,
    playerElementAdvantage: playerResult.advantage,
    botElementAdvantage: botResult.advantage,
  };
}
