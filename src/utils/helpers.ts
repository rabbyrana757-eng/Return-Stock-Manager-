export function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num
    .toString()
    .replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
}

export function formatBDT(amount: number): string {
  const formatted = Math.round(amount).toLocaleString('en-US');
  return `৳ ${toBengaliNumber(formatted)}`;
}

export function formatCount(count: number): string {
  const formatted = count.toLocaleString('en-US');
  return `${toBengaliNumber(formatted)} টি`;
}

export function formatPcs(count: number): string {
  const formatted = count.toLocaleString('en-US');
  return `${toBengaliNumber(formatted)} পিস`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatMonthName(monthKey: string): string {
  if (!monthKey) return '';
  const [yearStr, monthStr] = monthKey.split('-');
  const monthNum = parseInt(monthStr, 10);
  const yearNum = parseInt(yearStr, 10);

  const bnMonths = [
    'জানুয়ারি',
    'ফেব্রুয়ারি',
    'মার্চ',
    'এপ্রিল',
    'মে',
    'জুন',
    'জুলাই',
    'আগস্ট',
    'সেপ্টেম্বর',
    'অক্টোবর',
    'নভেম্বর',
    'ডিসেম্বর',
  ];

  if (monthNum >= 1 && monthNum <= 12) {
    return `${bnMonths[monthNum - 1]} ${toBengaliNumber(yearNum)}`;
  }
  return monthKey;
}

export function formatDateBn(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const bnMonths = [
      'জানু',
      'ফেব্রু',
      'মার্চ',
      'এপ্রিল',
      'মে',
      'জুন',
      'জুলাই',
      'আগস্ট',
      'সেপ্টে',
      'অক্টো',
      'নভে',
      'ডিসে',
    ];
    return `${toBengaliNumber(day)} ${bnMonths[month - 1]}, ${toBengaliNumber(year)}`;
  } catch {
    return dateStr;
  }
}
