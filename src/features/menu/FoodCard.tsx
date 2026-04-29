import React from 'react';
import { Plus, Minus, Star } from 'lucide-react';
import { MenuItem } from '../../types';
import { useCart } from '../../hooks/useCart';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface FoodCardProps {
  item: MenuItem;
  compact?: boolean;
  key?: React.Key;
}

export default function FoodCard({ item, compact }: FoodCardProps) {
  const { cart, addToCart, updateQuantity } = useCart();
  const [isAdded, setIsAdded] = React.useState(false);
  const cartItem = cart.find(i => i.id === item.id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = () => {
    addToCart(item);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  if (compact) {
    return (
      <motion.div 
        layout
        className="bg-white rounded-[32px] overflow-hidden border border-border-main group hover:shadow-vibrant transition-all duration-300"
      >
        <div className="h-36 w-full relative overflow-hidden">
          <img 
            src={item.image} 
            alt={item.name} 
            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" 
            referrerPolicy="no-referrer" 
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <div className={cn(
              "h-5 w-5 rounded-md border-2 flex items-center justify-center bg-white shadow-sm",
              item.isVeg ? "border-green-500" : "border-red-500"
            )}>
              <div className={cn("h-1.5 w-1.5 rounded-full", item.isVeg ? "bg-green-500" : "bg-red-500")}></div>
            </div>
          </div>
          {item.isPopular && (
            <div className="absolute top-3 right-3 bg-brand-secondary text-brand-secondary-foreground px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
              <Star size={10} fill="currentColor" />
              TOP
            </div>
          )}
        </div>
        <div className="p-4">
          <h4 className="font-display font-bold text-base text-gray-900 truncate leading-tight">{item.name}</h4>
          <div className="flex items-center justify-between mt-3">
            <span className="font-black text-brand-primary text-base">₹{item.price}</span>
            
            <AnimatePresence mode="wait">
              {quantity > 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center bg-brand-accent rounded-xl border border-brand-primary/10 overflow-hidden"
                >
                  <button 
                    onClick={() => updateQuantity(item.id, quantity - 1)}
                    className="p-1 px-2 text-brand-primary hover:bg-brand-primary/10 transition-colors"
                  >
                    <Minus size={14} strokeWidth={3} />
                  </button>
                  <span className="text-sm font-black text-brand-primary min-w-[20px] text-center">{quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, quantity + 1)}
                    className="p-1 px-2 text-brand-primary hover:bg-brand-primary/10 transition-colors"
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleAdd}
                  className={cn(
                    "h-8 px-4 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm",
                    isAdded ? "bg-green-500 text-white" : "bg-brand-primary text-white"
                  )}
                >
                  {isAdded ? 'Added!' : 'ADD'}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      layout
      className="flex gap-5 bg-white p-5 rounded-[40px] border border-border-main hover:shadow-vibrant transition-all duration-500 relative group"
    >
      <div className="flex-1 py-1">
        <div className={cn(
          "h-5 w-5 rounded-md border-2 flex items-center justify-center bg-white mb-3 shadow-sm",
          item.isVeg ? "border-green-500" : "border-red-500"
        )}>
          <div className={cn("h-1.5 w-1.5 rounded-full", item.isVeg ? "bg-green-500" : "bg-red-500")}></div>
        </div>
        <h3 className="font-display font-black text-xl text-gray-900 leading-tight">{item.name}</h3>
        <p className="text-text-subtle text-sm mt-2 line-clamp-2 leading-relaxed font-medium">{item.description}</p>
        <div className="mt-5 flex items-center gap-4">
          <span className="font-black text-2xl text-gray-900">₹{item.price}</span>
          {item.isPopular && (
            <span className="bg-brand-accent text-brand-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <Star size={10} fill="currentColor" />
              House Specialty
            </span>
          )}
        </div>
      </div>
      
      <div className="relative h-32 w-32 shrink-0">
        <div className="h-full w-full rounded-[32px] overflow-hidden shadow-premium group-hover:rotate-2 transition-transform duration-500">
          <img 
            src={item.image} 
            alt={item.name} 
            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" 
            referrerPolicy="no-referrer" 
          />
        </div>
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3/4">
          <AnimatePresence mode="wait">
            {quantity > 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center justify-between bg-white rounded-2xl border-2 border-brand-primary shadow-xl overflow-hidden h-10"
              >
                <button 
                  onClick={() => updateQuantity(item.id, quantity - 1)}
                  className="px-3 h-full text-brand-primary hover:bg-brand-accent transition-colors"
                >
                  <Minus size={16} strokeWidth={3} />
                </button>
                <span className="text-base font-black text-brand-primary">{quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.id, quantity + 1)}
                  className="px-3 h-full text-brand-primary hover:bg-brand-accent transition-colors"
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onClick={handleAdd}
                className={cn(
                  "w-full h-10 rounded-2xl border-2 shadow-xl text-sm font-black tracking-widest uppercase transition-all active:scale-95",
                  isAdded 
                    ? "bg-green-500 border-green-500 text-white" 
                    : "bg-white text-brand-primary border-brand-primary hover:bg-brand-primary hover:text-white"
                )}
              >
                {isAdded ? 'Added ✅' : 'ADD'}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
