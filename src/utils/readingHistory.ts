import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "reading_history_v1";
const MAX_ENTRIES = 50;

export interface ReadingHistoryEntry {
  surahNomor: number;
  namaLatin: string;
  ayatNomor: number;
  totalAyat: number;
  timestamp: number; // Date.now()
}

const readAll = async (): Promise<ReadingHistoryEntry[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Gagal membaca riwayat bacaan:", error);
    return [];
  }
};

const writeAll = async (entries: ReadingHistoryEntry[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error("Gagal menyimpan riwayat bacaan:", error);
  }
};

/**
 * Simpan/perbarui posisi terakhir dibaca untuk satu surah.
 * Kalau surah ini sudah ada di riwayat, entri lama diganti & dipindah ke paling atas
 * (jadi 1 surah = 1 entri, bukan numpuk tiap kali dibuka).
 */
export const saveLastRead = async (
  entry: Omit<ReadingHistoryEntry, "timestamp">
): Promise<void> => {
  const current = await readAll();
  const filtered = current.filter((e) => e.surahNomor !== entry.surahNomor);
  const next: ReadingHistoryEntry[] = [{ ...entry, timestamp: Date.now() }, ...filtered].slice(
    0,
    MAX_ENTRIES
  );
  await writeAll(next);
};

/** Ambil seluruh riwayat, yang paling baru dibaca di paling atas. */
export const getHistory = async (): Promise<ReadingHistoryEntry[]> => {
  return readAll();
};

/** Ambil nomor ayat terakhir dibaca untuk satu surah (null kalau surah ini belum pernah dibuka). */
export const getLastReadAyah = async (surahNomor: number): Promise<number | null> => {
  const all = await readAll();
  const found = all.find((e) => e.surahNomor === surahNomor);
  return found ? found.ayatNomor : null;
};

/** Hapus satu entri riwayat (satu surah). */
export const removeHistoryEntry = async (surahNomor: number): Promise<void> => {
  const current = await readAll();
  await writeAll(current.filter((e) => e.surahNomor !== surahNomor));
};

/** Hapus semua riwayat bacaan. */
export const clearHistory = async (): Promise<void> => {
  await writeAll([]);
};