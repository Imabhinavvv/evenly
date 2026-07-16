import {
  Home, ShoppingBag, Utensils, Zap, Car, Heart,
  Coffee, Gift, Receipt, Wallet
} from 'lucide-react';

const VISUALS = [
  { icon: Home, bg: 'var(--evenly-sage)', label: 'Home' },
  { icon: ShoppingBag, bg: 'var(--evenly-lavender)', label: 'Shopping' },
  { icon: Utensils, bg: 'rgba(255, 183, 178, 0.4)', label: 'Food' },
  { icon: Zap, bg: 'rgba(244, 180, 0, 0.15)', label: 'Utilities' },
  { icon: Car, bg: 'var(--evenly-sage)', label: 'Transport' },
  { icon: Heart, bg: 'var(--evenly-lavender)', label: 'Health' },
  { icon: Coffee, bg: 'rgba(255, 183, 178, 0.35)', label: 'Dining' },
  { icon: Gift, bg: 'var(--evenly-lavender)', label: 'Gifts' },
  { icon: Receipt, bg: 'var(--evenly-sage)', label: 'Bills' },
  { icon: Wallet, bg: 'rgba(255, 183, 178, 0.3)', label: 'General' },
];

const KEYWORD_MAP = [
  { keywords: ['rent', 'home', 'house', 'apartment'], index: 0 },
  { keywords: ['shop', 'grocery', 'market', 'store'], index: 1 },
  { keywords: ['food', 'dinner', 'lunch', 'breakfast', 'restaurant', 'cafe'], index: 2 },
  { keywords: ['electric', 'water', 'gas', 'internet', 'wifi', 'utility', 'bill'], index: 3 },
  { keywords: ['car', 'uber', 'taxi', 'fuel', 'petrol', 'transport', 'bus'], index: 4 },
  { keywords: ['health', 'medical', 'doctor', 'pharmacy'], index: 5 },
  { keywords: ['coffee', 'tea', 'snack'], index: 6 },
  { keywords: ['gift', 'birthday', 'party'], index: 7 },
  { keywords: ['subscription', 'membership', 'fee'], index: 8 },
];

export function getExpenseVisual(description = '') {
  const lower = description.toLowerCase();

  for (const { keywords, index } of KEYWORD_MAP) {
    if (keywords.some(kw => lower.includes(kw))) {
      return VISUALS[index];
    }
  }

  let hash = 0;
  for (let i = 0; i < description.length; i++) {
    hash = description.charCodeAt(i) + ((hash << 5) - hash);
  }

  return VISUALS[Math.abs(hash) % VISUALS.length];
}
