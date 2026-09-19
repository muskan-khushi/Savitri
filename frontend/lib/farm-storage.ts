/**
 * farm-storage.ts
 *
 * There is no auth/session system yet, so "which farm is this?" is
 * tracked client-side via localStorage — good enough for a single-user
 * demo/MVP, not a substitute for real auth once multiple farmers use
 * the web app. Replace with a real session once that exists.
 */

const KEY = "savitri:farmId";

export function getStoredFarmId(): number | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  return v ? Number(v) : null;
}

export function setStoredFarmId(id: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, String(id));
}

export function clearStoredFarmId() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}