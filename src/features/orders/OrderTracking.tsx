import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronLeft, Clock, MapPin, Search, CreditCard, Gift } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { cn } from '../../lib/utils';
import { QRCodeSVG } from 'qrcode.react';

const STATUS_STEPS: { status: OrderStatus; label: string; icon: any; color: string; emoji: string }[] = [
  { status: 'pending', label: 'Order Placed 📝', icon: Clock, color: 'bg-orange-500', emoji: '📝' },
  { status: 'confirmed', label: 'Accepted ✅', icon: CheckCircle2, color: 'bg-blue-500', emoji: '✅' },
  { status: 'preparing', label: 'In Preparation 🥘', icon: Search, color: 'bg-yellow-500', emoji: '🥘' },
  { status: 'ready', label: 'Ready 🍽️', icon: MapPin, color: 'bg-green-500', emoji: '🍽️' },
];

export default function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [couponCode, setCouponCode] = useState('');

  useEffect(() => {
    if (!orderId) return;
    const unsub = onSnapshot(doc(db, 'orders', orderId), (doc) => {
      if (doc.exists()) {
        setOrder({ id: doc.id, ...doc.data() } as Order);
      }
    });
    return () => unsub();
  }, [orderId]);

  if (!order) return <div className="h-screen flex items-center justify-center">Loading order...</div>;

  const currentStep = STATUS_STEPS.findIndex(s => s.status === order.status);
  const progress = ((currentStep + 1) / STATUS_STEPS.length) * 100;
  const isPaid = order.paymentStatus === 'paid';
  const handleMarkPaid = async () => {
    if (!orderId) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), { 
        paymentStatus: 'paid',
        updatedAt: serverTimestamp()
      });
      setShowPayment(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-muted">
      {/* Header */}
      <header className="bg-white p-6 flex items-center gap-4 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="font-bold text-lg">Order #{order.id.slice(-6).toUpperCase()}</h1>
          <p className="text-xs text-gray-400 uppercase tracking-widest">Live Updates</p>
        </div>
      </header>

      <div className="p-6 space-y-6 pb-32">
        <section className="bg-white rounded-[40px] p-10 text-center shadow-sm border border-gray-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <motion.div
            key={order.status}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 12 }}
            className="text-7xl mb-6 inline-block"
          >
            {STATUS_STEPS[currentStep]?.emoji || '🔥'}
          </motion.div>
          <h2 className="text-2xl font-black italic tracking-tight text-gray-900">
            {STATUS_STEPS[currentStep]?.label || 'Moving Fast!'}
          </h2>
          <div className="mt-8 px-4">
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${progress}%` }}
                 transition={{ duration: 1, ease: "easeOut" }}
                 className="h-full bg-brand-primary" 
               />
            </div>
            <div className="flex justify-between mt-2">
               {STATUS_STEPS.map((s, i) => (
                 <div key={i} className={cn(
                   "text-[8px] font-black uppercase tracking-widest",
                   i <= currentStep ? "text-brand-primary" : "text-gray-300"
                 )}>
                   {s.status}
                 </div>
               ))}
            </div>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-6 px-10 leading-relaxed italic">
            {order.status === 'pending' && "Hang tight! Chef is viewing your request."}
            {order.status === 'confirmed' && "Great news! Your order is official."}
            {order.status === 'preparing' && "Flames are high! Your dish is being crafted."}
            {order.status === 'ready' && "Ding! Your meal is ready for pickup or service."}
          </p>
        </section>

        {/* Status Timeline */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="space-y-8">
            {STATUS_STEPS.map((step, idx) => {
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;
              
              return (
                <div key={step.status} className="flex gap-4 relative">
                  {idx !== STATUS_STEPS.length - 1 && (
                    <div className={cn(
                      "absolute left-[18px] top-10 w-0.5 h-8",
                      isPast ? "bg-green-500" : "bg-gray-100"
                    )} />
                  )}
                  
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center z-10",
                    isPast ? "bg-green-500 text-white" : isCurrent ? `${step.color} text-white animate-pulse` : "bg-gray-100 text-gray-400"
                  )}>
                    {isPast ? <CheckCircle2 size={24} /> : <step.icon size={20} />}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className={cn(
                      "font-bold text-base",
                      isPast || isCurrent ? "text-gray-900" : "text-gray-300"
                    )}>{step.label}</h3>
                    {isCurrent && <p className="text-xs text-brand-primary font-medium mt-1">Our chefs are working their magic ✨</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Order Summary */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold flex items-center gap-2 mb-4 text-gray-700">
            Order Summary <span className="text-gray-400 font-normal">({order.items.length} items)</span>
          </h3>
          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span className="text-gray-600"><span className="font-bold text-gray-900">{item.quantity}x</span> {item.name}</span>
                <span className="font-semibold text-gray-900">₹{item.price * item.quantity}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-100 flex justify-between items-center font-bold text-lg">
              <span>Total Amount</span>
              <span className="text-brand-primary">₹{order.total}</span>
            </div>
          </div>
        </section>

        {/* Payment / Coupon Suggestion */}
        {!isPaid ? (
          <section className="bg-brand-accent rounded-3xl p-6 border border-orange-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-primary text-white flex items-center justify-center">
                <CreditCard size={20} />
              </div>
              <div>
                <h4 className="font-bold text-brand-primary">Payment Pending</h4>
                <p className="text-xs text-orange-700">Scan UPI to pay securely</p>
              </div>
              <button 
                onClick={() => setShowPayment(true)}
                className="ml-auto bg-brand-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-orange-200"
              >
                Pay Now
              </button>
            </div>
          </section>
        ) : (
          <motion.section 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-green-50 rounded-3xl p-6 border border-green-100 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500 text-white flex items-center justify-center">
                <Gift size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-green-700">Payment Successful!</h4>
                <p className="text-xs text-green-600">You've unlocked a welcome gift</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-dashed border-green-200 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Next Visit Coupon</p>
                <p className="text-xl font-black text-gray-900">COZY20</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-500 underline">20% OFF</p>
              </div>
            </div>
          </motion.section>
        )}
      </div>

      {/* UPI Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowPayment(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="relative bg-white w-full max-w-sm rounded-[40px] p-8 text-center space-y-6 shadow-2xl"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Pay via Indian UPI</h3>
              <p className="text-sm text-gray-500">Scan this QR with GPay, PhonePe, or Paytm</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-3xl inline-block mx-auto border border-gray-100">
              <QRCodeSVG value={`upi://pay?pa=desi.cozy@upi&pn=Desi%20Cozy%20Cafe&am=${order.total}&cu=INR`} size={180} />
            </div>

            <div className="space-y-3">
              <p className="font-bold text-lg">₹{order.total}</p>
              <button 
                onClick={handleMarkPaid} 
                className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold"
              >
                Confirm Payment (Simulation)
              </button>
              <button 
                onClick={() => setShowPayment(false)} 
                className="w-full bg-gray-100 text-gray-500 py-3 rounded-2xl font-bold text-sm"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
