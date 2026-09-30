import React, { useState, useEffect } from 'react';
import { ProductItem } from '../types';
import { X, Plus, PackagePlus, Trash2 } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (name: string, pricePerUnit: number, initialQty: number) => void;
  editingProduct?: ProductItem | null;
  onUpdateProduct?: (id: string, name: string, pricePerUnit: number) => void;
  onDeleteProduct?: (id: string) => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
  editingProduct,
  onUpdateProduct,
  onDeleteProduct,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [initialQty, setInitialQty] = useState('1');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setPrice(String(editingProduct.pricePerUnit));
      setInitialQty(String(editingProduct.quantity));
    } else {
      setName('');
      setPrice('');
      setInitialQty('1');
    }
    setError('');
    setConfirmDelete(false);
  }, [editingProduct, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('মালের নাম লিখুন');
      return;
    }
    const numPrice = Number(price);
    if (!price || isNaN(numPrice) || numPrice < 0) {
      setError('সঠিক দাম (টাকা) লিখুন');
      return;
    }

    if (editingProduct && onUpdateProduct) {
      onUpdateProduct(editingProduct.id, name.trim(), numPrice);
    } else {
      const qty = Math.max(0, parseInt(initialQty, 10) || 0);
      onAddProduct(name.trim(), numPrice, qty);
    }

    setName('');
    setPrice('');
    setInitialQty('1');
    setError('');
    onClose();
  };

  const handleConfirmDelete = () => {
    if (!editingProduct || !onDeleteProduct) return;
    onDeleteProduct(editingProduct.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-900">
              {editingProduct ? 'মালের তথ্য সংশোধন' : 'নতুন মাল যোগ করুন'}
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
          <p className="text-xs text-slate-500">
            {editingProduct 
              ? 'মালের নাম বা প্রতি পিসের দাম পরিবর্তন করতে পারেন।' 
              : 'মালটি একবার এখানে যোগ করে রাখলে পরবর্তীতে আর বারবার নাম বা দাম লিখতে হবে না, শুধু এক ক্লিকে সংখ্যা কাউন্ট করবেন।'}
          </p>

          {error && (
            <div className="p-2.5 rounded bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              মালের / প্রোডাক্টের নাম *
            </label>
            <input
              type="text"
              autoFocus
              placeholder="যেমন: কটন থ্রি-পিস / জামদানি শাড়ি / পলো শার্ট"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              প্রতি পিসের দাম (টাকা) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">৳</span>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="যেমন: 850"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
                required
              />
            </div>
          </div>

          {!editingProduct && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                বর্তমানে কত পিস রিটার্ন আছে?
              </label>
              <input
                type="number"
                min="0"
                value={initialQty}
                onChange={(e) => setInitialQty(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                (যদি এখনই কোনো পিস না থাকে তবে ০ রাখতে পারেন, পরে রিটার্ন আসলে + চাপলেই যোগ হবে)
              </span>
            </div>
          )}

          {/* In-app Inline Delete Confirmation (Never blocked by iframe) */}
          {editingProduct && confirmDelete ? (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 space-y-2">
              <p className="text-xs font-bold text-rose-800">
                ⚠️ আপনি কি নিশ্চিত "{editingProduct.name}" তালিকা থেকে মুছে ফেলতে চান?
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition cursor-pointer shadow-xs"
                >
                  হ্যাঁ, ডিলিট করুন
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            </div>
          ) : (
            /* Action Buttons: Delete on bottom-left if editing, Cancel & Save on right */
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div>
                {editingProduct && onDeleteProduct && (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ডিলিট করুন</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingProduct ? 'আপডেট করুন' : 'মালটি যোগ করুন'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
