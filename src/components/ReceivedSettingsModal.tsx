import React, { useState } from 'react';
import { ProductItem, ReceivedLog, AppTheme } from '../types';
import { formatBDT, formatPcs, formatDateBn } from '../utils/helpers';
import { exportBackupJSON } from '../utils/storage';
import { playSuccessSound } from '../utils/audio';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  PackageCheck, 
  Settings, 
  Download, 
  Upload, 
  Trash2, 
  Plus, 
  Minus,
  Sparkles,
  History,
  Check,
  Palette,
  Volume2,
  VolumeX,
  ArrowDownRight,
  AlertTriangle
} from 'lucide-react';

interface ReceivedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  receivedLogs: ReceivedLog[];
  onMarkReceived: (productId: string, count: number, note?: string) => void;
  onUndoReceived: (productId: string) => void;
  onClearAllData: () => void;
  onImportBackup: (importedData: any) => void;
  initialTab?: 'received' | 'settings';
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
}

export const ReceivedSettingsModal: React.FC<ReceivedSettingsModalProps> = ({
  isOpen,
  onClose,
  products,
  receivedLogs,
  onMarkReceived,
  onUndoReceived,
  onClearAllData,
  onImportBackup,
  initialTab = 'received',
  theme,
  onThemeChange,
  soundEnabled,
  onToggleSound,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'received' | 'history' | 'settings'>(initialTab);
  const [filterPendingOnly, setFilterPendingOnly] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Overall calculations:
  // totalPending = quantity currently awaiting receipt on Home screen
  const totalPending = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalPendingValue = products.reduce((sum, p) => sum + (p.quantity * p.pricePerUnit), 0);

  // totalReceived = pieces that have been physically verified & deducted from Home
  const totalReceived = products.reduce((sum, p) => sum + (p.receivedQuantity || 0), 0);
  const totalReceivedValue = products.reduce(
    (sum, p) => sum + ((p.receivedQuantity || 0) * p.pricePerUnit), 
    0
  );

  const filteredProducts = filterPendingOnly
    ? products.filter((p) => p.quantity > 0)
    : products;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed) {
          onImportBackup(parsed);
          setUploadStatus({
            type: 'success',
            message: 'সফলভাবে ব্যাকআপ থেকে সব ডাটা লোড হয়েছে!'
          });
          if (soundEnabled) playSuccessSound();
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } catch (err) {
        setUploadStatus({
          type: 'error',
          message: 'ফাইল পড়তে সমস্যা হয়েছে। সঠিক JSON ফাইল নির্বাচন করুন।'
        });
      }
    };
    reader.readAsText(file);
  };

  const handleMark = (id: string, count: number) => {
    onMarkReceived(id, count);
    if (soundEnabled) {
      playSuccessSound();
    }
  };

  const handleExecuteClear = () => {
    onClearAllData();
    setShowConfirmClear(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
      <div className={`rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border max-h-[88vh] flex flex-col ${
        theme === 'dark' 
          ? 'bg-slate-900 border-slate-700 text-slate-100' 
          : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm sm:text-base font-bold leading-tight">
                বুঝে পেলাম ও সেটিং
              </h2>
              <p className="text-[10px] text-slate-400 leading-none">
                হাতে পেলে 'বুঝে পেলাম' চাপুন, হোম স্ক্রিন থেকে স্বয়ংক্রিয়ভাবে মাইনাস হবে
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex border-b text-xs font-semibold ${
          theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 py-2.5 px-3 text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'received'
                ? 'border-emerald-600 text-emerald-500 font-bold bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PackageCheck className="w-4 h-4 text-emerald-500" />
            <span>বুঝে পেলাম চেকলিস্ট</span>
            {totalPending > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                {totalPending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 px-3 text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-500 font-bold bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4 text-slate-400" />
            <span>প্রাপ্তি ইতিহাস ({receivedLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2.5 px-3.5 text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-emerald-600 text-emerald-500 font-bold bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>সেটিংস ও থিম</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: বুঝে পেলাম চেকলিস্ট */}
          {activeTab === 'received' && (
            <div className="space-y-3">
              {/* Mini Status Cards */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* 1. বুঝে নেওয়া শেষ (Already received) */}
                <div className={`border rounded-lg p-2.5 ${
                  theme === 'dark' 
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <div className="flex items-center justify-between font-semibold mb-0.5">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      হাতে বুঝে পেয়েছি
                    </span>
                    <span className="font-bold">{formatPcs(totalReceived)}</span>
                  </div>
                  <p className="text-base font-black">
                    {formatBDT(totalReceivedValue)}
                  </p>
                </div>

                {/* 2. হোমে বাকি আছে (Pending to receive) */}
                <div className={`border rounded-lg p-2.5 ${
                  theme === 'dark' 
                    ? 'bg-amber-950/40 border-amber-800 text-amber-300' 
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <div className="flex items-center justify-between font-semibold mb-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      হোমে বাকি / কুরিয়ারে
                    </span>
                    <span className="font-bold">{formatPcs(totalPending)}</span>
                  </div>
                  <p className="text-base font-black">
                    {formatBDT(totalPendingValue)}
                  </p>
                </div>
              </div>

              {/* Instructions banner */}
              <div className="bg-slate-100 dark:bg-slate-800/80 p-2 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  <b>পেলেন?</b> সবুজ বাটনে চাপলে ১ পিস বুঝে নেওয়া হবে এবং <b>হোম স্ক্রিন থেকে ১ পিস মাইনাস হয়ে যাবে</b>।
                </span>
              </div>

              {/* Filter: All vs Pending */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="font-bold">
                  শাড়ির তালিকা ({filteredProducts.length}টি)
                </span>
                <button
                  onClick={() => setFilterPendingOnly(!filterPendingOnly)}
                  type="button"
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer border ${
                    filterPendingOnly
                      ? 'bg-amber-400 text-slate-950 border-amber-500 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {filterPendingOnly ? '✓ শুধু বাকিগুলো দেখাচ্ছে' : 'শুধু হোমে বাকিগুলো দেখুন'}
                </button>
              </div>

              {/* Products List for Receiving */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-bold">
                    {filterPendingOnly
                      ? 'কোনো শাড়ি হোমে বাকি নেই! সব হাতে বুঝে পেয়েছেন।'
                      : 'এখনও কোনো প্রোডাক্ট যোগ করা হয়নি।'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map((p) => {
                    const homePending = p.quantity;
                    const alreadyReceived = p.receivedQuantity || 0;
                    const isAllDone = homePending === 0 && alreadyReceived > 0;

                    return (
                      <div
                        key={p.id}
                        className={`p-2.5 sm:p-3 rounded-lg border transition ${
                          isAllDone
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs sm:text-sm font-bold truncate">
                                {p.name}
                              </h4>
                              {isAllDone && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 shrink-0">
                                  <Check className="w-3 h-3" />
                                  সব বুঝে পেয়েছেন (হোম ০)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                              <span>
                                হোমে বাকি: <b className={homePending > 0 ? "text-amber-700 dark:text-amber-400 font-bold" : "text-slate-400"}>
                                  {formatPcs(homePending)}
                                </b>
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                                বুঝে পেয়েছি: {formatPcs(alreadyReceived)}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>প্রতি পিস {formatBDT(p.pricePerUnit)}</span>
                            </div>
                          </div>

                          {/* Quick Receive Action Buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Undo 1 piece back to Home if alreadyReceived > 0 */}
                            {alreadyReceived > 0 && (
                              <button
                                onClick={() => onUndoReceived(p.id)}
                                title="ভুল হলে ১ পিস হোমে ফেরত পাঠান"
                                type="button"
                                className="w-7 h-7 rounded border border-slate-300 dark:border-slate-600 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-xs transition cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                            )}

                            {/* Mark 1 piece received -> Minus 1 from Home */}
                            <button
                              onClick={() => handleMark(p.id, 1)}
                              disabled={homePending <= 0}
                              type="button"
                              className={`px-2.5 py-1.5 text-xs font-bold rounded flex items-center gap-1 transition cursor-pointer active:scale-95 ${
                                homePending <= 0
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                  : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{homePending > 0 ? '১ পিস পেলাম (-১)' : 'সম্পন্ন ✓'}</span>
                            </button>

                            {/* Mark All Pending Received Button */}
                            {homePending > 1 && (
                              <button
                                onClick={() => handleMark(p.id, homePending)}
                                type="button"
                                className="px-2 py-1.5 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                                title={`সব ${homePending} পিস বুঝে নিয়ে হোম ০ করুন`}
                              >
                                সব পেলাম
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: বুঝে পাওয়ার ইতিহাস (Timeline) */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>সর্বমোট {receivedLogs.length} টি প্রাপ্তি রেকর্ড</span>
              </div>

              {receivedLogs.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold">এখনও কোনো প্রাপ্তি রেকর্ড নেই</p>
                  <p className="text-xs text-slate-400 mt-1">
                    চেকলিস্ট থেকে '১ পিস পেলাম' চাপলে এখানে সময়সহ তারিখ জমা হবে এবং হোম থেকে মাইনাস হবে।
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {receivedLogs.map((log) => (
                    <div key={log.id} className="p-2.5 sm:p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <p className="font-bold">{log.productName}</p>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          {formatDateBn(log.date)} · সময়: {log.time}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm block">
                          +{formatPcs(log.piecesReceived)} বুঝে পেয়েছি
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {formatBDT(log.totalValue)} (হোম থেকে মাইনাস)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: সেটিংস, থিম ও ডাটা ব্যাকআপ */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* In-app upload banner message */}
              {uploadStatus && (
                <div className={`p-2.5 rounded-lg text-xs font-semibold border flex items-center gap-2 ${
                  uploadStatus.type === 'success' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-300' 
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border-rose-300'
                }`}>
                  {uploadStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{uploadStatus.message}</span>
                </div>
              )}

              {/* Theme Selector */}
              <div className={`p-3 rounded-lg border space-y-2.5 ${
                theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    অ্যাপের থিম নির্বাচন
                  </h4>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => onThemeChange('emerald')}
                    type="button"
                    className={`p-2.5 rounded-lg border text-center transition cursor-pointer ${
                      theme === 'emerald'
                        ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/80 text-emerald-900 font-bold'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-emerald-600 mx-auto mb-1"></div>
                    <span className="text-xs block leading-tight">সবুজ ক্লাসিক</span>
                  </button>

                  <button
                    onClick={() => onThemeChange('dark')}
                    type="button"
                    className={`p-2.5 rounded-lg border text-center transition cursor-pointer ${
                      theme === 'dark'
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-slate-950 text-white font-bold'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-slate-900 border border-slate-600 mx-auto mb-1"></div>
                    <span className="text-xs block leading-tight">মিডনাইট ডার্ক</span>
                  </button>

                  <button
                    onClick={() => onThemeChange('indigo')}
                    type="button"
                    className={`p-2.5 rounded-lg border text-center transition cursor-pointer ${
                      theme === 'indigo'
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50 text-indigo-900 font-bold'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-indigo-600 mx-auto mb-1"></div>
                    <span className="text-xs block leading-tight">রয়্যাল ইন্ডিগো</span>
                  </button>
                </div>
              </div>

              {/* Sound / Tactile Feedback Toggle */}
              <div className={`p-3 rounded-lg border flex items-center justify-between ${
                theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                  <div>
                    <h5 className="text-xs font-bold leading-tight">
                      বাটন টাচ সাউন্ড ও ভাইব্রেশন
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      মোবাইলে প্লাস/মাইনাস চাপলে হালকা ক্লিকের শব্দ হবে
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleSound(!soundEnabled)}
                  className={`w-11 h-6 rounded-full transition cursor-pointer relative p-0.5 ${
                    soundEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>

              {/* Backup & Restore */}
              <div className={`p-3 rounded-lg border space-y-2 ${
                theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  ডাটা ব্যাকআপ সংরক্ষণ
                </h4>
                <p className="text-xs text-slate-500">
                  আপনার সব শাড়ির তালিকা, কাউন্টারের হিসাব এবং বুঝে পাওয়ার তথ্য আপনার মোবাইলে ব্যাকআপ ফাইল আকারে ডাউনলোড করে রাখতে পারেন।
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => exportBackupJSON(products, [], receivedLogs)}
                    type="button"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ব্যাকআপ ডাউনলোড</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>ব্যাকআপ আপলোড</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              {/* Danger Zone: Reliable In-App Confirmation (Never blocked by iframe) */}
              <div className="bg-rose-50 dark:bg-rose-950/30 p-3 rounded-lg border border-rose-200 dark:border-rose-900 space-y-2.5">
                <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    সমস্ত ডাটা রিসেট
                  </h4>
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-400">
                  আপনি যদি সমস্ত শাড়ি ও হিসাব মুছে একদম নতুন করে শুরু করতে চান তবে নিচের বাটন চাপুন।
                </p>

                {showConfirmClear ? (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border-2 border-rose-500 space-y-2 shadow-xs">
                    <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
                      ⚠️ আপনি কি নিশ্চিত সমস্ত শাড়ি, রিটার্নের হিসাব ও প্রাপ্তি তথ্য চিরতরে মুছে ফেলতে চান?
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleExecuteClear}
                        className="flex-1 px-3 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white transition cursor-pointer shadow-xs"
                      >
                        হ্যাঁ, সমস্ত ডাটা মুছে ফেলুন
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowConfirmClear(false)}
                        className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition cursor-pointer"
                      >
                        বাতিল
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmClear(true)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 hover:bg-rose-100 transition cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>সমস্ত ডাটা মুছে ফেলুন</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`px-4 py-2.5 border-t flex items-center justify-between ${
          theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {totalPending > 0 
              ? `হোমে ${totalPending} পিস শাড়ি এখনো আসা বাকি` 
              : 'সব শাড়ি হাতে পাওয়া সম্পন্ন ✓'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition cursor-pointer"
          >
            ঠিক আছে
          </button>
        </div>
      </div>
    </div>
  );
};
