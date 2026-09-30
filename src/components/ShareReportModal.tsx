import React, { useState } from 'react';
import { ProductItem } from '../types';
import { formatBDT, formatPcs, formatDateBn, getTodayDateString } from '../utils/helpers';
import { playSuccessSound } from '../utils/audio';
import { X, Share2, Copy, Check, MessageSquare } from 'lucide-react';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  totalStockMoney: number;
  totalStockPieces: number;
  totalPendingPieces: number;
  currentMonthReturnMoney: number;
}

export const ShareReportModal: React.FC<ShareReportModalProps> = ({
  isOpen,
  onClose,
  products,
  totalStockMoney,
  totalStockPieces,
  totalPendingPieces,
  currentMonthReturnMoney,
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const today = getTodayDateString();

  // Generate plain-text Bengali summary
  const generateText = () => {
    let text = `📦 রিটার্ন স্টক হিসাব বিবরণী\n`;
    text += `তারিখ: ${formatDateBn(today)}\n`;
    text += `---------------------------------\n`;
    text += `💰 মোট টাকার মাল: ${formatBDT(totalStockMoney)}\n`;
    text += `🛍️ মোট ফেরত মাল: ${formatPcs(totalStockPieces)}\n`;
    if (totalPendingPieces > 0) {
      text += `⏳ কুরিয়ার থেকে পাওয়া বাকি: ${formatPcs(totalPendingPieces)}\n`;
    }
    text += `📅 চলতি মাসের রিটার্ন: ${formatBDT(currentMonthReturnMoney)}\n`;
    text += `---------------------------------\n`;
    text += `মালের তালিকা:\n`;

    const activeProducts = products.filter((p) => p.quantity > 0);
    if (activeProducts.length === 0) {
      text += `(কোনো সক্রিয় মাল নেই)\n`;
    } else {
      activeProducts.forEach((p, idx) => {
        const itemVal = p.quantity * p.pricePerUnit;
        const pending = Math.max(0, p.quantity - (p.receivedQuantity || 0));
        text += `${idx + 1}. ${p.name}: ${p.quantity} পিস (${formatBDT(itemVal)})`;
        if (pending > 0) {
          text += ` [${pending} পিস বাকি]`;
        }
        text += `\n`;
      });
    }

    text += `---------------------------------\n`;
    text += `- রিটার্ন খাতা অ্যাপ থেকে প্রস্তুতকৃত`;
    return text;
  };

  const reportText = generateText();

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    playSuccessSound();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(reportText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm sm:text-base font-bold">
              হিসাব কপি ও হোয়াটসঅ্যাপ শেয়ার
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-xs text-slate-500">
            আজকের রিটার্ন স্টক বিবরণী পার্টনার বা কুরিয়ার ম্যানেজারের সাথে শেয়ার করতে নিচের বাটনে চাপ দিন:
          </p>

          {/* Report Preview Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-56 overflow-y-auto">
            <pre className="text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
              {reportText}
            </pre>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleCopy}
              type="button"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 transition cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">কপি হয়েছে!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>কপি করুন</span>
                </>
              )}
            </button>

            <button
              onClick={handleWhatsApp}
              type="button"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-xs active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>হোয়াটসঅ্যাপে পাঠান</span>
            </button>
          </div>
        </div>

        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded transition cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
