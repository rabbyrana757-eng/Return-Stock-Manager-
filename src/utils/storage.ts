import { ProductItem, ReturnLog, ReceivedLog } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'simple_returns_products_v1',
  LOGS: 'simple_returns_logs_v1',
  RECEIVED_LOGS: 'simple_received_logs_v1',
};

export function loadProducts(): ProductItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load products', err);
    return [];
  }
}

export function saveProducts(items: ProductItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save products', err);
  }
}

export function loadReturnLogs(): ReturnLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load return logs', err);
    return [];
  }
}

export function saveReturnLogs(logs: ReturnLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to save return logs', err);
  }
}

export function loadReceivedLogs(): ReceivedLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECEIVED_LOGS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load received logs', err);
    return [];
  }
}

export function saveReceivedLogs(logs: ReceivedLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RECEIVED_LOGS, JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to save received logs', err);
  }
}

export function clearAllStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.RECEIVED_LOGS);
  } catch (err) {
    console.error('Failed to clear storage', err);
  }
}

export function exportBackupJSON(
  products: ProductItem[], 
  logs: ReturnLog[], 
  receivedLogs: ReceivedLog[] = []
): void {
  const data = {
    exportedAt: new Date().toISOString(),
    products,
    logs,
    receivedLogs,
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `returns_stock_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
