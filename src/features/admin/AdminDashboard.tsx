import React, { useState, useEffect } from 'react';
import { 
  collection, query, onSnapshot, orderBy, doc, updateDoc, setDoc, serverTimestamp, limit 
} from 'firebase/firestore';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import { Order } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Users, ShoppingBag, IndianRupee, 
  ArrowUpRight, ArrowDownRight, LayoutDashboard, Utensils, Settings, Star,
  Lock, LogIn, X, ChevronRight, Bell
} from 'lucide-react';

import { APP_CONFIG, CATEGORIES, CATEGORY_EMOJIS } from '../../constants';
import MenuManager from './MenuManager';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState(auth.currentUser);
  const [authLoading, setAuthLoading] = useState(true);
  const [config, setConfig] = useState(APP_CONFIG);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    revenue: 0,
    totalOrders: 0,
    avgValue: 0,
    activeTables: 0
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Fetch remote config from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(prev => ({ ...prev, ...docSnap.data() }));
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || !config.adminEmails.includes(user.email || '')) return;

    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(data);
      
      const revenue = data.reduce((acc, o) => acc + (o.paymentStatus === 'paid' ? o.total : 0), 0);
      const activeOrderFilter = (o: Order) => !['served', 'cancelled'].includes(o.status);
      const tables = new Set(data.filter(activeOrderFilter).map(o => o.tableId)).size;
      
      setStats({
        revenue,
        totalOrders: data.length,
        avgValue: data.length > 0 ? Math.round(revenue / data.length) : 0,
        activeTables: tables
      });
    });
    return () => unsub();
  }, [user, config.adminEmails]);

  // Handle Notifications and Logs
  useEffect(() => {
    if (!user || !config.adminEmails.includes(user.email || '')) return;

    // Listen for recent logs/activities
    const logsQuery = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(20));
    const unsubLogs = onSnapshot(logsQuery, (snap) => {
      const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAuditLogs(logs);
      
      // Filter logs for notifications (e.g., new orders in the last hour)
      const recentNotifications = logs.filter((log: any) => {
        const oneHourAgo = Date.now() - 3600000;
        return log.type === 'ORDER_CREATED' && (log.timestamp?.toMillis?.() || 0) > oneHourAgo;
      });
      setNotifications(recentNotifications);
    });

    return () => unsubLogs();
  }, [user, config.adminEmails]);

  const logAction = async (type: string, message: string, details?: any) => {
    try {
      await setDoc(doc(collection(db, 'logs')), {
        type,
        message,
        details,
        adminEmail: user?.email,
        adminName: user?.displayName,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Logging failed:", e);
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
    }
  };

  if (authLoading) {
    return (
        <div className="h-screen flex items-center justify-center bg-[#F8F9FA]">
            <div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );
  }

  if (!user || !config.adminEmails.includes(user.email || '')) {
    return (
      <div className="h-screen bg-[#F0F1F3] flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[40px] shadow-premium max-w-md w-full text-center space-y-8 border border-border-main">
          <div className="h-20 w-20 bg-brand-primary/10 rounded-[32px] flex items-center justify-center text-brand-primary mx-auto">
            <Lock size={40} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black text-text-main leading-tight italic">Admin Access Only</h1>
            <p className="text-text-subtle text-sm mt-4 leading-relaxed font-medium">
              This dashboard is for authorized restaurant management only. Please sign in with your credentials.
            </p>
          </div>
          <button 
            onClick={handleLogin}
            className="w-full bg-brand-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-vibrant active:scale-95 transition-all"
          >
            <LogIn size={20} /> Sign In as Admin
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'Overview', icon: LayoutDashboard, emoji: '🏠' },
    { id: 'Live Orders', icon: ShoppingBag, badge: orders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).length, emoji: '🔥' },
    { id: 'Menu Manager', icon: Utensils, emoji: '📖' },
    { id: 'Analytics', icon: TrendingUp, emoji: '📈' },
    { id: 'Customers', icon: Users, emoji: '👥' },
    { id: 'Settings', icon: Settings, emoji: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-[#F0F1F3] flex font-sans">
      {/* Sidebar Rail */}
      <aside className="w-20 lg:w-72 bg-[#1A1B1F] text-white flex flex-col sticky top-0 h-screen z-50 transition-all duration-500">
        <div className="p-8">
            <div className="h-10 w-10 lg:h-12 lg:w-12 bg-brand-primary rounded-2xl flex items-center justify-center text-white rotate-12 shadow-vibrant mb-10">
                <Utensils size={24} strokeWidth={2.5} />
            </div>
            <div className="hidden lg:block">
                <h1 className="text-xl font-display font-black tracking-tight italic">{config.name} {config.logo}</h1>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">Management Hub</p>
            </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                        "w-full flex items-center justify-center lg:justify-start gap-4 p-4 rounded-2xl transition-all group relative",
                        activeTab === item.id 
                            ? "bg-brand-primary text-white shadow-premium" 
                            : "text-white/40 hover:bg-white/5 hover:text-white"
                    )}
                >
                    <item.icon size={22} className={cn(activeTab === item.id ? "scale-110" : "group-hover:scale-110 transition-transform")} />
                    <span className="hidden lg:block font-black text-[11px] uppercase tracking-[0.15em]">
                        {item.id} {item.emoji}
                    </span>
                    {item.badge && item.badge > 0 && (
                        <span className="absolute top-2 right-2 lg:static h-5 w-5 bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-lg animate-pulse lg:ml-auto">
                            {item.badge}
                        </span>
                    )}
                </button>
            ))}
        </nav>

        <div className="p-6 border-t border-white/5">
            <div className="flex items-center gap-4">
                <img src={user.photoURL!} alt="Admin" className="h-10 w-10 rounded-full border-2 border-brand-primary p-0.5" />
                <div className="hidden lg:block min-w-0">
                    <p className="text-sm font-black truncate">{user.displayName}</p>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">Primary Administrator</p>
                </div>
            </div>
            <button 
                onClick={() => auth.signOut()}
                className="mt-6 w-full hidden lg:flex items-center justify-center gap-2 text-[10px] font-black text-white/20 hover:text-red-500 transition-colors py-3 rounded-xl hover:bg-white/5 uppercase tracking-widest"
            >
                Log Out
            </button>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-24 bg-white border-b border-[#E0E2E7] px-10 flex items-center justify-between shrink-0 z-40">
            <div className="flex items-center gap-4">
                <h2 className="text-2xl font-display font-black tracking-tight text-gray-900">{activeTab}</h2>
                <div className="h-6 w-px bg-gray-200" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Global Ops 🌐</p>
            </div>
            
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 bg-[#F8F9FA] px-4 py-2.5 rounded-2xl border border-gray-50">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Servers Nominal</span>
                </div>
                
                <div className="relative">
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={cn(
                            "h-12 w-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 hover:text-brand-primary transition-all relative group",
                            showNotifications && "border-brand-primary text-brand-primary shadow-sm"
                        )}
                    >
                        <Bell size={20} />
                        {notifications.length > 0 && (
                            <div className="absolute top-3 right-3 h-2 w-2 bg-red-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
                        )}
                    </button>

                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-4 w-80 bg-white rounded-[32px] border border-gray-100 shadow-2xl overflow-hidden z-[60]"
                            >
                                <div className="p-6 bg-[#1A1B1F] text-white">
                                    <h4 className="text-xs font-black uppercase tracking-widest">Command Center Alerts 🚨</h4>
                                </div>
                                <div className="max-h-96 overflow-y-auto p-4 space-y-3">
                                    {notifications.length > 0 ? notifications.map((n) => (
                                        <div key={n.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:border-brand-primary transition-all cursor-pointer">
                                            <p className="text-[11px] font-black text-gray-900 uppercase leading-tight">{n.message}</p>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-tighter">
                                                {n.timestamp?.toDate().toLocaleTimeString()} • Kitchen Direct
                                            </p>
                                        </div>
                                    )) : (
                                        <div className="py-10 text-center">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No active alerts</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 border-t border-gray-50 bg-[#F8F9FA]">
                                    <button 
                                        onClick={() => setShowNotifications(false)}
                                        className="w-full py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-brand-primary transition-all"
                                    >
                                        Collapse Feed
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 lg:p-14 bg-[#F0F1F3]">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                    {activeTab === 'Overview' && <DashboardOverview stats={stats} orders={orders} setShowAuditLogs={setShowAuditLogs} />}
                    {activeTab === 'Live Orders' && <LiveOrderTracker orders={orders} logAction={logAction} />}
                    {activeTab === 'Menu Manager' && <MenuManager />}
                    {activeTab === 'Analytics' && <AnalyticsDashboard orders={orders} />}
                    {activeTab === 'Customers' && <CustomerInsights orders={orders} />}
                    {activeTab === 'Settings' && <SystemSettings config={config} logAction={logAction} />}
                </motion.div>
            </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
                {showAuditLogs && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            className="bg-white w-full max-w-2xl rounded-[48px] shadow-3xl overflow-hidden flex flex-col h-[70vh]"
                        >
                            <div className="p-8 bg-[#1A1B1F] text-white flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-display font-black italic tracking-tight">System Audit Log 🕵️‍♂️</h3>
                                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1">Infrastructure event history</p>
                                </div>
                                <button 
                                    onClick={() => setShowAuditLogs(false)}
                                    className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                                {auditLogs.length > 0 ? auditLogs.map((log) => (
                                    <div key={log.id} className="p-5 rounded-3xl border border-gray-50 bg-[#F8F9FA] hover:border-brand-primary/20 transition-all flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-xs shadow-sm">
                                            {log.type === 'ORDER_CREATED' ? '📝' : '⚙️'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{log.message}</p>
                                            <p className="text-[10px] text-gray-400 font-bold mt-1">
                                                {log.adminName || 'System'} • {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Just now'}
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                        <p className="text-sm font-black uppercase tracking-[0.2em] italic">Log storage empty</p>
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

function DashboardOverview({ stats, orders, setShowAuditLogs }: { stats: any, orders: Order[], setShowAuditLogs: (v: boolean) => void }) {
    const recentOrders = orders.slice(0, 5);
    const chartData = orders.slice(0, 10).reverse().map((o, i) => ({
        name: `O#${o.id.slice(-4).toUpperCase()}`,
        amount: o.total,
        profit: Math.round(o.total * 0.42)
    }));

    return (
        <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard title="Net Revenue 💰" value={`₹${stats.revenue.toLocaleString()}`} icon={IndianRupee} trend="+12.5%" color="bg-green-500" />
                <StatCard title="Total Volume 📦" value={stats.totalOrders.toString()} icon={ShoppingBag} trend="+4.2%" color="bg-brand-primary" />
                <StatCard title="Active Tables 🪑" value={`${stats.activeTables}/20`} icon={Users} trend="Active" color="bg-blue-500" />
                <StatCard title="Average ABV 📈" value={`₹${stats.avgValue}`} icon={TrendingUp} trend="-1.5%" color="bg-purple-500" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <div className="xl:col-span-2 bg-white p-10 lg:p-12 rounded-[56px] border border-[#E0E2E7] shadow-sm">
                    <div className="flex items-center justify-between mb-12">
                         <div>
                            <h3 className="text-2xl font-display font-black text-gray-900 italic tracking-tight">Revenue Velocity 🚀</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Real-time performance metrics</p>
                         </div>
                         <div className="bg-[#F8F9FA] p-1.5 rounded-2xl flex gap-2">
                             <button className="px-4 py-2 bg-white shadow-sm border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest">Daily</button>
                             <button className="px-4 py-2 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest">Weekly</button>
                         </div>
                    </div>
                    <div className="h-[380px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FB642A" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#FB642A" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F1F3" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#A3A3A3', fontWeight: 800 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#A3A3A3', fontWeight: 800 }} />
                                <Tooltip contentStyle={{ borderRadius: '28px', border: 'none', boxShadow: '0 25px 50px rgba(0,0,0,0.06)', padding: '20px' }} />
                                <Area type="monotone" dataKey="amount" stroke="#FB642A" strokeWidth={5} fillOpacity={1} fill="url(#revenueGradient)" />
                                <Area type="monotone" dataKey="profit" stroke="#FB642A30" strokeWidth={2} fill="transparent" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-10 lg:p-12 rounded-[56px] border border-[#E0E2E7] shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-xl font-display font-black text-gray-900 italic uppercase tracking-tighter">Terminal Feed 📟</h3>
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    </div>
                    <div className="space-y-8 flex-1 overflow-y-auto no-scrollbar pr-2">
                        {recentOrders.map((order) => (
                            <div key={order.id} className="flex gap-5 group cursor-pointer">
                                <div className="h-14 w-14 rounded-3xl bg-[#F8F9FA] border border-gray-100 flex items-center justify-center shrink-0 shadow-sm group-hover:bg-brand-primary group-hover:text-white transition-all transform group-hover:rotate-6">
                                    <ShoppingBag size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-sm font-black text-gray-900 uppercase truncate">Table {order.tableId}</h4>
                                        <p className="text-sm font-black text-brand-primary">₹{order.total}</p>
                                    </div>
                                    <div className="flex justify-between items-center mt-1.5">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">#{order.id.slice(-6).toUpperCase()}</p>
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border",
                                            order.status === 'pending' ? 'bg-orange-50 text-orange-500 border-orange-100' : 'bg-green-50 text-green-500 border-green-100'
                                        )}>{order.status}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button 
                        onClick={() => setShowAuditLogs(true)}
                        className="w-full mt-10 py-5 rounded-[24px] border-2 border-dashed border-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] hover:border-brand-primary hover:text-brand-primary transition-all"
                    >
                        View Audit History
                    </button>
                </div>
            </div>
        </div>
    );
}

function LiveOrderTracker({ orders, logAction }: { orders: Order[], logAction: any }) {
    const liveOrders = orders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status));

    return (
        <div className="space-y-12">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-3xl font-display font-black text-gray-900 italic">Live Kitchen View 🥘</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Real-time throughput analytics</p>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-brand-primary animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Monitoring Active</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {liveOrders.map((order) => (
                    <motion.div
                        key={order.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                            "bg-white p-10 rounded-[48px] border-2 shadow-sm relative overflow-hidden group",
                            order.status === 'pending' ? "border-brand-primary" : "border-gray-100"
                        )}
                    >
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h4 className="text-3xl font-display font-black text-gray-900 leading-tight">Table {order.tableId}</h4>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1 italic">#{order.id.slice(-6).toUpperCase()}</p>
                            </div>
                            <div className="bg-brand-primary/10 px-4 py-2 rounded-2xl text-brand-primary text-[10px] font-black uppercase tracking-widest shadow-sm">
                                {order.status === 'pending' ? 'PENDING ⏳' : order.status === 'confirmed' ? 'ACCEPTED ✅' : 'PREPARING 🍳'}
                            </div>
                        </div>

                        <div className="space-y-4 mb-10">
                            {order.items.map((item, i) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-[#F8F9FA] rounded-2xl border border-gray-100 group-hover:bg-white transition-colors duration-500">
                                    <div className="flex items-center gap-4">
                                        <div className="h-7 w-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-[10px] font-black text-brand-primary shadow-sm">
                                            {item.quantity}
                                        </div>
                                        <span className="text-sm font-black text-gray-700 tracking-tight">{item.name}</span>
                                    </div>
                                    <span className={cn("h-2.5 w-2.5 rounded-full", item.isVeg ? "bg-green-500" : "bg-red-500")} />
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={async () => {
                                    const nextStatus = order.status === 'pending' ? 'confirmed' : 
                                                    order.status === 'confirmed' ? 'preparing' : 'ready';
                                    await updateDoc(doc(db, 'orders', order.id), { status: nextStatus, updatedAt: serverTimestamp() });
                                    logAction('ORDER_STATUS_UPDATE', `Order #${order.id.slice(-6).toUpperCase()} transitioned to ${nextStatus.toUpperCase()}`, { orderId: order.id, status: nextStatus });
                                }}
                                className="flex-1 bg-brand-primary text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-vibrant active:scale-95 transition-all text-center"
                            >
                                {order.status === 'pending' ? 'ACCEPT ✅' : order.status === 'confirmed' ? 'PREPARING 🥘' : 'READY 🍽️'}
                            </button>
                            <button className="h-14 w-14 rounded-[24px] bg-[#FEF2F2] flex items-center justify-center text-red-500 border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                <X size={20} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
            {liveOrders.length === 0 && (
                <div className="h-[450px] flex flex-col items-center justify-center bg-white rounded-[64px] border-2 border-dashed border-gray-200">
                    <div className="h-24 w-24 bg-[#F8F9FA] rounded-full flex items-center justify-center text-gray-200 mb-6">
                        <ShoppingBag size={40} />
                    </div>
                    <p className="text-xl font-display font-black text-gray-300 uppercase tracking-[0.3em] italic">No Orders in Pipeline</p>
                </div>
            )}
        </div>
    );
}

function AnalyticsDashboard({ orders }: { orders: Order[] }) {
    const categoryRev: Record<string, number> = {};
    const productRev: Record<string, { count: number, revenue: number, name: string }> = {};

    orders.forEach(order => {
        if (order.paymentStatus !== 'paid') return;
        order.items.forEach(item => {
            const cat = item.category || 'Uncategorized';
            categoryRev[cat] = (categoryRev[cat] || 0) + (item.price * item.quantity);

            if (!productRev[item.name]) {
                productRev[item.name] = { count: 0, revenue: 0, name: item.name };
            }
            productRev[item.name].count += item.quantity;
            productRev[item.name].revenue += (item.price * item.quantity);
        });
    });

    const categoryData = Object.entries(categoryRev).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    const topProducts = Object.values(productRev).sort((a,b) => b.revenue - a.revenue).slice(0, 5);

    return (
        <div className="space-y-12">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <div className="bg-white p-12 rounded-[56px] border border-[#E0E2E7] shadow-sm">
                    <div className="mb-10">
                        <h3 className="text-2xl font-display font-black text-gray-900 italic tracking-tight">Portfolio Distribution 📊</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Revenue by menu category</p>
                    </div>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F0F1F3" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#A3A3A3', fontWeight: 800 }} />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#1A1B1F', fontWeight: 800 }} />
                                <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px rgba(0,0,0,0.06)' }} />
                                <Bar dataKey="value" fill="#FB642A" radius={[0, 12, 12, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-12 rounded-[56px] border border-[#E0E2E7] shadow-sm">
                    <div className="mb-10 flex justify-between items-end">
                        <div>
                            <h3 className="text-2xl font-display font-black text-gray-900 italic tracking-tight">Asset Performance 🏅</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Top grossing menu items</p>
                        </div>
                        <div className="bg-green-50 text-green-500 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-green-100">
                            Profit Optimized
                        </div>
                    </div>
                    <div className="space-y-6">
                        {topProducts.map((product, i) => (
                            <div key={product.name} className="flex items-center gap-6 group">
                                <div className="h-14 w-14 bg-[#F8F9FA] rounded-2xl flex items-center justify-center font-black text-gray-300 text-lg group-hover:bg-brand-primary group-hover:text-white transition-all transform group-hover:rotate-6">
                                    0{i+1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <p className="font-black text-gray-900 uppercase tracking-tight">{product.name}</p>
                                        <p className="font-black text-brand-primary">₹{product.revenue.toLocaleString()}</p>
                                    </div>
                                    <div className="w-full h-2 bg-[#F8F9FA] rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(product.revenue / topProducts[0].revenue) * 100}%` }}
                                            className="h-full bg-brand-primary rounded-full" 
                                        />
                                    </div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2">{product.count} units sold this period</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CustomerInsights({ orders }: { orders: Order[] }) {
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const customerMap: Record<string, { totalSpent: number, orderCount: number, phone: string, orders: Order[] }> = {};
  
  orders.forEach(o => {
    const cid = o.customerId || 'Walk-in';
    if (!customerMap[cid]) {
      customerMap[cid] = { totalSpent: 0, orderCount: 0, phone: o.customerPhone || 'N/A', orders: [] };
    }
    customerMap[cid].totalSpent += o.paymentStatus === 'paid' ? o.total : 0;
    customerMap[cid].orderCount += 1;
    customerMap[cid].orders.push(o);
  });

  const customers = Object.entries(customerMap)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a,b) => b.totalSpent - a.totalSpent);

  const totalPatrons = Object.keys(customerMap).length;
  const repeatIndex = Math.round((customers.filter(c => c.orderCount > 1).length / totalPatrons) * 100) || 0;

  const exportCSV = () => {
    const headers = ['ID', 'Contact (Phone/Email)', 'Total Spent (INR)', 'Order Count'];
    const rows = customers.map(c => [
      c.id, 
      `"${c.phone}${c.orders[0]?.customerEmail ? ' / ' + c.orders[0].customerEmail : ''}"`, 
      c.totalSpent, 
      c.orderCount
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `desi_cozy_patrons_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Total Patrons 👥" value={totalPatrons.toString()} icon={Users} color="bg-blue-500" trend="+4%" />
        <StatCard title="Repeat Index 🔄" value={`${repeatIndex}%`} icon={Star} color="bg-orange-400" trend="Tier 1" />
        <StatCard title="Session Avg ⏱️" value="48m" icon={Users} color="bg-indigo-500" trend="Optimal" />
        <StatCard title="Loyalty Ratio 💎" value={`1:${Math.max(1, Math.round(totalPatrons/5))}`} icon={Users} color="bg-purple-500" trend="+0.2" />
      </div>

      <div className="bg-white p-12 lg:p-14 rounded-[56px] border border-[#E0E2E7] shadow-sm overflow-hidden relative">
        <div className="flex items-center justify-between mb-12">
            <div>
                <h3 className="text-2xl font-display font-black mb-2 text-gray-900 italic tracking-tight">Global Patron List 📋</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Behavioral segment mapping</p>
            </div>
            <button 
                onClick={exportCSV}
                className="px-6 py-3 bg-[#F8F9FA] border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-brand-primary hover:bg-white transition-all shadow-sm"
            >
                Export .CSV 📥
            </button>
        </div>
        <div className="space-y-8">
          {customers.map((customer, i) => (
            <div 
                key={customer.id} 
                onClick={() => setSelectedCustomer(customer.id)}
                className="flex items-center gap-8 border-b border-[#F8F9FA] pb-8 last:border-0 last:pb-0 group cursor-pointer"
            >
               <div className="h-16 w-16 rounded-[24px] bg-brand-primary/5 flex items-center justify-center font-black text-brand-primary text-xl group-hover:bg-brand-primary group-hover:text-white transition-all duration-500 transform group-hover:scale-105">
                  {customer.id.charAt(0).toUpperCase()}
               </div>
               <div className="flex-1 min-w-0">
                  <p className="font-black text-lg text-gray-900 truncate tracking-tight group-hover:text-brand-primary transition-colors">
                    {customer.id === 'Walk-in' ? 'Walk-in Guest 🚶' : `Customer ${customer.id.slice(-6).toUpperCase()} ✨`}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 font-mono">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">📱 {customer.phone}</p>
                    <span className="h-1 w-1 rounded-full bg-gray-300" />
                    <p className="text-[10px] text-brand-primary font-black uppercase tracking-widest">
                        {customer.orderCount > 3 ? '🌟 Platinum Tier' : customer.orderCount > 1 ? '✨ Gold Tier' : '🆕 New Patron'}
                    </p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-xl font-display font-black text-gray-900 leading-none">₹ { customer.totalSpent.toLocaleString() }</p>
                  <span className="text-[9px] font-black uppercase tracking-widest text-green-500 mt-2 block">{customer.orderCount} Orders Total</span>
               </div>
               <div className="h-10 w-10 rounded-xl bg-[#F8F9FA] flex items-center justify-center text-gray-300 group-hover:text-brand-primary group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-100">
                  <ChevronRight size={18} />
               </div>
            </div>
          ))}
          {customers.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center text-gray-300 italic uppercase font-black tracking-[0.2em] text-[10px]">
                Customer database is currently empty 📂
            </div>
          )}
        </div>
      </div>

      {/* Customer Detail Overlay */}
      <AnimatePresence>
        {selectedCustomer && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
            >
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-white w-full max-w-3xl rounded-[64px] border border-gray-100 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                >
                    <div className="p-12 lg:p-14 bg-[#1A1B1F] text-white flex justify-between items-start relative overflow-hidden shrink-0">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--brand-primary)_0%,_transparent_70%)]" />
                        <div className="relative z-10">
                            <div className="h-20 w-20 bg-brand-primary rounded-[32px] flex items-center justify-center font-black text-3xl mb-6 shadow-vibrant">
                                {selectedCustomer.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-4xl font-display font-black tracking-tight italic">
                                {selectedCustomer === 'Walk-in' ? 'Walk-in Guest' : `Customer ${selectedCustomer.slice(-6).toUpperCase()}`}
                            </h2>
                            <p className="text-white/40 font-mono text-sm mt-2 uppercase tracking-widest">Verified Dining Identity 🎫</p>
                        </div>
                        <button 
                            onClick={() => setSelectedCustomer(null)}
                            className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all z-20 group"
                        >
                            <X size={24} className="group-hover:rotate-90 transition-transform duration-500" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-12 lg:p-14 space-y-10 no-scrollbar">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-8 bg-[#F8F9FA] rounded-[32px] border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Lifetime Capital 💰</p>
                                <p className="text-3xl font-display font-black text-brand-primary">₹ {customerMap[selectedCustomer].totalSpent.toLocaleString()}</p>
                            </div>
                            <div className="p-8 bg-[#F8F9FA] rounded-[32px] border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Order Frequency 📦</p>
                                <p className="text-3xl font-display font-black text-gray-900">{customerMap[selectedCustomer].orderCount} Orders</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xl font-display font-black text-gray-900 italic mb-6 tracking-tight">Order Timeline 📜</h4>
                            <div className="space-y-4">
                                {customerMap[selectedCustomer].orders.map((o, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-6 rounded-3xl border border-gray-100 bg-white hover:border-brand-primary transition-colors cursor-default">
                                        <div>
                                            <p className="font-black text-sm text-gray-900 uppercase">Order #{o.id.slice(-6).toUpperCase()}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                                {o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString() : 'Recent Session'} • Table {o.tableId}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-gray-900">₹ {o.total}</p>
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border mt-1 inline-block",
                                                o.status === 'served' ? "bg-green-50 text-green-500 border-green-100" : "bg-orange-50 text-orange-500 border-orange-100"
                                            )}>
                                                {o.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SystemSettings({ config, logAction }: { config: any, logAction: any }) {
    const [localConfig, setLocalConfig] = useState(config);
    const [saving, setSaving] = useState(false);
    const [newAdmin, setNewAdmin] = useState('');
    const hasChanges = JSON.stringify(localConfig) !== JSON.stringify(config);

    // Update local state when remote config changes, but only if not currently editing/saving
    useEffect(() => {
        if (!saving) {
            setLocalConfig(config);
        }
    }, [config, saving]);

    const handleSave = async (updatedConfig = localConfig) => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'global'), updatedConfig, { merge: true });
            logAction('SETTINGS_UPDATE', 'System infrastructure & financial configurations updated');
            alert('Infrastructure updated successfully! 🛡️');
        } catch (e) {
            console.error("Settings Sync Error:", e);
            alert('Failed to sync settings. Ensure you have administrative privileges.');
        } finally {
            setSaving(false);
        }
    };

    const addAdmin = () => {
        if (newAdmin && !localConfig.adminEmails.includes(newAdmin)) {
            const updated = {
                ...localConfig, 
                adminEmails: [...localConfig.adminEmails, newAdmin]
            };
            setLocalConfig(updated);
            logAction('ADMIN_ADDED', `New security clearing granted to ${newAdmin}`);
            setNewAdmin('');
            // Optional: Auto-save on critical identity changes
            // handleSave(updated); 
        }
    };

    const removeAdmin = (email: string) => {
        const updated = {
            ...localConfig, 
            adminEmails: localConfig.adminEmails.filter((e: string) => e !== email)
        };
        setLocalConfig(updated);
        logAction('ADMIN_REMOVED', `Security credentials revoked for ${email}`);
    };

    return (
        <div className="max-w-4xl space-y-12 pb-20">
            <div className="bg-white p-12 lg:p-14 rounded-[56px] border border-[#E0E2E7] shadow-sm relative overflow-hidden">
                {/* Visual indicator for unsaved changes */}
                {hasChanges && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-brand-primary animate-pulse" />
                )}

                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h3 className="text-2xl font-display font-black text-gray-900 italic tracking-tight">Enterprise Infrastructure ⚙️</h3>
                        {hasChanges && <p className="text-[10px] font-black text-brand-primary uppercase mt-1">You have unsaved configuration changes!</p>}
                    </div>
                    <button 
                        onClick={() => handleSave()}
                        disabled={saving || !hasChanges}
                        className={cn(
                            "px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
                            hasChanges 
                                ? "bg-brand-primary text-white shadow-vibrant scale-105 active:scale-95" 
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        )}
                    >
                        {saving ? 'Syncing...' : hasChanges ? 'Save All Changes 💾' : 'System Optimized ✅'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Restaurant Identity</label>
                        <input 
                            type="text" 
                            value={localConfig.name}
                            onChange={(e) => setLocalConfig({...localConfig, name: e.target.value})}
                            className="w-full bg-[#F8F9FA] border border-gray-100 p-5 rounded-2xl font-black uppercase text-xs focus:border-brand-primary outline-none transition-all"
                            placeholder="RESTAURANT NAME"
                        />
                    </div>
                    <div className="space-y-6">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Visual Identity (Logo Emoji)</label>
                        <input 
                            type="text" 
                            value={localConfig.logo}
                            onChange={(e) => setLocalConfig({...localConfig, logo: e.target.value})}
                            className="w-full bg-[#F8F9FA] border border-gray-100 p-5 rounded-2xl font-black text-center text-2xl focus:border-brand-primary outline-none transition-all"
                            placeholder="🍽️"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10 p-10 bg-[#F8F9FA] rounded-3xl border border-gray-100/50">
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Financial: GST (%)</p>
                        <input 
                            type="number" 
                            value={localConfig.gstPercentage}
                            onChange={(e) => setLocalConfig({...localConfig, gstPercentage: Number(e.target.value)})}
                            className="w-full bg-white border border-gray-100 p-4 rounded-xl font-black text-xs"
                        />
                    </div>
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Financial: Service Charge (%)</p>
                        <input 
                            type="number" 
                            value={localConfig.serviceCharge}
                            onChange={(e) => setLocalConfig({...localConfig, serviceCharge: Number(e.target.value)})}
                            className="w-full bg-white border border-gray-100 p-4 rounded-xl font-black text-xs"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10 p-10 bg-brand-accent/30 rounded-3xl border border-brand-accent/50 outline outline-4 outline-white">
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Payment: UPI ID (VPA)</p>
                        <input 
                            type="text" 
                            value={localConfig.upiId}
                            onChange={(e) => setLocalConfig({...localConfig, upiId: e.target.value})}
                            className="w-full bg-white border border-orange-200 p-4 rounded-xl font-bold text-xs focus:ring-2 ring-brand-primary outline-none"
                            placeholder="yourname@upi"
                        />
                    </div>
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Payment: Beneficiary Name</p>
                        <input 
                            type="text" 
                            value={localConfig.upiName}
                            onChange={(e) => setLocalConfig({...localConfig, upiName: e.target.value})}
                            className="w-full bg-white border border-orange-200 p-4 rounded-xl font-bold text-xs focus:ring-2 ring-brand-primary outline-none"
                            placeholder="Restaurant Name"
                        />
                    </div>
                </div>

                <div className="mt-12 space-y-6">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Management Council (Admins) 👑</h4>
                        <span className="text-[9px] font-black text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">
                            {localConfig.adminEmails.length} Authorized
                        </span>
                    </div>

                    <div className="flex gap-4">
                        <input 
                            type="email" 
                            value={newAdmin}
                            onChange={(e) => setNewAdmin(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addAdmin()}
                            placeholder="ADD NEW ADMIN EMAIL..."
                            className="flex-1 bg-[#F8F9FA] border border-gray-100 p-5 rounded-2xl text-xs font-black uppercase tracking-wider focus:border-brand-primary outline-none transition-all shadow-inner"
                        />
                        <button 
                            onClick={addAdmin}
                            className="bg-[#1A1B1F] text-white px-10 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-brand-primary transition-all active:scale-95"
                        >
                            ADD
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {localConfig.adminEmails.map((email: string) => (
                            <div key={email} className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center justify-between group hover:border-brand-primary transition-all shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    <span className="text-xs font-bold text-gray-700 truncate max-w-[180px]">{email}</span>
                                </div>
                                <button 
                                    onClick={() => removeAdmin(email)}
                                    className="text-gray-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

}

function SettingRow({ label, description, active = false }: any) {
    const [isOn, setIsOn] = useState(active);
    return (
        <div className="flex items-center justify-between pb-10 border-b border-[#F8F9FA] last:border-0 last:pb-0">
            <div className="space-y-1.5 pr-8">
                <p className="text-sm font-black text-gray-900 uppercase tracking-[0.1em] leading-none">{label}</p>
                <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-sm">{description}</p>
            </div>
            <button 
                onClick={() => setIsOn(!isOn)}
                className={cn(
                    "w-16 h-9 rounded-full transition-all relative p-1.5 outline-none flex items-center",
                    isOn ? "bg-brand-primary shadow-lg shadow-orange-100" : "bg-gray-200"
                )}
            >
                <div className={cn(
                    "h-6 w-6 bg-white rounded-full shadow-md transition-all duration-300 transform",
                    isOn ? "translate-x-7" : "translate-x-0"
                )} />
            </button>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
  return (
    <div className="bg-white p-10 rounded-[56px] border border-[#E0E2E7] shadow-sm hover:shadow-premium transition-all duration-500 overflow-hidden relative group">
      <div className="absolute top-0 right-0 h-32 w-32 bg-brand-primary/5 rounded-full -mr-12 -mt-12 transition-transform duration-700 group-hover:scale-150" />
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className={cn("h-16 w-16 rounded-3xl flex items-center justify-center text-white shadow-2xl transition-transform duration-500 group-hover:rotate-12", color)}>
          <Icon size={32} strokeWidth={2.5} />
        </div>
        <div className={cn(
          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] shadow-sm border",
          trend.includes('+') || trend === 'Active' ? "bg-green-50 text-green-600 border-green-100" : "bg-orange-50 text-orange-500 border-orange-100"
        )}>
          {trend}
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-gray-400 text-[11px] font-black uppercase tracking-[0.2em] mb-2">{title}</p>
        <h4 className="text-5xl font-display font-black text-gray-900 leading-none tracking-tighter">{value}</h4>
      </div>
    </div>
  );
}
