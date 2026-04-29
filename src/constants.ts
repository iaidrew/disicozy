import { MenuItem } from './types';

export const SAMPLE_MENU: MenuItem[] = [
  {
    id: '1',
    name: 'Classic Paneer Tikka',
    description: 'Fresh paneer cubes marinated in yogurt and spices, grilled to perfection.',
    price: 320,
    category: 'Starters',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=400',
    isVeg: true,
    isPopular: true,
    available: true
  },
  {
    id: '2',
    name: 'Masala Dosa',
    description: 'Crispy rice crepe filled with spiced potato mash, served with chutney & sambar.',
    price: 180,
    category: 'South Indian',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=400',
    isVeg: true,
    isRecommended: true,
    available: true
  },
  {
    id: '3',
    name: 'Butter Chicken',
    description: 'Tender chicken pieces simmered in a rich tomato and butter cream gravy.',
    price: 450,
    category: 'Main Course',
    image: 'https://images.unsplash.com/photo-1603894584202-73a776100994?auto=format&fit=crop&q=80&w=400',
    isVeg: false,
    isPopular: true,
    available: true
  },
  {
    id: '4',
    name: 'Mango Lassi',
    description: 'Refreshing yogurt drink blended with sweet Alphonso mangoes.',
    price: 120,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1571006682855-3cf35b5368a5?auto=format&fit=crop&q=80&w=400',
    isVeg: true,
    available: true
  },
  {
    id: '5',
    name: 'Gulab Jamun',
    description: 'Soft milk solids dumplings deep fried and soaked in cardamom sugar syrup.',
    price: 150,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1548141243-7052a9263435?auto=format&fit=crop&q=80&w=400',
    isVeg: true,
    isRecommended: true,
    available: true
  },
  {
    id: '6',
    name: 'Amritsari Kulcha',
    description: 'Crispy stuffed bread served with chickpea curry (Chhole) and butter.',
    price: 240,
    category: 'Starters',
    image: 'https://images.unsplash.com/photo-1601050633647-8f196140ca30?auto=format&fit=crop&q=80&w=400',
    isVeg: true,
    available: true
  }
];

export const APP_CONFIG = {
  name: 'Desi Cozy',
  logo: '🍽️',
  gstPercentage: 5,
  serviceCharge: 0,
  upiId: 'desi.cozy@upi',
  upiName: 'Desi Cozy Cafe',
  adminEmails: ['adityaofficial9918@gmail.com'],
};

export const CATEGORIES = ['Starters', 'Main Course', 'South Indian', 'Desserts', 'Beverages'];

export const CATEGORY_EMOJIS: Record<string, string> = {
  'Starters': '🍢',
  'Main Course': '🥘',
  'South Indian': '🍛',
  'Desserts': '🍨',
  'Beverages': '🥤',
  'All': '🍴'
};
