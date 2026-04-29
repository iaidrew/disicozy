import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, updateDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, CheckCircle2, Clock, Check, X, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const activeOrders = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Order))
        .filter(o => !['served', 'cancelled'].includes(o.status));
      setOrders(activeOrders);
    });
    return () => unsub();
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { 
          status,
          updatedAt: serverTimestamp() 
      });
    } catch (e) {
      console.error(e);
    }
  };

  const getTimeElapsed = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const seconds = Math.floor((new Date().getTime() - timestamp.toDate().getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  return (
    <div className="min-h-screen bg-surface-base text-text-main p-8 lg:p-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-3xl font-black font-serif italic tracking-tight flex items-center gap-4">
            <div className="h-12 w-12 bg-text-main rounded-2xl flex items-center justify-center text-white">
               <Utensils size={28} />
            </div>
            Kitchen Pipeline 🔪
          </h1>
          <p className="text-text-subtle text-sm mt-2 font-medium">Real-time order management system ⚡</p>
        </div>
        <div className="flex gap-4 items-center bg-white p-2 rounded-2xl border border-border-main shadow-sm">
          <div className="px-4 py-2 flex items-center gap-2 text-sm font-bold bg-orange-100 text-orange-700 rounded-xl">
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            {orders.length} Active Orders 🥘
          </div>
          <button className="text-text-subtle hover:text-text-main transition-colors px-4 py-2 font-bold text-xs uppercase tracking-widest">History</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <AnimatePresence>
          {orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl overflow-hidden border border-border-main flex flex-col shadow-sm hover:shadow-xl transition-all duration-300 group"
            >
              <div className={cn(
                "p-5 flex items-center justify-between border-b border-border-main",
                order.status === 'pending' ? 'bg-orange-50' : 'bg-surface-base'
              )}>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Table {order.tableId}</h3>
                  <p className="text-[10px] text-text-subtle font-black tracking-widest mt-0.5">#{order.id.slice(-6).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.15em] mb-1 italic">{order.status} ⚡</p>
                  <p className="text-[10px] text-text-subtle font-black uppercase tracking-widest">{getTimeElapsed(order.createdAt)}</p>
                </div>
              </div>

              <div className="p-6 flex-1 space-y-4 bg-white/50 backdrop-blur-sm">
                {order.items.map((item, i) => (
                  <div key={i} className="flex gap-3">
                     <span className="font-black text-brand-primary text-sm min-w-[24px] pt-0.5">{item.quantity}×</span>
                     <div className="flex flex-col">
                       <span className="font-bold text-sm text-text-main">{item.name}</span>
                       {item.customizations && (
                         <span className="text-[11px] text-text-muted mt-1 leading-relaxed italic border-l border-brand-primary/30 pl-2">“{item.customizations}”</span>
                       )}
                     </div>
                  </div>
                ))}
              </div>

              <div className="p-5 bg-surface-base/50 border-t border-border-main flex gap-2">
                {/* Status cycling logic preserved */}
                {order.status === 'pending' && (
                  <button onClick={() => updateStatus(order.id, 'confirmed')} className="flex-1 bg-text-main text-white py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-md">Confirm</button>
                )}
                {order.status === 'confirmed' && (
                   <button onClick={() => updateStatus(order.id, 'preparing')} className="flex-1 bg-orange-500 text-white py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-md">Start Cook</button>
                )}
                {order.status === 'preparing' && (
                   <button onClick={() => updateStatus(order.id, 'ready')} className="flex-1 bg-green-600 text-white py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-md">Mark Ready</button>
                )}
                {order.status === 'ready' && (
                   <button onClick={() => updateStatus(order.id, 'served')} className="flex-1 bg-text-subtle text-white py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-md">Served</button>
                )}
                <button onClick={() => updateStatus(order.id, 'cancelled')} className="p-3 bg-red-50 text-red-600 rounded-2xl border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"><X size={18} /></button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {orders.length === 0 && (
          <div className="col-span-full h-64 flex flex-col items-center justify-center text-gray-600">
            <CheckCircle2 size={64} strokeWidth={1} className="mb-4 opacity-20" />
            <p className="text-xl font-bold">All caught up!</p>
            <p className="text-sm">No active orders in the kitchen.</p>
          </div>
        )}
      </div>
    </div>
  );
}
