import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useCart } from '../../hooks/useCart';
import { Order } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronRight, CheckCircle2, ChevronLeft, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { customerId } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      where('customerId', '==', customerId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => {
        const d = doc.data();
        return { 
          id: doc.id, 
          ...d,
          createdAt: d.createdAt?.toDate() || new Date() 
        } as Order;
      });
      // Sort client-side to avoid needing composite indexes in dev
      data.sort((a, b) => (b.createdAt as any) - (a.createdAt as any));
      setOrders(data);
      setLoading(false);
    }, (error) => {
      console.error("Orders sync error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [customerId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface-base">
      <header className="p-6 bg-white border-b border-border-main sticky top-0 z-20 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-input rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-display font-black">Your Orders</h1>
      </header>

      <div className="p-6 space-y-6 pb-32">
        {orders.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-20 w-20 bg-surface-input rounded-full flex items-center justify-center text-text-subtle">
              <ShoppingBag size={32} />
            </div>
            <div>
              <h3 className="font-bold text-lg">No orders yet</h3>
              <p className="text-sm text-text-muted">Start ordering from the menu to see them here!</p>
            </div>
            <button 
                onClick={() => navigate('/')}
                className="bg-brand-primary text-white px-6 py-2.5 rounded-2xl font-bold"
            >
                View Menu
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/order/${order.id}`)}
                className="bg-white p-5 rounded-[32px] border border-border-main shadow-sm hover:shadow-vibrant transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-black text-text-subtle uppercase tracking-widest">Order ID: #{order.id.slice(-6).toUpperCase()}</p>
                    <h3 className="font-bold text-gray-900 mt-1">Table {order.tableId}</h3>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    order.status === 'ready' || order.status === 'served' ? "bg-green-50 text-green-600" : "bg-brand-accent text-brand-primary"
                  )}>
                    {order.status}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                   {order.items.slice(0, 2).map((item, idx) => (
                     <p key={idx} className="text-sm text-text-muted flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-medium">₹{item.price * item.quantity}</span>
                     </p>
                   ))}
                   {order.items.length > 2 && (
                     <p className="text-[11px] text-text-subtle italic">+ {order.items.length - 2} more items</p>
                   )}
                </div>

                <div className="pt-4 border-t border-border-main flex justify-between items-center">
                  <div className="flex items-center gap-2 text-text-subtle">
                    <Clock size={14} />
                    <span className="text-xs font-medium">Recently updated</span>
                  </div>
                  <div className="flex items-center gap-2 text-brand-primary font-black">
                    <span>Total: ₹{order.total}</span>
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
