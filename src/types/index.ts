export interface ProductItem {
  id: string;
  name: string; // মালের নাম (যেমন: থ্রি-পিস, পলো শার্ট, শাড়ি)
  pricePerUnit: number; // প্রতি পিসের দাম (টাকা)
  quantity: number; // মোট রিটার্ন আসা মালের সংখ্যা
  receivedQuantity?: number; // এর মধ্যে কয় পিস আমি হাতে বুঝে পেলাম
  createdAt: string;
  updatedAt: string;
}

export interface ReturnLog {
  id: string;
  productId: string;
  productName: string;
  changeType: 'return_in' | 'sold_out'; // রিটার্ন আসলো (+) নাকি মাল সরানো/বিক্রি হলো (-)
  quantity: number; // কয় পিস (যেমন: ২)
  pricePerUnit: number; // প্রতি পিসের দাম
  totalValue: number; // মোট কত টাকার মাল (quantity * pricePerUnit)
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface ReceivedLog {
  id: string;
  productId: string;
  productName: string;
  piecesReceived: number; // কত পিস বুঝে পেলাম
  pricePerUnit: number;
  totalValue: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes?: string;
  createdAt: string;
}

export type AppTheme = 'emerald' | 'dark' | 'indigo';
export type Language = 'bn' | 'en';
