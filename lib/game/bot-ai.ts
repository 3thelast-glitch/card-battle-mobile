import { Card, Element } from './types';
import { ALL_CARDS, getElementAdvantage } from './cards-data';
import type { DifficultyLevel } from '@/app/screens/difficulty';

// دالة لحساب قوة البطاقة الإجمالية
function calculateCardPower(card: Card): number {
  return card.attack + card.defense + card.speed;
}

// دالة لحساب قوة البطاقة ضد بطاقة معينة (مع التفوق العنصري)
function calculateCardPowerAgainst(attacker: Card, defender: Card): number {
  const basePower = calculateCardPower(attacker);
  const elementAdvantage = getElementAdvantage(attacker.element, defender.element);
  
  if (elementAdvantage === 'strong') {
    return basePower * 1.5; // زيادة 50% عند التفوق
  } else if (elementAdvantage === 'weak') {
    return basePower * 0.7; // نقصان 30% عند الضعف
  }
  
  return basePower;
}

// استراتيجية المستوى السهل: اختيار عشوائي تماماً
function getEasyBotCards(count: number): Card[] {
  const shuffled = [...ALL_CARDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// استراتيجية المستوى المتوسط: اختيار بطاقات متوازنة
function getMediumBotCards(count: number, playerCards?: Card[]): Card[] {
  // ترتيب البطاقات حسب القوة الإجمالية
  const sortedCards = [...ALL_CARDS].sort((a, b) => {
    return calculateCardPower(b) - calculateCardPower(a);
  });
  
  // اختيار مزيج من البطاقات القوية والمتوسطة
  const topCards = sortedCards.slice(0, Math.ceil(ALL_CARDS.length / 2));
  const shuffled = topCards.sort(() => Math.random() - 0.5);
  
  // إذا كان العدد المطلوب أكبر من البطاقات المتاحة، نكرر البطاقات
  const result: Card[] = [];
  for (let i = 0; i < count; i++) {
    result.push(shuffled[i % shuffled.length]);
  }
  
  return result;
}

// استراتيجية المستوى الصعب: اختيار أقوى البطاقات مع استراتيجية متقدمة
function getHardBotCards(count: number, playerCards?: Card[]): Card[] {
  let selectedCards: Card[] = [];
  
  if (playerCards && playerCards.length > 0) {
    // استراتيجية متقدمة: اختيار بطاقات تستغل ضعف بطاقات اللاعب
    for (let i = 0; i < count; i++) {
      const playerCard = playerCards[i % playerCards.length];
      
      // البحث عن أفضل بطاقة ضد بطاقة اللاعب
      const availableCards = ALL_CARDS.filter(
        card => !selectedCards.some(selected => selected.id === card.id)
      );
      
      const bestCard = availableCards.reduce((best, current) => {
        const currentPower = calculateCardPowerAgainst(current, playerCard);
        const bestPower = calculateCardPowerAgainst(best, playerCard);
        return currentPower > bestPower ? current : best;
      });
      
      selectedCards.push(bestCard);
    }
  } else {
    // إذا لم تكن بطاقات اللاعب متاحة، اختر أقوى البطاقات
    const sortedCards = [...ALL_CARDS].sort((a, b) => {
      return calculateCardPower(b) - calculateCardPower(a);
    });
    
    selectedCards = sortedCards.slice(0, count);
  }
  
  return selectedCards;
}

// الدالة الرئيسية لاختيار بطاقات البوت حسب مستوى الصعوبة
export function getBotCards(
  count: number,
  difficulty: DifficultyLevel,
  playerCards?: Card[]
): Card[] {
  switch (difficulty) {
    case 'easy':
      return getEasyBotCards(count);
    
    case 'medium':
      return getMediumBotCards(count, playerCards);
    
    case 'hard':
      return getHardBotCards(count, playerCards);
    
    default:
      return getMediumBotCards(count, playerCards);
  }
}

// دالة لوصف استراتيجية البوت
export function getBotStrategyDescription(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case 'easy':
      return 'البوت يختار بطاقات عشوائية بدون استراتيجية';
    
    case 'medium':
      return 'البوت يختار بطاقات متوازنة مع بعض التفكير الاستراتيجي';
    
    case 'hard':
      return 'البوت يختار أقوى البطاقات ويستخدم استراتيجية متقدمة مع التفوق العنصري';
    
    default:
      return 'البوت يستخدم استراتيجية متوازنة';
  }
}
