import React, { useState, useEffect } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { Home, UtensilsCrossed, ShoppingBag, ClipboardList, User, Settings } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { cn } from '../../lib/utils';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function BottomNav() {
  const { tableId } = useParams();
  const { itemCount } = useCart();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAdmin(user?.email === 'adityaofficial9918@gmail.com');
    });
    return () => unsub();
  }, []);

  const navItems = [
    { label: 'Menu', icon: UtensilsCrossed, path: tableId ? `/t/${tableId}` : '/' },
    { label: 'Cart', icon: ShoppingBag, path: '#cart', isCart: true },
    { label: 'Orders', icon: ClipboardList, path: '/order/status' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  const finalNavItems = [...navItems];
  if (isAdmin) {
    // Add Admin link before Profile
    finalNavItems.splice(3, 0, { label: 'Admin', icon: Settings, path: '/admin' } as any);
  }

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white/90 backdrop-blur-md border border-border-main shadow-lg rounded-full flex items-center justify-around py-3 px-6 z-40">
      {finalNavItems.map((item: any) => (
        <NavLink
          key={item.label}
          to={item.path}
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 transition-all relative",
            isActive ? "text-brand-primary" : "text-text-subtle hover:text-text-main"
          )}
        >
          {({ isActive }) => (
            <>
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-bold uppercase tracking-[0.1em]">{item.label}</span>
              
              {item.isCart && itemCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-brand-primary text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white">
                  {itemCount}
                </span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
