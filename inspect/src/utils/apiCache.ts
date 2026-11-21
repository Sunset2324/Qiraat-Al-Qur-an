import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "api_cache_v1:";
const INDEX_PREFIX = "api_cache_index_v1:";

interface Entry<T> {
  t: number; // waktu disimpan (ms)
  d: T;
}

interface CacheOptions {
  /** Selama ini data cache dianggap segar dan langsung dipakai tanpa request ke server. */
  ttlMs: number;
  /** Nama grup untuk membatasi jumlah entri (AsyncStorage Android punya batas total ~6MB). */
  group?: string;
  /** Jumlah maksimum entri di grup ini; yang paling lama tidak dipakai dihapus. */
  maxEntries?: number;
}

// AsyncStorage di Android gagal membaca satu nilai di atas ~2MB (batas CursorWindow).
// Entri yang lebih besar dari ini tidak disimpan supaya tidak merusak pembacaan berikutnya.
const MAX_ENTRY_CHARS = 1_500_000;

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/**
 * Network-first dengan fallback cache:
 *  1. Cache masih segar (< ttlMs)  -> langsung dipakai (cepat, hemat kuota).
 *  2. Cache kedaluwarsa/tidak ada -> ambil dari server lalu simpan.
 *  3. Server gagal (offline/timeout) tapi ada cache lama -> pakai cache lama.
 *  4. Server gagal dan tidak ada cache -> lempar error aslinya.
 */
export async function cachedRequest<T>(
  key: string,
  fetcher: () => Promise<T>,
  { ttlMs, group, maxEntries }: CacheOptions
): Promise<T> {
  const fullKey = PREFIX + key;

  let cached: Entry<T> | null = null;
  try {
    const raw = await AsyncStorage.getItem(fullKey);
    if (raw) cached = JSON.parse(raw) as Entry<T>;
  } catch {
    cached = null;
  }

  if (cached && Date.now() - cached.t < ttlMs) {
    return cached.d;
  }

  try {
    const data = await fetcher();
    await saveEntry(fullKey, data, group, maxEntries);
    return data;
  } catch (error) {
    if (cached) {
      console.warn(`[cache] server gagal, pakai data tersimpan: ${key}`);
      return cached.d;
    }
    throw error;
  }
}

async function saveEntry<T>(fullKey: string, data: T, group?: string, maxEntries?: number) {
  try {
    const entry: Entry<T> = { t: Date.now(), d: data };
    const json = JSON.stringify(entry);
    if (json.length > MAX_ENTRY_CHARS) {
      console.warn(`[cache] entri terlalu besar, tidak disimpan: ${fullKey}`);
      return;
    }
    await AsyncStorage.setItem(fullKey, json);

    if (group && maxEntries) {
      const indexKey = INDEX_PREFIX + group;
      let index: string[] = [];
      try {
        const raw = await AsyncStorage.getItem(indexKey);
        if (raw) index = JSON.parse(raw);
      } catch {}
      index = index.filter((k) => k !== fullKey);
      index.push(fullKey);
      while (index.length > maxEntries) {
        const oldest = index.shift();
        if (oldest) await AsyncStorage.removeItem(oldest);
      }
      await AsyncStorage.setItem(indexKey, JSON.stringify(index));
    }
  } catch (e) {
    // Penyimpanan penuh / gagal tulis: abaikan, app tetap jalan tanpa cache.
    console.warn("[cache] gagal menyimpan cache:", e);
  }
}

/** Hapus semua cache API (mis. untuk tombol "Reset" di Pengaturan). */
export async function clearApiCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const target = keys.filter((k) => k.startsWith(PREFIX) || k.startsWith(INDEX_PREFIX));
    if (target.length) await AsyncStorage.multiRemove(target);
  } catch (e) {
    console.warn("[cache] gagal menghapus cache:", e);
  }
}