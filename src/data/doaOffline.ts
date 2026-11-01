// Seluruh data Doa & Dzikir EQuran.id yang dibundel di dalam app (offline penuh).
// Isi file JSON dibuat oleh: node scripts/fetchDoaOffline.mjs
// Kalau masih kosong ([]), layar akan memakai jalur lama (API + cache) sebagai cadangan.
import raw from "./doaEquran.json";

export interface DoaOffline {
  id: number;
  judul: string;
  doa: string;
  latin?: string;
  arti: string;
  grup?: string;
  tags?: string[];
  tentang?: string;
}

export const DOA_OFFLINE = raw as unknown as DoaOffline[];
export const DOA_OFFLINE_READY = DOA_OFFLINE.length > 0;
export const getDoaOffline = (id: number): DoaOffline | null => DOA_OFFLINE.find((d) => d.id === id) ?? null;
