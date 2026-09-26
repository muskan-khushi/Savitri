/**
 * farm-storage.ts
 *
 * Stores the farmer's active farm profile in localStorage.
 * This is intentionally simple for MVP: one farm per browser.
 * The farm ID links to the real backend DB record — if the farm
 * is deleted from the backend, the next API call will 404 and
 * the UI should clear localStorage (handled in each page's error state).
 */

export interface StoredFarm {
  id: number;
  data: {
    name: string | null;
    lat: number;
    lon: number;
    crop: string;
    sowing_date: string;
    telegram_chat_id?: string | null;
  };
  savedAt: string; // ISO timestamp
}

const STORAGE_KEY = "savitri_farm";

export function saveFarm(farm: {
  id: number;
  name: string | null;
  lat: number;
  lon: number;
  crop: string;
  sowing_date: string;
  telegram_chat_id?: string | null;
}): void {
  const stored: StoredFarm = {
    id: farm.id,
    data: {
      name: farm.name,
      lat: farm.lat,
      lon: farm.lon,
      crop: farm.crop,
      sowing_date: farm.sowing_date,
      telegram_chat_id: farm.telegram_chat_id,
    },
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // localStorage unavailable (SSR, private browsing quota exceeded)
  }
}

export function loadFarm(): StoredFarm | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredFarm;
    // Basic validation — if shape is wrong, clear and return null
    if (typeof parsed.id !== "number" || !parsed.data?.crop) {
      clearFarm();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getStoredFarmId(): number | null {
  return loadFarm()?.id ?? null;
}

export function clearFarm(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Call this when a 404 is received for the stored farm ID —
 * it means the backend DB was cleared/reset. Clears localStorage
 * so the user is prompted to re-register.
 */
export function handleFarmNotFound(): void {
  clearFarm();
}