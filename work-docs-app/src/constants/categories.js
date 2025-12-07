export const CATEGORIES = {
  TECHNICAL: {
    id: 'technical',
    name: 'Technical & Engineering',
    description: 'Motor development, testing, specifications',
    icon: '',
    color: '#1A7F7F', // Deep Teal
  },
  BRAND: {
    id: 'brand',
    name: 'Brand & Business',
    description: 'Marketing, brand decisions, client relationships',
    icon: '',
    color: '#D17A4A', // Terracotta
  },
  WILD_IDEAS: {
    id: 'wild_ideas',
    name: 'Wild Ideas Lab',
    description: 'Experimental thinking, "what if" discussions, innovation sandbox',
    icon: '',
    color: '#9B6B9E', // Purple for creativity
  },
  TEAM: {
    id: 'team',
    name: 'Team Coordination',
    description: 'Office management, trips, daily logistics',
    icon: '',
    color: '#4A90D1', // Blue
  },
  KNOWLEDGE: {
    id: 'knowledge',
    name: 'Knowledge Base',
    description: 'Decisions made, why we chose X over Y, lessons learned',
    icon: '',
    color: '#5A9E6B', // Green
  },
  GENERAL: {
    id: 'general',
    name: 'General Discussion',
    description: 'Everything else - when you\'re not sure which category fits',
    icon: '',
    color: '#6B7280', // Neutral Gray
  },
};

export const getCategoryById = (id) => {
  return Object.values(CATEGORIES).find(cat => cat.id === id) || CATEGORIES.TECHNICAL;
};

export const getAllCategories = () => {
  return Object.values(CATEGORIES);
};
