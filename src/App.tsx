/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ProductItem, ReturnLog, ReceivedLog, AppTheme } from './types';
import { 
  loadProducts, 
  saveProducts, 
  loadReturnLogs, 
  saveReturnLogs,
  loadReceivedLogs,
  saveReceivedLogs,
  clearAllStorage,
  exportBackupJSON
} from './utils/storage';
import { 
  formatBDT, 
  formatCount, 
  formatPcs, 
  getTodayDateString, 
  getCurrentMonthKey, 
  formatMonthName,
  formatDateBn
} from './utils/helpers';
import { playTickSound, playSuccessSound } from './utils/audio';

import { AddProductModal } from './components/AddProductModal';
import { QuickAddPiecesModal } from './components/QuickAddPiecesModal';
import { MonthlyHistoryModal } from './components/MonthlyHistoryModal';
import { ReceivedSettingsModal } from './components/ReceivedSettingsModal';
import { ShareReportModal } from './components/ShareReportModal';

import { 
  Plus, 
  Minus, 
  Package, 
  Calendar, 
  Search, 
  Edit3, 
  Trash2, 
  Sparkles,
  Layers,
  ArrowUpDown,
  X,
  PackageCheck,
  Settings,
  CheckCircle2,
  Clock,
  Share2,
  TrendingUp,
  Moon,
  Sun,
  Palette,
  Check
} from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [logs, setLogs] = useState<ReturnLog[]>([]);
  const [receivedLogs, setReceivedLogs] = useState<ReceivedLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'quantity' | 'value'>('recent');
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'pending' | 'in_stock' | 'zero_stock'>('all');

  // Theme & Sound state
  const [theme, setTheme] = useState<AppTheme>('emerald');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [activeProductForAdd, setActiveProductForAdd] = useState<ProductItem | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isReceivedModalOpen, setIsReceivedModalOpen] = useState(false);
  const [receivedModalTab, setReceivedModalTab] = useState<'received' | 'settings'>('received');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Load saved data & preferences
  useEffect(() => {
    setProducts(loadProducts());
    setLogs(loadReturnLogs());
    setReceivedLogs(loadReceivedLogs());

    const savedTheme = localStorage.getItem('app_theme') as AppTheme;
    if (savedTheme && ['emerald', 'dark', 'indigo'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
    const savedSound = localStorage.getItem('app_sound_enabled');
    if (savedSound !== null) {
      setSoundEnabled(savedSound === 'true');
    }
  }, []);

  const handleThemeChange = (newTheme: AppTheme) => {
    setTheme(newTheme);
    localStorage.setItem('app_theme', newTheme);
  };

  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('app_sound_enabled', String(enabled));
  };

  const updateProducts = (newProducts: ProductItem[]) => {
    setProducts(newProducts);
    saveProducts(newProducts);
  };

  const updateLogs = (newLogs: ReturnLog[]) => {
    setLogs(newLogs);
    saveReturnLogs(newLogs);
  };

  // Add Product (User does this ONCE per product)
  const handleAddProduct = (name: string, pricePerUnit: number, initialQty: number) => {
    const now = new Date().toISOString();
    const today = getTodayDateString();

    const newProd: ProductItem = {
      id: `prod-${Date.now()}`,
      name,
      pricePerUnit,
      quantity: initialQty,
      receivedQuantity: 0, // initially 0 received until physically verified in hand!
      createdAt: now,
      updatedAt: now,
    };

    const newProductsList = [newProd, ...products];
    updateProducts(newProductsList);
    if (soundEnabled) playSuccessSound();

    // If initialQty > 0, log it for monthly calculation
    if (initialQty > 0) {
      const logEntry: ReturnLog = {
        id: `log-${Date.now()}`,
        productId: newProd.id,
        productName: newProd.name,
        changeType: 'return_in',
        quantity: initialQty,
        pricePerUnit,
        totalValue: initialQty * pricePerUnit,
        date: today,
        createdAt: now,
      };
      updateLogs([logEntry, ...logs]);
    }
  };

  // Update existing product name or price
  const handleUpdateProduct = (id: string, name: string, pricePerUnit: number) => {
    const updated = products.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          name,
          pricePerUnit,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    updateProducts(updated);
  };

  // Delete product
  const handleDeleteProduct = (id: string) => {
    updateProducts(products.filter((p) => p.id !== id));
  };

  // 1-Click: Add pieces (কাউন্ট বাড়ানো - নতুন রিটার্ন আসলো)
  const handleIncrement = (productId: string, amountToAdd = 1) => {
    const today = getTodayDateString();
    const now = new Date().toISOString();

    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;

    if (soundEnabled) playTickSound();

    const updated = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          quantity: p.quantity + amountToAdd,
          updatedAt: now,
        };
      }
      return p;
    });
    updateProducts(updated);

    // Auto record monthly return log
    const logEntry: ReturnLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      productId,
      productName: targetProduct.name,
      changeType: 'return_in',
      quantity: amountToAdd,
      pricePerUnit: targetProduct.pricePerUnit,
      totalValue: amountToAdd * targetProduct.pricePerUnit,
      date: today,
      createdAt: now,
    };
    updateLogs([logEntry, ...logs]);
  };

  // 1-Click: Reduce pieces manual (যদি কোনো মাল বিক্রি বা সরানো হয়)
  const handleDecrement = (productId: string) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct || targetProduct.quantity <= 0) return;

    if (soundEnabled) playTickSound();

    const updated = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          quantity: Math.max(0, p.quantity - 1),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    updateProducts(updated);
  };

  // Mark received in hand (বুঝে পেলাম -> হোম থেকে স্বয়ংক্রিয়ভাবে মাইনাস হবে!)
  const handleMarkReceived = (productId: string, count: number, note?: string) => {
    const today = getTodayDateString();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct || targetProduct.quantity <= 0) return;

    // How many can be received is capped at targetProduct.quantity on Home
    const countToReceive = Math.min(targetProduct.quantity, count);
    if (countToReceive <= 0) return;

    if (soundEnabled) playSuccessSound();

    const updated = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          quantity: Math.max(0, p.quantity - countToReceive), // HOME DEDUCTED!
          receivedQuantity: (p.receivedQuantity || 0) + countToReceive, // RECEIVED INCREMENTED!
          updatedAt: now.toISOString(),
        };
      }
      return p;
    });
    updateProducts(updated);

    const log: ReceivedLog = {
      id: `rec-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      productId,
      productName: targetProduct.name,
      piecesReceived: countToReceive,
      pricePerUnit: targetProduct.pricePerUnit,
      totalValue: countToReceive * targetProduct.pricePerUnit,
      date: today,
      time: timeStr,
      notes: note || 'বুঝে পেলাম (হোম থেকে মাইনাস হয়েছে)',
      createdAt: now.toISOString(),
    };
    const newReceivedLogs = [log, ...receivedLogs];
    setReceivedLogs(newReceivedLogs);
    saveReceivedLogs(newReceivedLogs);
  };

  // Undo received (ভুলবশত চাপলে ১ পিস হোমে ফেরত পাঠানো)
  const handleUndoReceived = (productId: string) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct || !targetProduct.receivedQuantity || targetProduct.receivedQuantity <= 0) return;

    const updated = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          quantity: p.quantity + 1, // Added 1 back to Home!
          receivedQuantity: Math.max(0, (p.receivedQuantity || 0) - 1),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    updateProducts(updated);
  };

  // Clear all data
  const handleClearAllData = () => {
    setProducts([]);
    setLogs([]);
    setReceivedLogs([]);
    clearAllStorage();
    if (soundEnabled) playSuccessSound();
  };

  // Import backup data
  const handleImportBackup = (data: any) => {
    if (data.products && Array.isArray(data.products)) {
      updateProducts(data.products);
    }
    if (data.logs && Array.isArray(data.logs)) {
      updateLogs(data.logs);
    }
    if (data.receivedLogs && Array.isArray(data.receivedLogs)) {
      setReceivedLogs(data.receivedLogs);
      saveReceivedLogs(data.receivedLogs);
    }
  };

  // Calculations
  // 1. Total money in pending return stock on Home (হোমে বাকি টাকার মাল)
  const totalStockMoney = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.quantity * p.pricePerUnit), 0);
  }, [products]);

  // 2. Total pieces currently pending on Home (হোমে বাকি পিস সংখ্যা)
  const totalStockPieces = useMemo(() => {
    return products.reduce((sum, p) => sum + p.quantity, 0);
  }, [products]);

  // 3. Total pieces & value already received in hand (মোট বুঝে পাওয়া মাল)
  const totalReceivedPieces = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.receivedQuantity || 0), 0);
  }, [products]);

  const totalReceivedMoney = useMemo(() => {
    return products.reduce((sum, p) => sum + ((p.receivedQuantity || 0) * p.pricePerUnit), 0);
  }, [products]);

  // Total pending to receive is whatever is currently on Home!
  const totalPendingToReceive = totalStockPieces;

  // 4. This month's total return value (এই মাসে কত টাকা রিটার্ন আসলো)
  const currentMonthKey = getCurrentMonthKey();
  const currentMonthLogs = useMemo(() => {
    return logs.filter((l) => l.changeType === 'return_in' && l.date.startsWith(currentMonthKey));
  }, [logs, currentMonthKey]);

  const currentMonthReturnMoney = useMemo(() => {
    return currentMonthLogs.reduce((sum, l) => sum + l.totalValue, 0);
  }, [currentMonthLogs]);

  const currentMonthReturnPieces = useMemo(() => {
    return currentMonthLogs.reduce((sum, l) => sum + l.quantity, 0);
  }, [currentMonthLogs]);

  // 5. Today's returns (আজকে কত টাকার মাল আসলো)
  const todayDateStr = getTodayDateString();
  const todayLogs = useMemo(() => {
    return logs.filter((l) => l.changeType === 'return_in' && l.date === todayDateStr);
  }, [logs, todayDateStr]);

  const todayReturnMoney = useMemo(() => {
    return todayLogs.reduce((sum, l) => sum + l.totalValue, 0);
  }, [todayLogs]);

  const todayReturnPieces = useMemo(() => {
    return todayLogs.reduce((sum, l) => sum + l.quantity, 0);
  }, [todayLogs]);

  // Filter & sort products
  const filteredProducts = useMemo(() => {
    let result = products;

    // Search filter
    if (searchTerm.trim()) {
      result = result.filter((p) => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Quick filter chips
    if (activeFilterTab === 'pending') {
      result = result.filter((p) => p.quantity > 0);
    } else if (activeFilterTab === 'in_stock') {
      result = result.filter((p) => p.quantity > 0);
    } else if (activeFilterTab === 'zero_stock') {
      result = result.filter((p) => p.quantity === 0);
    }

    // Sorting
    if (sortBy === 'quantity') {
      return [...result].sort((a, b) => b.quantity - a.quantity);
    }
    if (sortBy === 'value') {
      return [...result].sort((a, b) => (b.quantity * b.pricePerUnit) - (a.quantity * a.pricePerUnit));
    }
    return result; // default recent
  }, [products, searchTerm, activeFilterTab, sortBy]);

  // Dynamic Theme Colors
  const headerThemeClass = useMemo(() => {
    if (theme === 'dark') return 'bg-slate-950 border-b border-slate-800 text-white';
    if (theme === 'indigo') return 'bg-indigo-950 border-b border-indigo-900 text-white';
    return 'bg-emerald-950 border-b border-emerald-900 text-white'; // emerald
  }, [theme]);

  const pageBgClass = useMemo(() => {
    if (theme === 'dark') return 'bg-slate-950 text-slate-100';
    return 'bg-slate-100/80 text-slate-900';
  }, [theme]);

  const cardBgClass = useMemo(() => {
    if (theme === 'dark') return 'bg-slate-900 border-slate-800 text-slate-100';
    return 'bg-white border-slate-200 text-slate-900';
  }, [theme]);

  return (
    <div className={`min-h-screen font-['Hind_Siliguri',sans-serif] pb-16 transition-colors duration-150 ${pageBgClass}`}>
      {/* Mobile-Friendly Sticky Top Bar */}
      <header className={`shadow-sm sticky top-0 z-20 transition-colors ${headerThemeClass}`}>
        <div className="max-w-4xl mx-auto px-3 sm:px-4 h-13 sm:h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-xs">
              ৳
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base leading-tight">
                রিটার্ন মাল ও স্টক কাউন্টার
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-300 leading-none">
                মোবাইল দ্রুত কাউন্টার
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Share / WhatsApp Button */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              type="button"
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded bg-white/10 hover:bg-white/20 text-white transition cursor-pointer border border-white/15"
              title="হিসাব কপি ও হোয়াটসঅ্যাপ শেয়ার"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden xs:inline">শেয়ার</span>
            </button>

            {/* বুঝে পেলাম Button with badge */}
            <button
              onClick={() => {
                setReceivedModalTab('received');
                setIsReceivedModalOpen(true);
              }}
              type="button"
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 text-xs font-semibold rounded bg-emerald-700 hover:bg-emerald-600 text-white transition cursor-pointer border border-emerald-500/80 active:scale-95"
              title="কোনটা কোনটা হাতে পেলাম তার চেকলিস্ট"
            >
              <PackageCheck className="w-3.5 h-3.5 text-emerald-200" />
              <span className="hidden xs:inline">বুঝে পেলাম</span>
              {totalPendingToReceive > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black leading-none">
                  {totalPendingToReceive}
                </span>
              )}
            </button>

            {/* Monthly History */}
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              type="button"
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded bg-white/10 hover:bg-white/20 text-white transition cursor-pointer border border-white/15"
            >
              <Calendar className="w-3 h-3 text-amber-300" />
              <span className="hidden xs:inline">মাসিক</span>
            </button>

            {/* Settings & Theme */}
            <button
              onClick={() => {
                setReceivedModalTab('settings');
                setIsReceivedModalOpen(true);
              }}
              title="সেটিংস, থিম ও ব্যাকআপ"
              type="button"
              className="p-1.5 text-slate-200 hover:text-white hover:bg-white/15 rounded transition cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {/* Add New Product Button */}
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsAddModalOpen(true);
              }}
              type="button"
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-bold rounded bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition shadow-xs cursor-pointer ml-0.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন মাল</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container - Compact Mobile Optimized */}
      <main className="max-w-4xl mx-auto px-2.5 sm:px-4 pt-2.5 sm:pt-4 space-y-2 sm:space-y-3">
        {/* Compact 3-Column Summary Bar */}
        <div className={`grid grid-cols-3 gap-1 sm:gap-2.5 p-2 sm:p-3 rounded-xl border shadow-xs ${cardBgClass}`}>
          {/* 1. হোমে বাকি মাল (কুরিয়ারে) */}
          <div className="text-center px-1 py-1 border-r border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium block leading-tight">
              হোমে বাকি মাল
            </span>
            <p className="text-sm sm:text-lg font-black mt-0.5 tracking-tight truncate text-amber-600 dark:text-amber-400">
              {formatBDT(totalStockMoney)}
            </p>
            <span className="text-[9px] text-slate-400 block">{formatPcs(totalStockPieces)} বাকি</span>
          </div>

          {/* 2. মোট বুঝে পেয়েছি */}
          <div className="text-center px-1 py-1 border-r border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium block leading-tight">
              মোট বুঝে পেয়েছি
            </span>
            <p className="text-sm sm:text-lg font-black mt-0.5 tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatBDT(totalReceivedMoney)}
            </p>
            <span className="text-[9px] text-slate-400 block">{formatPcs(totalReceivedPieces)} প্রাপ্ত</span>
          </div>

          {/* 3. চলতি মাসে কত টাকা রিটার্ন আসলো */}
          <div className="text-center px-1 py-1">
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium block leading-tight truncate">
              চলতি মাস ({formatMonthName(currentMonthKey).split(' ')[0]})
            </span>
            <p className="text-sm sm:text-lg font-black mt-0.5 tracking-tight truncate">
              {formatBDT(currentMonthReturnMoney)}
            </p>
            <span className="text-[9px] text-slate-400 block">{formatPcs(currentMonthReturnPieces)} রেকর্ড</span>
          </div>
        </div>

        {/* Feature: Today's live counter ribbon */}
        {todayReturnPieces > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-1.5 flex items-center justify-between text-xs text-amber-900 dark:text-amber-300">
            <div className="flex items-center gap-1.5 font-semibold">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>আজকের নতুন রিটার্ন:</span>
              <span className="font-bold">{formatPcs(todayReturnPieces)}</span>
              <span>({formatBDT(todayReturnMoney)})</span>
            </div>
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="text-[11px] font-bold text-amber-800 dark:text-amber-200 underline cursor-pointer hover:opacity-80"
            >
              শেয়ার করুন →
            </button>
          </div>
        )}

        {/* Search & Sort Row */}
        <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${cardBgClass}`}>
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="শাড়ি বা প্রোডাক্ট খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-6 py-1 border-0 focus:outline-none bg-transparent"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-1.5 top-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-500 shrink-0">
            <span className="font-semibold">{filteredProducts.length}টি মাল</span>
            {products.length > 2 && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-[10px] sm:text-xs border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="recent">নতুন</option>
                <option value="quantity">বেশি পিস</option>
                <option value="value">বেশি টাকা</option>
              </select>
            )}
          </div>
        </div>

        {/* Feature: 1-Tap Quick Filter Chips */}
        {products.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs scrollbar-none">
            <button
              onClick={() => setActiveFilterTab('all')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer whitespace-nowrap border ${
                activeFilterTab === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              সব শাড়ি ({products.length})
            </button>

            {totalPendingToReceive > 0 && (
              <button
                onClick={() => setActiveFilterTab('pending')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer whitespace-nowrap border flex items-center gap-1 ${
                  activeFilterTab === 'pending'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-xs'
                    : 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                }`}
              >
                <span>হোমে বাকি</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                  {totalPendingToReceive}
                </span>
              </button>
            )}

            <button
              onClick={() => setActiveFilterTab('in_stock')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer whitespace-nowrap border ${
                activeFilterTab === 'in_stock'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              বাকি আছে ({products.filter(p => p.quantity > 0).length})
            </button>

            {products.some(p => p.quantity === 0) && (
              <button
                onClick={() => setActiveFilterTab('zero_stock')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer whitespace-nowrap border ${
                  activeFilterTab === 'zero_stock'
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                বুঝে পাওয়া সম্পন্ন ({products.filter(p => p.quantity === 0).length})
              </button>
            )}
          </div>
        )}

        {/* Empty State when no products added */}
        {products.length === 0 && (
          <div className={`rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 sm:p-8 text-center my-4 ${cardBgClass}`}>
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950 rounded-xl flex items-center justify-center mx-auto mb-2 text-emerald-700 dark:text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold">
              এখনও কোনো শাড়ি বা প্রোডাক্ট যোগ করেননি
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              আপনার শাড়িগুলোর নাম ও প্রতি পিসের দাম একবার যোগ করুন। এরপর মোবাইলে শুধু <b>+ বাটন</b> চাপলেই দ্রুত কাউন্ট হয়ে যাবে।
            </p>
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsAddModalOpen(true);
              }}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>প্রথম শাড়ি বা মাল যোগ করুন</span>
            </button>
          </div>
        )}

        {/* Ultra-Compact Product List */}
        {products.length > 0 && (
          <div className="space-y-1.5 sm:space-y-2">
            {filteredProducts.map((product) => {
              const itemTotalMoney = product.quantity * product.pricePerUnit;
              const alreadyReceived = product.receivedQuantity || 0;
              const isCleared = product.quantity === 0 && alreadyReceived > 0;

              return (
                <div
                  key={product.id}
                  className={`rounded-lg border px-3 py-2 sm:py-2.5 shadow-xs hover:border-slate-400 transition flex items-center justify-between gap-2 ${
                    isCleared 
                      ? 'opacity-80 bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200/60 dark:border-emerald-900/40' 
                      : cardBgClass
                  }`}
                >
                  {/* Left: Product Name, Price per piece, and Total Value on Home */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 
                        className={`text-xs sm:text-sm font-bold truncate ${
                          isCleared ? 'text-slate-700 dark:text-slate-300' : ''
                        }`}
                        title={product.name}
                      >
                        {product.name}
                      </h3>
                      {/* Mini Edit Button */}
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setIsAddModalOpen(true);
                        }}
                        title="নাম বা দাম সংশোধন ও ডিলিট"
                        className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                      <span>{formatBDT(product.pricePerUnit)}/পিস</span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        মোট {formatBDT(itemTotalMoney)}
                      </span>
                      {product.quantity > 0 ? (
                        <>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                          {/* 1-Tap Quick Receive Button right on Home row! Deducts 1 piece from Home! */}
                          <button
                            onClick={() => handleMarkReceived(product.id, 1)}
                            type="button"
                            className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-800 px-1.5 py-0.2 rounded text-[10px] font-bold cursor-pointer active:scale-95 transition shadow-2xs"
                            title="১ পিস হাতে বুঝে পেয়েছি (হোম থেকে ১ পিস মাইনাস হবে)"
                          >
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>বুঝে পেলাম (-১)</span>
                          </button>
                        </>
                      ) : alreadyReceived > 0 ? (
                        <>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="text-emerald-700 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-0.5">
                            ✓ সব বুঝে পেয়েছি ({alreadyReceived} পিস প্রাপ্ত)
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {/* Right: Ultra-Compact 1-Touch Mobile Counter */}
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    {/* Minus 1 button */}
                    <button
                      onClick={() => handleDecrement(product.id)}
                      disabled={product.quantity <= 0}
                      title="১ পিস কমান"
                      type="button"
                      className={`w-8 h-8 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center transition cursor-pointer active:scale-95 ${
                        product.quantity <= 0
                          ? 'opacity-25 cursor-not-allowed bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                          : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    {/* Pieces Count Badge (Tap to quickly add 2/3/5/custom pieces) */}
                    <button
                      onClick={() => setActiveProductForAdd(product)}
                      type="button"
                      title="কাস্টম সংখ্যা যোগ করতে চাপুন"
                      className={`min-w-[46px] sm:min-w-[50px] px-2 py-0.5 rounded-lg text-center transition cursor-pointer border active:scale-95 ${
                        product.quantity === 0
                          ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 border-slate-200 dark:border-slate-700'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700'
                      }`}
                    >
                      <span className="text-sm sm:text-base font-black block leading-tight">
                        {product.quantity}
                      </span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 block leading-none">
                        বাকি
                      </span>
                    </button>

                    {/* Quick +1 Piece button (নতুন রিটার্ন আসলে যোগ করুন) */}
                    <button
                      onClick={() => handleIncrement(product.id, 1)}
                      title="+১ পিস রিটার্ন যোগ"
                      type="button"
                      className="w-8 h-8 sm:w-8 sm:h-8 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:scale-90 text-white flex items-center justify-center font-bold transition shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add / Edit Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        onAddProduct={handleAddProduct}
        editingProduct={editingProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
      />

      {/* Quick Add Multiple Pieces Modal */}
      <QuickAddPiecesModal
        product={activeProductForAdd}
        onClose={() => setActiveProductForAdd(null)}
        onAddPieces={handleIncrement}
      />

      {/* Monthly History Modal */}
      <MonthlyHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        logs={logs}
      />

      {/* Received & Settings Checklist Modal */}
      <ReceivedSettingsModal
        isOpen={isReceivedModalOpen}
        onClose={() => setIsReceivedModalOpen(false)}
        products={products}
        receivedLogs={receivedLogs}
        onMarkReceived={handleMarkReceived}
        onUndoReceived={handleUndoReceived}
        onClearAllData={handleClearAllData}
        onImportBackup={handleImportBackup}
        initialTab={receivedModalTab}
        theme={theme}
        onThemeChange={handleThemeChange}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* WhatsApp & Text Share Modal */}
      <ShareReportModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        products={products}
        totalStockMoney={totalStockMoney}
        totalStockPieces={totalStockPieces}
        totalPendingPieces={totalPendingToReceive}
        currentMonthReturnMoney={currentMonthReturnMoney}
      />
    </div>
  );
}
