import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { cn } from '../../lib/utils';
import { useNavigate, useParams } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import confetti from 'canvas-confetti';

export default function CartDrawer() {
  const { 
    cart, removeFromCart, updateQuantity, subtotal, total, taxes, serviceCharge, itemCount, clearCart, customerId, config 
  } = useCart();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isOrdering, setIsOrdering] = React.useState(false);
  const { tableId } = useParams();
  const navigate = useNavigate();

  const handlePlaceOrder = async () => {
    if (!tableId || cart.length === 0) return;
    
    setIsOrdering(true);
    try {
      const orderData = {
        tableId,
        customerId,
        customerEmail: auth.currentUser?.email || '',
        items: cart,
        subtotal,
        taxes,
        serviceCharge,
        total,
        status: 'pending',
        paymentStatus: 'unpaid',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Celebrate success!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FB642A', '#000000', '#FFFFFF']
      });

      clearCart();
      setIsOpen(false);
      navigate(`/order/${docRef.id}`);
    } catch (error) {
      console.error('Order error:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <>
      {/* Floating Action Button for Cart */}
      {!isOpen && itemCount > 0 && (
        <motion.button
          initial={{ y: 100 }}
          animate={{ y: 0, scale: [1, 1.05, 1] }}
          transition={{ 
            y: { type: 'spring' },
            scale: { repeat: Infinity, duration: 2, ease: "easeInOut" }
          }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 bg-brand-primary text-white p-4 rounded-full shadow-2xl flex items-center gap-3 z-50 group transition-transform ring-4 ring-orange-500/20 px-6"
        >
          <ShoppingCart size={24} />
          <span className="font-bold">{itemCount} items • ₹{total}</span>
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 bg-white rounded-t-[32px] max-h-[85vh] overflow-hidden flex flex-col z-[51] max-w-md mx-auto"
            >
              <div className="p-6 flex items-center justify-between border-bottom border-gray-100">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Your Order <span className="text-gray-400 font-normal">({itemCount} items)</span>
                </h2>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-2 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-400 space-y-4">
                    <ShoppingCart size={48} strokeWidth={1} />
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative h-20 w-20 flex-shrink-0">
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                        {item.isVeg !== undefined && (
                           <div className={cn("absolute top-1 right-1 h-3 w-3 rounded-sm border flex items-center justify-center", item.isVeg ? "border-green-500 bg-white" : "border-red-500 bg-white")}>
                              <div className={cn("h-1.5 w-1.5 rounded-full", item.isVeg ? "bg-green-500" : "bg-red-500")}></div>
                           </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{item.name}</h4>
                        <p className="text-brand-primary font-bold">₹{item.price * item.quantity}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                            <Minus size={14} />
                          </button>
                          <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 bg-surface-warm border-t border-gray-100 flex flex-col gap-4">
                <div className="space-y-2 border-b border-gray-200/50 pb-4">
                  <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  {config.gstPercentage > 0 && (
                    <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                      <span>GST ({config.gstPercentage}%)</span>
                      <span>₹{taxes}</span>
                    </div>
                  )}
                  {config.serviceCharge > 0 && (
                    <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                      <span>Service Charge ({config.serviceCharge}%)</span>
                      <span>₹{serviceCharge}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center text-xl font-black italic">
                  <span>Grand Total</span>
                  <span className="text-brand-primary">₹{total}</span>
                </div>
                
                <button
                  disabled={cart.length === 0 || isOrdering}
                  onClick={handlePlaceOrder}
                  className="w-full bg-brand-primary text-white py-5 rounded-[24px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-vibrant active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
                >
                  {isOrdering ? 'TRANSMITTING...' : 'Place Order 🍕'}
                  {!isOrdering && <ArrowRight size={20} />}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
