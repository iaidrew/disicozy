import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import BottomNav from './BottomNav';
import { useCart } from '../../hooks/useCart';
import CartDrawer from '../cart/CartDrawer';

export default function MainLayout() {
  const location = useLocation();
  const { itemCount } = useCart();
  
  // Only show bottom nav on customer pages
  const isCustomerPage = !['/admin', '/kitchen'].some(path => location.pathname.startsWith(path));

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-surface-base shadow-xl relative overflow-hidden">
      <main className="flex-1 pb-24">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>

      {isCustomerPage && <BottomNav />}
      
      <CartDrawer />
    </div>
  );
}
