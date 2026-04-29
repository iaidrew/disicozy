import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, ArrowRight, Utensils } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { APP_CONFIG } from '../../constants';

export default function Home() {
  const navigate = useNavigate();
  const [config, setConfig] = useState(APP_CONFIG);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) setConfig(prev => ({ ...prev, ...snap.data() }));
    });
    return () => unsub();
  }, []);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-8 text-center bg-surface-base relative overflow-hidden">
      {/* Background blobs for vibrancy */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-secondary/5 rounded-full blur-3xl -ml-32 -mb-32" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.8 }}
        className="w-24 h-24 bg-brand-primary rounded-[40px] flex items-center justify-center text-white rotate-12 shadow-premium mb-12 text-4xl"
      >
        {config.logo || <Utensils size={44} strokeWidth={2.5} />}
      </motion.div>

      <div className="space-y-6 max-w-xs mb-10">
        <div>
          <p className="text-brand-primary text-[10px] font-black uppercase tracking-[0.3em] mb-3">Authentic Flavors</p>
          <h1 className="text-5xl font-black text-text-main font-display leading-[1.1] italic">
            {config.name.split(' ')[0]} <br />
            <span className="text-brand-primary">{config.name.split(' ')[1] || 'Heritage'}</span>
          </h1>
        </div>
        <p className="text-text-muted text-sm leading-relaxed font-medium">
          Experience {config.name}'s curated menu with seamless digital ordering at your fingertips.
        </p>
      </div>

      <div className="w-full max-w-[280px] space-y-4">
        <button
          onClick={() => navigate('/t/04')}
          className="w-full bg-text-main text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-vibrant active:scale-95 transition-all group"
        >
          Explore Menu
          <div className="h-6 w-6 bg-white/10 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
            <ArrowRight size={16} />
          </div>
        </button>
        
        <p className="text-[10px] text-text-subtle font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <QrCode size={14} className="text-brand-primary" />
            Scan QR code at your table
        </p>
      </div>

      <div className="mt-16 flex gap-8">
        <div className="text-center">
            <p className="text-2xl font-black text-text-main">4.9</p>
            <p className="text-[9px] text-text-subtle font-black uppercase tracking-tighter">Rating</p>
        </div>
        <div className="h-10 w-px bg-border-main" />
        <div className="text-center">
            <p className="text-2xl font-black text-text-main">20+</p>
            <p className="text-[9px] text-text-subtle font-black uppercase tracking-tighter">Specials</p>
        </div>
        <div className="h-10 w-px bg-border-main" />
        <div className="text-center">
            <p className="text-2xl font-black text-text-main">1k+</p>
            <p className="text-[9px] text-text-subtle font-black uppercase tracking-tighter">Served</p>
        </div>
      </div>
    </div>
  );
}
