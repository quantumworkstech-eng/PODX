export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
}

export function setToLocalStorage(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeFromLocalStorage(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}
