import React, { useState } from 'react';
import { ReturnLog } from '../types';
import { formatBDT, formatPcs, formatMonthName, formatDateBn } from '../utils/helpers';
import { X, Calendar, RotateCcw, Clock, Trash2 } from 'lucide-react';

interface MonthlyHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ReturnLog[];
  onClearLogs?: () => void;
}

export const MonthlyHistoryModal: React.FC<MonthlyHistoryModalProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
}) => {
  if (!isOpen) return null;

  // Group logs by month (YYYY-MM)
  const monthMap: { [monthKey: string]: { totalMoney: number; totalPieces: number; items: ReturnLog[] } } = {};

  logs.forEach((log) => {
    if (log.changeType !== 'return_in') return; // only count returns in
    const monthKey = log.date.slice(0, 7);
    if (!monthMap[monthKey]) {
      monthMap[monthKey] = { totalMoney: 0, totalPieces: 0, items: [] };
    }
    monthMap[monthKey].totalMoney += log.totalValue;
    monthMap[monthKey].totalPieces += log.quantity;
    monthMap[monthKey].items.push(log);
  });

  const sortedMonths = Object.keys(monthMap).sort((a, b) => b.localeCompare(a));
  const [selectedMonth, setSelectedMonth] = useState<string>(sortedMonths[0] || '');

  const activeMonthData = selectedMonth ? monthMap[selectedMonth] : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-800" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                মাসিক রিটার্ন হিসাব
              </h2>
              <p className="text-xs text-slate-500">
                প্রতিমাসে কত টাকার মাল রিটার্ন এসেছে তার রেকর্ড
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {sortedMonths.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">এখনও কোনো মাসিক রেকর্ড জমা হয়নি</p>
              <p className="text-xs text-slate-400 mt-1">
                মালের কার্ড থেকে সংখ্যা বা কাউন্ট যোগ করলে এখানে স্বয়ংক্রিয়ভাবে হিসাব দেখাবে।
              </p>
            </div>
          ) : (
            <>
              {/* Month Selector Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {sortedMonths.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(m)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                      selectedMonth === m
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {formatMonthName(m)}
                  </button>
                ))}
              </div>

              {/* Selected Month Summary Card */}
              {activeMonthData && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-slate-500 block font-medium">
                      {formatMonthName(selectedMonth)} এ মোট রিটার্ন:
                    </span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {formatBDT(activeMonthData.totalMoney)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-medium">
                      মোট ফেরত আসা সংখ্যা:
                    </span>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">
                      {formatPcs(activeMonthData.totalPieces)}
                    </p>
                  </div>
                </div>
              )}

              {/* Detailed Event Log */}
              {activeMonthData && (
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    রিটার্ন এন্ট্রি তালিকা
                  </h3>
                  <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                    {activeMonthData.items.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <p className="font-bold text-slate-900">{item.productName}</p>
                          <span className="text-[11px] text-slate-500">
                            {formatDateBn(item.date)} · প্রতি পিস {formatBDT(item.pricePerUnit)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 block">
                            +{formatPcs(item.quantity)}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-700">
                            {formatBDT(item.totalValue)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            সর্বমোট {logs.length} টি কাউন্ট রেকর্ড
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
