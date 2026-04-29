import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit3, Trash2, Camera, Star, Flame, Check, Loader2, X } from 'lucide-react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CATEGORIES, CATEGORY_EMOJIS } from '../../constants';
import { MenuItem } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function MenuManager() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    price: 0,
    category: 'Mains',
    description: '',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
    isVeg: true,
    isPopular: false,
    isRecommended: false
  });

  useEffect(() => {
    const q = query(collection(db, 'menuItems'), orderBy('name', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      setItems(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem);
    } else {
      setFormData({
        name: '',
        price: 0,
        category: 'Mains',
        description: '',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
        isVeg: true,
        isPopular: false,
        isRecommended: false
      });
    }
  }, [editingItem, isAdding]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      const dataToSave = {
        ...formData,
        updatedAt: serverTimestamp(),
      };

      if (editingItem) {
        await updateDoc(doc(db, 'menuItems', editingItem.id), dataToSave);
      } else {
        await addDoc(collection(db, 'menuItems'), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
      }
      setIsAdding(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Error saving menu item:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this product from your public menu? This action is irreversible.')) {
      try {
        await deleteDoc(doc(db, 'menuItems', id));
      } catch (error) {
        console.error("Error deleting menu item:", error);
      }
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...CATEGORIES];

  return (
    <div className="space-y-12">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <h2 className="text-3xl font-display font-black tracking-tight text-gray-900 italic">Product Catalog</h2>
          <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Enterprise Inventory Management</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="bg-white border border-[#E0E2E7] p-1.5 rounded-2xl flex items-center gap-2 px-4 w-full lg:w-72 shadow-sm focus-within:border-brand-primary transition-all">
                <Search size={18} className="text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search catalog..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm font-bold w-full placeholder:text-gray-300" 
                />
            </div>
            <button 
                onClick={() => setIsAdding(true)}
                className="bg-brand-primary text-white h-12 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-vibrant hover:scale-105 transition-all shrink-0"
            >
                <Plus size={18} strokeWidth={3} />
                Add New Product
            </button>
        </div>
      </header>

      {/* Category Filter Rail */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
        {categories.map((cat) => (
            <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-all shrink-0 flex items-center gap-2",
                    activeCategory === cat 
                        ? "bg-[#1A1B1F] border-[#1A1B1F] text-white shadow-xl" 
                        : "bg-white border-transparent text-gray-400 hover:text-gray-900 hover:border-gray-200"
                )}
            >
                <span>{CATEGORY_EMOJIS[cat]}</span>
                {cat}
            </button>
        ))}
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-4">
            <div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Syncing with Cloud Vault</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
            <AnimatePresence>
            {filteredItems.map((item) => (
                <motion.div 
                    layout
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[48px] border border-[#E0E2E7] p-8 hover:shadow-premium transition-all duration-500 group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-6 flex gap-2">
                        {item.isPopular && <div className="h-4 w-4 bg-orange-400 rounded-full shadow-sm flex items-center justify-center text-white"><Star size={8} strokeWidth={3} /></div>}
                        {item.isRecommended && <div className="h-4 w-4 bg-pink-500 rounded-full shadow-sm flex items-center justify-center text-white"><Flame size={8} strokeWidth={3} /></div>}
                    </div>

                    <div className="space-y-6">
                        <div className="h-48 w-full rounded-[40px] overflow-hidden shadow-sm relative">
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 border border-white/50">
                                <div className={cn("h-1.5 w-1.5 rounded-full", item.isVeg ? "bg-green-500" : "bg-red-500")} />
                                <span className={cn("text-[9px] font-black uppercase tracking-widest", item.isVeg ? "text-green-600" : "text-red-600")}>
                                    {item.isVeg ? 'VEG' : 'NON-VEG'}
                                </span>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-display font-black text-gray-900 leading-tight italic truncate">{item.name}</h3>
                                <p className="text-sm font-black text-brand-primary">₹{item.price}</p>
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.category}</p>
                            <p className="text-xs text-gray-500 font-medium line-clamp-2 mt-3 leading-relaxed">{item.description}</p>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <button 
                                onClick={() => setEditingItem(item)}
                                className="flex-1 bg-[#F8F9FA] border border-gray-100 text-gray-700 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1A1B1F] hover:text-white hover:border-[#1A1B1F] transition-all flex items-center justify-center gap-2"
                            >
                                <Edit3 size={14} />
                                Edit Item
                            </button>
                            <button 
                                onClick={() => handleDelete(item.id)}
                                className="h-10 w-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            ))}
            </AnimatePresence>
            {filteredItems.length === 0 && (
                <div className="col-span-full h-80 flex flex-col items-center justify-center bg-white rounded-[56px] border-2 border-dashed border-gray-200">
                    <Search className="text-gray-200 mb-4" size={48} />
                    <p className="text-gray-400 font-black uppercase tracking-widest italic">No matching products found</p>
                </div>
            )}
        </div>
      )}

      {/* Editor Sidebar Pane */}
      <AnimatePresence>
        {(isAdding || editingItem) && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsAdding(false); setEditingItem(null); }}
              className="fixed inset-0 bg-[#1A1B1F]/40 backdrop-blur-md z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[550px] bg-white shadow-2xl z-[70] overflow-y-auto"
            >
              <div className="p-12 lg:p-14">
                <header className="flex justify-between items-center mb-12">
                   <div>
                        <h3 className="text-3xl font-display font-black text-gray-900 leading-tight italic">
                            {editingItem ? 'Edit Product' : 'Add New Entry'}
                        </h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Configure item attributes</p>
                   </div>
                   <button 
                    onClick={() => { setIsAdding(false); setEditingItem(null); }}
                    className="h-14 w-14 rounded-3xl bg-[#F8F9FA] border border-gray-100 flex items-center justify-center text-gray-400 hover:text-brand-primary transition-all shadow-sm"
                  >
                    <X size={24} />
                  </button>
                </header>

                <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-1">Cover Imagery</label>
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="relative h-64 w-full rounded-[48px] overflow-hidden group cursor-pointer border-8 border-[#F8F9FA] shadow-premium bg-gray-50 flex items-center justify-center"
                    >
                      {formData.image ? (
                        <img src={formData.image} alt="Preview" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <Camera size={32} className="text-gray-300" />
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white px-8 py-4 rounded-[24px] flex items-center gap-3 shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <Camera size={20} className="text-brand-primary" />
                          <span className="text-xs font-black text-brand-primary uppercase tracking-widest">Update Photo</span>
                        </div>
                      </div>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                  </div>

                  <div className="grid grid-cols-1 gap-8">
                    <EditorField label="Product Name" value={formData.name} onChange={(e: any) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Maharaja Thali" />
                    <div className="grid grid-cols-2 gap-8">
                        <EditorField type="number" label="Price (₹)" value={formData.price} onChange={(e: any) => setFormData({...formData, price: Number(e.target.value)})} placeholder="0.00" />
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-1">Category</label>
                            <select 
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                                className="w-full h-14 bg-[#F8F9FA] border border-gray-100 rounded-2xl px-6 text-sm font-black focus:border-brand-primary outline-none transition-all appearance-none"
                            >
                                {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-1">Description</label>
                        <textarea 
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Detail the ingredients, preparation, and spice levels..."
                            className="w-full bg-[#F8F9FA] border border-gray-100 rounded-[32px] p-6 text-sm font-bold text-gray-700 outline-none focus:border-brand-primary transition-all resize-none"
                        />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-1">Product Markers</label>
                    <div className="flex flex-wrap gap-4">
                       <EditorToggle label="Veg" active={formData.isVeg} onClick={() => setFormData({...formData, isVeg: !formData.isVeg})} />
                       <EditorToggle label="Bestseller" active={formData.isPopular} onClick={() => setFormData({...formData, isPopular: !formData.isPopular})} />
                       <EditorToggle label="Recommended" active={formData.isRecommended} onClick={() => setFormData({...formData, isRecommended: !formData.isRecommended})} />
                    </div>
                  </div>

                  <div className="pt-10 flex gap-4">
                    <button 
                      onClick={handleSave}
                      className="flex-1 bg-brand-primary text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-vibrant active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      <Check size={20} strokeWidth={4} />
                      {editingItem ? 'Update Catalog' : 'Sync to Menu'}
                    </button>
                    {editingItem && (
                        <button 
                             onClick={() => handleDelete(editingItem.id)}
                            className="w-20 rounded-[32px] bg-red-50 border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        >
                            <Trash2 size={24} />
                        </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function EditorField({ label, placeholder, type = 'text', value, onChange }: any) {
    return (
        <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-1">{label}</label>
            <input 
                type={type} 
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full h-14 bg-[#F8F9FA] border border-gray-100 rounded-2xl px-6 text-sm font-black text-gray-700 placeholder:text-gray-300 outline-none focus:border-brand-primary transition-all"
            />
        </div>
    );
}

function EditorToggle({ label, active, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-3 shadow-sm",
                active 
                    ? "bg-brand-primary text-white border-brand-primary shadow-orange-100" 
                    : "bg-white border-gray-100 text-gray-400 hover:border-gray-300"
            )}
        >
            {active && <Check size={14} strokeWidth={4} />}
            {label}
        </button>
    );
}

