/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CartProvider } from './hooks/useCart';
import MainLayout from './components/layout/MainLayout';

// Features (to be created)
import Home from './features/home/Home';
import Menu from './features/menu/Menu';
import OrderTracking from './features/orders/OrderTracking';
import MyOrders from './features/orders/MyOrders';
import AdminDashboard from './features/admin/AdminDashboard';
import KitchenDashboard from './features/admin/KitchenDashboard';
import Profile from './features/profile/Profile';

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="t/:tableId" element={<Menu />} />
              <Route path="order/:orderId" element={<OrderTracking />} />
              <Route path="order/status" element={<MyOrders />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/kitchen" element={<KitchenDashboard />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </CartProvider>
  );
}

