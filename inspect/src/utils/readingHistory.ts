import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ReadingProgress {
  surahNomor: number;
  namaLatin: string;
  ayatNomor: number;
  totalAyat: number;
  mushafId: string;
  mushafName?: string;
  timestamp?: number;
}

const HISTORY_LIST_KEY = "reading_history_list_v2"; // Versi baru untuk menghindari konflik data lama

// Simpan progres spesifik untuk kombinasi Surah + Mushaf (Qiraat)
export const saveLastRead = async (progress: ReadingProgress) => {
  try {
    // Key unik: last_read_surah_[nomor]_mushaf_[id]
    const key = `last_read_surah_${progress.surahNomor}_mushaf_${progress.mushafId}`;
    const dataToSave = { ...progress, timestamp: Date.now() };
    await AsyncStorage.setItem(key, JSON.stringify(dataToSave));

    // Update Daftar History (untuk Tab History)
    const historyListStr = await AsyncStorage.getItem(HISTORY_LIST_KEY);
    let historyList: ReadingProgress[] = historyListStr ? JSON.parse(historyListStr) : [];
    
    // Hapus entri lama untuk surah+mushaf yang sama agar tidak duplikat
    historyList = historyList.filter(
      (item) => !(item.surahNomor === progress.surahNomor && item.mushafId === progress.mushafId)
    );
    
    // Tambahkan yang baru di paling atas
    historyList.unshift(dataToSave);
    
    // Batasi hanya 50 riwayat terakhir
    if (historyList.length > 50) historyList = historyList.slice(0, 50);
    
    await AsyncStorage.setItem(HISTORY_LIST_KEY, JSON.stringify(historyList));
  } catch (e) {
    console.error("Gagal menyimpan progres bacaan:", e);
  }
};

// Ambil nomor ayat terakhir dibaca untuk Surah + Mushaf tertentu
export const getLastReadAyah = async (surahNomor: number, mushafId: string): Promise<number | null> => {
  try {
    const key = `last_read_surah_${surahNomor}_mushaf_${mushafId}`;
    const saved = await AsyncStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.ayatNomor;
    }
    return null;
  } catch (e) {
    return null;
  }
};

// Ambil seluruh daftar history
export const getHistoryList = async (): Promise<ReadingProgress[]> => {
  try {
    const saved = await AsyncStorage.getItem(HISTORY_LIST_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};