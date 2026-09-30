import React, { useState } from 'react';
import { ProductItem } from '../types';
import { formatBDT, formatPcs } from '../utils/helpers';
import { X, Plus, PackageCheck } from 'lucide-react';

interface QuickAddPiecesModalProps {
  product: ProductItem | null;
  onClose: () => void;
  onAddPieces: (productId: string, quantityToAdd: number) => void;
}

export const QuickAddPiecesModal: React.FC<QuickAddPiecesModalProps> = ({
  product,
  onClose,
  onAddPieces,
}) => {
  if (!product) return null;

  const [qty, setQty] = useState('1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(qty, 10);
    if (!count || count <= 0) return;
    onAddPieces(product.id, count);
    onClose();
  };

  const currentPieces = product.quantity;
  const addingCount = parseInt(qty, 10) || 0;
  const newTotalPieces = currentPieces + addingCount;
  const newTotalValue = newTotalPieces * product.pricePerUnit;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-900">
              রিটার্ন মাল যোগ করুন
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <span className="text-xs text-slate-500 font-medium block">প্রোডাক্ট:</span>
            <p className="text-base font-bold text-slate-900">{product.name}</p>
            <span className="text-xs text-slate-600 block mt-0.5">
              প্রতি পিস: {formatBDT(product.pricePerUnit)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              আজকে কত পিস রিটার্ন আসলো?
            </label>
            <input
              type="number"
              min="1"
              autoFocus
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full text-center text-2xl font-bold border border-slate-300 rounded-lg py-2.5 focus:ring-2 focus:ring-slate-900 focus:outline-none"
              required
            />

            {/* Quick preset buttons */}
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[1, 2, 3, 5].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQty(String(preset))}
                  className={`py-1.5 text-xs font-bold rounded border cursor-pointer transition ${
                    addingCount === preset
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  +{preset} পিস
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200/80 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>বর্তমানে আছে:</span>
              <span className="font-semibold text-slate-900">{formatPcs(currentPieces)}</span>
            </div>
            <div className="flex justify-between text-emerald-800 font-semibold">
              <span>যোগ করার পর হবে:</span>
              <span>{formatPcs(newTotalPieces)}</span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold pt-1 border-t border-emerald-200">
              <span>নতুন মোট মূল্য:</span>
              <span>{formatBDT(newTotalValue)}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>যোগ করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
