import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Star, Flame, Loader2, Bell } from 'lucide-react';
import { collection, onSnapshot, query, addDoc, getDocs, doc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { SAMPLE_MENU, CATEGORIES, CATEGORY_EMOJIS, APP_CONFIG } from '../../constants';
import { MenuItem } from '../../types';
import FoodCard from './FoodCard';
import { cn } from '../../lib/utils';
import { onAuthStateChanged } from 'firebase/auth';

export default function Menu() {
  const { tableId } = useParams();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);
  const [config, setConfig] = useState(APP_CONFIG);
  const [showGreeting, setShowGreeting] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) setConfig(prev => ({ ...prev, ...snap.data() }));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowGreeting(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'menuItems'), (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      setMenuItems(items);
      setLoading(false);
      
      // Auto-seed if empty for demo purposes
      if (items.length === 0) {
        SAMPLE_MENU.forEach(async (item) => {
            const { id, ...itemData } = item;
            await addDoc(collection(db, 'menuItems'), itemData);
        });
      }
    });

    return () => unsub();
  }, []);

  const itemsToDisplay = menuItems.length > 0 ? menuItems : [];

  const filteredMenu = itemsToDisplay.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
        <div className="h-screen flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-brand-primary" size={40} />
            <p className="text-sm font-bold text-text-muted animate-pulse">Setting up your culinary experience...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface-base">
      {/* Greeting Overlay */}
      <AnimatePresence>
        {showGreeting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-brand-primary flex items-center justify-center p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 1.1, opacity: 0 }}
            >
              <div className="text-6xl mb-6">🍿</div>
              <h2 className="text-white text-4xl font-display font-black italic tracking-tight">
                {user?.displayName ? `Namaste, ${user.displayName.split(' ')[0]}!` : 'Welcome to'}
              </h2>
              <p className="text-white/60 text-lg font-black uppercase tracking-[0.3em] mt-4">
                {config.name} {config.logo}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="p-6 pb-4 bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-border-main">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-display font-black text-text-main tracking-tight">{config.name} {config.logo}</h1>
            <p className="text-brand-primary text-[10px] font-black uppercase tracking-widest">Table No. {tableId || '04'}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-surface-base border border-border-main flex items-center justify-center text-lg shadow-sm">
            🇮🇳
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-subtle" size={16} />
          <input
            type="text"
            placeholder="Search for starters, mains, drinks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-input border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-1 focus:ring-brand-primary transition-all outline-none text-text-main placeholder:text-text-subtle"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2 -mx-2 px-2">
          {['All', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border flex items-center gap-2",
                activeCategory === cat 
                  ? "bg-brand-primary text-white border-brand-primary shadow-premium" 
                  : "bg-white text-text-subtle border-border-main hover:border-text-subtle"
              )}
            >
              <span>{CATEGORY_EMOJIS[cat]}</span>
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6 space-y-10 pb-40">
        {activeCategory === 'All' && !searchQuery && (
          <>
            {/* Recommended Section */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-xl bg-yellow-50 flex items-center justify-center">
                    <Star className="text-yellow-500 fill-yellow-500" size={18} />
                </div>
                <h2 className="text-xl font-display font-black tracking-tight">Our Signatures ✨</h2>
              </div>
              <div className="flex overflow-x-auto no-scrollbar gap-6 -mx-6 px-6 pb-4">
                {filteredMenu.filter(item => item.isRecommended).map(item => (
                  <div key={item.id} className="w-56 flex-shrink-0">
                    <FoodCard item={item} compact />
                  </div>
                ))}
              </div>
            </section>

            {/* Popular Section */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-xl bg-orange-50 flex items-center justify-center">
                    <Flame className="text-brand-primary" size={18} />
                </div>
                <h2 className="text-xl font-display font-black tracking-tight">Bestsellers 🔥</h2>
              </div>
              <div className="space-y-6">
                {filteredMenu.filter(item => item.isPopular).map(item => (
                  <FoodCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          </>
        )}

        {/* Categorized Items */}
        <section>
          {!searchQuery && activeCategory !== 'All' && (
            <h2 className="text-xl font-display font-black tracking-tight mb-6">{activeCategory}</h2>
          )}
          {(searchQuery || activeCategory === 'All') && (
             <h2 className="text-xl font-display font-black tracking-tight mb-6">The Menu</h2>
          )}
          
          <div className="space-y-6">
            {filteredMenu.map(item => (
              <FoodCard key={item.id} item={item} />
            ))}
            {filteredMenu.length === 0 && (
              <div className="text-center py-20">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-surface-input text-text-subtle mb-4">
                    <Search size={32} />
                </div>
                <p className="text-text-subtle font-bold italic">No dishes match your search...</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
