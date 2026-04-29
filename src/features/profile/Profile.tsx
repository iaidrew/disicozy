import React, { useState, useEffect } from 'react';
import { User, Package, Heart, LogOut, ArrowRight, Settings, Bell, Star, LogIn, Crown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getCountFromServer, doc, onSnapshot } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../lib/firebase';
import { useCart } from '../../hooks/useCart';
import { cn } from '../../lib/utils';
import { APP_CONFIG } from '../../constants';

export default function Profile() {
  const { customerId } = useCart();
  const [orderCount, setOrderCount] = useState(0);
  const [user, setUser] = useState(auth.currentUser);
  const [config, setConfig] = useState(APP_CONFIG);
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) setConfig(prev => ({ ...prev, ...snap.data() }));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchOrderCount = async () => {
      try {
        const q = query(collection(db, 'orders'), where('customerId', '==', customerId));
        const snapshot = await getCountFromServer(q);
        setOrderCount(snapshot.data().count);
      } catch (error) {
        console.error("Failed to fetch order count:", error);
      }
    };
    fetchOrderCount();
  }, [customerId]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Redirect to ordering page after success
      navigate('/t/04'); 
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const stats = [
    { label: 'Orders', value: orderCount.toString(), icon: Package },
    { label: 'Favorites', value: '0', icon: Heart },
    { label: 'Cozy Points', value: (orderCount * 50).toString(), icon: Star },
  ];

  const isAdmin = user && config.adminEmails.includes(user.email || '');

  return (
    <div className="flex flex-col min-h-screen bg-surface-base pb-32">
      <header className="p-8 pt-12 bg-[#1A1B1F] text-white relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-brand-secondary/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="h-24 w-24 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center mb-4 overflow-hidden backdrop-blur-sm">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || "User"} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={48} className="text-white" />
            )}
          </div>
          <h1 className="text-2xl font-display font-black tracking-tight">
            {user?.displayName || "Guest User"}
          </h1>
          <p className="text-white/70 text-sm font-medium">
            {user?.email || "Connect for rewards & admin access"}
          </p>
          
          {isAdmin && (
            <div className="mt-3 flex items-center gap-2 bg-brand-primary text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-vibrant">
              <Crown size={12} /> Management Access
            </div>
          )}
          
          {!user ? (
            <button 
              onClick={handleLogin}
              className="mt-4 flex items-center gap-2 bg-white text-brand-primary px-6 py-2 rounded-full font-bold text-sm shadow-lg active:scale-95 transition-all"
            >
              <LogIn size={18} /> Sign In with Google
            </button>
          ) : (
             <div className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 px-3 py-1 rounded-full border border-white/20">
                Logged In
             </div>
          )}
        </div>
      </header>

      <div className="px-6 -mt-8 relative z-10">
        <div className="bg-white rounded-3xl shadow-vibrant p-6 flex justify-around items-center border border-border-main">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="text-2xl font-black text-brand-primary">{stat.value}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mt-1">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6 mt-4">
        <section>
          <h2 className="text-xs font-black uppercase tracking-widest text-text-subtle mb-4 ml-2">App Settings</h2>
          <div className="bg-white rounded-3xl border border-border-main divide-y divide-border-main overflow-hidden">
            <MenuLink 
              icon={Bell} 
              label="Notifications" 
              onClick={() => setActiveOverlay('notifications')}
            />
            <MenuLink 
              icon={Settings} 
              label="Preferences" 
              onClick={() => setActiveOverlay('preferences')}
            />
            <MenuLink 
              icon={Heart} 
              label="Favorite Dishes" 
              onClick={() => setActiveOverlay('favorites')}
            />
          </div>
        </section>

        <section>
          <h2 className="text-xs font-black uppercase tracking-widest text-text-subtle mb-4 ml-2">Account</h2>
          <div className="bg-white rounded-3xl border border-border-main divide-y divide-border-main overflow-hidden">
            {isAdmin && (
              <MenuLink 
                icon={Settings} 
                label="Admin Dashboard"
                description="Manage menu, orders and analytics"
                color="text-brand-primary" 
                onClick={() => navigate('/admin')} 
              />
            )}
            <MenuLink icon={Package} label="Order History" onClick={() => navigate('/order/status')} />
            {user && (
              <MenuLink icon={LogOut} label="Log Out" color="text-red-500" onClick={handleLogout} />
            )}
          </div>
        </section>

        <div className="bg-brand-accent p-6 rounded-3xl border border-brand-primary/10 flex items-center justify-between group cursor-pointer hover:bg-brand-primary/5 transition-colors">
          <div>
            <h3 className="font-bold text-brand-primary">Refer & Earn</h3>
            <p className="text-xs text-brand-primary/70 mt-1">Get 100 Cozy Points for every friend!</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all">
            <ArrowRight size={20} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-lg rounded-[40px] p-10 relative overflow-hidden"
            >
              <button 
                onClick={() => setActiveOverlay(null)}
                className="absolute top-8 right-8 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-8">
                <h3 className="text-2xl font-display font-black italic tracking-tight">
                  {activeOverlay === 'notifications' && "Status Center 🔔"}
                  {activeOverlay === 'preferences' && "Preferences ⚙️"}
                  {activeOverlay === 'favorites' && "Your Favorites ❤️"}
                </h3>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-2">
                  Personalized for {user?.displayName || 'Guest'}
                </p>
              </div>

              <div className="space-y-4">
                {activeOverlay === 'notifications' && (
                  <div className="text-center py-10">
                    <div className="h-16 w-16 bg-brand-primary/5 rounded-3xl flex items-center justify-center text-brand-primary mx-auto mb-4">
                      <Bell size={24} />
                    </div>
                    <p className="font-bold text-gray-900">All caught up!</p>
                    <p className="text-xs text-gray-400 mt-2">We'll ping you when your dinner is ready.</p>
                  </div>
                )}
                {activeOverlay === 'preferences' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div>
                        <p className="text-sm font-black text-gray-900 uppercase">Cinema Mode</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Enhanced dark themes</p>
                      </div>
                      <div className="h-6 w-12 bg-gray-200 rounded-full relative">
                         <div className="h-4 w-4 bg-white rounded-full absolute left-1 top-1 shadow-sm" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div>
                        <p className="text-sm font-black text-gray-900 uppercase">Instant Order Ping</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Haptic feedback on orders</p>
                      </div>
                      <div className="h-6 w-12 bg-brand-primary rounded-full relative">
                         <div className="h-4 w-4 bg-white rounded-full absolute right-1 top-1 shadow-sm" />
                      </div>
                    </div>
                  </div>
                )}
                {activeOverlay === 'favorites' && (
                  <div className="text-center py-10">
                    <div className="h-16 w-16 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-4">
                      <Heart size={24} />
                    </div>
                    <p className="font-bold text-gray-900">No favorites curated yet</p>
                    <p className="text-xs text-gray-400 mt-2">Star dishes on the menu to see them here.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({ icon: Icon, label, color = "text-text-main", onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-surface-input transition-colors group"
    >
      <div className="flex items-center gap-4">
        <div className={cn("p-2 rounded-xl bg-surface-base group-hover:bg-white transition-colors", color)}>
          <Icon size={20} />
        </div>
        <span className={cn("font-bold text-sm", color)}>{label}</span>
      </div>
      <ArrowRight size={16} className="text-text-subtle" />
    </button>
  );
}
