import {
  Plane,
  Home,
  Utensils,
  Briefcase,
  Calendar,
  Tag,
} from 'lucide-react';

/**
 * Group categories configuration with clean SVG icons (no emojis).
 */
export const GROUP_CATEGORIES = [
  { id: 'trip', label: 'Trip & Travel', icon: Plane },
  { id: 'home', label: 'Home & Roommates', icon: Home },
  { id: 'food', label: 'Dining & Outings', icon: Utensils },
  { id: 'work', label: 'Work & Projects', icon: Briefcase },
  { id: 'event', label: 'Events & Parties', icon: Calendar },
  { id: 'other', label: 'General / Other', icon: Tag },
];

export function getGroupCategoryMeta(categoryId) {
  return GROUP_CATEGORIES.find(c => c.id === categoryId) || GROUP_CATEGORIES[1]; // default 'home'
}

/**
 * Ensures clean backward compatibility by migrating single-roommate data into groups.
 * Does NOT generate any dummy data or default groups.
 */
export function migrateToGroups(rawGroups, rawRoommates = [], rawExpenses = [], rawHistory = []) {
  if (Array.isArray(rawGroups) && rawGroups.length > 0) {
    // Purge any stale dummy placeholders from previous sessions
    const cleaned = rawGroups.filter((g) => {
      const isLegacyDummy =
        g.id === 'grp_default' &&
        g.name === 'Roommates' &&
        Array.isArray(g.members) &&
        (g.members.length === 0 ||
          (g.members.length === 2 && g.members.includes('Alice') && g.members.includes('Bob'))) &&
        (!g.expenses || g.expenses.length === 0) &&
        (!g.history || g.history.length === 0);
      return !isLegacyDummy;
    });

    return cleaned.map((g) => ({
      id: g.id || `grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: g.name || 'Unnamed Group',
      category: g.category || 'home',
      members: Array.isArray(g.members) ? g.members : [],
      expenses: Array.isArray(g.expenses) ? g.expenses : [],
      history: Array.isArray(g.history) ? g.history : [],
      createdAt: g.createdAt || new Date().toISOString(),
    }));
  }

  // Only migrate if user had actual non-empty legacy data
  const hasLegacyData =
    (Array.isArray(rawRoommates) && rawRoommates.length > 0) ||
    (Array.isArray(rawExpenses) && rawExpenses.length > 0);

  if (hasLegacyData) {
    return [
      {
        id: `grp_${Date.now()}`,
        name: 'My Group',
        category: 'home',
        members: Array.isArray(rawRoommates) ? rawRoommates : [],
        expenses: Array.isArray(rawExpenses) ? rawExpenses : [],
        history: Array.isArray(rawHistory) ? rawHistory : [],
        createdAt: new Date().toISOString(),
      },
    ];
  }

  // Clean slate: No dummy data and no default groups
  return [];
}
